import { ref, computed } from 'vue'

const BASE = '/temple-of-zeus-content'

const CATEGORY_NAMES = {
  '01-Main': '📋 Main',
  '02-About': 'ℹ️ About',
  '03-Gods': '⚡ Gods',
  '04-Doctrines': '📜 Doctrines',
  '05-Philosophy': '🧠 Philosophy',
  '06-Zevism-Branches': '🌿 Zevism Branches',
  '07-Afterlife': '💀 Afterlife',
  '08-Magick': '🔮 Magick',
  '09-Squares': '🔲 Squares',
  '10-Chakras-Meditations': '🕉️ Chakras & Meditations',
  '11-Enlightenment': '✨ Enlightenment',
  '12-Personalities': '👤 Personalities',
  '13-Family': '👪 Family',
  '14-Coven': '🕯️ Coven',
  '15-Rites': '🏛️ Rites',
  '16-Ethics': '⚖️ Ethics',
  '17-Virtues': '⭐ Virtues',
  '18-Liturgical-Terms': '📖 Liturgical Terms',
  '19-Resources': '📚 Resources',
}

const CATEGORY_ORDER = Object.keys(CATEGORY_NAMES)

// State
const libraryIndex = ref(null)
const selectedCategory = ref(null)
const selectedPage = ref(null)
const pageContent = ref('')
const isLoading = ref(false)
const isOpen = ref(false)
const searchQuery = ref('')

/**
 * Load the library index from the generated index.md.
 * Parses it to extract category → pages mapping.
 */
export function useToZLibrary() {
  async function loadIndex() {
    if (libraryIndex.value) return libraryIndex.value

    isLoading.value = true
    try {
      const resp = await fetch(`${BASE}/index.md`)
      const text = await resp.text()
      libraryIndex.value = parseIndex(text)
    } catch (err) {
      console.error('Failed to load ToZ library index:', err)
      libraryIndex.value = {}
    }
    isLoading.value = false
    return libraryIndex.value
  }

  // Auto-load index on initialization
  loadIndex()

  /**
   * Load a page's markdown content.
   */
  async function loadPage(category, filename) {
    isLoading.value = true
    selectedCategory.value = category
    selectedPage.value = filename
    pageContent.value = ''

    try {
      const resp = await fetch(`${BASE}/${category}/${filename}.md`)
      const text = await resp.text()
      pageContent.value = text
    } catch (err) {
      console.error(`Failed to load ${category}/${filename}:`, err)
      pageContent.value = '# Error loading page\n\nFailed to load this page. It may have been moved or deleted.'
    }
    isLoading.value = false
  }

  /**
   * Parse the index.md to extract category and page info.
   */
  function parseIndex(text) {
    const result = {}
    let currentCategory = null
    const lines = text.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      // Category header: "### 01-Main"
      const catMatch = line.match(/^###\s+([\d]{2}-[A-Za-z-]+)/)
      if (catMatch) {
        currentCategory = catMatch[1]
        result[currentCategory] = {
          name: CATEGORY_NAMES[currentCategory] || currentCategory,
          pages: [],
        }
        continue
      }

      // Page entry: "- ✅ [filename](category/filename.md)"
      if (currentCategory && line.startsWith('- ')) {
        const pageMatch = line.match(/\[([^\]]+)\]\([^)]+\)/)
        if (pageMatch) {
          const displayName = pageMatch[1].replace(/^doctrines-|^family-|^coven-|^personalities-|^enlightenment-|^advancedphilosophy-/g, '')
          result[currentCategory].pages.push({
            filename: pageMatch[1],
            display: displayName.replace(/[-_]/g, ' '),
          })
        }
      }
    }

    return result
  }

  /**
   * Get pages filtered by search query.
   */
  const filteredCategories = computed(() => {
    const idx = libraryIndex.value
    if (!idx) return []

    const cats = CATEGORY_ORDER.filter((c) => idx[c]).map((c) => ({
      key: c,
      name: idx[c].name,
      pages: idx[c].pages,
    }))

    if (!searchQuery.value) return cats

    const q = searchQuery.value.toLowerCase()
    return cats
      .map((cat) => ({
        ...cat,
        pages: cat.pages.filter((p) => p.display.toLowerCase().includes(q)),
      }))
      .filter((cat) => cat.pages.length > 0)
  })

  const totalPages = computed(() => {
    const idx = libraryIndex.value
    if (!idx) return 0
    return Object.values(idx).reduce((sum, cat) => sum + (cat.pages?.length || 0), 0)
  })

  const categoryCount = computed(() => {
    const idx = libraryIndex.value
    if (!idx) return 0
    return Object.keys(idx).length
  })

  function toggle() {
    isOpen.value = !isOpen.value
    if (isOpen.value && !libraryIndex.value) {
      loadIndex()
    }
  }

  function close() {
    isOpen.value = false
  }

  function closePage() {
    selectedPage.value = null
    selectedCategory.value = null
    pageContent.value = ''
  }

  return {
    libraryIndex,
    selectedCategory,
    selectedPage,
    pageContent,
    isLoading,
    isOpen,
    searchQuery,
    filteredCategories,
    totalPages,
    categoryCount,
    loadIndex,
    loadPage,
    toggle,
    close,
    closePage,
    CATEGORY_NAMES,
  }
}
