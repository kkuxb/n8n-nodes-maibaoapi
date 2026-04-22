# Coding Conventions

**Analysis Date:** 2026-04-22

## Naming Patterns

**Files:**
- Use PascalCase for n8n credential and node implementation files: `credentials/MaibaoApi.credentials.ts`, `nodes/MaibaoApi/MaibaoApi.node.ts`.
- Use dot-suffixed role names for framework entry files: `*.credentials.ts`, `*.node.ts` in `credentials/` and `nodes/`.
- Use lowercase config filenames for tooling: `.prettierrc.js`, `eslint.config.mjs`, `tsconfig.json`, `package.json`.

**Functions:**
- Use camelCase for local helpers and pure transforms: `collectBinaryFromNodes()`, `extractImagesFromBinary()`, `downloadImagesFromUrls()`, `extractAudioFromBinary()`, `convertWordsToSentences()` in `nodes/MaibaoApi/MaibaoApi.node.ts`.
- Use verb-led names for async operations that fetch, collect, extract, or convert data in `nodes/MaibaoApi/MaibaoApi.node.ts`.

**Variables:**
- Use camelCase for local variables and parameters: `rawBaseUrl`, `binarySourceMode`, `specifiedNodes`, `responseFormat`, `bufferMap` in `nodes/MaibaoApi/MaibaoApi.node.ts`.
- Use descriptive boolean names with `is`/feature wording: `isAudioOrVideo`, `smartWait`, `storyboardMode` in `nodes/MaibaoApi/MaibaoApi.node.ts`.
- Use short loop counters only for item iteration: `i` in `execute()` at `nodes/MaibaoApi/MaibaoApi.node.ts`.

**Types:**
- Use PascalCase for interfaces and classes: `ImageData`, `AudioData`, `CollectedBinaryResult`, `WhisperWord`, `WhisperResponse`, `MaibaoApi` in `nodes/MaibaoApi/MaibaoApi.node.ts` and `credentials/MaibaoApi.credentials.ts`.
- Keep inline object typing for one-off workflow structures when the type is local to a branch, for example `shotCollection` in `nodes/MaibaoApi/MaibaoApi.node.ts`.

## Code Style

**Formatting:**
- Use Prettier via `.prettierrc.js`.
- Apply semicolons, trailing commas, bracket spacing, tabs with width 2, `arrowParens: 'always'`, `singleQuote: true`, `printWidth: 100`, and `endOfLine: 'lf'` from `.prettierrc.js`.
- Keep object literals and parameter lists multi-line when they exceed print width, as shown throughout `nodes/MaibaoApi/MaibaoApi.node.ts`.

**Linting:**
- Use the shared n8n ESLint preset exported from `eslint.config.mjs` via `@n8n/node-cli/eslint`.
- Run lint through `npm run lint` and `npm run lint:fix` defined in `package.json`.
- Keep targeted inline suppressions directly above exceptional lines only. Current examples in `nodes/MaibaoApi/MaibaoApi.node.ts`:
  - `@n8n/community-nodes/no-credential-reuse`
  - `@typescript-eslint/no-explicit-any`
  - `@n8n/community-nodes/no-deprecated-workflow-functions`
  - `@n8n/community-nodes/no-restricted-globals`

## Import Organization

**Order:**
1. Import external n8n types from `n8n-workflow`.
2. Define local interfaces near the top of the file.
3. Define helper functions before the exported class.

**Path Aliases:**
- Not detected in `tsconfig.json`.
- Use relative-free package imports only for external packages, for example `import { ... } from 'n8n-workflow';` in both `credentials/MaibaoApi.credentials.ts` and `nodes/MaibaoApi/MaibaoApi.node.ts`.

## Error Handling

**Patterns:**
- Throw `NodeOperationError` for user-facing validation and API contract failures, for example unsupported audio formats at `nodes/MaibaoApi/MaibaoApi.node.ts` and missing image payload branches in the image mode handler.
- Use local `try/catch` blocks around best-effort binary reads and remote downloads; on failure, skip the item instead of aborting helper execution in `collectBinaryFromNodes()`, `extractImagesFromBinary()`, `downloadImagesFromUrls()`, and `extractAudioFromBinary()` inside `nodes/MaibaoApi/MaibaoApi.node.ts`.
- Wrap each processed input item in a top-level `try/catch` inside `execute()` in `nodes/MaibaoApi/MaibaoApi.node.ts`.
- Respect n8n partial-failure behavior: when `this.continueOnFail()` is enabled, push `{ json: { error: error.message } }` and continue processing in `nodes/MaibaoApi/MaibaoApi.node.ts`.

## Logging

**Framework:** console not used.

**Patterns:**
- Do not add ad hoc `console.log` statements; no logging helper or logger abstraction is present in `nodes/MaibaoApi/MaibaoApi.node.ts` or `credentials/MaibaoApi.credentials.ts`.
- Surface execution problems through `NodeOperationError` and node output payloads instead of logs.

## Comments

**When to Comment:**
- Use short explanatory comments for branch intent, n8n behavior, API quirks, and fallback logic. Examples appear throughout `nodes/MaibaoApi/MaibaoApi.node.ts` for binary pre-read behavior, storyboard logic, and request helper selection.
- Keep comments near the exact line they justify rather than using file-level narrative blocks.

**JSDoc/TSDoc:**
- Not detected in `nodes/MaibaoApi/MaibaoApi.node.ts` or `credentials/MaibaoApi.credentials.ts`.
- Use inline comments instead of JSDoc for internal helpers in this codebase.

## Function Design

**Size:**
- Keep helper functions focused on one transformation or extraction concern.
- The main `execute()` method in `nodes/MaibaoApi/MaibaoApi.node.ts` is a large mode dispatcher; add new behavior as a dedicated helper before extending the main branch logic.

**Parameters:**
- Pass `context: IExecuteFunctions` explicitly into helpers that need node APIs, and pass `itemIndex` plus normalized arrays such as `propNames` or `specifiedNodes`, as shown in `nodes/MaibaoApi/MaibaoApi.node.ts`.
- Use union string literals for mode-like helper parameters, for example `'current' | 'specified' | 'url'` in `collectBinaryFromNodes()` usage and `'current' | 'specified'` in audio handling inside `nodes/MaibaoApi/MaibaoApi.node.ts`.

**Return Values:**
- Return typed objects from helpers instead of tuples, for example `CollectedBinaryResult` in `collectBinaryFromNodes()`.
- Return nullable values for optional extraction results, for example `Promise<AudioData | null>` from `extractAudioFromBinary()` in `nodes/MaibaoApi/MaibaoApi.node.ts`.
- Return n8n execution payloads as `INodeExecutionData[]` entries pushed into `returnData` and wrapped as `[returnData]` in `execute()`.

## Module Design

**Exports:**
- Export one primary class per module: `export class MaibaoApi implements ICredentialType` in `credentials/MaibaoApi.credentials.ts` and `export class MaibaoApi implements INodeType` in `nodes/MaibaoApi/MaibaoApi.node.ts`.
- Keep supporting interfaces and helpers file-local unless the n8n runtime requires export.

**Barrel Files:**
- Not used. No `index.ts` barrel exports detected under `credentials/` or `nodes/`.

---

*Convention analysis: 2026-04-22*
