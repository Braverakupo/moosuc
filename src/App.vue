<template>
  <div class="app-layout">
    <!-- Left: Content -->
    <ContentPanel
      :text="contentText"
      :scanning="scanner.isScanning.value"
      :lastScan="scanner.lastScanTime.value"
      @update:text="onTextChange"
      @scan="handleScan"
      @clear="onClearContent"
      @mount="onContentMount"
    />

    <!-- Divider (desktop) -->
    <div class="divider"></div>

    <!-- Right: Cards -->
    <CardPanel
      :cards="ai.cards.value"
      :loading="ai.isLoading.value"
      :error="ai.error.value"
      @select-card="onSelectCard"
      @add-card="onAddCardToContent"
    />

    <!-- Mobile toggle for cards -->
    <button v-if="showMobileToggle" class="mobile-toggle" @click="showMobileCards = !showMobileCards">
      {{ showMobileCards ? '✕ Close' : '💡 Concepts' }}
      <span v-if="ai.cards.value.length" class="mobile-badge">{{ ai.cards.value.length }}</span>
    </button>

    <!-- Settings button -->
    <button class="settings-btn" @click="showSettings = true">⚙️</button>

    <!-- Chat Drawer / Flashcard View -->
    <ChatDrawer
      v-if="ai.activeConcept.value"
      :concept="ai.activeConcept.value"
      :messages="ai.chatHistory.value"
      :loading="ai.isFlashcardLoading.value || ai.isChatting.value"
      @close="ai.closeChat()"
      @send="onChatMessage"
      @add-content="onAddFlashcardToContent"
    />

    <!-- Settings Panel -->
    <SettingsPanel
      v-if="showSettings"
      @close="showSettings = false"
      @reset="resetSettings"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import ContentPanel from './components/ContentPanel.vue'
import CardPanel from './components/CardPanel.vue'
import ChatDrawer from './components/ChatDrawer.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import { useSettings } from './composables/useSettings.js'
import { useScanner } from './composables/useScanner.js'
import { useAI } from './composables/useAI.js'

const { settings, reset: resetSettings } = useSettings()
const scanner = useScanner()
const ai = useAI()

const contentText = ref('')
const showSettings = ref(false)
const showMobileCards = ref(false)
const isMobile = ref(window.innerWidth < 768)

window.addEventListener('resize', () => {
  isMobile.value = window.innerWidth < 768
})

const showMobileToggle = computed(() => isMobile.value)

function onContentMount(el) {
  scanner.setContentElement(el)
}

function onTextChange(val) {
  contentText.value = val
}

function onClearContent() {
  contentText.value = ''
}

function onAddCardToContent(card) {
  const text = typeof card === 'string' ? card : (card.concept || card.description || '')
  if (contentText.value) {
    contentText.value += '\n\n' + text
  } else {
    contentText.value = text
  }
}

function onAddFlashcardToContent() {
  const flashcardText = ai.chatHistory.value
    .filter(m => m.role === 'assistant')
    .map(m => m.content)
    .join('\n\n')
  if (contentText.value) {
    contentText.value += '\n\n---\n\n' + flashcardText
  } else {
    contentText.value = flashcardText
  }
}

async function handleScan() {
  const text = scanner.scan()
  if (!text) return  // empty = duplicate or scanning in progress
  await ai.analyze(text, settings.model)
}

function onSelectCard(card) {
  ai.openFlashcard(card, scanner.visibleText.value, settings.model)
  showMobileCards.value = false
}

async function onChatMessage(msg) {
  await ai.sendChatMessage(
    msg,
    settings.model,
    scanner.visibleText.value
  )
}
</script>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: relative;
}
.divider {
  width: 1px;
  background: var(--border);
  flex-shrink: 0;
}
.settings-btn {
  position: fixed;
  bottom: 16px;
  left: 16px;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--bg2);
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  transition: all .15s;
}
.settings-btn:hover {
  border-color: var(--accent);
  background: #1c2333;
}
.mobile-toggle {
  display: none;
}
@media (max-width: 768px) {
  .app-layout {
    flex-direction: column;
  }
  .divider {
    width: 100%;
    height: 1px;
  }
  .mobile-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    position: fixed;
    bottom: 16px;
    right: 16px;
    padding: 10px 16px;
    border: 1px solid var(--border);
    border-radius: 24px;
    background: var(--bg2);
    color: var(--text);
    font-size: 13px;
    font-weight: 600;
    z-index: 50;
    box-shadow: var(--shadow);
  }
  .mobile-badge {
    background: var(--accent);
    color: #fff;
    font-size: 11px;
    padding: 1px 6px;
    border-radius: 8px;
  }
}
</style>
