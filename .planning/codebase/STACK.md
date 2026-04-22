# Technology Stack

**Analysis Date:** 2026-04-22

## Languages

**Primary:**
- TypeScript 5.9.2 - source implementation for the n8n community node in `nodes/MaibaoApi/MaibaoApi.node.ts` and credential definition in `credentials/MaibaoApi.credentials.ts`, declared in `package.json`.

**Secondary:**
- JavaScript - repository tooling configuration in `eslint.config.mjs` and `.prettierrc.js`.
- YAML - CI workflow definition in `.github/workflows/ci.yml`.
- Markdown - package and integration documentation in `README.md`, `CLAUDE.md`, `CHANGELOG.md`, and `APIdocs/*.md`.

## Runtime

**Environment:**
- Node.js 22 in CI, configured in `.github/workflows/ci.yml`.
- TypeScript compiles to CommonJS targeting ES2019, configured in `tsconfig.json`.

**Package Manager:**
- npm - used by scripts in `package.json` and CI install step in `.github/workflows/ci.yml`.
- Lockfile: present in `package-lock.json`.

## Frameworks

**Core:**
- n8n community node runtime via `n8n-workflow` peer dependency - node interfaces, credential interfaces, execution helpers, and binary-data APIs used in `nodes/MaibaoApi/MaibaoApi.node.ts` and `credentials/MaibaoApi.credentials.ts`.

**Testing:**
- Not detected as an automated test framework in `package.json` or repository test file patterns.

**Build/Dev:**
- `@n8n/node-cli` - build, lint, dev, and release commands defined in `package.json` (`n8n-node build`, `n8n-node lint`, `n8n-node dev`, `n8n-node release`).
- TypeScript compiler - watch mode and type compilation configured through `tsconfig.json` and `package.json`.
- ESLint 9.32.0 - linting via `eslint.config.mjs`, which delegates to `@n8n/node-cli/eslint`.
- Prettier 3.6.2 - formatting rules in `.prettierrc.js`.
- `release-it` 19.0.4 - release automation configured as the `release` script in `package.json`.

## Key Dependencies

**Critical:**
- `n8n-workflow` (peer dependency) - required host/runtime contract for `INodeType`, `ICredentialType`, `IExecuteFunctions`, `NodeOperationError`, binary APIs, and credential testing in `nodes/MaibaoApi/MaibaoApi.node.ts` and `credentials/MaibaoApi.credentials.ts`.
- `@n8n/node-cli` (*) - provides the n8n-specific development toolchain invoked throughout `package.json`.
- `typescript` 5.9.2 - compiles `credentials/**/*` and `nodes/**/*` into `dist/` per `tsconfig.json`.

**Infrastructure:**
- `eslint` 9.32.0 - static analysis for repository code quality, configured by `eslint.config.mjs`.
- `prettier` 3.6.2 - formatting standard for source and config files, configured in `.prettierrc.js`.
- `@types/node` 25.0.3 - Node.js type support for Buffer and runtime APIs used in `nodes/MaibaoApi/MaibaoApi.node.ts`.
- `release-it` 19.0.4 - versioning and release workflow support from `package.json`.

## Configuration

**Environment:**
- Runtime credentials are configured through the n8n credential type in `credentials/MaibaoApi.credentials.ts`, not through checked-in `.env` files.
- Required runtime inputs are `apiKey` and `baseUrl` on the `maibaoApi` credential, with `baseUrl` defaulting to `https://api.maibao.chat/v1` in `credentials/MaibaoApi.credentials.ts`.
- Credential validation uses `GET /models` through the test request defined in `credentials/MaibaoApi.credentials.ts`.
- `.env` files are not detected in the repository root.

**Build:**
- `package.json` defines all developer entry commands.
- `tsconfig.json` controls strict compilation, declaration output, source maps, and `dist/` output.
- `eslint.config.mjs` centralizes linting through the n8n preset.
- `.prettierrc.js` defines formatting rules including tabs, single quotes, trailing commas, and print width 100.
- `.github/workflows/ci.yml` enforces install, lint, and build on pull requests and pushes to `main`.

## Platform Requirements

**Development:**
- Use npm with the lockfile in `package-lock.json`.
- Use Node.js 22 to match CI in `.github/workflows/ci.yml`.
- Develop against an n8n host that provides the `n8n-workflow` peer dependency declared in `package.json`.
- Build output is generated into `dist/`, and only `dist/` is published according to `package.json`.

**Production:**
- Deployment target is an installed n8n community node package consumed by an n8n instance, with runtime entries declared under the `n8n` field in `package.json`.
- The node executes inside n8n and relies on n8n helper APIs such as `httpRequest`, `request`, `prepareBinaryData`, `getBinaryDataBuffer`, `getBinaryStream`, and `getWorkflowDataProxy` used in `nodes/MaibaoApi/MaibaoApi.node.ts`.

---

*Stack analysis: 2026-04-22*
