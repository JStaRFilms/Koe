# @koe/core

Shared logic and types for the Koe transcription platform.

## Scope

- **Transcription Providers:** Interfaces and helpers for Groq Whisper/Llama.
- **Session Orchestration:** The `SessionCoordinator` which handles segment ordering, committing, and refinement sequencing.
- **Usage Accounting:** Basic helpers for tracking audio seconds and request counts.
- **Utils:** Transcription-specific text manipulation.
- **Types:** Shared data contracts for settings and session state.

## Usage

### Desktop (CommonJS)

```javascript
const { SessionCoordinator } = require('@koe/core');
```

### Mobile (ES Modules / TypeScript)

```typescript
import { SessionCoordinator } from '@koe/core';
```

## Extraction Rules

- **Pure JS/TS Only:** No platform-specific APIs (Electron, React Native, Node FS).
- **Dependency Injection:** Use hooks/callbacks for platform-specific actions (storage, sounds, UI updates).
- **Small Surface Area:** Only export what is genuinely shared. Platform-specific adapters stay in their respective apps.
