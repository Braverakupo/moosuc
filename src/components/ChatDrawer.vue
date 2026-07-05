<template>
  <div class="chat-overlay" @click.self="$emit('close')">
    <div class="chat-drawer">
      <div class="chat-header">
        <div>
          <div class="chat-concept-name">{{ concept?.concept || concept }}</div>
          <div class="chat-concept-desc" v-if="concept?.description">{{ concept.description }}</div>
        </div>
        <div class="chat-header-actions">
          <button class="btn-add-content" @click="$emit('add-content')" title="Add to content layer">+ Add</button>
          <button class="btn-close" @click="$emit('close')">✕</button>
        </div>
      </div>

      <div class="chat-messages" ref="messagesRef">
        <div
          v-for="(msg, i) in messages"
          :key="i"
          class="message"
          :class="msg.role === 'assistant' ? 'msg-assistant' : 'msg-user'"
        >
          <div class="msg-avatar">{{ msg.role === 'assistant' ? '🤖' : '👤' }}</div>
          <div class="msg-content" :class="{ 'msg-html': msg.role === 'assistant' }" v-html="renderMarkdown(msg.content)"></div>
        </div>
        <div v-if="loading" class="message msg-assistant">
          <div class="msg-avatar">🤖</div>
          <div class="msg-content loading-msg">
            <div class="loading-bar-sm"><div class="loading-bar-sm-fill"></div></div>
            <span>Generating flashcard...</span>
          </div>
        </div>
      </div>

      <form class="chat-input" @submit.prevent="handleSend">
        <input
          v-model="input"
          placeholder="Ask about this concept..."
          :disabled="loading"
          ref="inputRef"
        />
        <button type="submit" :disabled="loading || !input.trim()" class="btn-send">Send</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch, onMounted } from 'vue'

const props = defineProps({
  concept: { type: [Object, String], required: true },
  messages: { type: Array, default: () => [] },
  loading: Boolean
})
const emit = defineEmits(['close', 'send', 'add-content'])

const input = ref('')
const inputRef = ref(null)
const messagesRef = ref(null)

function handleSend() {
  if (!input.value.trim() || props.loading) return
  emit('send', input.value.trim())
  input.value = ''
}

watch(() => props.messages.length, async (newLen, oldLen) => {
  await nextTick()
  if (!messagesRef.value) return
  // Scroll to top on initial flashcard load (0 → 1), bottom for chat messages
  if (oldLen === 0 && newLen === 1) {
    messagesRef.value.scrollTop = 0
  } else {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
})

onMounted(() => {
  nextTick(() => inputRef.value?.focus())
})

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function renderMarkdown(text) {
  if (!text) return ''
  let html = escapeHtml(text)

  // Code blocks (``` ... ```) — must come before inline code
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const langClass = lang ? ` class="lang-${lang}"` : ''
    return `<pre><code${langClass}>${code.trim()}</code></pre>`
  })

  // Inline code (`code`)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Headings (### Title then ## then #)
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

  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')

  // Ordered lists — wrap consecutive <li> in <ol>
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
.chat-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  z-index: 100;
}
.chat-drawer {
  width: 480px;
  max-width: 100vw;
  height: 100%;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--border);
  animation: slideIn 0.2s ease-out;
}
@keyframes slideIn {
  from { transform: translateX(100%) }
  to { transform: translateX(0) }
}
.chat-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.chat-concept-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}
.chat-concept-desc {
  font-size: 12px;
  color: var(--text2);
}
.chat-header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.btn-add-content {
  padding: 4px 10px;
  border: 1px solid var(--accent);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--accent);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all .15s;
}
.btn-add-content:hover {
  background: var(--accent);
  color: #fff;
}
.btn-close {
  background: none;
  border: 0;
  color: var(--text2);
  font-size: 18px;
  padding: 4px;
  line-height: 1;
  cursor: pointer;
}
.btn-close:hover { color: var(--text) }
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.message {
  display: flex;
  gap: 8px;
  max-width: 95%;
}
.msg-user {
  align-self: flex-end;
  flex-direction: row-reverse;
}
.msg-avatar {
  font-size: 18px;
  flex-shrink: 0;
  margin-top: 2px;
}
.msg-content {
  background: var(--bg3);
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}
.msg-user .msg-content {
  background: var(--accent);
  color: #fff;
  border-bottom-right-radius: 4px;
}
.msg-assistant .msg-content {
  border-bottom-left-radius: 4px;
}
.msg-html {
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.7;
}
.loading-msg {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}
.loading-bar-sm {
  width: 100px;
  height: 3px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}
.loading-bar-sm-fill {
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
.chat-input {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}
.chat-input input {
  flex: 1;
  padding: 8px 12px;
  border-radius: 20px;
}
.btn-send {
  padding: 8px 16px;
  border: 0;
  border-radius: 20px;
  background: var(--accent);
  color: #fff;
  font-weight: 600;
  font-size: 13px;
}
.btn-send:disabled { opacity: 0.5; cursor: default; }
.btn-send:hover:not(:disabled) { background: #4a8aff; }

@media (max-width: 480px) {
  .chat-drawer { width: 100vw }
}
</style>

<!-- Global styles for rendered markdown content -->
<style>
.msg-html h1,
.msg-html h2,
.msg-html h3,
.msg-html h4 {
  margin: 12px 0 6px;
  font-weight: 600;
  line-height: 1.3;
}
.msg-html h1 { font-size: 17px; }
.msg-html h2 { font-size: 16px; }
.msg-html h3 { font-size: 15px; }
.msg-html h4 { font-size: 14px; }
.msg-html p {
  margin: 6px 0;
}
.msg-html p:first-child {
  margin-top: 0;
}
.msg-html ul,
.msg-html ol {
  margin: 6px 0;
  padding-left: 20px;
}
.msg-html li {
  margin: 3px 0;
  line-height: 1.5;
}
.msg-html strong {
  color: #e8e8e8;
  font-weight: 700;
}
.msg-html em {
  color: #aac8ff;
}
.msg-html code {
  background: #1a1f2e;
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 12px;
  font-family: 'Cascadia Code', 'Fira Code', monospace;
  color: #7ec8e3;
}
.msg-html pre {
  background: #0d111f;
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 8px 0;
  border: 1px solid var(--border);
}
.msg-html pre code {
  background: none;
  padding: 0;
  font-size: 12px;
  line-height: 1.5;
  color: #c9d1d9;
}
.msg-html blockquote {
  margin: 8px 0;
  padding: 6px 12px;
  border-left: 3px solid var(--accent);
  background: rgba(88,166,255,0.06);
  border-radius: 0 6px 6px 0;
  color: var(--text2);
}
.msg-html hr {
  border: 0;
  border-top: 1px solid var(--border);
  margin: 12px 0;
}
.msg-html a {
  color: var(--accent);
  text-decoration: underline;
}
.msg-html a:hover {
  color: #7ab4ff;
}
</style>
