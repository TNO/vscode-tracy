import { type } from "os"
import { StructureLinkDistance } from "./constants"
import { ReactElement } from "react"

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
    row: CellContents[][], 
    cellSelection: boolean[],
    structureLink: StructureLinkDistance | undefined,
    wildcardsIndices: number[][]
}

export interface ContextMenuItem {
    text: string,
    callback: (anchorDiv: string) => void,
}

export interface Wildcard {
    wildcardSubstitutions: WildcardSubstitution []
}

export interface WildcardSubstitution {
    entryIndex: number, 
    cellIndex: number,
    contentsIndex: number
}

export interface CellContents {
    contentsIndex: number
    textValue: string,
    wildcardIndex: number | null
} 

export type StructureMatchId = number | null;