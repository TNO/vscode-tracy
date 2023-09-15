# Structure Table

This component contains the structure definition used for the structure matching. The structure definitions consists of entries and structure links between them


### Relations to other components

- Parent: [`StructureDialog`](StatesDialog.md)

### Props

| Name | Type | Description |
| ---- | ---- | ----------- |
| `headerColumns` | [`Header`](../types/Header.md)`[]` | Contains the table headers. |
| `structureEntries` | [`StructureEntry`](../types/StructureEntry.md)`[]` | Contains the entries in the table. |
| `wildcards` | [`Wildcard`](../types/Wildcard.md)`[]` | Keeps track of all wildcards used in the structure definition. |
| `isRemovingStructureEntries` | `boolean` | Keeps track of whether the user is removing [`StructureEntry`](../types/StructureEntry.md) from the structure definition. |
| `onToggleStructureLink` | `function` | Reference to a function of the [`StructureDialog`](StatesDialog.md) that handles the change of a [`StructureLinkDistance`](../constants/enums/StructureLinkDistance.md) between two entries in the table. |
| `onStructureEntryRemoved` | `function` | Reference to a function of the [`StructureDialog`](StatesDialog.md) that handles the removal of a [`StructureEntry`](../types/StructureEntry.md) from the structure definition. |
| `onToggleIsCellSelected` | `function` | Reference to a function of the [`StructureDialog`](StatesDialog.md) that handles (un)selecting cells of a [`StructureEntry`](../types/StructureEntry.md). |

### State

| Name | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `columnWidth` | `[id: string]: number` | [`LOG_COLUMN_WIDTH_LOOKUP`](../constants/LOG_COLUMN_WIDTH_LOOKUP.md) | Keeps track of the width of the table columns. |

### Functions

#### Component lifecycle functions

- `constructor(...)`
	- **Params:**
		- `props: Props`
	- **Description:** initializes the `columnWidth` in state.
	- **Returns**: -

- `shouldComponentUpdate(...)`
	- **Params:**
		- `nextProps: Readonly<Props>`
		- `nextState: Readonly<State>`
		- `_nextContext: any`
	- **Description:** Checks whether there is a change in any of the props. If so, it returns `true` and the component is re-rendered. Otherwise it returns `false`.
	- **Returns**: `boolean`

- `render()`
	- **Description:** renders the table by calling the `renderHeader` and `renderRows` functions.
	- **Returns:** div of type `JSX.Element`

#### Table-related functions

- `setColumnWidth()`
	- **Params:**
		- `name: string`
		- `width: number`
	- **Description:** renders the `structureEntries` as rows of the table.
	- **Returns:** div of type `JSX.Element` containing the structure entries in the structure definition.

- `columnWidth(...)`
	- **Params:**
		- `name: string`
	- **Description:** gets the `columnWidth` of a column from the state based on the parameter, if the name is not present it uses the `LOG_DEFAULT_COLUMN_WIDTH` (const)
	- **Returns:** `number`

- `renderHeader()`
	- **Params:**
		- `containerWidth: number`
	- **Description:** renders the table header.
	- **Returns:** div of the type `JSX.Element` containing all the cells in the table header.

- `renderHeaderColumn()`
	- **Params:**
		- `value: string`
		- `columnIndex: number`
		-  `width: number`
	- **Description:** renders a single cell of the table headers.
	- **Returns:** `ReactResizeDetector` containing a div with a [`Header`](../types/Header.md)

- `renderColumn(...)`
	- **Params:**
		- `rowIndex: number`
		- `cellIndex: number`
		- `width: number`
	- **Description:** renders one `cellContents` (i.e., a single cell) of a [StructureEntry](../types/StructureEntry.md) `row` based on the parameters.
	- **Returns:** div of type `JSX.Element` containing the cell of a `structureEntry.row`

- `renderRows(...)`
	- **Params:**
		- `containerWidth: number`
		- `containerHeight: number`
	- **Description:** renders the `structureEntries` as rows of the table.
	- **Returns:** div of type `JSX.Element` containing the structure entries in the structure definition.