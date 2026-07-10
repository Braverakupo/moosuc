// Generate temple-of-zeus-content/index.json from directory structure
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

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

const index = { categories: [] }

for (const dir of CAT_ORDER) {
  const dirPath = join(root, dir)
  if (!existsSync(dirPath) || !statSync(dirPath).isDirectory()) continue

  const files = readdirSync(dirPath).filter(f => f.endsWith('.md'))
  const pages = files.map(f => ({
    filename: f.replace(/\.md$/, ''),
    display: f.replace(/\.md$/, '')
      .replace(/^doctrines-|^family-|^coven-|^personalities-|^enlightenment-|^advancedphilosophy-/g, '')
      .replace(/[-_]/g, ' ')
  }))

  index.categories.push({
    key: dir,
    name: CAT_NAMES[dir] || dir,
    pages
  })
}

const outPath = join(root, 'index.json')
writeFileSync(outPath, JSON.stringify(index, null, 2))
console.log(`Generated index.json with ${index.categories.length} categories, ${index.categories.reduce((s, c) => s + c.pages.length, 0)} pages`)
