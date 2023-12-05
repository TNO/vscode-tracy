
---
```TS
enum SelectedRowType {
	None = "NONE",
	UserSelect = "SELECTED",
	QueryResult = "QUERY_RESULT",
}
```

This `enum` is used for the Structure Matching functionality to indicate if the row is selected by the user.

`NONE` if the row is not selected;
`SELECTED` if the row is selected by the user;
`QUERY_RESULT` it is not used yet.