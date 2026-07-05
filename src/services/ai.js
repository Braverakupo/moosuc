const API_URL = 'https://api.deepseek.com/v1/chat/completions'
const DEFAULT_API_KEY = 'sk-b036428e7a4849bbb0098f7a444ad84d'

export async function analyzeText(text, model = 'deepseek-chat', apiKey = DEFAULT_API_KEY) {
  const prompt = `You are a reading comprehension assistant. Analyze the following text and extract 3-6 key concepts that would be valuable for the reader to explore further.

For each concept, provide:
1. "concept": A short name for the concept (2-5 words)
2. "description": A 1-2 sentence explanation of why this concept is relevant to the text
3. "deepDive": A specific question or topic suggestion for a deeper exploration

Return ONLY a valid JSON array of objects with these fields. No markdown, no code fences, just the JSON array.

TEXT TO ANALYZE:
${text.slice(0, 6000)}`

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You extract key concepts from text and return them as a JSON array. Only output valid JSON.' },
        { role: 'user', content: prompt }
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
  const content = data.choices?.[0]?.message?.content?.trim() || '[]'
  
  // Strip code fences if present
  const cleaned = content.replace(/^```(?:json)?\s*|```\s*$/gi, '').trim()
  
  try {
    return JSON.parse(cleaned)
  } catch {
    // If it's not valid JSON, return as a single general card
    return [{ concept: 'Explore Further', description: content.slice(0, 200), deepDive: 'Can you elaborate on the key ideas here?' }]
  }
}

export async function generateFlashcard(concept, textContext, model = 'deepseek-chat', apiKey = DEFAULT_API_KEY) {
  const conceptName = typeof concept === 'string' ? concept : (concept.concept || '')
  const prompt = `You are a flashcard generator. Create a detailed, well-structured flashcard about "${conceptName}" based on the context below.

CONTEXT:
${(textContext || '').slice(0, 4000)}

Create a comprehensive flashcard with:
1. A clear, concise definition of "${conceptName}"
2. Key points or characteristics (bullet points)
3. A practical example or application
4. Related concepts or connections
5. A memorable takeaway

Format the response in clean markdown with clear sections. Make it educational and engaging.`

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You create detailed flashcard-style explanations. Output clean markdown.' },
        { role: 'user', content: prompt }
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
  return data.choices?.[0]?.message?.content || 'Could not generate flashcard.'
}

export async function chatAboutConcept(concept, textContext, messages, model = 'deepseek-chat', apiKey = DEFAULT_API_KEY) {
  const systemPrompt = `You are a knowledgeable tutor. The user is reading content and wants to explore the concept of "${concept}" more deeply. The relevant text context is provided below. Answer their questions clearly and conversationally.

CONTEXT: ${(textContext || '').slice(0, 4000)}`

  const msgs = [
    { role: 'system', content: systemPrompt },
    ...(messages || []).map(m => ({ role: m.role, content: m.content }))
  ]

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: msgs,
      temperature: 0.5,
      max_tokens: 1500
    })
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Chat API ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || 'No response.'
}
