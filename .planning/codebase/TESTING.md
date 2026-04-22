# Testing Patterns

**Analysis Date:** 2026-04-22

## Test Framework

**Runner:**
- Not detected.
- Config: Not detected; no `jest.config.*`, `vitest.config.*`, or test runner config files are present at the project root.

**Assertion Library:**
- Not detected.

**Run Commands:**
```bash
Not applicable              # No test command defined in `package.json`
Not applicable              # No watch-mode test command defined in `package.json`
Not applicable              # No coverage command defined in `package.json`
```

## Test File Organization

**Location:**
- Not detected. No `*.test.*` or `*.spec.*` files are present under `D:\Projects\n8n-nodes-maibaoapi`.

**Naming:**
- Not applicable until test files are added.

**Structure:**
```
Not detected
```

## Test Structure

**Suite Organization:**
```typescript
// Not detected: the repository contains no committed test suites.
```

**Patterns:**
- Setup pattern: Not detected.
- Teardown pattern: Not detected.
- Assertion pattern: Not detected.

## Mocking

**Framework:** Not detected.

**Patterns:**
```typescript
// Not detected: no mocking utilities or test doubles are committed.
```

**What to Mock:**
- Not defined in code. The production code in `nodes/MaibaoApi/MaibaoApi.node.ts` depends heavily on n8n runtime helpers such as `this.helpers.httpRequest()`, `this.helpers.request()`, `this.helpers.prepareBinaryData()`, `context.helpers.getBinaryDataBuffer()`, and `context.getWorkflowDataProxy()`. Any future unit tests need doubles for these runtime APIs.

**What NOT to Mock:**
- Not defined in code. No current repository guidance distinguishes unit versus integration boundaries.

## Fixtures and Factories

**Test Data:**
```typescript
// Not detected: no fixtures, factories, or sample payload builders are present.
```

**Location:**
- Not detected.

## Coverage

**Requirements:** None enforced.
- `package.json` contains build and lint scripts only.
- `.github/workflows/ci.yml` runs `npm ci`, `npm run lint`, and `npm run build`; it does not run tests or coverage checks.

**View Coverage:**
```bash
Not applicable
```

## Test Types

**Unit Tests:**
- Not used. No unit test files or runner configuration are present for helper logic in `nodes/MaibaoApi/MaibaoApi.node.ts` such as `convertWordsToSentences()` or binary extraction helpers.

**Integration Tests:**
- Not used. No automated tests exercise the n8n node class in `nodes/MaibaoApi/MaibaoApi.node.ts` or the credential definition in `credentials/MaibaoApi.credentials.ts`.

**E2E Tests:**
- Not used.

## Common Patterns

**Async Testing:**
```typescript
// Not detected: async production code exists in `nodes/MaibaoApi/MaibaoApi.node.ts`,
// but no async test pattern is committed.
```

**Error Testing:**
```typescript
// Not detected: no tests assert `NodeOperationError` branches or continue-on-fail behavior
// from `nodes/MaibaoApi/MaibaoApi.node.ts`.
```

## Current Verification Baseline

- Use `npm run lint` from `package.json` for static checks.
- Use `npm run build` from `package.json` for compilation validation.
- Treat `.github/workflows/ci.yml` as the only automated quality gate currently committed.
- When adding tests, place them alongside the only production entry points—`nodes/MaibaoApi/MaibaoApi.node.ts` and `credentials/MaibaoApi.credentials.ts`—or in a dedicated parallel test tree that clearly mirrors those paths.

## Recommended Repository-Specific Test Targets

- Add focused tests for pure transformation logic in `convertWordsToSentences()` within `nodes/MaibaoApi/MaibaoApi.node.ts`.
- Add helper-level tests for binary extraction branches in `collectBinaryFromNodes()`, `extractImagesFromBinary()`, `downloadImagesFromUrls()`, and `extractAudioFromBinary()` in `nodes/MaibaoApi/MaibaoApi.node.ts`.
- Add execute-path tests that verify mode branching, request payload construction, binary output generation, and `continueOnFail()` behavior in `nodes/MaibaoApi/MaibaoApi.node.ts`.
- Add credential request-shape tests for `credentials/MaibaoApi.credentials.ts` to validate `/models` connectivity payload construction.

---

*Testing analysis: 2026-04-22*
