# Tracy Architecture

# Introduction


# Component graph
![](../figures/Tracy-Architecture.svg)

---
### React Components
- ### [`App`](./components/App.md)
- ### [`LogView`](./components/LogView.md)
	 - Presents the log as a table in which each column corresponds to a log entry field. 
- ### [`Minimap`](./components/Minimap.md)
	 - Allows navigation and analysis of the log by representing information as glyphs (coloured rectangles). Each minimap column represents a log column as a column of glyphs.
- ### Structure Matching related components
	- ### [`StructureDialog`](./components/StructureDialog.md)
		- Allows users to search for occurrences of a structure (i.e., pattern) in the opened log.
	- ### [`StructureTable`](./components/StructureTable.md)
		- Contains the structure definition used for the structure matching.
- ### Rule-related components
	- ### [`FlagsDialog`](./components/FlagsDialog.md)
	- ### [`StatesDialog`](./components/StatesDialog.md)

### Files containing custom hooks

- ### [`useStructureEntryManager`](./hooks/useStructureEntryManager.md)
- ### [`useStructureRegularExpressionManager`](./hooks/useStructureRegularExpressionManager.md)
- ### [`useStyleManager`](./hooks/useStyleManager.md)
- ### [`useWildcardManager`](./hooks/useWildcardManager.md)