import { RowProperty, Segment } from "../types";
import { SelectedRowType} from "../constants";

export const constructNewRowProperty = (isSearchResult: boolean, isRendered: boolean, rowType: SelectedRowType): RowProperty => {
    const newRowProperty: RowProperty = { isSearchResult, isRendered, rowType };
    return newRowProperty;
}

export const constructNewSegment = (start: number, end: number, level: number) => {
    const newSegment: Segment = { start, end, level };
    return newSegment;
}

export const getSegmentMaxLevel = (segments: { [key: number]: Segment }) => {
    const levels = Object.values(segments).map(segment => segment.level);
    return Math.max(...levels);
}

export const getSegment = (segments: Segment[], start: number) => {
    return segments.map(segment => {
        if (segment.start == start) {
            return segment;
        }
    });
}