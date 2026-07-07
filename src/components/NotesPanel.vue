<template>
  <div class="notes-root">
    <!-- Toggle button -->
    <button class="notes-toggle" @click="open = !open" :title="open ? 'Close notes' : 'Open notes'">
      📓 <span class="toggle-label">{{ open ? 'Close' : 'Notes' }}</span>
      <span v-if="notes.length && !open" class="notes-badge">{{ notes.length }}</span>
    </button>

    <!-- Popout panel -->
    <div v-if="open" class="notes-panel">
      <!-- Header -->
      <div class="notes-header">
        <h3>📓 Notes</h3>
        <div class="notes-header-actions">
          <button v-if="notes.length" class="btn btn-clear-all" @click="handleClearAll" title="Delete all notes">🗑 Clear all</button>
          <button class="btn-add" @click="handleAdd" title="New note">＋ New</button>
        </div>
      </div>

      <div class="notes-body">
        <!-- Notepad grid (overview) -->
        <div v-if="!editingNote" class="notepad-grid">
          <div
            v-for="note in notes"
            :key="note.id"
            class="notepad-card"
            @dblclick="startEdit(note)"
          >
            <div class="notepad-icon">📄</div>
            <div class="notepad-title">{{ note.title }}</div>
            <div class="notepad-date">{{ fmtDate(note.updatedAt) }}</div>
          </div>
          <div v-if="notes.length === 0" class="notepad-empty">
            <p>No notes yet.</p>
            <p class="notepad-empty-sub">Click <strong>＋ New</strong> to create one.</p>
          </div>
        </div>

        <!-- Editor -->
        <div v-else class="note-editor">
          <div class="editor-header">
            <input
              class="editor-title-input"
              v-model="editTitle"
              placeholder="Note title"
              @keydown.enter.prevent="handleSave"
            />
            <div class="editor-actions">
              <button class="btn btn-save" @click="handleSave">💾 Save</button>
              <button class="btn btn-delete" @click="handleDelete">🗑 Delete</button>
              <button class="btn btn-back" @click="cancelEdit">← Back</button>
            </div>
          </div>
          <textarea
            class="editor-textarea"
            v-model="editContent"
            placeholder="Write your note here..."
          ></textarea>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useNotes } from '../composables/useNotes.js'

const { notes, addNote, updateNote, deleteNote, clearNotes } = useNotes()

const open = ref(false)
const editingNote = ref(null)
const editTitle = ref('')
const editContent = ref('')

function fmtDate(ts) {
  const d = new Date(ts)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function handleAdd() {
  const note = addNote()
  startEdit(note)
}

function startEdit(note) {
  editingNote.value = note
  editTitle.value = note.title
  editContent.value = note.content
}

function cancelEdit() {
  editingNote.value = null
  editTitle.value = ''
  editContent.value = ''
}

function handleSave() {
  if (!editingNote.value) return
  const title = editTitle.value.trim() || 'Untitled'
  updateNote(editingNote.value.id, { title, content: editContent.value })
  cancelEdit()
}

function handleDelete() {
  if (!editingNote.value) return
  deleteNote(editingNote.value.id)
  cancelEdit()
}

function handleClearAll() {
  if (notes.length === 0) return
  clearNotes()
}
</script>

<style scoped>
.notes-root {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 80;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
}

.notes-toggle {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border: 1px solid var(--border);
  border-bottom: 0;
  border-radius: 12px 12px 0 0;
  background: var(--bg2);
  color: var(--text);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all .15s;
  position: relative;
}
.notes-toggle:hover {
  background: var(--bg3);
  border-color: var(--accent);
}
.toggle-label {
  min-width: 36px;
}
.notes-badge {
  background: var(--accent);
  color: #fff;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 8px;
  position: absolute;
  top: -4px;
  right: -4px;
}

.notes-panel {
  pointer-events: auto;
  width: 100%;
  max-width: 100%;
  max-height: 60vh;
  background: var(--bg);
  border: 1px solid var(--border);
  border-bottom: 0;
  border-radius: 12px 12px 0 0;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp .2s ease;
}

@keyframes slideUp {
  from { transform: translateY(100%); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}

.notes-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.notes-header h3 {
  font-size: 14px;
  font-weight: 700;
}
.btn-add {
  padding: 4px 12px;
  border: 1px solid var(--accent);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--accent);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all .15s;
}
.btn-add:hover {
  background: rgba(88,166,255,0.1);
}

.notes-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

/* Notepad grid */
.notepad-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}
.notepad-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg2);
  cursor: default;
  transition: all .15s;
}
.notepad-card:hover {
  border-color: var(--accent);
  background: var(--bg3);
}
.notepad-icon {
  font-size: 32px;
  line-height: 1;
}
.notepad-title {
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
.notepad-date {
  font-size: 10px;
  color: var(--text2);
}
.notepad-empty {
  grid-column: 1 / -1;
  text-align: center;
  color: var(--text2);
  padding: 32px 0;
}
.notepad-empty-sub {
  font-size: 12px;
  margin-top: 4px;
  opacity: 0.7;
}

/* Editor */
.note-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
}
.editor-header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.editor-title-input {
  flex: 1;
  min-width: 140px;
  font-size: 14px;
  font-weight: 700;
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg3);
  color: var(--text);
}
.editor-title-input:focus {
  border-color: var(--accent);
  outline: none;
}
.editor-actions {
  display: flex;
  gap: 6px;
}
.editor-textarea {
  flex: 1;
  min-height: 180px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg3);
  color: var(--text);
  font-size: 13px;
  line-height: 1.6;
  resize: vertical;
}
.editor-textarea:focus {
  border-color: var(--accent);
  outline: none;
}

.btn {
  padding: 5px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg3);
  color: var(--text);
  font-size: 12px;
  cursor: pointer;
  transition: all .15s;
  white-space: nowrap;
}
.btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}
.btn-save {
  border-color: var(--accent2);
  color: var(--accent2);
}
.btn-save:hover {
  background: rgba(63,185,80,0.1);
}
.btn-delete {
  border-color: var(--danger);
  color: var(--danger);
}
.btn-delete:hover {
  background: rgba(248,81,73,0.1);
}
.btn-clear-all {
  font-size: 11px;
  padding: 3px 10px;
  color: var(--text2);
  border-color: transparent;
  background: transparent;
}
.btn-clear-all:hover {
  border-color: var(--danger);
  color: var(--danger);
  background: rgba(248,81,73,0.08);
}
</style>
