# Configurable MaibaoAPI base URL design

## Problem

The MaibaoAPI credential currently stores its base URL in a hidden field fixed to
`https://api.maibao.chat/v1`. Users need to choose between the standard API domain and the new AI
domain, with the AI domain selected by default.

## Design

Change the existing `baseUrl` credential property from `hidden` to `options`. Present these choices
to users:

- `https://api.maibao.chat`
- `https://ai.maibao.chat`

Store the corresponding values with the existing `/v1` suffix so the node's current endpoint
construction and credential test continue to work without request-routing changes. Set
`https://ai.maibao.chat/v1` as the default.

Keep the `baseUrl` property name unchanged. Existing saved credentials therefore retain their
stored standard API URL, while newly created credentials default to the AI API URL.

## Documentation

Update the README credential setup instructions to describe the selectable API address and its new
default instead of saying that the address is fixed.

## Verification

- Add a regression test for the credential field type, option labels and values, and default value.
- Run lint, the full test suite, and the production build.

