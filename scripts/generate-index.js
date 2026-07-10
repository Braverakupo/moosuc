// Generate temple-of-zeus-content/index.json and .html from .md files
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { marked } from 'marked'

marked.use({ gfm: true })

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..', 'public', 'temple-of-zeus-content')

const CAT_NAMES = {
  '01-Main':'📋 Main','02-About':'ℹ️ About','03-Gods':'⚡ Gods','04-Doctrines':'📜 Doctrines',
  '05-Philosophy':'🧠 Philosophy','06-Zevism-Branches':'🌿 Zevism Branches','07-Afterlife':'💀 Afterlife',
  '08-Magick':'🔮 Magick','09-Squares':'🔲 Squares','10-Chakras-Meditations':'🕉️ Chakras & Meditations',
  '11-Enlightenment':'✨ Enlightenment','12-Personalities':'👤 Personalities','13-Family':'👪 Family',
  '14-Coven':'🕯️ Coven','15-Rites':'🏛️ Rites','16-Ethics':'⚖️ Ethics','17-Virtues':'⭐ Virtues',
  '18-Liturgical-Terms':'📖 Liturgical Terms','19-Resources':'📚 Resources',
}

const CAT_ORDER = Object.keys(CAT_NAMES)

function stripFrontmatter(text) {
  if (!text) return ''
  const match = text.match(/^---[\s\S]*?---\n*/)
  return match ? text.slice(match[0].length) : text
}

function fixRelativeUrls(text) {
  return text
    .replace(/!\[([^\]]*)\]\(\.\.\/assets\/([^)]+)\)/g, (_, alt, src) => `![${alt}](https://templeofzeus.org/assets/${src})`)
    .replace(/\[([^\]]+)\]\(([^)]+\.php[^)]*)\)/g, (_, text, href) => `[${text}](https://templeofzeus.org/${href})`)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
      if (src.startsWith('http') || src.startsWith('data:')) return _
      return `![${alt}](https://templeofzeus.org/${src.replace(/^\.\.\/?/, '')})`
    })
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, linkText, href) => {
      if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) return _
      if (href.endsWith('.php') || href.endsWith('.html')) {
        return `[${linkText}](https://templeofzeus.org/${href.replace(/^\.\.\/?/, '')})`
      }
      return _
    })
}

const index = { categories: [] }
let totalHtml = 0

for (const dir of CAT_ORDER) {
  const dirPath = join(root, dir)
  if (!existsSync(dirPath) || !statSync(dirPath).isDirectory()) continue

  const files = readdirSync(dirPath).filter(f => f.endsWith('.md'))
  const pages = []

  for (const f of files) {
    const name = f.replace(/\.md$/, '')
    pages.push({
      filename: name,
      display: name.replace(/^doctrines-|^family-|^coven-|^personalities-|^enlightenment-|^advancedphilosophy-/g, '').replace(/[-_]/g, ' ')
    })

    // Convert .md to .html
    const mdPath = join(dirPath, f)
    const htmlPath = join(dirPath, name + '.html')
    const mdContent = readFileSync(mdPath, 'utf-8')
    let body = stripFrontmatter(mdContent)
    body = fixRelativeUrls(body)
    const html = marked.parse(body)
    writeFileSync(htmlPath, html)
    totalHtml++
  }

  index.categories.push({
    key: dir,
    name: CAT_NAMES[dir] || dir,
    pages
  })
}

const outPath = join(root, 'index.json')
writeFileSync(outPath, JSON.stringify(index, null, 2))
console.log(`Generated index.json (${index.categories.length} cats, ${index.categories.reduce((s, c) => s + c.pages.length, 0)} pages) and ${totalHtml} .html files`)
