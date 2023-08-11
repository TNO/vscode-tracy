import { RowProperty } from "../types";
import {
    RowType
} from "../constants";
export const constructNewRowProperty = (isSearchResult: boolean, isRendered: boolean, rowType: RowType): RowProperty => {
    const newRowProperty: RowProperty = { isSearchResult, isRendered, rowType };
    return newRowProperty;
}