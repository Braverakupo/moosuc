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
          <div class="status-ok">✅ DeepSeek V4 configured</div>
          <div class="field-hint">Cache hit = $0.0028/1M · Cache miss = $0.14/1M · Output = $0.28/1M</div>
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
              <span>Cache hits</span>
              <span class="usage-val" :class="usage.cachePct > 50 ? 'cache-good' : 'cache-poor'">{{ usage.cachedTokens.toLocaleString() }} ({{ usage.cachePct }}%)</span>
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

        <!-- Live call log -->
        <div class="field">
          <label>Call Log <span class="log-count">({{ log.length }} calls)</span></label>
          <div class="call-log-table" v-if="log.length">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Type</th>
                  <th>Prompt</th>
                  <th>Cache</th>
                  <th>Output</th>
                  <th>Total</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(call, i) in reversedLog" :key="i" :class="warningClass(call)">
                  <td>{{ log.length - i }}</td>
                  <td><span class="call-type" :class="'type-' + call.type">{{ call.type }}</span></td>
                  <td class="num">{{ call.promptTokens.toLocaleString() }}</td>
                  <td class="num">
                    <span :class="call.cachePct > 50 ? 'cache-badge-hit' : 'cache-badge-miss'">
                      {{ call.cachePct }}%
                    </span>
                  </td>
                  <td class="num">{{ call.completionTokens.toLocaleString() }}</td>
                  <td class="num">{{ (call.promptTokens + call.completionTokens).toLocaleString() }}</td>
                  <td class="num">${{ call.cost.toFixed(6) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="log-empty">No API calls yet. Scan some text to get started.</div>
        </div>

        <hr />

        <button class="btn btn-secondary" @click="$emit('reset')">Reset to defaults</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getUsage, getCallLog } from '../services/ai.js'

const emit = defineEmits(['close', 'reset'])

const usage = ref(getUsage())
const log = ref([])

const reversedLog = computed(() => [...log.value].reverse())

function warningClass(call) {
  const thresholds = { scan: 2000, flashcard: 800, chat: 500 }
  const t = thresholds[call.type]
  return t && call.promptTokens > t ? 'row-warn' : ''
}

function refresh() {
  usage.value = getUsage()
  log.value = getCallLog()
}

onMounted(() => {
  refresh()
})
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
  width: 480px;
  max-width: 90vw;
  max-height: 85vh;
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
.cache-good { color: #3fb950 !important; }
.cache-poor { color: #d29922 !important; }

/* Call log table */
.log-count {
  font-weight: 400;
  color: var(--text2);
  font-size: 12px;
}
.call-log-table {
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: 6px;
  margin-top: 4px;
}
.call-log-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}
.call-log-table th {
  position: sticky;
  top: 0;
  background: var(--bg3);
  color: var(--text2);
  padding: 6px 8px;
  text-align: left;
  font-weight: 600;
  border-bottom: 1px solid var(--border);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.call-log-table td {
  padding: 5px 8px;
  border-bottom: 1px solid var(--border);
  color: var(--text);
}
.call-log-table tr:last-child td {
  border-bottom: 0;
}
.call-log-table td.num {
  text-align: right;
}
.call-type {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
}
.type-scan { background: rgba(88,166,255,0.15); color: #58a6ff; }
.type-flashcard { background: rgba(247,197,60,0.15); color: #f7c53c; }
.type-chat { background: rgba(63,185,80,0.15); color: #3fb950; }
.cache-badge-hit {
  color: #3fb950;
  font-weight: 600;
}
.cache-badge-miss {
  color: #f85149;
  font-weight: 600;
}
.row-warn {
  background: rgba(248,81,73,0.08) !important;
}
.row-warn td {
  color: #f85149 !important;
}
.log-empty {
  font-size: 12px;
  color: var(--text2);
  padding: 16px 0;
  text-align: center;
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
