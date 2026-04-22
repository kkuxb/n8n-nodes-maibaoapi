# Architecture

**Analysis Date:** 2026-04-22

## Pattern Overview

**Overall:** Single-package n8n community node with a monolithic node implementation and a separate credential definition.

**Key Characteristics:**
- Runtime behavior is centralized in one `INodeType` class at `nodes/MaibaoApi/MaibaoApi.node.ts`.
- Declarative n8n UI/property metadata and imperative execution logic live in the same file at `nodes/MaibaoApi/MaibaoApi.node.ts`.
- Shared binary-processing helpers sit above the exported node class in `nodes/MaibaoApi/MaibaoApi.node.ts` and are reused across text, image, video, and audio flows.

## Layers

**Package/Build Layer:**
- Purpose: Declare the package, n8n entrypoints, scripts, and TypeScript build output.
- Location: `package.json`, `tsconfig.json`, `eslint.config.mjs`, `.prettierrc.js`
- Contains: npm scripts, `n8n` manifest, compiler settings, lint/format configuration.
- Depends on: `@n8n/node-cli`, `typescript`, `eslint`, `prettier`, `n8n-workflow` in `package.json`.
- Used by: Local development, CI in `.github/workflows/ci.yml`, and npm packaging.

**Credential Layer:**
- Purpose: Define authentication fields and credential test behavior for MaibaoAPI.
- Location: `credentials/MaibaoApi.credentials.ts`
- Contains: `MaibaoApi implements ICredentialType`, API key field, hidden base URL field, `/models` test request.
- Depends on: `ICredentialType`, `INodeProperties`, and `ICredentialTestRequest` from `n8n-workflow` in `credentials/MaibaoApi.credentials.ts`.
- Used by: The node description in `nodes/MaibaoApi/MaibaoApi.node.ts` through `credentials: [{ name: 'maibaoApi', required: true }]`.

**Node Definition Layer:**
- Purpose: Define all n8n-facing metadata, modes, parameter schema, and tool capability.
- Location: `nodes/MaibaoApi/MaibaoApi.node.ts`
- Contains: `description: INodeTypeDescription`, `properties`, `displayOptions`, operation modes, and `usableAsTool: true`.
- Depends on: n8n type contracts from `n8n-workflow` and credential name `maibaoApi` from `credentials/MaibaoApi.credentials.ts`.
- Used by: n8n editor and runtime when rendering the node UI and validating parameters.

**Execution Orchestration Layer:**
- Purpose: Route each input item into the selected mode and operation, then push normalized outputs to n8n.
- Location: `nodes/MaibaoApi/MaibaoApi.node.ts` in `async execute(this: IExecuteFunctions)`.
- Contains: item loop, credential loading, mode branching for `text`, `image`, `video`, `audio`, and `embeddings`, plus final error propagation.
- Depends on: helper functions in the same file, n8n execution helpers, and credential values from `this.getCredentials('maibaoApi')`.
- Used by: n8n runtime when the node executes in a workflow.

**Binary Acquisition Layer:**
- Purpose: Collect binary payloads from current input, specified upstream nodes, or remote URLs before downstream API calls.
- Location: `nodes/MaibaoApi/MaibaoApi.node.ts`
- Contains: `collectBinaryFromNodes()`, `extractImagesFromBinary()`, `downloadImagesFromUrls()`, and `extractAudioFromBinary()`.
- Depends on: `context.getInputData()`, `context.getWorkflowDataProxy()`, `context.helpers.getBinaryStream()`, `context.helpers.binaryToBuffer()`, `context.helpers.getBinaryDataBuffer()`, and `context.helpers.httpRequest()`.
- Used by: Text mode at `nodes/MaibaoApi/MaibaoApi.node.ts:743-752`, image mode at `nodes/MaibaoApi/MaibaoApi.node.ts:793-801` and `nodes/MaibaoApi/MaibaoApi.node.ts:835-843`, video create at `nodes/MaibaoApi/MaibaoApi.node.ts:888-896`, and audio mode at `nodes/MaibaoApi/MaibaoApi.node.ts:992-996`.

**Response Adaptation Layer:**
- Purpose: Convert remote API responses into n8n JSON or binary outputs.
- Location: `nodes/MaibaoApi/MaibaoApi.node.ts`
- Contains: chat response passthrough, binary image/video preparation with `prepareBinaryData`, and Whisper sentence aggregation with `convertWordsToSentences()`.
- Depends on: `this.helpers.prepareBinaryData()` and response shapes returned by MaibaoAPI.
- Used by: All mode branches before pushing items into `returnData`.

## Data Flow

**Credential Validation Flow:**

1. n8n loads `credentials/MaibaoApi.credentials.ts` and renders `apiKey` and hidden `baseUrl` fields.
2. Credential test calls `GET {{$credentials.baseUrl}}/models` with `Authorization: Bearer {{$credentials.apiKey}}` from `credentials/MaibaoApi.credentials.ts:24-31`.
3. Successful credentials are referenced by `this.getCredentials('maibaoApi')` inside `nodes/MaibaoApi/MaibaoApi.node.ts:717`.

**Node Execution Flow:**

1. `nodes/MaibaoApi/MaibaoApi.node.ts:714-721` loads input items, credentials, mode, and derives both `rawBaseUrl` and `soraBaseUrl`.
2. `nodes/MaibaoApi/MaibaoApi.node.ts:722-1091` iterates item-by-item and branches by `mode`.
3. Each branch reads node parameters, optionally gathers binary inputs, performs a remote request, adapts the response, and pushes one n8n output item into `returnData`.
4. The node returns a single main output channel with `[returnData]` at `nodes/MaibaoApi/MaibaoApi.node.ts:1093`.

**Multimodal Input Flow:**

1. Text, image, video-create, and audio flows first resolve source strategy from `binarySourceMode` in `nodes/MaibaoApi/MaibaoApi.node.ts:591-624`.
2. For upstream-node sourcing, `collectBinaryFromNodes()` uses `workflowProxy.$(nodeName).all()` at `nodes/MaibaoApi/MaibaoApi.node.ts:63-65` and renames merged binaries to `data`, `data0`, `data1`, and so on at `nodes/MaibaoApi/MaibaoApi.node.ts:76-91`.
3. For file-system backed binaries, helper functions pre-read content into `bufferMap` at `nodes/MaibaoApi/MaibaoApi.node.ts:93-108` so later extraction avoids cross-node access issues.
4. Mode-specific branches transform the extracted buffers into base64 data URLs, form-data file objects, or n8n binary outputs.

**Text Generation Flow:**

1. `nodes/MaibaoApi/MaibaoApi.node.ts:727-736` merges `userPrompt` with upstream `items[i].json.text` when present.
2. `nodes/MaibaoApi/MaibaoApi.node.ts:743-752` gathers optional images from URLs or binary input.
3. `nodes/MaibaoApi/MaibaoApi.node.ts:755-764` emits either plain text content or a mixed array of text and `image_url` parts.
4. `nodes/MaibaoApi/MaibaoApi.node.ts:766-779` posts to `/chat/completions` and returns the API JSON directly.

**Image Generation Flow:**

1. `nodes/MaibaoApi/MaibaoApi.node.ts:781-789` reads prompt, model, and binary source settings.
2. Gemini models use `parts` arrays with prompt text plus inline image data at `nodes/MaibaoApi/MaibaoApi.node.ts:790-805`.
3. Gemini requests go to `/v1beta/models/{model}:generateContent` with `generationConfig` at `nodes/MaibaoApi/MaibaoApi.node.ts:807-824`, then the returned base64 image is converted into n8n binary output at `nodes/MaibaoApi/MaibaoApi.node.ts:825-829`.
4. Doubao image requests go to `/images/generations` with prompt, size, and optional input images at `nodes/MaibaoApi/MaibaoApi.node.ts:832-857`, then the returned `b64_json` becomes binary output.

**Video Generation Flow:**

1. `nodes/MaibaoApi/MaibaoApi.node.ts:860-979` branches again by `videoOperation`.
2. Create mode builds either storyboard text from `storyboardShots` at `nodes/MaibaoApi/MaibaoApi.node.ts:869-875` or a direct prompt at `nodes/MaibaoApi/MaibaoApi.node.ts:876-877`.
3. Optional reference image extraction occurs at `nodes/MaibaoApi/MaibaoApi.node.ts:888-903`, then form-data is sent to `/v1/videos` through `this.helpers.request()` at `nodes/MaibaoApi/MaibaoApi.node.ts:906-914`.
4. Retrieve mode optionally polls up to 40 times with 15-second waits at `nodes/MaibaoApi/MaibaoApi.node.ts:934-944` before returning final status.
5. Download mode fetches arraybuffer content from `/v1/videos/{id}/content` and returns `video/mp4` binary output at `nodes/MaibaoApi/MaibaoApi.node.ts:954-970`.

**Audio Transcription Flow:**

1. `nodes/MaibaoApi/MaibaoApi.node.ts:983-996` resolves binary source settings and extracts the first supported audio/video file.
2. `nodes/MaibaoApi/MaibaoApi.node.ts:1002-1024` builds a multipart form for `whisper-1`, optionally adding language and timestamp granularity.
3. `nodes/MaibaoApi/MaibaoApi.node.ts:1026-1037` sends the request to `/audio/transcriptions` with `this.helpers.request()`.
4. Text output is wrapped in `json.text` metadata at `nodes/MaibaoApi/MaibaoApi.node.ts:1040-1053`, while `verbose_json` output is normalized with `convertWordsToSentences()` at `nodes/MaibaoApi/MaibaoApi.node.ts:1055-1071`.

**State Management:**
- State is request-scoped and in-memory only.
- Per-item transient state is kept in local variables inside `execute()` such as `mode`, `propNames`, `specifiedNodes`, `extractedImages`, and `formData` in `nodes/MaibaoApi/MaibaoApi.node.ts`.
- Cross-helper transient state is passed explicitly as arguments and return values, especially `CollectedBinaryResult` and `bufferMap` in `nodes/MaibaoApi/MaibaoApi.node.ts:27-31`.

## Key Abstractions

**Credential Contract:**
- Purpose: Provide the authentication surface expected by the node.
- Examples: `credentials/MaibaoApi.credentials.ts`
- Pattern: n8n `ICredentialType` class with declarative `properties` and a built-in connection test.

**Node Contract:**
- Purpose: Register one workflow node with all editor metadata and runtime behavior.
- Examples: `nodes/MaibaoApi/MaibaoApi.node.ts`
- Pattern: n8n `INodeType` class containing `description` metadata and one `execute()` dispatcher.

**Binary Collection Result:**
- Purpose: Carry both merged binary descriptors and preloaded byte buffers for later extraction.
- Examples: `nodes/MaibaoApi/MaibaoApi.node.ts:27-31`
- Pattern: Simple TypeScript interface returned by `collectBinaryFromNodes()`.

**Media Payload Objects:**
- Purpose: Normalize image and audio payloads before they are converted into outbound request bodies.
- Examples: `nodes/MaibaoApi/MaibaoApi.node.ts:11-16`, `nodes/MaibaoApi/MaibaoApi.node.ts:19-25`
- Pattern: Plain data interfaces (`ImageData`, `AudioData`) shared across helper functions and mode branches.

**Mode Branches:**
- Purpose: Keep API-specific request construction separate inside one orchestrator.
- Examples: `nodes/MaibaoApi/MaibaoApi.node.ts:727-779`, `nodes/MaibaoApi/MaibaoApi.node.ts:781-859`, `nodes/MaibaoApi/MaibaoApi.node.ts:860-979`, `nodes/MaibaoApi/MaibaoApi.node.ts:982-1072`, `nodes/MaibaoApi/MaibaoApi.node.ts:1075-1086`
- Pattern: `if / else if` branching on `mode` and `videoOperation` rather than separate modules.

## Entry Points

**Package Manifest:**
- Location: `package.json`
- Triggers: npm install, build, lint, release, and n8n package discovery.
- Responsibilities: Publish only `dist`, expose scripts, and map compiled credential/node files under the `n8n` key.

**Credential Definition:**
- Location: `credentials/MaibaoApi.credentials.ts`
- Triggers: n8n credential creation and credential test actions.
- Responsibilities: Define `apiKey`, default `baseUrl`, icon metadata, and `/models` connectivity test.

**Node Definition and Runtime:**
- Location: `nodes/MaibaoApi/MaibaoApi.node.ts`
- Triggers: n8n editor rendering and workflow execution.
- Responsibilities: Expose node parameters, mark the node as `usableAsTool`, and execute all supported API modes.

**Build Pipeline:**
- Location: `package.json`, `tsconfig.json`, `.github/workflows/ci.yml`
- Triggers: `npm run build`, `npm run lint`, local development, and CI.
- Responsibilities: Compile `credentials/**/*` and `nodes/**/*` into `dist/`, enforce linting, and validate build output on pull requests and pushes.

## Error Handling

**Strategy:** Centralized per-item try/catch inside `execute()` with selective skipping in helper functions and n8n-native `NodeOperationError` for user-facing failures.

**Patterns:**
- Use `NodeOperationError` for invalid user inputs or missing required media, such as unsupported audio formats at `nodes/MaibaoApi/MaibaoApi.node.ts:245-248` and missing audio files at `nodes/MaibaoApi/MaibaoApi.node.ts:998-1000`.
- Silently skip inaccessible images, URLs, or specified nodes in helper functions at `nodes/MaibaoApi/MaibaoApi.node.ts:99-104`, `nodes/MaibaoApi/MaibaoApi.node.ts:112-115`, `nodes/MaibaoApi/MaibaoApi.node.ts:170-172`, `nodes/MaibaoApi/MaibaoApi.node.ts:211-214`, and `nodes/MaibaoApi/MaibaoApi.node.ts:275-277`.
- Respect n8n `continueOnFail()` at `nodes/MaibaoApi/MaibaoApi.node.ts:1088-1090` to emit `{ error: error.message }` instead of halting the workflow.

## Cross-Cutting Concerns

**Logging:** Minimal explicit logging. The code relies on n8n runtime errors and returned JSON rather than application-level log statements in `nodes/MaibaoApi/MaibaoApi.node.ts`.

**Validation:** Validation is distributed across node parameter schemas in `nodes/MaibaoApi/MaibaoApi.node.ts:362-710` and runtime guards such as MIME checks, supported format checks, and response-shape checks in helper functions and mode branches.

**Authentication:** All external API calls depend on credentials from `credentials/MaibaoApi.credentials.ts`; most requests use `Authorization: Bearer ${credentials.apiKey}` in `nodes/MaibaoApi/MaibaoApi.node.ts:769`, `821`, `850`, `1032`, and `1082`, while Sora endpoints use the raw key in `Authorization` headers at `nodes/MaibaoApi/MaibaoApi.node.ts:910`, `922`, `939`, `949`, `959`, and `976`.

---

*Architecture analysis: 2026-04-22*
