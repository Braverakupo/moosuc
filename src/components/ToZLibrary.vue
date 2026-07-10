<template>
  <div class="toz-wrapper" :class="{ 'toz-wrapper--collapsed': collapsed }">
    <!-- Sidebar -->
    <div class="toz-sidebar">
      <button class="toz-toggle" @click="$emit('toggle')" :title="collapsed ? 'Show' : 'Hide'">
        {{ collapsed ? '🏛️' : '◀' }}
      </button>

      <div v-if="!collapsed" class="toz-sidebar-inner">
        <div class="toz-header"><h2>🏛️</h2></div>


        <div v-if="loading && !index" class="toz-loading"><div class="loading-bar"><div class="loading-bar-fill"></div></div></div>

        <div v-else class="toz-cats">
          <div v-for="cat in categories" :key="cat.key">
            <button class="toz-cat-hdr" @click="toggleCat(cat.key)">
              <span class="toz-arr">{{ open[cat.key] ? '▼' : '▶' }}</span>
              <span class="toz-catn">{{ cat.name }}</span>
              <span class="toz-cnt">{{ cat.pages.length }}</span>
            </button>
            <div v-if="open[cat.key]" class="toz-pgs">
              <button
                v-for="p in cat.pages"
                :key="p.filename"
                class="toz-pg"
                :class="{ 'toz-pg--on': selPage === p.filename && selCat === cat.key }"
                @click="selectPage(cat.key, p.filename)"
              >{{ p.display }}</button>
            </div>
          </div>
          <div v-if="!categories.length && !loading" class="toz-no">No matches</div>
        </div>
      </div>
    </div>

    <!-- Reader -->
    <div v-if="selPage" class="toz-reader" :class="{ 'toz-reader--active': selPage }">
      <div class="toz-reader-hdr">
        <span class="toz-reader-title">{{ readerTitle }}</span>
        <button class="toz-reader-x" @click="closeReader">✕</button>
      </div>
      <div class="toz-reader-body">
        <div v-if="loading" class="toz-loading"><div class="loading-bar"><div class="loading-bar-fill"></div></div><p>Loading...</p></div>
        <article v-else class="toz-md" v-html="renderedMd"></article>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { marked } from 'marked'
marked.use({ gfm: true })

const BASE = './temple-of-zeus-content'

const props = defineProps({
  collapsed: Boolean,
  searchQuery: String,
})
const emit = defineEmits(['toggle', 'update:searchQuery'])

const index = ref(null)
const loading = ref(false)
const open = ref({})
const selCat = ref(null)
const selPage = ref(null)
const pageMd = ref('')

const CAT_NAMES = {
  '01-Main':'📋 Main','02-About':'ℹ️ About','03-Gods':'⚡ Gods','04-Doctrines':'📜 Doctrines',
  '05-Philosophy':'🧠 Philosophy','06-Zevism-Branches':'🌿 Zevism Branches','07-Afterlife':'💀 Afterlife',
  '08-Magick':'🔮 Magick','09-Squares':'🔲 Squares','10-Chakras-Meditations':'🕉️ Chakras & Meditations',
  '11-Enlightenment':'✨ Enlightenment','12-Personalities':'👤 Personalities','13-Family':'👪 Family',
  '14-Coven':'🕯️ Coven','15-Rites':'🏛️ Rites','16-Ethics':'⚖️ Ethics','17-Virtues':'⭐ Virtues',
  '18-Liturgical-Terms':'📖 Liturgical Terms','19-Resources':'📚 Resources',
}
const CAT_ORDER = Object.keys(CAT_NAMES)

const categories = computed(() => {
  const idx = index.value
  if (!idx) return []
  return CAT_ORDER.filter(c => idx[c]).map(c => ({ key: c, name: CAT_NAMES[c] || c, pages: idx[c] }))
})

const readerTitle = computed(() => {
  if (!selPage.value) return ''
  return selPage.value.replace(/^doctrines-|^family-|^coven-|^personalities-|^enlightenment-|^advancedphilosophy-/g, '').replace(/[-_]/g, ' ')
})

const renderedMd = computed(() => {
  if (!pageMd.value) return '<p>Select a page.</p>'
  try {
    let t = pageMd.value.replace(/^---[\s\S]*?---\n*/, '') // strip frontmatter
    // fix relative urls
    t = t.replace(/!\[([^\]]*)\]\(\.\.\/assets\/([^)]+)\)/g, '![$1](https://templeofzeus.org/assets/$2)')
    t = t.replace(/\[([^\]]+)\]\(([^)]+\.php[^)]*)\)/g, '[$1](https://templeofzeus.org/$2)')
    return marked.parse(t)
  } catch(e) { return '<p>Error rendering.</p>' }
})

async function loadIndex() {
  loading.value = true
  try {
    const r = await fetch(`${BASE}/index.md`)
    const txt = await r.text()
    const idx = {}
    let cat = null
    for (const line of txt.split('\n')) {
      const m = line.match(/^###\s+([\d]{2}-[A-Za-z-]+)/)
      if (m) { cat = m[1]; idx[cat] = [] }
      else if (cat) {
        // Match markdown links in list items: may have checkmarks or other prefixes
        // e.g. "- ✅ [filename](path.md)" or "- [filename](path.md)"
        const p = line.match(/\[([^\]]+)\]\(([^)]+\.md)\)/)
        if (p) idx[cat].push({ filename: p[1], display: p[1].replace(/^doctrines-|^family-|^coven-|^personalities-|^enlightenment-|^advancedphilosophy-/g, '').replace(/[-_]/g, ' ') })
      }
    }
    index.value = idx
  } catch(e) { console.error('index load fail', e); index.value = {} }
  loading.value = false
}
loadIndex()

async function selectPage(cat, file) {
  selCat.value = cat
  selPage.value = file
  pageMd.value = ''
  loading.value = true
  try {
    const r = await fetch(`${BASE}/${cat}/${file}.md`)
    pageMd.value = await r.text()
  } catch(e) { console.error('page load fail', e); pageMd.value = '# Error\nFailed to load.' }
  loading.value = false
}

function closeReader() {
  selCat.value = null
  selPage.value = null
  pageMd.value = ''
}

function toggleCat(k) { open.value[k] = !open.value[k] }

watch(selCat, (c) => { if (c) open.value[c] = true })
</script>

<style scoped>
.toz-wrapper {
  display: flex;
  height: 100%;
  overflow: hidden;
  flex: 1;
  max-width: 50%;
}
.toz-wrapper--collapsed { max-width: 50%; }

/* Sidebar */
.toz-sidebar {
  width: 240px;
  min-width: 240px;
  display: flex;
  flex-direction: column;
  background: var(--bg2);
  border-right: 1px solid var(--border);
  position: relative;
  transition: width 0.2s, min-width 0.2s;
  overflow: hidden;
}
.toz-wrapper--collapsed .toz-sidebar { width: 0; min-width: 0; overflow: visible; border: none; background: transparent; }
.toz-wrapper--collapsed .toz-toggle { position: fixed; top: 10px; left: 0; right: auto; border: 1px solid var(--border); border-radius: 0 4px 4px 0; width: 22px; height: 30px; font-size: 13px; background: var(--bg2); z-index: 100; }
.toz-toggle {
  position: absolute; top: 10px; right: -1px; z-index: 5;
  width: 18px; height: 26px; display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--border); border-right: none; border-radius: 4px 0 0 4px;
  background: var(--bg2); color: var(--text2); font-size: 9px; cursor: pointer;
}
.toz-toggle:hover { background: var(--bg3); color: var(--text); }
.toz-sidebar-inner { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.toz-header { padding: 8px 12px; border-bottom: 1px solid var(--border); }
.toz-header h2 { font-size: 15px; font-weight: 700; }
.toz-loading { padding: 16px; text-align: center; }
.toz-loading p { font-size: 11px; color: var(--text2); margin-top: 6px; }
.loading-bar { height: 3px; border-radius: 2px; background: var(--border); overflow: hidden; }
.loading-bar-fill { height: 100%; width: 30%; background: var(--accent); border-radius: 2px; animation: slide 1.4s ease-in-out infinite; }
@keyframes slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(400%); } }

.toz-cats { flex: 1; overflow-y: auto; padding: 4px 0; }
.toz-cat-hdr { width: 100%; display: flex; align-items: center; gap: 3px; padding: 4px 12px; border: 0; background: transparent; color: var(--text); font-size: 11px; font-weight: 600; text-align: left; cursor: pointer; }
.toz-cat-hdr:hover { background: var(--bg3); }
.toz-arr { font-size: 7px; color: var(--text2); width: 10px; flex-shrink: 0; }
.toz-catn { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.toz-cnt { font-size: 9px; color: var(--text2); background: var(--bg); padding: 0 5px; border-radius: 6px; flex-shrink: 0; }
.toz-pgs { border-left: 1px solid var(--border); margin-left: 16px; }
.toz-pg { width: 100%; display: block; padding: 2px 12px 2px 6px; border: 0; background: transparent; color: var(--text2); font-size: 11px; text-align: left; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.toz-pg:hover { color: var(--text); background: var(--bg3); }
.toz-pg--on { color: var(--accent); background: rgba(88,166,255,0.08); font-weight: 600; }
.toz-no { padding: 16px 12px; text-align: center; color: var(--text2); font-size: 11px; }

/* Reader */
.toz-reader {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
  background: var(--bg);
}
.toz-reader-hdr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 14px;
  border-bottom: 1px solid var(--border);
  background: var(--bg2);
  flex-shrink: 0;
}
.toz-reader-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.toz-reader-x {
  width: 22px; height: 22px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--border); border-radius: 4px;
  background: transparent; color: var(--text2); font-size: 10px;
  cursor: pointer; flex-shrink: 0;
}
.toz-reader-x:hover { background: var(--bg3); color: var(--text); }
.toz-reader-body {
  flex: 1;
  overflow-y: auto;
  padding: 3px;
  max-width: 800px;
  margin: 0 auto;
}

/* Markdown */
.toz-md { line-height: 1.7; color: var(--text); font-size: 14px; }
.toz-md :deep(img) {
  max-width: 360px;
  max-height: 360px;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: var(--radius);
  margin: 16px 0;
}
.toz-md :deep(h1) { font-size: 24px; font-weight: 800; margin: 0 0 12px; padding-bottom: 6px; border-bottom: 1px solid var(--border); }
.toz-md :deep(h2) { font-size: 18px; font-weight: 700; margin: 24px 0 10px; }
.toz-md :deep(h3) { font-size: 15px; font-weight: 600; margin: 20px 0 6px; }
.toz-md :deep(p) { margin: 0 0 12px; }
.toz-md :deep(a) { color: var(--accent); text-decoration: none; }
.toz-md :deep(a:hover) { text-decoration: underline; }
.toz-md :deep(ul), .toz-md :deep(ol) { margin: 0 0 12px; padding-left: 22px; }
.toz-md :deep(li) { margin-bottom: 3px; }
.toz-md :deep(blockquote) { margin: 12px 0; padding: 10px 14px; border-left: 3px solid var(--accent3); background: var(--bg2); border-radius: 0 4px 4px 0; font-style: italic; color: var(--text2); }
.toz-md :deep(blockquote p) { margin: 0; }
.toz-md :deep(code) { background: var(--bg3); padding: 1px 5px; border-radius: 3px; font-size: 12px; }
.toz-md :deep(pre) { background: var(--bg2); padding: 14px; border-radius: 6px; border: 1px solid var(--border); overflow-x: auto; margin: 14px 0; }
.toz-md :deep(pre code) { background: none; padding: 0; font-size: 12px; }
.toz-md :deep(hr) { border: 0; border-top: 1px solid var(--border); margin: 20px 0; }
.toz-md :deep(strong) { font-weight: 700; color: var(--accent3); }

@media (max-width: 768px) {
  .toz-wrapper {
    max-width: 100%;
    flex: none;
    height: auto;
    max-height: 50vh;
  }
  .toz-wrapper--collapsed {
    max-width: 0;
    flex: none;
    height: auto;
  }
  /* When collapsed, keep toggle pinned below top bar */
  .toz-wrapper--collapsed .toz-toggle {
    position: fixed;
    top: 44px;
    left: 0;
    width: 26px;
    height: 32px;
    font-size: 14px;
    border: 1px solid var(--border);
    border-radius: 0 4px 4px 0;
    background: var(--bg2);
    z-index: 100;
  }
  .toz-wrapper:not(.toz-wrapper--collapsed) .toz-sidebar {
    width: 100%;
    min-width: 0;
  }
  .toz-wrapper:not(.toz-wrapper--collapsed) .toz-reader {
    display: none;
  }
  /* When a page is selected on mobile, show only the reader */
  .toz-wrapper:not(.toz-wrapper--collapsed) .toz-reader--active {
    display: flex;
  }
  .toz-reader-body {
    padding: 3px;
  }
  .toz-md :deep(h1) { font-size: 20px; }
  .toz-md :deep(h2) { font-size: 16px; }
}
</style>
