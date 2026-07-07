import { ref, watch } from 'vue'

const STORAGE_KEY = 'moosuc-notes'
const VERSION_KEY = 'moosuc-notes-ver'
const NOTES_VERSION = 2

function loadNotes() {
  try {
    const ver = parseInt(localStorage.getItem(VERSION_KEY) || '0', 10)
    if (ver < NOTES_VERSION) {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.setItem(VERSION_KEY, String(NOTES_VERSION))
      return []
    }
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveNotes(notes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
}

let nextId = 1

const notes = ref(loadNotes())

// sync to localStorage on every change
watch(notes, (val) => saveNotes(val), { deep: true })

export function useNotes() {
  function addNote(title = 'Untitled') {
    const now = Date.now()
    const note = {
      id: nextId++,
      title,
      content: '',
      createdAt: now,
      updatedAt: now,
    }
    notes.value.push(note)
    return note
  }

  function updateNote(id, patch) {
    const note = notes.value.find((n) => n.id === id)
    if (!note) return
    Object.assign(note, patch, { updatedAt: Date.now() })
  }

  function deleteNote(id) {
    notes.value = notes.value.filter((n) => n.id !== id)
  }

  function getNote(id) {
    return notes.value.find((n) => n.id === id)
  }

  function clearNotes() {
    notes.value = []
  }

  return { notes, addNote, updateNote, deleteNote, getNote, clearNotes }
}
