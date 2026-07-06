# Token Optimization Plan

## Current Issues

1. **No dedup on scan** — Every Enter press re-sends the full text to DeepSeek even if nothing changed
2. **Flashcard generation sends too much context** — 4000 chars of full text per card click
3. **Chat sends too much context** — 4000 chars per message

## Changes

### 1. [`src/composables/useScanner.js`](src/composables/useScanner.js)
- Add `lastScannedHash` variable to track the last scanned text content
- In `scan()`, compare newly extracted text against last hash
- If identical, return empty string (skip)
- If different, update hash and proceed

### 2. [`src/App.vue`](src/App.vue) 
- In `handleScan()`, check if `scanner.scan()` returned empty (duplicate)
- If empty, skip the API call entirely

### 3. [`src/services/ai.js`](src/services/ai.js)
- `generateFlashcard()`: Reduce textContext slice from 4000 → 1500 chars
- `chatAboutConcept()`: Reduce textContext slice from 4000 → 1500 chars
- Both flashcard and chat only need a brief excerpt relevant to the specific concept, not the full document

### 4. [`src/composables/useAI.js`](src/composables/useAI.js)
- No changes needed — the context reduction happens in the service layer

## Result
- Pressing Enter on unchanged text = 0 API calls (saved)
- Flashcard generation: 2500 fewer chars per call (~60% reduction)
- Chat: 2500 fewer chars per call (~60% reduction)
