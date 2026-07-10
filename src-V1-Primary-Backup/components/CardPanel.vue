<template>
  <div class="card-panel" :class="{ 'card-panel--empty': !showAnyContent && !studyLoading && !error, 'card-panel--fullscreen': isFullscreen }">
    <div class="panel-header">
      <h2>💡 Concepts</h2>
      <div class="header-right">
        <!-- Mode selector -->
        <div class="mode-selector">
          <button
            class="mode-btn"
            :class="{ 'mode-btn--active': studyMode === 'architect' }"
            @click="$emit('update:studyMode', 'architect')"
            title="Architect mode - structured study outline"
          >🏗️</button>
          <button
            class="mode-btn"
            :class="{ 'mode-btn--active': studyMode === 'essay' }"
            @click="$emit('update:studyMode', 'essay')"
            title="Essay mode - deep-dive essay"
          >📝</button>
        </div>
        <span class="card-count" v-if="cards.length && !studyOutput">{{ cards.length }} found</span>
        <span class="mode-label" v-else-if="studyOutput">{{ studyMode === 'architect' ? '🏗️ Outline' : '📝 Essay' }}</span>
        <button class="fullscreen-btn" @click="toggleFullscreen" :title="isFullscreen ? 'Exit fullscreen' : 'Fullscreen'">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline :points="isFullscreen ? '2 5 2 2 5 2' : '2 9 2 12 5 12'" />
            <polyline :points="isFullscreen ? '12 9 12 12 9 12' : '12 5 12 2 9 2'" />
            <line x1="2" :y1="isFullscreen ? 2 : 12" x2="6" y2="6" />
            <line x1="12" :y1="isFullscreen ? 12 : 2" x2="8" y2="6" />
          </svg>
        </button>
      </div>
    </div>

    <div class="panel-body">
      <!-- Loading state -->
      <div v-if="loading || studyLoading" class="state-msg">
        <div class="loading-bar"><div class="loading-bar-fill"></div></div>
        <p>{{ studyLoading ? 'Generating study output...' : 'Analyzing text...' }}</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="state-msg error">
        <span class="state-icon">⚠️</span>
        <p>{{ error }}</p>
      </div>

      <!-- Study output (when available) -->
      <div v-else-if="studyOutput" class="study-output" v-html="renderMarkdown(studyOutput)"></div>

      <!-- Empty state (no cards, no output) -->
      <div v-else-if="!cards.length" class="state-msg">
        <span class="state-icon" style="font-size:36px">🔍</span>
        <p>Add content and scan to discover concepts</p>
        <p class="state-sub">Cards will appear here automatically</p>
      </div>

      <!-- Cards (fallback when no study output) -->
      <div v-else class="cards-list">
        <ConceptCard
          v-for="(card, i) in cards"
          :key="i"
          :card="card"
          :index="i"
          @select="$emit('select-card', card)"
          @add="$emit('add-card', card)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import ConceptCard from './ConceptCard.vue'

const props = defineProps({
  cards: { type: Array, default: () => [] },
  loading: Boolean,
  error: String,
  studyMode: { type: String, default: 'architect' },
  studyOutput: { type: String, default: '' },
  studyLoading: Boolean
})
defineEmits(['select-card', 'add-card', 'update:studyMode'])

const isFullscreen = ref(false)

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
}

const showAnyContent = computed(() => {
  return props.cards.length > 0 || !!props.studyOutput
})

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function renderMarkdown(text) {
  if (!text) return ''
  let html = escapeHtml(text)

  // Code blocks (triple backtick)
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const langClass = lang ? ` class="lang-${lang}"` : ''
    return `<pre><code${langClass}>${code.trim()}</code></pre>`
  })

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Headings (largest first to avoid partial matches)
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>')
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/_(.+?)_/g, '<em>$1</em>')

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')

  // Ordered lists
  html = html.replace(/(?:^\d+\. (.+)$\n?)+/gm, (match) => {
    const items = match.trim().split('\n').map(line => {
      const content = line.replace(/^\d+\. /, '')
      return `<li>${content}</li>`
    }).join('')
    return `<ol>${items}</ol>`
  })

  // Unordered lists
  html = html.replace(/(?:^[-*] (.+)$\n?)+/gm, (match) => {
    const items = match.trim().split('\n').map(line => {
      const content = line.replace(/^[-*] /, '')
      return `<li>${content}</li>`
    }).join('')
    return `<ul>${items}</ul>`
  })

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>')

  // Paragraphs: wrap consecutive non-empty lines not already in a block tag
  const blockTags = /^<(h[1-6]|ul|ol|li|pre|blockquote|hr|div|p)/i
  const lines = html.split('\n')
  const result = []
  let inParagraph = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) {
      if (inParagraph) {
        result.push('</p>')
        inParagraph = false
      }
      continue
    }

    if (blockTags.test(trimmed)) {
      if (inParagraph) {
        result.push('</p>')
        inParagraph = false
      }
      result.push(trimmed)
    } else {
      if (!inParagraph) {
        result.push('<p>')
        inParagraph = true
      } else {
        result.push('<br>')
      }
      result.push(trimmed)
    }
  }

  if (inParagraph) {
    result.push('</p>')
  }

  return result.join('')
}
</script>

<style scoped>
.card-panel {
  width: 320px;
  flex-shrink: 0;
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg2);
}
.card-panel--empty {
  width: 280px;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.panel-header h2 {
  font-size: 15px;
  font-weight: 600;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.mode-selector {
  display: flex;
  gap: 2px;
  background: var(--bg3);
  border-radius: 8px;
  padding: 2px;
}
.mode-btn {
  width: 30px;
  height: 26px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all .15s;
  opacity: 0.5;
}
.mode-btn:hover {
  opacity: 0.8;
  background: rgba(88,166,255,0.08);
}
.mode-btn--active {
  opacity: 1;
  background: var(--bg);
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.mode-btn--active:hover {
  background: var(--bg);
  opacity: 1;
}
.fullscreen-btn {
  width: 26px;
  height: 26px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all .15s;
  opacity: 0.4;
  color: var(--text2);
}
.fullscreen-btn svg {
  display: block;
}
.fullscreen-btn:hover {
  opacity: 0.9;
  background: rgba(88,166,255,0.08);
}
.card-count {
  font-size: 11px;
  color: var(--accent);
  background: rgba(88,166,255,0.1);
  padding: 2px 8px;
  border-radius: 10px;
  white-space: nowrap;
}
.mode-label {
  font-size: 11px;
  color: var(--accent2);
  background: rgba(63,185,80,0.1);
  padding: 2px 8px;
  border-radius: 10px;
  white-space: nowrap;
}
.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}
.state-msg {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 20px;
  color: var(--text2);
  font-size: 13px;
  gap: 8px;
}
.state-msg.error {
  color: var(--danger);
}
.state-icon {
  font-size: 28px;
  margin-bottom: 4px;
}
.state-sub {
  font-size: 11px;
  opacity: 0.6;
}
.cards-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.loading-bar {
  width: 140px;
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 4px;
}
.loading-bar-fill {
  width: 100%;
  height: 100%;
  background: var(--accent);
  border-radius: 2px;
  animation: loadAnim 1.2s ease-in-out infinite;
  transform-origin: left;
}
@keyframes loadAnim {
  0% { transform: scaleX(0); opacity: 1; }
  50% { transform: scaleX(1); opacity: 0.6; }
  100% { transform: scaleX(0); opacity: 1; }
}

/* Study output rendered markdown */
.study-output {
  padding: 8px 4px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text);
}
.study-output :deep(h1),
.study-output :deep(h2),
.study-output :deep(h3),
.study-output :deep(h4) {
  margin: 14px 0 6px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--text);
}
.study-output :deep(h1) { font-size: 16px; }
.study-output :deep(h2) { font-size: 15px; }
.study-output :deep(h3) { font-size: 14px; }
.study-output :deep(h4) { font-size: 13px; }
.study-output :deep(p) {
  margin: 6px 0;
}
.study-output :deep(ul),
.study-output :deep(ol) {
  margin: 6px 0;
  padding-left: 20px;
}
.study-output :deep(li) {
  margin: 3px 0;
  line-height: 1.5;
}
.study-output :deep(strong) {
  color: #e8e8e8;
  font-weight: 700;
}
.study-output :deep(em) {
  color: #aac8ff;
}
.study-output :deep(code) {
  background: #1a1f2e;
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 11px;
  font-family: 'Cascadia Code', 'Fira Code', monospace;
  color: #7ec8e3;
}
.study-output :deep(pre) {
  background: #0d111f;
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 8px 0;
  border: 1px solid var(--border);
}
.study-output :deep(pre code) {
  background: none;
  padding: 0;
  font-size: 11px;
  line-height: 1.5;
  color: #c9d1d9;
}
.study-output :deep(blockquote) {
  margin: 8px 0;
  padding: 6px 12px;
  border-left: 3px solid var(--accent);
  background: rgba(88,166,255,0.06);
  border-radius: 0 6px 6px 0;
  color: var(--text2);
}
.study-output :deep(hr) {
  border: 0;
  border-top: 1px solid var(--border);
  margin: 12px 0;
}
.study-output :deep(a) {
  color: var(--accent);
  text-decoration: underline;
}
.study-output :deep(a:hover) {
  color: #7ab4ff;
}

.card-panel--fullscreen {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 200 !important;
  border-left: 0 !important;
  border-top: 1px solid var(--border);
  background: var(--bg);
  animation: fullscreenIn .2s ease-out;
}
.card-panel--fullscreen .panel-header {
  padding: 14px 20px;
}
.card-panel--fullscreen .panel-body {
  padding: 16px 24px;
}
@keyframes fullscreenIn {
  from { opacity: 0.7; transform: scale(0.97); }
  to   { opacity: 1; transform: scale(1); }
}

@media (max-width: 768px) {
  .card-panel {
    width: 100% !important;
    border-left: 0;
    border-top: 1px solid var(--border);
    max-height: 45vh;
  }
  .card-panel--fullscreen {
    max-height: 100vh !important;
  }
}
</style>
