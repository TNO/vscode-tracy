export interface LogColumn {
    name: string,
    type: 'string' | 'number',
    width: number,
}

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
