import { type } from "os"
import { StructureLinkDistance } from "./constants"

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

export type StructureMatchId = number | null;