import { ref } from 'vue'
import { analyzeText, chatAboutConcept, generateFlashcard } from '../services/ai.js'

export function useAI() {
  const cards = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const chatHistory = ref([])
  const activeConcept = ref(null)
  const isChatting = ref(false)
  const isFlashcardLoading = ref(false)

  async function analyze(text, model) {
    if (!text || !text.trim()) {
      error.value = 'No text to analyze. Add content first.'
      return
    }
    isLoading.value = true
    error.value = null
    try {
      const result = await analyzeText(text, model)
      cards.value = Array.isArray(result) ? result : []
      if (cards.value.length === 0) {
        error.value = 'No concepts detected in the visible text.'
      }
    } catch (e) {
      error.value = e.message || 'Analysis failed'
      cards.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function sendChatMessage(message, model) {
    if (!activeConcept.value) return

    // Use the card's stored context (brief excerpt), not the full document
    const cardContext = activeConcept.value.context || activeConcept.value.description || ''

    chatHistory.value.push({ role: 'user', content: message })
    isChatting.value = true
    error.value = null

    try {
      // Only sends current message + card context — no history accumulation
      const response = await chatAboutConcept(
        activeConcept.value,
        cardContext,
        message,
        model
      )
      chatHistory.value.push({ role: 'assistant', content: response })
    } catch (e) {
      error.value = e.message || 'Chat failed'
    } finally {
      isChatting.value = false
    }
  }

  async function openFlashcard(concept, model) {
    activeConcept.value = concept
    chatHistory.value = []
    isFlashcardLoading.value = true
    error.value = null

    // Use the card's stored context (brief excerpt) instead of full document text
    const cardContext = concept.context || concept.description || ''

    try {
      const flashcard = await generateFlashcard(concept, cardContext, model)
      chatHistory.value.push({ role: 'assistant', content: flashcard })
    } catch (e) {
      error.value = e.message || 'Failed to generate flashcard'
      chatHistory.value = [
        { role: 'assistant', content: `Could not generate flashcard for "${concept.concept || concept}". Please try again.` }
      ]
    } finally {
      isFlashcardLoading.value = false
    }
  }

  function closeChat() {
    activeConcept.value = null
    chatHistory.value = []
    isFlashcardLoading.value = false
  }

  return {
    cards,
    isLoading,
    error,
    chatHistory,
    activeConcept,
    isChatting,
    isFlashcardLoading,
    analyze,
    sendChatMessage,
    openFlashcard,
    closeChat
  }
}
