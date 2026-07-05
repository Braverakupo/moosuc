import { ref } from 'vue'

export function useScanner() {
  const isScanning = ref(false)
  const lastScanTime = ref(null)
  const visibleText = ref('')
  let contentEl = null

  function setContentElement(el) {
    contentEl = el
  }

  function extractVisibleText() {
    if (!contentEl) return ''

    // If it's a textarea, read its value directly
    if (contentEl.tagName === 'TEXTAREA') {
      return contentEl.value.trim().slice(0, 6000)
    }

    const viewportTop = 0
    const viewportBottom = window.innerHeight

    // Get all text nodes and check visibility
    const walker = document.createTreeWalker(contentEl, NodeFilter.SHOW_TEXT, null, false)
    const textParts = []
    let node

    while (node = walker.nextNode()) {
      const range = document.createRange()
      range.selectNodeContents(node)
      const clientRects = range.getClientRects()

      // Check if any part of this text node is visible in viewport
      let isVisible = false
      for (let i = 0; i < clientRects.length; i++) {
        const r = clientRects[i]
        if (r.bottom > viewportTop && r.top < viewportBottom) {
          isVisible = true
          break
        }
      }

      if (isVisible) {
        const text = node.textContent.trim()
        if (text) textParts.push(text)
      }
    }

    return textParts.join(' ').slice(0, 6000)
  }

  function scan() {
    if (isScanning.value) return
    isScanning.value = true
    lastScanTime.value = new Date().toLocaleTimeString()
    visibleText.value = extractVisibleText()
    // The AI analysis is triggered by the consumer watching visibleText
    setTimeout(() => { isScanning.value = false }, 300)
    return visibleText.value
  }

  return {
    isScanning,
    lastScanTime,
    visibleText,
    setContentElement,
    scan
  }
}
