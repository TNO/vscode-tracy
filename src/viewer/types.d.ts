export interface LogViewState {
    height: number,
    start: number,
    visibleItems: number,
    startFloor: number,
    endCeil: number,
    scrollTop: number,
    scrollLeft: number,
    rowHeight: number,
}

export interface Header {
    name: string, 
    type: 'string' | 'number'
}