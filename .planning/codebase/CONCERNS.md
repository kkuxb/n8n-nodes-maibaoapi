# Codebase Concerns

**Analysis Date:** 2026-04-22

## Tech Debt

**Monolithic node implementation:**
- Issue: Most runtime behavior, parameter definitions, binary extraction, media handling, audio post-processing, and API branching live in one large file, making changes tightly coupled and difficult to review safely.
- Files: `nodes/MaibaoApi/MaibaoApi.node.ts`
- Impact: Small edits can regress unrelated modes; duplicated logic for text/image/video/audio binary sourcing is harder to keep consistent.
- Fix approach: Split `nodes/MaibaoApi/MaibaoApi.node.ts` into focused modules for parameter schemas, binary/media helpers, per-mode API clients, and response shaping.

**Dead-but-retained feature branches:**
- Issue: Video and embeddings execution branches still exist in `execute()`, but the mode selector comments out those options from the UI.
- Files: `nodes/MaibaoApi/MaibaoApi.node.ts`
- Impact: Unsupported code paths remain unverified, increase maintenance cost, and create documentation/runtime drift.
- Fix approach: Either fully re-enable and test `video` / `embeddings` modes, or remove dormant branches and related parameters until they are supported.

**Documentation drift across project metadata:**
- Issue: published metadata and docs disagree on current capabilities and versions. `package.json` reports `1.1.6`, `README.md` headline says `V1.1.0`, and docs still advertise five modes while the node UI exposes only image, text, and audio.
- Files: `package.json`, `README.md`, `CHANGELOG.md`, `PROJECT_INDEX.md`, `nodes/MaibaoApi/MaibaoApi.node.ts`
- Impact: Users can configure flows based on features that are not selectable in the node UI; maintainers lose confidence in docs as source of truth.
- Fix approach: Align version strings, regenerate `PROJECT_INDEX.md`, and document only modes exposed by `description.properties` in `nodes/MaibaoApi/MaibaoApi.node.ts`.

**Duplicated parameter definitions with shared names:**
- Issue: Several parameters are declared multiple times under different display conditions (`imageSize`, `aspectRatio`, `binarySourceMode`) instead of being normalized through helper builders.
- Files: `nodes/MaibaoApi/MaibaoApi.node.ts`
- Impact: Future edits can update one variant and miss another, causing inconsistent UI behavior between modes or models.
- Fix approach: Extract reusable parameter factory helpers or consolidate conditional options into fewer parameter definitions.

## Known Bugs

**Sentence timestamp conversion is language-fragile:**
- Symptoms: `verbose_json` post-processing can produce incorrect or incomplete sentence boundaries because sentence segmentation uses `data.text.split(' ')` and then matches concatenated `word.word` tokens by length.
- Files: `nodes/MaibaoApi/MaibaoApi.node.ts`
- Trigger: Audio transcription output without space-delimited sentence boundaries, especially Chinese text such as the examples documented in `README.md`.
- Workaround: Use `text` output format or consume raw word-level timestamps upstream instead of relying on sentence conversion.

**Video and embeddings are documented but not user-selectable:**
- Symptoms: README and changelog describe video generation and embeddings, but the node mode picker does not expose them because those options are commented out.
- Files: `nodes/MaibaoApi/MaibaoApi.node.ts`, `README.md`, `CHANGELOG.md`
- Trigger: Installing the package and trying to follow documented setup for video or embeddings.
- Workaround: None in normal UI usage; the implementation must be re-exposed or the docs must be corrected.

**Image count limits differ between docs and code:**
- Symptoms: docs say text/image generation supports up to 3 images, but runtime extraction allows up to 10 for text and image modes.
- Files: `nodes/MaibaoApi/MaibaoApi.node.ts`, `README.md`, `CLAUDE.md`, `PROJECT_INDEX.md`
- Trigger: Workflows using more than 3 images may work despite docs claiming otherwise, or may exceed upstream API expectations.
- Workaround: Treat the API provider limit as authoritative and test per model before using more than 3 images.

## Security Considerations

**SSRF and unbounded remote fetch risk through image URLs:**
- Risk: `downloadImagesFromUrls()` performs direct GET requests to user-provided URLs without host allowlisting, protocol restrictions, content-length checks, or download size limits.
- Files: `nodes/MaibaoApi/MaibaoApi.node.ts`
- Current mitigation: MIME type is checked after download via response headers.
- Recommendations: Restrict protocols to HTTPS, reject private-network targets, enforce maximum body size, validate content type before full download where possible, and document URL-fetch trust assumptions.

**Inconsistent Authorization header construction for Sora endpoints:**
- Risk: text, image, audio, and credential test requests send `Bearer <token>`, while video requests send the raw API key string.
- Files: `nodes/MaibaoApi/MaibaoApi.node.ts`, `credentials/MaibaoApi.credentials.ts`
- Current mitigation: None in code; success depends on provider-specific tolerance.
- Recommendations: Standardize auth header format in one helper and cover all endpoints with regression tests.

**Local secret-handling test script invites manual key insertion:**
- Risk: the batch script instructs developers to paste a real API key into a tracked file.
- Files: `test_timestamp_granularities.bat`
- Current mitigation: Placeholder value only.
- Recommendations: Replace inline assignment with environment variable lookup and add the script output files to `.gitignore` if they are generated locally.

## Performance Bottlenecks

**Repeated buffer duplication for media-heavy workflows:**
- Problem: image and audio paths repeatedly decode binary data into `Buffer`, then often convert again into base64 strings or multipart payloads.
- Files: `nodes/MaibaoApi/MaibaoApi.node.ts`
- Cause: `collectBinaryFromNodes()`, `extractImagesFromBinary()`, and audio/image request building keep full in-memory copies of the same payload.
- Improvement path: Stream where possible, cap attachment counts and sizes, and avoid redundant base64 conversion when downstream APIs accept binary upload.

**Long-running serial polling blocks throughput:**
- Problem: video retrieval can sleep for up to 40 attempts × 15 seconds, and audio transcription allows 10-minute request timeouts inside the per-item loop.
- Files: `nodes/MaibaoApi/MaibaoApi.node.ts`
- Cause: `execute()` processes all input items sequentially and holds the worker until each item completes.
- Improvement path: Minimize in-node polling, return task IDs earlier, or isolate slow operations behind dedicated async patterns so one item does not block all following items.

## Fragile Areas

**Silent error swallowing during binary collection and media extraction:**
- Files: `nodes/MaibaoApi/MaibaoApi.node.ts`
- Why fragile: multiple helper functions use bare `catch {}` blocks and continue silently when node lookup, binary read, image decode, audio read, or URL download fails.
- Safe modification: Preserve error context and surface actionable warnings per property/node instead of silently skipping failures.
- Test coverage: No automated tests in the repository; `.github/workflows/ci.yml` only runs lint and build.

**Cross-node binary access assumptions:**
- Files: `nodes/MaibaoApi/MaibaoApi.node.ts`, `CLAUDE.md`
- Why fragile: `collectBinaryFromNodes()` depends on `workflowDataProxy.$(nodeName).all()` and item-index fallback behavior that can vary with upstream node shapes and execution timing.
- Safe modification: Add fixture-based tests for current-node vs specified-node paths, filesystem-backed binaries, and mismatched item counts before changing collection logic.
- Test coverage: Not covered by tests; behavior is validated only by implementation comments and docs.

**Mode-specific request logic embedded in one execute loop:**
- Files: `nodes/MaibaoApi/MaibaoApi.node.ts`
- Why fragile: a single `try/catch` around all mode branches increases the chance that shared parameter parsing or helper edits affect unrelated modes.
- Safe modification: Refactor into one dispatcher plus separate handler functions with narrow inputs and outputs.
- Test coverage: No mode-level unit or integration tests are present.

## Scaling Limits

**Per-item execution time scales linearly with slow external APIs:**
- Current capacity: one `execute()` loop handles items sequentially in `nodes/MaibaoApi/MaibaoApi.node.ts`.
- Limit: batches containing many audio or video items can accumulate minutes of runtime per workflow execution.
- Scaling path: prefer asynchronous job submission/retrieval patterns and document recommended batch sizes for media workloads.

**Attachment volume scales poorly in memory:**
- Current capacity: text and image modes allow up to 10 images per item, each materialized as buffers and base64 strings.
- Limit: large images or many concurrent executions can increase memory pressure significantly.
- Scaling path: enforce per-file and per-request size budgets, reduce allowed counts, and reject oversized payloads early.

## Dependencies at Risk

**Wildcard n8n dependencies increase compatibility drift:**
- Risk: `@n8n/node-cli` and peer dependency `n8n-workflow` are unpinned (`*`), so local builds and published installs can resolve against materially different n8n releases.
- Impact: community-node APIs, lint rules, or runtime interfaces may change without this package explicitly opting in.
- Migration plan: pin supported version ranges in `package.json` and test against the declared minimum/maximum n8n versions.

## Missing Critical Features

**Automated test suite is absent:**
- Problem: there are no `*.test.*` or `*.spec.*` files, and CI in `.github/workflows/ci.yml` validates only lint and build.
- Blocks: safe refactoring of `nodes/MaibaoApi/MaibaoApi.node.ts`, regression protection for binary handling, and reliable re-enabling of hidden modes.

**Input validation and request guardrails are thin for remote media:**
- Problem: URL-fed image ingestion lacks explicit size, count, protocol, and host safety guardrails beyond a best-effort MIME check.
- Blocks: safe adoption in multi-tenant or security-sensitive n8n environments.

## Test Coverage Gaps

**Binary ingestion paths are untested:**
- What's not tested: current-node binary reads, specified-node reads, filesystem-backed binary preloading, property-name fallbacks, and mixed image/audio inputs.
- Files: `nodes/MaibaoApi/MaibaoApi.node.ts`
- Risk: regressions in cross-node media access will only appear at runtime inside n8n workflows.
- Priority: High

**Audio post-processing is untested:**
- What's not tested: `extractAudioFromBinary()` format validation, `convertWordsToSentences()` sentence mapping, and `verbose_json` vs `text` output shaping.
- Files: `nodes/MaibaoApi/MaibaoApi.node.ts`, `test_timestamp_granularities.bat`
- Risk: timestamp conversion bugs and malformed response payloads can ship unnoticed.
- Priority: High

**Provider-specific API contract handling is untested:**
- What's not tested: auth-header format differences, Gemini image response parsing, 即梦 response parsing, Sora polling termination, and error propagation under `continueOnFail()`.
- Files: `nodes/MaibaoApi/MaibaoApi.node.ts`, `credentials/MaibaoApi.credentials.ts`
- Risk: upstream API changes can break production workflows with no early signal from CI.
- Priority: High

---

*Concerns audit: 2026-04-22*
