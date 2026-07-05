<template>
  <div class="card-panel" :class="{ 'card-panel--empty': !cards.length && !loading && !error }">
    <div class="panel-header">
      <h2>💡 Concepts</h2>
      <span class="card-count" v-if="cards.length">{{ cards.length }} found</span>
    </div>

    <div class="panel-body">
      <!-- Loading -->
      <div v-if="loading" class="state-msg">
        <div class="loading-bar"><div class="loading-bar-fill"></div></div>
        <p>Analyzing text...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="state-msg error">
        <span class="state-icon">⚠️</span>
        <p>{{ error }}</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="!cards.length" class="state-msg">
        <span class="state-icon" style="font-size:36px">🔍</span>
        <p>Add content and scan to discover concepts</p>
        <p class="state-sub">Cards will appear here automatically</p>
      </div>

      <!-- Cards -->
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
import ConceptCard from './ConceptCard.vue'
defineProps({
  cards: { type: Array, default: () => [] },
  loading: Boolean,
  error: String
})
defineEmits(['select-card', 'add-card'])
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
.card-count {
  font-size: 11px;
  color: var(--accent);
  background: rgba(88,166,255,0.1);
  padding: 2px 8px;
  border-radius: 10px;
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

@media (max-width: 768px) {
  .card-panel {
    width: 100% !important;
    border-left: 0;
    border-top: 1px solid var(--border);
    max-height: 45vh;
  }
}
</style>
