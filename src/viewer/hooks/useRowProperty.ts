import { RowProperty, Segment } from "../types";
import { SelectedRowType } from "../constants";

export const constructNewRowProperty = (
	isRendered: boolean,
	rowType: SelectedRowType,
): RowProperty => {
	const newRowProperty: RowProperty = { isRendered, rowType };
	return newRowProperty;
};

export const constructNewSegment = (start: number, end: number, level: number) => {
	const newSegment: Segment = { start, end, level };
	return newSegment;
};

export const getSegmentMaxLevel = (segments: { [key: number]: Segment }) => {
	const levels = Object.values(segments).map((segment) => segment.level);
	if (levels !== undefined && levels.length > 0) {
		return Math.min(4, Math.max(...levels));
	} else {
		return -1;
	}
};

export const getSegment = (segments: Segment[], start: number) => {
	return segments.map((segment) => {
		if (segment.start == start) {
			return segment;
		}
	});
};
