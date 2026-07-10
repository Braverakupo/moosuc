<template>
  <div class="toz-reader-container">
    <!-- Loading -->
    <div v-if="loading" class="toz-reader-loading">
      <div class="loading-bar"><div class="loading-bar-fill"></div></div>
      <p>Loading...</p>
    </div>

    <!-- Content -->
    <article v-else class="toz-content" v-html="renderedContent"></article>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { marked } from 'marked'

const props = defineProps({
  content: { type: String, default: '' },
  category: { type: String, default: '' },
  filename: { type: String, default: '' },
  loading: { type: Boolean, default: false },
})

// Configure marked — use gfm for tables, strikethrough, etc.
marked.use({ gfm: true, breaks: false })

const renderedContent = computed(() => {
  const text = stripFrontmatter(props.content)
  if (!text) return '<p class="toz-empty">Select a page from the sidebar.</p>'

  try {
    const processed = fixRelativeUrls(text)
    return marked.parse(processed)
  } catch (err) {
    console.error('Markdown render error:', err)
    return '<p class="toz-error">Error rendering page content.</p>'
  }
})

/**
 * Strip YAML frontmatter (--- ... ---) from markdown text.
 */
function stripFrontmatter(text) {
  if (!text) return ''
  const match = text.match(/^---[\s\S]*?---\n*/)
  return match ? text.slice(match[0].length) : text
}

/**
 * Fix relative URLs to point to the live site.
 */
function fixRelativeUrls(text) {
  return text
    // Relative image paths from assets/
    .replace(/!\[([^\]]*)\]\(\.\.\/assets\/([^)]+)\)/g,
      (_, alt, src) => `![${alt}](https://templeofzeus.org/assets/${src})`)
    // Relative links to .php pages
    .replace(/\[([^\]]+)\]\(([^)]+\.php[^)]*)\)/g,
      (_, text, href) => `[${text}](https://templeofzeus.org/${href})`)
    // Other relative images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g,
      (_, alt, src) => {
        if (src.startsWith('http') || src.startsWith('data:')) return _
        return `![${alt}](https://templeofzeus.org/${src.replace(/^\.\.\/?/, '')})`
      })
    // Other relative links (.php / .html)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g,
      (_, linkText, href) => {
        if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) return _
        if (href.endsWith('.php') || href.endsWith('.html')) {
          return `[${linkText}](https://templeofzeus.org/${href.replace(/^\.\.\/?/, '')})`
        }
        return _
      })
}
</script>

<style scoped>
.toz-reader-container {
  height: 100%;
  overflow-y: auto;
  padding: 32px 40px;
  max-width: 800px;
  margin: 0 auto;
}

.toz-reader-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
}
.toz-reader-loading p {
  font-size: 13px;
  color: var(--text2);
}

/* Markdown content styling */
.toz-content {
  line-height: 1.7;
  color: var(--text);
  font-size: 15px;
}
.toz-content :deep(h1) {
  font-size: 28px;
  font-weight: 800;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
  line-height: 1.3;
}
.toz-content :deep(h2) {
  font-size: 20px;
  font-weight: 700;
  margin: 28px 0 12px;
  line-height: 1.3;
}
.toz-content :deep(h3) {
  font-size: 16px;
  font-weight: 600;
  margin: 24px 0 8px;
}
.toz-content :deep(h4) {
  font-size: 14px;
  font-weight: 600;
  margin: 20px 0 6px;
  color: var(--accent3);
}
.toz-content :deep(p) {
  margin: 0 0 14px;
}
.toz-content :deep(a) {
  color: var(--accent);
  text-decoration: none;
}
.toz-content :deep(a:hover) {
  text-decoration: underline;
}
.toz-content :deep(ul),
.toz-content :deep(ol) {
  margin: 0 0 14px;
  padding-left: 24px;
}
.toz-content :deep(li) {
  margin-bottom: 4px;
}
.toz-content :deep(blockquote) {
  margin: 16px 0;
  padding: 12px 16px;
  border-left: 3px solid var(--accent3);
  background: var(--bg2);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  font-style: italic;
  color: var(--text2);
}
.toz-content :deep(blockquote p) {
  margin: 0;
}
.toz-content :deep(code) {
  background: var(--bg3);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 13px;
  font-family: 'SFMono-Regular', Consolas, monospace;
}
.toz-content :deep(pre) {
  background: var(--bg2);
  padding: 16px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  overflow-x: auto;
  margin: 16px 0;
}
.toz-content :deep(pre code) {
  background: none;
  padding: 0;
  font-size: 13px;
  line-height: 1.5;
}
.toz-content :deep(img) {
  max-width: 100%;
  border-radius: var(--radius);
  margin: 16px 0;
}
.toz-content :deep(hr) {
  border: none;
  border-top: 1px solid var(--border);
  margin: 24px 0;
}
.toz-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  font-size: 13px;
}
.toz-content :deep(th),
.toz-content :deep(td) {
  padding: 8px 12px;
  border: 1px solid var(--border);
  text-align: left;
}
.toz-content :deep(th) {
  background: var(--bg2);
  font-weight: 600;
}
.toz-content :deep(strong) {
  font-weight: 700;
  color: var(--accent3);
}
.toz-content :deep(em) {
  font-style: italic;
}

/* Loading bar */
.loading-bar {
  width: 120px;
  height: 3px;
  border-radius: 2px;
  background: var(--border);
  overflow: hidden;
}
.loading-bar-fill {
  height: 100%;
  width: 30%;
  background: var(--accent);
  border-radius: 2px;
  animation: loading-slide 1.4s ease-in-out infinite;
}
@keyframes loading-slide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}

@media (max-width: 768px) {
  .toz-reader-container {
    padding: 20px 16px;
  }
}
</style>
