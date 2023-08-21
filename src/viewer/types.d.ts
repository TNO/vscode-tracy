import { type } from "os"
import { RowType, StructureLinkDistance } from "./constants"

export interface LogViewState {
    height: number,
    start: number,
    visibleItems: number,
    startFloor: number,
    endCeil: number,
    scrollTop: number,
    scrollLeft: number,
    rowHeight: number
}

export interface Header {
    name: string,
    type: 'string' | 'number'
}

export interface StructureEntry {
    row: string[],
    cellSelection: boolean[],
    structureLink: StructureLinkDistance | undefined
}

export interface RowProperty {
    isSearchResult: boolean,
    isRendered: boolean,
    rowType: RowType
}

export interface Segment {
    start: number,
    end: number,
    level: number
}

export type StructureMatchId = number | null;