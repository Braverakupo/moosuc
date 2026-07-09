<template>
  <div class="content-panel" ref="contentRef">
    <div class="content-header">
      <div class="content-header-left">
        <img src="/DontTread.png" alt="Don't Tread" class="donttread-img" />
        <button class="btn btn-settings" @click="$emit('open-settings')" title="Settings">⚙️</button>
        <button v-if="text" class="btn btn-clear" @click="$emit('clear')" title="Clear all content">✕ Clear</button>
      </div>
      <div class="content-actions">
        <button class="btn btn-sm" @click="$emit('scan')" :disabled="scanning">
          {{ scanning ? '⏳ Scanning...' : '🔍 Scan Now' }}
        </button>
      </div>
    </div>
    <div class="content-body" v-if="!text">
      <div class="placeholder">
        <div class="placeholder-icon">📝</div>
        <p>Paste or type content here to analyze.</p>
        <p class="placeholder-sub">Click <kbd>Scan Now</kbd> to extract concepts.</p>
      </div>
    </div>
    <textarea
      ref="textareaRef"
      class="content-textarea"
      :value="text"
      @input="$emit('update:text', $event.target.value)"
      placeholder="Paste article text, documentation, or any content you're studying..."
    ></textarea>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  text: String,
  scanning: Boolean,
  lastScan: String
})
const emit = defineEmits(['update:text', 'scan', 'clear', 'open-settings'])
const textareaRef = ref(null)

defineExpose({ textareaRef })

onMounted(() => {
  if (textareaRef.value) {
    emit('mount', textareaRef.value)
  }
})
</script>

<style scoped>
.content-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  background: var(--bg);
}
.content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.content-header-left {
  display: flex;
  align-items: center;
  gap: 6px;
}
.donttread-img {
  height: 36px;
  width: auto;
  opacity: 0.95;
}
.content-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.scan-time {
  font-size: 11px;
  color: var(--text2);
}
.content-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.placeholder {
  text-align: center;
  color: var(--text2);
  max-width: 320px;
}
.placeholder-icon {
  font-size: 48px;
  margin-bottom: 12px;
}
.placeholder-sub {
  font-size: 12px;
  margin-top: 8px;
  opacity: 0.7;
}
.placeholder-sub kbd {
  display: inline-block;
  padding: 1px 6px;
  font-size: 11px;
  font-family: inherit;
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 4px;
}
.content-textarea {
  flex: 1;
  width: 100%;
  border: 0;
  border-radius: 0;
  background: var(--bg);
  padding: 20px 24px;
  font-size: 16px;
  line-height: 1.8;
  resize: none;
  min-height: 200px;
  color: var(--text);
  letter-spacing: 0.01em;
}
.content-textarea::placeholder {
  color: var(--text2);
  opacity: 0.6;
}
.content-textarea:focus {
  border: 0;
  outline: 0;
  background: #0d111f;
}
.btn {
  padding: 6px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg3);
  color: var(--text);
  font-size: 12px;
  transition: all .15s;
  cursor: pointer;
}
.btn:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}
.btn:disabled {
  opacity: 0.5;
  cursor: default;
}
.btn-clear {
  padding: 3px 10px;
  font-size: 11px;
  color: var(--text2);
  background: transparent;
  border-color: transparent;
}
.btn-clear:hover {
  border-color: var(--danger);
  color: var(--danger);
  background: rgba(255,80,80,0.08);
}
.btn-settings {
  padding: 0;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all .15s;
  opacity: 0.6;
}
.btn-settings:hover {
  opacity: 1;
  background: rgba(88,166,255,0.08);
}
</style>
