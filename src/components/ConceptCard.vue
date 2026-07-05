<template>
  <div class="card">
    <div class="card-main" @click="$emit('select', card)">
      <div class="card-icon">{{ icon }}</div>
      <div class="card-body">
        <div class="card-title">{{ card.concept || card }}</div>
        <div class="card-desc">{{ card.description || '' }}</div>
      </div>
      <div class="card-action">
        <span class="card-arrow">→</span>
      </div>
    </div>
    <button class="card-add" @click.stop="$emit('add', card)" title="Add concept to content">
      +
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  card: { type: [Object, String], required: true },
  index: { type: Number, default: 0 }
})
defineEmits(['select', 'add'])

const icons = ['💡', '🔬', '🌐', '📐', '🧠', '⚡', '🎯', '🔗', '📊', '🔄']
const icon = icons[props.index % icons.length]
</script>

<style scoped>
.card {
  display: flex;
  align-items: stretch;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  transition: border-color .15s;
}
.card:hover {
  border-color: var(--accent);
}
.card-main {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  cursor: pointer;
  flex: 1;
  min-width: 0;
  background: var(--bg2);
  transition: background .15s;
}
.card-main:hover {
  background: #1c2333;
}
.card-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}
.card-body {
  flex: 1;
  min-width: 0;
}
.card-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 3px;
}
.card-desc {
  font-size: 11px;
  color: var(--text2);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.card-action {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--bg3);
  transition: all .15s;
  margin-top: 2px;
}
.card-main:hover .card-action {
  background: var(--accent);
}
.card-arrow {
  font-size: 14px;
  color: var(--text2);
  transition: color .15s;
}
.card-main:hover .card-arrow {
  color: #fff;
}
.card-add {
  flex-shrink: 0;
  width: 32px;
  border: 0;
  border-left: 1px solid var(--border);
  background: var(--bg2);
  color: var(--text2);
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all .15s;
}
.card-add:hover {
  background: var(--accent);
  color: #fff;
}
</style>
