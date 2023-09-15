![[Structure-entry.svg]]

---
```TS
interface StructureEntry {
    row: CellContents[][],
    cellSelection: boolean[],
    structureLink: StructureLinkDistance | undefined,
    wildcardsIndices: number[][]
}
```

- `row` is an array containing all the contents for all the cells in the entry.
- `cellSelection` is an array that keeps track which cells of an entry are used during the matching. For example, the cells containing the timestamps in the figure above all ignored, therefore `cellSelection[0]` will be `false` for all entries.
- `structureLink` represents the distance constraint ([[StructureLinkDistance]]) set between two entries.
- `wildcardIndices` keeps track of the wildcards used, per cell.
