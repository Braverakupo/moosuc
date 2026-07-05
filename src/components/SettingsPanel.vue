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

        <hr />

        <button class="btn btn-secondary" @click="$emit('reset')">Reset to defaults</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['close', 'reset'])
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
