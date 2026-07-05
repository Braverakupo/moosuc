import { reactive } from 'vue'

const STORAGE_KEY = 'concept-explorer-settings'

const defaults = {
  model: 'deepseek-chat'
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults }
  } catch { return { ...defaults } }
}

function save(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch { /* quota exceeded, ignore */ }
}

const settings = reactive(load())

export function useSettings() {
  function update(key, value) {
    settings[key] = value
    save(settings)
  }

  function reset() {
    Object.assign(settings, defaults)
    save(settings)
  }

  return { settings, update, reset }
}
