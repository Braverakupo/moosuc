const API_URL = 'https://api.deepseek.com/v1/chat/completions'
const DEFAULT_API_KEY = 'sk-b036428e7a4849bbb0098f7a444ad84d'

// --- Passcode lock ---
let _unlocked = false

export function unlockPasscode(key) {
  _unlocked = (key === 'A')
  return _unlocked
}

export function isUnlocked() {
  return _unlocked
}

function requireUnlocked() {
  if (!_unlocked) {
    throw new Error('🔒 Enter passcode to unlock API')
  }
}

// --- Input token thresholds for diagnostics ---
const TOKEN_THRESHOLDS = {
  scan:      { prompt: 2000 },
  flashcard: { prompt: 800  },
  chat:      { prompt: 500  }
}

// --- Usage tracking ---
let _totalPromptTokens = 0
let _totalCompletionTokens = 0
let _totalCost = 0
const _callLog = []

export function getUsage() {
  return {
    prompt: _totalPromptTokens,
    completion: _totalCompletionTokens,
    total: _totalPromptTokens + _totalCompletionTokens,
    calls: _callLog.length,
    cost: _totalCost
  }
}

export function getCallLog() {
  return _callLog
}

function trackUsage(type, promptTokens, completionTokens, inputCharCount = 0, model = 'deepseek-chat') {
  _totalPromptTokens += promptTokens
  _totalCompletionTokens += completionTokens
  // DeepSeek Chat: $0.27/1M input, $1.10/1M output
  const cost = (promptTokens * 0.27 + completionTokens * 1.10) / 1_000_000
  _totalCost += cost

  const totalTokens = promptTokens + completionTokens
  const time = new Date().toLocaleTimeString()

  _callLog.push({ type, promptTokens, completionTokens, totalTokens, inputCharCount, cost, time, model })
  // Keep only last 500 calls
  if (_callLog.length > 500) _callLog.shift()

  // --- Console log every API call ---
  const icon = type === 'scan' ? '🔵' : type === 'flashcard' ? '🟡' : '🟢'
  console.log(
    `${icon} DeepSeek [${type}]`,
    `Prompt:${promptTokens.toLocaleString()}`,
    `Out:${completionTokens.toLocaleString()}`,
    `Total:${totalTokens.toLocaleString()}`,
    `Chars:${inputCharCount.toLocaleString()}`,
    `$${cost.toFixed(6)}`,
    model
  )

  // --- Warn if input tokens exceed expected threshold ---
  const threshold = TOKEN_THRESHOLDS[type]
  if (threshold && promptTokens > threshold.prompt) {
    console.warn(
      `⚠️  [${type}] Prompt tokens (${promptTokens}) exceed threshold (${threshold.prompt}). ` +
      `Input chars: ${inputCharCount}. Possible context leakage.`
    )
  }
}

// --- API Functions ---

/*
 * TOKEN AUDIT: analyzeText (initial scan)
 *   System: ~85 chars  (~21 tokens)
 *   Instructions: ~450 chars (~112 tokens)
 *   User text: up to 6,000 chars (~1,500 tokens)
 *   ─────────────────────────────────
 *   Input total: ~6,535 chars ≈ ~1,633 tokens
 *   Output: max 1,000 tokens
 *   Cost per call: ~1,633 input tokens
 */
export async function analyzeText(text, model = 'deepseek-chat', apiKey = DEFAULT_API_KEY) {
  requireUnlocked()
  const systemContent = 'You extract key concepts from text and return them as a JSON array. Only output valid JSON.'
  const userContent = `Extract exactly 5 key concepts from the text below.

For each concept, return a JSON object with:
1. "concept": short name (2-5 words)
2. "description": 1-2 sentence explanation of relevance
3. "context": a 2-3 sentence excerpt from the text most relevant to this concept — this will be used as the sole input when exploring this concept further, so be concise but informative
4. "deepDive": a specific question for deeper exploration

Return ONLY a valid JSON array of exactly 5 objects. No markdown, no code fences.

TEXT:
${text.slice(0, 6000)}`

  const inputCharCount = systemContent.length + userContent.length

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemContent },
        { role: 'user', content: userContent }
      ],
      temperature: 0.3,
      max_tokens: 1000
    })
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`API ${res.status}: ${err}`)
  }

  const data = await res.json()
  const usage = data.usage || {}
  trackUsage('scan', usage.prompt_tokens || 0, usage.completion_tokens || 0, inputCharCount, model)

  const content = data.choices?.[0]?.message?.content?.trim() || '[]'
  
  // Strip code fences if present
  const cleaned = content.replace(/^```(?:json)?\s*|```\s*$/gi, '').trim()
  
  try {
    return JSON.parse(cleaned)
  } catch {
    // If it's not valid JSON, return as a single general card
    return [{ concept: 'Explore Further', description: content.slice(0, 200), context: content.slice(0, 300), deepDive: 'Can you elaborate on the key ideas here?' }]
  }
}

/*
 * TOKEN AUDIT: generateFlashcard (click card)
 *   System: ~65 chars   (~16 tokens)
 *   Instructions: ~400 chars (~100 tokens)
 *   Concept name: ~50 chars (~12 tokens)
 *   Context: up to 1,500 chars (~375 tokens)
 *   ─────────────────────────────────
 *   Input total: ~2,015 chars ≈ ~503 tokens
 *   Output: max 2,000 tokens
 *   Cost per call: ~503 input tokens
 */
export async function generateFlashcard(concept, textContext, model = 'deepseek-chat', apiKey = DEFAULT_API_KEY) {
  requireUnlocked()
  const conceptName = typeof concept === 'string' ? concept : (concept.concept || '')
  const systemContent = 'You create detailed flashcard-style explanations. Output clean markdown.'
  const userContent = `You are a flashcard generator. Create a detailed, well-structured flashcard about "${conceptName}" based on the context below.

CONTEXT:
${(textContext || '').slice(0, 1500)}

Create a comprehensive flashcard with:
1. A clear, concise definition of "${conceptName}"
2. Key points or characteristics (bullet points)
3. A practical example or application
4. Related concepts or connections
5. A memorable takeaway

Format the response in clean markdown with clear sections. Make it educational and engaging.`

  const inputCharCount = systemContent.length + userContent.length

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemContent },
        { role: 'user', content: userContent }
      ],
      temperature: 0.4,
      max_tokens: 2000
    })
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Flashcard API ${res.status}: ${err}`)
  }

  const data = await res.json()
  const usage = data.usage || {}
  trackUsage('flashcard', usage.prompt_tokens || 0, usage.completion_tokens || 0, inputCharCount, model)
  return data.choices?.[0]?.message?.content || 'Could not generate flashcard.'
}

/*
 * TOKEN AUDIT: chatAboutConcept (send message — NO history)
 *   System prompt: ~200 chars (~50 tokens)
 *   Context (from card): up to 500 chars (~125 tokens)
 *   Current message: ~100 chars (~25 tokens)
 *   ─────────────────────────────────
 *   Input total: ~800 chars ≈ ~200 tokens (flat, never grows)
 *   Output: max 1,500 tokens
 *   Cost per call: ~200 input tokens (fixed)
 *   NOTE: Only sends the current message + card context. No history accumulation.
 */
export async function chatAboutConcept(concept, textContext, message, model = 'deepseek-chat', apiKey = DEFAULT_API_KEY) {
  requireUnlocked()
  const conceptName = typeof concept === 'string' ? concept : (concept.concept || '')
  const systemContent = `You are a knowledgeable tutor. The user is exploring "${conceptName}" and asks a question. Use the context below to answer. Be conversational and informative.

CONTEXT: ${(textContext || '').slice(0, 500)}`
  const userContent = message || ''

  const inputCharCount = systemContent.length + userContent.length

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemContent },
        { role: 'user', content: userContent }
      ],
      temperature: 0.5,
      max_tokens: 1500
    })
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Chat API ${res.status}: ${err}`)
  }

  const data = await res.json()
  const usage = data.usage || {}
  trackUsage('chat', usage.prompt_tokens || 0, usage.completion_tokens || 0, inputCharCount, model)
  return data.choices?.[0]?.message?.content || 'No response.'
}
