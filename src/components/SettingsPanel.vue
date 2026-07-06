<template>
  <div class="settings-overlay" @click.self="$emit('close')">
    <div class="settings-panel">
      <div class="settings-header">
        <h2>⚙️ Settings</h2>
        <button class="btn-close" @click="$emit('close')">✕</button>
      </div>
      <div class="settings-body">
        <div class="field">
          <label>API Status</label>
          <div class="status-ok">✅ DeepSeek API key is configured</div>
          <div class="field-hint">Using DeepSeek Chat model for analysis and flashcards.</div>
        </div>

        <div class="field">
          <label>Session Usage</label>
          <div class="usage-stats">
            <div class="usage-row">
              <span>API calls</span>
              <span class="usage-val">{{ usage.calls }}</span>
            </div>
            <div class="usage-row">
              <span>Input tokens</span>
              <span class="usage-val">{{ usage.prompt.toLocaleString() }}</span>
            </div>
            <div class="usage-row">
              <span>Output tokens</span>
              <span class="usage-val">{{ usage.completion.toLocaleString() }}</span>
            </div>
            <div class="usage-row">
              <span>Total tokens</span>
              <span class="usage-val usage-highlight">{{ usage.total.toLocaleString() }}</span>
            </div>
            <div class="usage-row">
              <span>Estimated cost</span>
              <span class="usage-val">${{ usage.cost.toFixed(4) }}</span>
            </div>
          </div>
        </div>

        <hr />

        <button class="btn btn-secondary" @click="$emit('reset')">Reset to defaults</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { getUsage } from '../services/ai.js'

defineEmits(['close', 'reset'])

const usage = ref(getUsage())

// Refresh usage stats every 2 seconds while panel is open
let interval
onMounted(() => {
  usage.value = getUsage()
  interval = setInterval(() => { usage.value = getUsage() }, 2000)
})

onUnmounted(() => clearInterval(interval))
</script>

<style scoped>
.settings-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.settings-panel {
  width: 360px;
  max-width: 90vw;
  max-height: 80vh;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow);
}
.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}
.settings-header h2 { font-size: 16px; }
.btn-close {
  background: none; border: 0; color: var(--text2); font-size: 18px; padding: 4px; line-height: 1; cursor: pointer;
}
.btn-close:hover { color: var(--text) }
.settings-body {
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.field { display: flex; flex-direction: column; gap: 4px; }
.field label { font-size: 13px; font-weight: 600; }
.field-hint { font-size: 11px; color: var(--text2); }
.status-ok {
  font-size: 13px;
  color: #4caf50;
  padding: 8px 0;
}
.usage-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 0;
}
.usage-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text2);
}
.usage-val {
  font-weight: 600;
  color: var(--text);
  font-variant-numeric: tabular-nums;
}
.usage-highlight {
  color: var(--accent);
  font-size: 13px;
}
hr { border: 0; border-top: 1px solid var(--border); }
.btn {
  padding: 8px 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg3);
  color: var(--text);
  font-size: 13px;
  cursor: pointer;
}
.btn-secondary:hover { border-color: var(--danger); color: var(--danger); }
</style>
