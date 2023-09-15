---

---
![[Tracy-Architecture.svg]]

---
### React Components
- App
- LogView - Presents the log as a table in which each column corresponds to a log entry field. 
- Minimap - Allows navigation and analysis of the log by representing information as glyphs (coloured rectangles). Each minimap column represents a log column as a column of glyphs.
- Structure Matching related components
	- [[StructureDialog]] - Allows users to search for occurrences of a structure (i.e., pattern) in the opened log.
	- [[StructureTable]] - Contains the structure definition used for the structure matching.
- Rule-related components
	- FlagsDialog
	- StatesDialog

### Files containing custom hooks

- [[useStructureEntryManager]]
- [[useStructureRegularExpressionManager]]
- [[useStyleManager]]
- [[useWildcardManager]]