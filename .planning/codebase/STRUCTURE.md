# Codebase Structure

**Analysis Date:** 2026-04-22

## Directory Layout

```text
n8n-nodes-maibaoapi/
├── credentials/        # n8n credential source definitions
├── nodes/              # n8n node source files and bundled assets
├── .github/            # CI workflow definitions
├── .planning/          # GSD-generated project analysis artifacts
├── APIdocs/            # Supplemental API reference documents
├── .vscode/            # Local editor settings
├── package.json        # Package manifest and n8n entry declarations
├── tsconfig.json       # TypeScript compiler configuration
├── eslint.config.mjs   # ESLint entrypoint using n8n defaults
├── .prettierrc.js      # Formatting rules
├── README.md           # User-facing documentation
├── CLAUDE.md           # Repository-specific AI guidance
├── PROJECT_INDEX.md    # Generated project inventory document
├── PROJECT_INDEX.json  # Generated machine-readable project inventory
└── test_timestamp_granularities.bat # Local manual test helper script
```

## Directory Purposes

**`credentials/`:**
- Purpose: Hold n8n credential definitions that are compiled into `dist/credentials/`.
- Contains: TypeScript source files implementing `ICredentialType`.
- Key files: `credentials/MaibaoApi.credentials.ts`

**`nodes/`:**
- Purpose: Hold n8n node implementations and node-level static assets.
- Contains: Per-node subdirectories with `.node.ts` source and icon assets.
- Key files: `nodes/MaibaoApi/MaibaoApi.node.ts`, `nodes/MaibaoApi/maibaoapi.png`

**`nodes/MaibaoApi/`:**
- Purpose: Encapsulate the complete MaibaoAPI node implementation.
- Contains: The monolithic runtime/UI source file and the icon used by both node and credential definitions.
- Key files: `nodes/MaibaoApi/MaibaoApi.node.ts`, `nodes/MaibaoApi/maibaoapi.png`

**`.github/workflows/`:**
- Purpose: Define automated repository checks.
- Contains: GitHub Actions workflows.
- Key files: `.github/workflows/ci.yml`

**`.planning/codebase/`:**
- Purpose: Store generated codebase map documents used by GSD planning and execution commands.
- Contains: Architecture, structure, stack, convention, testing, and concern documents.
- Key files: `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`

**`APIdocs/`:**
- Purpose: Store reference material for external image APIs used by the node.
- Contains: Markdown documentation files.
- Key files: `APIdocs/gpt-image-2图像编辑.md`, `APIdocs/gpt-image-2图像生成.md`

**`.vscode/`:**
- Purpose: Provide workspace-specific editor recommendations and launch configuration.
- Contains: JSON editor config files.
- Key files: `.vscode/extensions.json`, `.vscode/launch.json`

## Key File Locations

**Entry Points:**
- `package.json`: Declares package scripts and compiled n8n entry files under the `n8n` field.
- `credentials/MaibaoApi.credentials.ts`: Source credential entrypoint for authentication setup and testing.
- `nodes/MaibaoApi/MaibaoApi.node.ts`: Source node entrypoint for UI metadata and runtime execution.

**Configuration:**
- `tsconfig.json`: Compiles `credentials/**/*` and `nodes/**/*` into `dist/`.
- `eslint.config.mjs`: Re-exports `@n8n/node-cli/eslint` defaults.
- `.prettierrc.js`: Defines tabs, single quotes, semicolons, and 100-character print width.
- `.github/workflows/ci.yml`: Runs `npm ci`, `npm run lint`, and `npm run build` on CI.

**Core Logic:**
- `nodes/MaibaoApi/MaibaoApi.node.ts`: All mode routing, helper functions, request construction, and response shaping.
- `credentials/MaibaoApi.credentials.ts`: Credential fields and connectivity test logic.

**Testing:**
- `.github/workflows/ci.yml`: Build and lint verification in CI.
- `test_timestamp_granularities.bat`: Manual local helper for timestamp-related testing.
- Not detected: dedicated automated test directory or `*.test.*` / `*.spec.*` files.

## Naming Conventions

**Files:**
- n8n node implementation files use the `*.node.ts` suffix: `nodes/MaibaoApi/MaibaoApi.node.ts`.
- n8n credential files use the `*.credentials.ts` suffix: `credentials/MaibaoApi.credentials.ts`.
- Node directories use PascalCase aligned with the exported class and node name: `nodes/MaibaoApi/`.
- Root documentation uses uppercase or conventional markdown filenames: `README.md`, `CLAUDE.md`, `PROJECT_INDEX.md`.

**Directories:**
- Top-level source directories are simple lowercase plurals: `nodes/`, `credentials/`.
- Per-node directories use PascalCase product naming: `nodes/MaibaoApi/`.
- Tooling and metadata directories retain ecosystem-standard names: `.github/`, `.vscode/`, `.planning/`.

## Where to Add New Code

**New Feature:**
- Primary code: Extend `nodes/MaibaoApi/MaibaoApi.node.ts` when the feature is another mode, operation, parameter set, or helper tied to the existing MaibaoAPI node.
- Tests: No established automated test location is present; use a new test directory only if introducing a test framework, otherwise verify through CI build/lint and manual workflow testing.

**New Component/Module:**
- Implementation: Place additional n8n node implementations under a new subdirectory inside `nodes/`, following the `nodes/<PascalCaseNodeName>/<PascalCaseNodeName>.node.ts` pattern used by `nodes/MaibaoApi/MaibaoApi.node.ts`.
- Credential additions: Place new credential contracts in `credentials/` with the `<PascalCaseName>.credentials.ts` pattern used by `credentials/MaibaoApi.credentials.ts`.

**Utilities:**
- Shared helpers: Current helpers are colocated at the top of `nodes/MaibaoApi/MaibaoApi.node.ts`; follow that pattern for node-specific utilities.
- If helpers need reuse across multiple future nodes, create a new shared source directory and update `tsconfig.json` `include` paths before relying on it, because current compilation only includes `credentials/**/*`, `nodes/**/*`, `nodes/**/*.json`, and `package.json`.

## Special Directories

**`dist/`:**
- Purpose: Compiled package output published to npm and referenced by the `n8n` manifest in `package.json`.
- Generated: Yes.
- Committed: Not detected in the current working tree.

**`.planning/`:**
- Purpose: Store GSD planning and mapping artifacts for future automated workflows.
- Generated: Yes.
- Committed: Yes, because `.planning/` exists in the repository working tree at `D:\Projects\n8n-nodes-maibaoapi\.planning`.

**`.git/`:**
- Purpose: Git repository metadata and object storage.
- Generated: Yes.
- Committed: No.

**`APIdocs/`:**
- Purpose: Human-readable API reference notes separate from executable source.
- Generated: No.
- Committed: Yes.

## Placement Guidance

- Put n8n runtime behavior in `nodes/MaibaoApi/MaibaoApi.node.ts` unless the repository is first refactored into multiple source modules.
- Keep node assets beside their node source under `nodes/<NodeName>/`, matching `nodes/MaibaoApi/maibaoapi.png`.
- Keep credential logic isolated in `credentials/` and reference it from the node via the credential name string, matching `maibaoApi` in `credentials/MaibaoApi.credentials.ts` and `nodes/MaibaoApi/MaibaoApi.node.ts`.
- Update `package.json` `n8n.credentials` and `n8n.nodes` entries whenever new compiled entry files are added, following the existing `dist/credentials/MaibaoApi.credentials.js` and `dist/nodes/MaibaoApi/MaibaoApi.node.js` pattern.
- Update `tsconfig.json` include paths if source code is added outside `credentials/` or `nodes/`, because current build inclusion is narrowly scoped.

---

*Structure analysis: 2026-04-22*
