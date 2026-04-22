# External Integrations

**Analysis Date:** 2026-04-22

## APIs & External Services

**AI inference and media generation:**
- MaibaoAPI - primary upstream service for all model execution handled by `nodes/MaibaoApi/MaibaoApi.node.ts`.
  - SDK/Client: No vendor SDK detected; integration uses n8n HTTP helpers directly in `nodes/MaibaoApi/MaibaoApi.node.ts`.
  - Auth: `apiKey` credential field in `credentials/MaibaoApi.credentials.ts`.
- MaibaoAPI Models listing - credential validation request to `/models` from `credentials/MaibaoApi.credentials.ts`.
  - SDK/Client: n8n credential test request in `credentials/MaibaoApi.credentials.ts`.
  - Auth: `apiKey` credential field in `credentials/MaibaoApi.credentials.ts`.

**Chat completions:**
- MaibaoAPI chat completions endpoint - text generation and multimodal text+image prompts sent to `POST /chat/completions` in `nodes/MaibaoApi/MaibaoApi.node.ts`.
  - SDK/Client: `this.helpers.httpRequest` in `nodes/MaibaoApi/MaibaoApi.node.ts`.
  - Auth: `Authorization: Bearer ${credentials.apiKey}` from credentials loaded via `this.getCredentials('maibaoApi')`.

**Image generation:**
- Gemini image generation through MaibaoAPI-compatible endpoint - requests sent to `POST /v1beta/models/{model}:generateContent` in `nodes/MaibaoApi/MaibaoApi.node.ts` for `gemini-3.1-flash-image-preview` and `gemini-3-pro-image-preview`.
  - SDK/Client: `this.helpers.httpRequest` in `nodes/MaibaoApi/MaibaoApi.node.ts`.
  - Auth: `apiKey` credential from `credentials/MaibaoApi.credentials.ts`.
- 即梦 5.0 image generation through MaibaoAPI - requests sent to `POST /images/generations` in `nodes/MaibaoApi/MaibaoApi.node.ts` for `doubao-seedream-5-0-260128`.
  - SDK/Client: `this.helpers.httpRequest` in `nodes/MaibaoApi/MaibaoApi.node.ts`.
  - Auth: `apiKey` credential from `credentials/MaibaoApi.credentials.ts`.

**Video generation:**
- Sora-style video endpoints exposed by MaibaoAPI - create, remix, retrieve, download, and list operations sent to `/v1/videos*` using the base URL stripped from `/v1` in `nodes/MaibaoApi/MaibaoApi.node.ts`.
  - SDK/Client: `this.helpers.request` for multipart create and audio-like form-data flows; `this.helpers.httpRequest` for JSON and download flows in `nodes/MaibaoApi/MaibaoApi.node.ts`.
  - Auth: raw `Authorization` header populated from `credentials.apiKey` in `nodes/MaibaoApi/MaibaoApi.node.ts`.

**Speech-to-text:**
- Whisper transcription through MaibaoAPI - requests sent to `POST /audio/transcriptions` in `nodes/MaibaoApi/MaibaoApi.node.ts` with multipart form data and fixed model `whisper-1`.
  - SDK/Client: `this.helpers.request` in `nodes/MaibaoApi/MaibaoApi.node.ts`.
  - Auth: `Authorization: Bearer ${credentials.apiKey}` from `credentials/MaibaoApi.credentials.ts`.

**Vector embeddings:**
- Embeddings API through MaibaoAPI - requests sent to `POST /embeddings` in `nodes/MaibaoApi/MaibaoApi.node.ts`.
  - SDK/Client: `this.helpers.httpRequest` in `nodes/MaibaoApi/MaibaoApi.node.ts`.
  - Auth: `Authorization: Bearer ${credentials.apiKey}` from credentials loaded in `nodes/MaibaoApi/MaibaoApi.node.ts`.

**Remote asset fetch:**
- Arbitrary remote image URLs - optional image input download performed with `GET` requests in `downloadImagesFromUrls()` inside `nodes/MaibaoApi/MaibaoApi.node.ts`.
  - SDK/Client: `context.helpers.httpRequest` in `nodes/MaibaoApi/MaibaoApi.node.ts`.
  - Auth: None detected; URLs are fetched anonymously.

## Data Storage

**Databases:**
- Not detected.
  - Connection: Not applicable.
  - Client: Not applicable.

**File Storage:**
- n8n binary storage - binary inputs may be loaded from n8n-managed file-system-backed binary storage using `getBinaryStream`, `binaryToBuffer`, and `getBinaryDataBuffer` in `nodes/MaibaoApi/MaibaoApi.node.ts`.

**Caching:**
- None detected.

## Authentication & Identity

**Auth Provider:**
- Custom API key authentication against MaibaoAPI.
  - Implementation: n8n credential type `maibaoApi` in `credentials/MaibaoApi.credentials.ts` stores `apiKey` as a password field and injects it into `Authorization` headers in `nodes/MaibaoApi/MaibaoApi.node.ts`.

## Monitoring & Observability

**Error Tracking:**
- None detected.

**Logs:**
- No dedicated logging integration detected. Error surfacing is handled through `NodeOperationError` and n8n execution results in `nodes/MaibaoApi/MaibaoApi.node.ts`.

## CI/CD & Deployment

**Hosting:**
- Runtime hosting is an n8n instance that installs the package as a community node, with package metadata and dist entrypoints defined in `package.json`.

**CI Pipeline:**
- GitHub Actions workflow in `.github/workflows/ci.yml` runs `npm ci`, `npm run lint`, and `npm run build` on pull requests and pushes to `main`.

## Environment Configuration

**Required env vars:**
- No repository-level environment variables are required by checked-in code.
- Runtime secrets are supplied through the n8n credential fields `apiKey` and `baseUrl` in `credentials/MaibaoApi.credentials.ts`.

**Secrets location:**
- Secrets are stored in n8n credentials at runtime through `credentials/MaibaoApi.credentials.ts`.
- `.env` files are not detected in the repository root.

## Webhooks & Callbacks

**Incoming:**
- None detected. No webhook routes, callback handlers, or public server endpoints are implemented in `nodes/MaibaoApi/MaibaoApi.node.ts` or `credentials/MaibaoApi.credentials.ts`.

**Outgoing:**
- `POST {baseUrl}/chat/completions` from `nodes/MaibaoApi/MaibaoApi.node.ts`.
- `POST {baseUrl-without-/v1}/v1beta/models/{model}:generateContent` from `nodes/MaibaoApi/MaibaoApi.node.ts`.
- `POST {baseUrl}/images/generations` from `nodes/MaibaoApi/MaibaoApi.node.ts`.
- `POST {soraBaseUrl}/v1/videos` from `nodes/MaibaoApi/MaibaoApi.node.ts`.
- `POST {soraBaseUrl}/v1/videos/{video_id}/remix` from `nodes/MaibaoApi/MaibaoApi.node.ts`.
- `GET {soraBaseUrl}/v1/videos/{video_id}` from `nodes/MaibaoApi/MaibaoApi.node.ts`.
- `GET {soraBaseUrl}/v1/videos/{video_id}/content` from `nodes/MaibaoApi/MaibaoApi.node.ts`.
- `GET {soraBaseUrl}/v1/videos` from `nodes/MaibaoApi/MaibaoApi.node.ts`.
- `POST {baseUrl}/audio/transcriptions` from `nodes/MaibaoApi/MaibaoApi.node.ts`.
- `POST {baseUrl}/embeddings` from `nodes/MaibaoApi/MaibaoApi.node.ts`.
- `GET remote-image-url` fetches from `downloadImagesFromUrls()` in `nodes/MaibaoApi/MaibaoApi.node.ts`.

---

*Integration audit: 2026-04-22*
