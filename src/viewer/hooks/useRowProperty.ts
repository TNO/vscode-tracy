import { RowProperty } from "../types";
import {
    RowType
} from "../constants";
export const constructNewRowProperty = (isRendered: boolean, rowType: RowType): RowProperty => {
    const newRowProperty: RowProperty = { isRendered, rowType };
    return newRowProperty;
}