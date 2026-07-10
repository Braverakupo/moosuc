<template>
  <!-- Passcode lock screen -->
  <div v-if="!passcodeUnlocked" class="passcode-screen">
    <div class="passcode-box">
      <div class="passcode-icon">🔒</div>
      <h1>MOOSUC</h1>
      <p>Enter passcode to unlock</p>
      <input
        v-model="passcodeInput"
        @keydown.enter="checkPasscode"
        class="passcode-input"
        type="password"
        placeholder="Passcode"
        autofocus
        maxlength="1"
      />
      <p v-if="passcodeError" class="passcode-error">Incorrect passcode</p>
    </div>
  </div>

  <!-- Main app (passcode unlocked) -->
  <div v-else class="app-layout">
    <!-- TOZ Browser (sidebar + reader, self-contained) -->
    <ToZLibrary
      :collapsed="tozCollapsed"
      :searchQuery="tozQuery"
      @toggle="tozCollapsed = !tozCollapsed"
      @update:searchQuery="tozQuery = $event"
    />

    <!-- Divider after TOZ browser -->
    <div class="divider"></div>

    <!-- === MAIN STUDY AREA === -->
    <ContentPanel
      :text="contentText"
      :scanning="scanner.isScanning.value"
      :lastScan="scanner.lastScanTime.value"
      @update:text="onTextChange"
      @scan="handleScan"
      @clear="onClearContent"
      @mount="onContentMount"
      @open-settings="showSettings = true"
    />

    <div class="divider"></div>

    <CardPanel
      :cards="ai.cards.value"
      :loading="ai.isLoading.value"
      :error="ai.error.value"
      :studyMode="ai.studyMode.value"
      :studyOutput="ai.studyOutput.value"
      :studyLoading="ai.isStudyLoading.value"
      @select-card="onSelectCard"
      @add-card="onAddCardToContent"
      @update:studyMode="onStudyModeChange"
    />

    <!-- Mobile toggle for cards -->
    <button v-if="showMobileToggle" class="mobile-toggle" @click="showMobileCards = !showMobileCards">
      {{ showMobileCards ? '✕ Close' : '💡 Concepts' }}
      <span v-if="ai.cards.value.length || ai.studyOutput.value" class="mobile-badge">
        {{ ai.studyOutput.value ? (ai.studyMode.value === 'architect' ? '🏗️' : '📝') : ai.cards.value.length }}
      </span>
    </button>

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

    <!-- Notes Panel (bottom popout) -->
    <NotesPanel />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ContentPanel from './components/ContentPanel.vue'
import CardPanel from './components/CardPanel.vue'
import ChatDrawer from './components/ChatDrawer.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import NotesPanel from './components/NotesPanel.vue'
import ToZLibrary from './components/ToZLibrary.vue'
import { useSettings } from './composables/useSettings.js'
import { useScanner } from './composables/useScanner.js'
import { useAI } from './composables/useAI.js'
import { unlockPasscode } from './services/ai.js'

const { settings, reset: resetSettings } = useSettings()
const scanner = useScanner()
const ai = useAI()

const contentText = ref('')
const showSettings = ref(false)
const showMobileCards = ref(false)
const isMobile = ref(window.innerWidth < 768)
const passcodeUnlocked = ref(false)
const passcodeInput = ref('')
const passcodeError = ref(false)

// TOZ: just collapsed state + search query (component handles the rest)
const tozCollapsed = ref(false)
const tozQuery = ref('')

function checkPasscode() {
  if (unlockPasscode(passcodeInput.value)) {
    passcodeUnlocked.value = true
    passcodeError.value = false
  } else {
    passcodeError.value = true
    passcodeInput.value = ''
  }
}

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

function onStudyModeChange(mode) {
  ai.setStudyMode(mode)
}

async function handleScan() {
  const text = scanner.scan()
  if (!text) return  // empty = duplicate or scanning in progress
  // Use mode-based study generation instead of concept extraction
  await ai.generateStudy(text, settings.model)
}

function onSelectCard(card) {
  // Card carries its own brief context — no need to pass full text
  ai.openFlashcard(card, settings.model)
  showMobileCards.value = false
}

async function onChatMessage(msg) {
  // Sends only the current message + card's stored context — no history, no full text
  await ai.sendChatMessage(msg, settings.model)
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

/* Passcode lock screen */
.passcode-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100vw;
  background: var(--bg);
}
.passcode-box {
  text-align: center;
  padding: 40px;
}
.passcode-icon {
  font-size: 48px;
  margin-bottom: 16px;
}
.passcode-box h1 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--text);
}
.passcode-box p {
  font-size: 13px;
  color: var(--text2);
  margin-bottom: 20px;
}
.passcode-input {
  width: 60px;
  height: 60px;
  text-align: center;
  font-size: 24px;
  border: 2px solid var(--border);
  border-radius: 12px;
  background: var(--bg2);
  color: var(--text);
  outline: none;
  transition: border-color .15s;
}
.passcode-input:focus {
  border-color: var(--accent);
}
.passcode-error {
  color: var(--danger) !important;
  margin-top: 12px !important;
  font-size: 12px !important;
}
</style>
