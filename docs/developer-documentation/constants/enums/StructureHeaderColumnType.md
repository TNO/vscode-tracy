
---
```TS
enum StructureHeaderColumnType {
    Unselected = "UNSELECTED",
    Selected = "SELECTED",
    Custom = "CUSTOM"
}
```

This `enum` is used for the Structure Matching functionality to indicate which columns should be utilized (initially) in the matching. 

`SELECTED` columns are used for the Structure Matching.
The cells in the `UNSELECTED` columns are initially ignored during matching but can be included by the user. `Custom` columns are ignored and cannot be included in the matching, these are columns created from Flag rules and State-based rules. Both `Unselected` and `Custom` columns are visually distinguishable from the `Selected` ones by a diagonal stripe pattern over their cells, indicating that they are ignored.