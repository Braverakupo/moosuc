const API_URL = 'https://api.deepseek.com/v1/chat/completions'
const DEFAULT_API_KEY = 'sk-a5279ec1d1e444b99c6f9df227853733'

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

// --- DeepSeek V4 pricing (per 1M tokens) ---
const PRICING = {
  inputCacheHit:  0.0028,
  inputCacheMiss: 0.14,
  output:         0.28
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
let _totalCachedTokens = 0
let _totalCost = 0
const _callLog = []

export function getUsage() {
  const total = _totalPromptTokens + _totalCompletionTokens
  const cachePct = _totalPromptTokens > 0
    ? Math.round(_totalCachedTokens / _totalPromptTokens * 100)
    : 0
  return {
    prompt: _totalPromptTokens,
    completion: _totalCompletionTokens,
    total,
    calls: _callLog.length,
    cost: _totalCost,
    cachedTokens: _totalCachedTokens,
    cachePct
  }
}

export function getCallLog() {
  return _callLog
}

function trackUsage(type, promptTokens, completionTokens, inputCharCount = 0, model = 'deepseek-chat', cachedTokens = 0) {
  _totalPromptTokens += promptTokens
  _totalCompletionTokens += completionTokens
  _totalCachedTokens += cachedTokens

  // Calculate cost with cache-aware pricing
  const missTokens = promptTokens - cachedTokens
  const inputCost = (cachedTokens * PRICING.inputCacheHit + missTokens * PRICING.inputCacheMiss) / 1_000_000
  const outputCost = completionTokens * PRICING.output / 1_000_000
  const cost = inputCost + outputCost
  _totalCost += cost

  const totalTokens = promptTokens + completionTokens
  const cachePct = promptTokens > 0 ? Math.round(cachedTokens / promptTokens * 100) : 0
  const time = new Date().toLocaleTimeString()

  _callLog.push({ type, promptTokens, completionTokens, totalTokens, inputCharCount, cachedTokens, cachePct, cost, time, model })
  // Keep only last 500 calls
  if (_callLog.length > 500) _callLog.shift()

  // --- Console log every API call ---
  const icon = type === 'scan' ? '🔵' : type === 'flashcard' ? '🟡' : '🟢'
  const cacheIcon = cachedTokens > 0 ? '📦' : '❄️'
  console.log(
    `${icon} DeepSeek [${type}]`,
    `Prompt:${promptTokens.toLocaleString()}`,
    `Out:${completionTokens.toLocaleString()}`,
    `Total:${totalTokens.toLocaleString()}`,
    `Chars:${inputCharCount.toLocaleString()}`,
    `${cacheIcon}${cachePct}% cached`,
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

// --- Pre-Prompt Templates ---

const STUDY_PREPROMPTS = {
  architect: `You are a study architect. Given a body of text, produce a structured study outline that breaks down the material into clear, logical sections.

Format your response as follows:

# [Main Topic Title]

## 📋 Overview
A 2-3 sentence high-level summary of what this material covers.

## 🏗️ Core Concepts
- **Concept 1**: Brief definition and why it matters
- **Concept 2**: Brief definition and why it matters
- (3-5 key concepts)

## 📊 Structure Map
A hierarchical breakdown of the material:
1. **Major Section 1**
   - Subtopic A
   - Subtopic B
2. **Major Section 2**
   - Subtopic A
   - Subtopic B

## 🔗 Connections
How the key ideas relate to each other, any dependencies, or broader context.

## 📝 Study Questions
3-5 questions that test understanding of the material, ordered from foundational to advanced.

## 🎯 Key Takeaways
3 bullet points summarizing the most important things to remember.

Use clear markdown headings and formatting. Be concise but comprehensive.`,

  essay: `You are a study essayist. Given a body of text, write an engaging, well-structured essay that explains the material in depth.

Format your response as follows:

# [Compelling Essay Title]

## 🧠 Introduction
Hook the reader with context and state what this essay will cover.

## 📖 Body
Organize into 3-5 sections, each with a clear heading. For each section:
- Explain the concept clearly
- Provide examples or applications where relevant
- Connect ideas back to the main theme

## 💡 Insights
What makes this material interesting or important? Any surprising implications, counterintuitive points, or elegant ideas worth highlighting.

## 🔄 Synthesis
Bring everything together. How do the pieces form a coherent whole? What's the bigger picture?

## 📚 Further Exploration
2-3 suggested directions for deeper study based on this material.

Write in an engaging, conversational yet precise tone. Use examples liberally. Avoid bullet-sprawl — prefer full paragraphs that flow naturally.`
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
  const details = usage.prompt_tokens_details || {}
  trackUsage('scan', usage.prompt_tokens || 0, usage.completion_tokens || 0, inputCharCount, model, details.cached_tokens || 0)

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
  // Context first so the prefix (system + "CONTEXT:") is cacheable.
  // Concept name at the end so it doesn't break the common prefix.
  const userContent = `CONTEXT:
${(textContext || '').slice(0, 1500)}

Create a comprehensive flashcard about "${conceptName}" with:
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
  const details = usage.prompt_tokens_details || {}
  trackUsage('flashcard', usage.prompt_tokens || 0, usage.completion_tokens || 0, inputCharCount, model, details.cached_tokens || 0)
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
  // System prompt is always the same — always cacheable after first call.
  // Concept name + context moved to user message so they don't break the cache.
  const systemContent = 'You are a knowledgeable tutor. Be conversational and informative.'
  const userContent = `The user is exploring "${conceptName}". Use this context to answer:

CONTEXT: ${(textContext || '').slice(0, 500)}

User question: ${message || ''}`

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
  const details = usage.prompt_tokens_details || {}
  trackUsage('chat', usage.prompt_tokens || 0, usage.completion_tokens || 0, inputCharCount, model, details.cached_tokens || 0)
}

/*
 * TOKEN AUDIT: generateStudyOutput (mode-based study output)
 *   System: pre-prompt template (~800 chars / ~200 tokens)
 *   User text: up to 6,000 chars (~1,500 tokens)
 *   ─────────────────────────────────
 *   Input total: ~6,800 chars ≈ ~1,700 tokens
 *   Output: max 2,000 tokens
 *   Cost per call: ~1,700 input tokens
 */
export async function generateStudyOutput(text, mode = 'architect', model = 'deepseek-chat', apiKey = DEFAULT_API_KEY) {
  requireUnlocked()
  const systemContent = STUDY_PREPROMPTS[mode] || STUDY_PREPROMPTS.architect
  const userContent = `MODE: ${mode}

CONTEXT:
${(text || '').slice(0, 6000)}`

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
    throw new Error(`Study API ${res.status}: ${err}`)
  }

  const data = await res.json()
  const usage = data.usage || {}
  const details = usage.prompt_tokens_details || {}
  trackUsage('study', usage.prompt_tokens || 0, usage.completion_tokens || 0, inputCharCount, model, details.cached_tokens || 0)
  return data.choices?.[0]?.message?.content || 'Could not generate study output.'
}
