
---
```TS
interface WildcardSubstitution {
    entryIndex: number,
    cellIndex: number,
    contentsIndex: number
}
```

This type represents a single use of a wildcard in the structure definition visible in the [[StructureTable]]. 

- `entryIndex`  is the index of the [[StructureEntry]] in which the wildcard is used.
- `cellIndex` is the index of the cell in the entry in which the wildcard is used.
- `contentsIndex` is the index of the content in the cell in which the wildcard is used.

For an explanation of the `cellIndex` and `contentsIndex`, check [[StructureEntry]].