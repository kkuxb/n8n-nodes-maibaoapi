# MaibaoAPI item linking design

## Problem

The node processes input items by index but returns newly created output items without n8n's
`pairedItem` metadata. Newer n8n releases no longer reliably infer this missing relationship, so
drag-generated expressions using `$('Node').item` can fail after MaibaoAPI processes multiple
items.

## Design

Add one small output helper that appends an `INodeExecutionData` item and always associates it with
the input item that produced it:

```ts
function pushExecutionData(
	returnData: INodeExecutionData[],
	itemIndex: number,
	output: INodeExecutionData,
): void
```

Every success path and the `continueOnFail` path must use this helper. The helper preserves the
existing JSON and binary data and adds only `pairedItem: { item: itemIndex }`.

This direct metadata assignment is part of n8n's stable execution-data contract. It is preferable
here to `constructExecutionMetaData()`, which is useful when expanding response arrays but would add
boilerplate and helper-version coupling to this node's one-output-per-input execution model.

## Compatibility

The change does not alter API requests, parameters, output JSON, binary files, item order, or error
handling. Existing workflows gain the missing relationship metadata automatically after updating
the community node.

The fix covers linking information owned by MaibaoAPI. Genuine ambiguity caused by combining items
from different upstream origins remains n8n-defined behavior.

## Verification

- Unit-test that JSON and binary output are preserved.
- Unit-test that different output items receive the correct input index.
- Ensure all execution output paths, including `continueOnFail`, use the shared helper.
- Run the full test suite and TypeScript build.
