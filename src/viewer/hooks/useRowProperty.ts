import { RowProperty, Segment } from "../types";
import {
    RowType
} from "../constants";
export const constructNewRowProperty = (isRendered: boolean, rowType: RowType): RowProperty => {
    const newRowProperty: RowProperty = { isRendered, rowType };
    return newRowProperty;
}

export const constructNewSegment = (start: number, end: number, level: number) => {
    const newSegment: Segment = { start, end, level };
    return newSegment;
}

export const getSegmentMaxLevel = (segments: { [key: number]: Segment }) => {
    return Math.max.apply(Math, Object.keys(segments).map(key => { return segments[key].level; }));
}

export const getSegment = (segments: Segment[], start: number) => {
    return segments.map(segment => {
        if (segment.start == start) {
            return segment;
        }
    });
}