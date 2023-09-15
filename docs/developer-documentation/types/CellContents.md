# CellContents
---
```TS
interface CellContents {
    contentsIndex: number,
    textValue: string,
    wildcardIndex: number | null
}
```

This type is used to represent the values in a single cell of a [[StructureEntry]]. Initially, each cell contains a single `cellContent` which is split in several parts after a [[Wildcard]] is inserted in the cell.

- `contentsIndex` - index of the part of the `cellContents'
- `textValue` - the string of that part.
- `wildcardIndex` - if the part is a wildcard, this value is the index of the wildcard. See example below.

### Example
A cell containing the Timestamp '2023-06-15T22:00:00.000'. Initially the `cellContents` of that cell is the following:

```JS
[
	{
	contentsIndex: 0,
	textValue: '2023-06-15T22:00:00.000',
	wildcardIndex: null
	}
]
```

After a wildcard is inserted to replace the _month_ in the timestamp. The `cellContents` are split and become:
```JS
[
	{
	contentsIndex: 0,
	textValue: '2023-',
	wildcardIndex: null
	},
	{
	contentsIndex: 1,
	textValue: '06',
	wildcardIndex: 0
	},
	{
	contentsIndex: 2,
	textValue: '-15T22:00:00.000',
	wildcardIndex: null
	}
]
```

