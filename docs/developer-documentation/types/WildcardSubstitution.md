# `WildcardSubstitution`

```TS
interface WildcardSubstitution {
    entryIndex: number,
    cellIndex: number,
    contentsIndex: number
}
```

This type represents a single use of a wildcard in the structure definition visible in the [`StructureTable`](../components/StructureTable.md). 

- `entryIndex`  is the index of the [`StructureEntry`](StructureEntry.md) in which the wildcard is used.
- `cellIndex` is the index of the cell in the entry in which the wildcard is used.
- `contentsIndex` is the index of the content in the cell in which the wildcard is used.

For an explanation of the `cellIndex` and `contentsIndex`, check [`StructureEntry`](StructureEntry.md).