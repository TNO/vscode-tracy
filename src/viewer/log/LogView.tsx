import React from 'react';
import { LOG_HEADER_HEIGHT, LOG_ROW_HEIGHT, LOG_COLUMN_WIDTH_LOOKUP, 
         LOG_DEFAULT_COLUMN_WIDTH, BORDER, BORDER_SIZE, RGB_ANNOTATION0, RGB_ANNOTATION1, RGB_ANNOTATION2, RGB_ANNOTATION3, RGB_ANNOTATION4 } from '../constants';
import { getHeaderColumnInnerStyle, getHeaderColumnStyle, getLogViewRowSelectionStyle, getLogViewStructureMatchStyle, getSegmentStyle } from '../hooks/useStyleManager';
import { LogViewState, RowProperty, Segment, StructureMatchId } from '../types';
import LogFile from '../LogFile';
import ReactResizeDetector from 'react-resize-detector';
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
import { getSegmentMaxLevel } from '../hooks/useRowProperty';

interface Props {
    logFile: LogFile;
    onLogViewStateChanged: (value: LogViewState) => void;
    onSelectedRowsChanged: (index: number, event: React.MouseEvent) => void;
    onRowPropsChanged: (index: number, isRendered: boolean) => void;
    forwardRef: React.RefObject<HTMLDivElement>;
    coloredTable: boolean;
    rowProperties: RowProperty[];
    currentStructureMatch: number[];
    structureMatches: number[][];
    structureMatchesLogRows: number[];
    collapsibleRows: { [key: number]: Segment };
}
interface State {
    state: LogViewState | undefined;
    columnWidth: { [id: string]: number };
    logFile: LogFile;
    collapsed: { [key: number]: boolean };
}

const HEADER_STYLE: React.CSSProperties = {
    width: '100%', height: LOG_HEADER_HEIGHT, position: 'relative', overflow: 'hidden', 
    borderBottom: BORDER,
};

const VIEWPORT_STYLE: React.CSSProperties = {position: 'relative', flex: 1, overflow: 'auto'};

export default class LogView extends React.Component<Props, State> {
    viewport: React.RefObject<HTMLDivElement>;

    constructor(props: Props) {
        super(props);
        this.viewport = this.props.forwardRef;
        this.updateState = this.updateState.bind(this);
        this.state = {state: undefined, columnWidth: LOG_COLUMN_WIDTH_LOOKUP, logFile: this.props.logFile, 
            collapsed: []};
    }

    componentDidMount(): void {
        window.addEventListener('resize', () => this.updateState());
        // this.updateState();
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>): void {
        if (prevProps.logFile !== this.props.logFile) {
            this.updateState();
        }
        if (prevProps.currentStructureMatch[0] !== this.props.currentStructureMatch[0]) {
            this.updateState(this.props.currentStructureMatch[0]);
        }
        // if (prevState.columnWidth !== this.state.columnWidth) {
        //     this.render(); //TODO: Discuss whether this is redundant.
        // }
    }

    renderColumn(value: string, columnIndex: number, isHeader: boolean, width: number, colorMap: string) {
        const height = isHeader ? LOG_HEADER_HEIGHT : LOG_ROW_HEIGHT;
        const widthNew = width + BORDER_SIZE; //increase width with 1px, because the border is 1px
        let color = 'transparent';
        let fontColor = ''

        if (this.props.coloredTable){
            color = colorMap;
            if (this.isLight(color)){
                fontColor = "#000000"
            } else {
                fontColor = "#ffffff"
            }
        }

        const columnHeaderStyle = getHeaderColumnStyle(widthNew, columnIndex, height);
        const columnHeaderInnerStyle = getHeaderColumnInnerStyle(height, isHeader);    
        const colorStyle: React.CSSProperties = {backgroundColor: color, color: fontColor};
        const innerStyle = {...columnHeaderInnerStyle, ...colorStyle};

        return (
            <div style={columnHeaderStyle} key={columnIndex}>
                <div style={innerStyle}>
                    {value}
                </div>
            </div>
        );
    }

    renderRows() {
        // This method only renders the rows that are visible
        if (!this.state.state) return;
        const result: any = [];
        const {logFile, rowProperties, structureMatches, currentStructureMatch, structureMatchesLogRows, collapsibleRows} = this.props;
        let firstRender = this.state.state.startFloor;
        let lastRender = this.state.state.endCeil;
        const visibleRows = logFile.rows.filter((v, i) => rowProperties[i].isRendered);
        if (lastRender > visibleRows.length){
            if (!this.viewport.current) return;
            const height = this.viewport.current.clientHeight;
            const maxVisibleItems = height / LOG_ROW_HEIGHT;
            lastRender = visibleRows.length - 1;
            firstRender = Math.max(0, Math.ceil(lastRender - maxVisibleItems) - 1);
        }

        // Search does not match any row
        if ((visibleRows.length === 0)) {
            return [];
        }

        let counter = firstRender;
        const maxLevel = Math.min(4, getSegmentMaxLevel(collapsibleRows));
        const segmentWidth:number = (this.getMaxLevel() + 1) * 30 + BORDER_SIZE;
        for (let r = firstRender; counter <= lastRender; r++) {
            if (rowProperties[r].isSearchResult && rowProperties[r].isRendered) {
                let rowStyle;

                if(structureMatchesLogRows.includes(r)){
                    rowStyle = getLogViewStructureMatchStyle(currentStructureMatch, structureMatches, r, segmentWidth);
                }else{
                    rowStyle = getLogViewRowSelectionStyle(rowProperties, r, counter, segmentWidth);
                }
                //add segment
                let rowResult: any = [];
                for (let l = 0; l <= maxLevel; l++) {
                    rowResult.push(this.renderSegmentForRow(r, l));
                }
                //add log rows
                result.push(
                    <div style={{display: 'flex', flexDirection: 'row', flexWrap: 'nowrap'}}>
                        <div style={{flex: 1, display: "flex", flexDirection: "row", position: 'absolute',height: LOG_ROW_HEIGHT,
        overflow: 'hidden', top: counter * LOG_ROW_HEIGHT, width: segmentWidth }} key={'seg'+r}>{rowResult}</div>
                        <div key={r} style={rowStyle} onClick={(event) => this.props.onSelectedRowsChanged(r, event)}>
                            {logFile.headers.map((h, c) => 
                            logFile.selectedColumns[c]== true &&
                                this.renderColumn(logFile.rows[r][c], c, false, this.state.columnWidth[h.name], logFile.columnsColors[c][r]))
                            }
                        </div>
                    </div>
                );
                counter++;
                rowResult = [];
            }
        }
        return result;
    }

    renderSegmentForRow(r: number, level: number) {
        const { collapsibleRows } = this.props;
        const style: React.CSSProperties = {
            textAlign: "center",
            alignContent: "center",
            justifyContent: "center",
            height: LOG_ROW_HEIGHT,
            position: 'relative',
            width: 30
        };
        let annotation = false;
        if (collapsibleRows[r] != undefined && collapsibleRows[r].level == level) {
            return (<VSCodeButton style={{...style, color: this.getRGB(level)}} key={r+"_"+level} appearance="icon" onClick={() => this.collapseRows(r)}>
                {this.state.collapsed[r] ? (
                <i className="codicon codicon-chevron-right" key={r} />
                ) : (
                <i className="codicon codicon-chevron-down" key={r} />
                )}
            </VSCodeButton>);
        } else {
            Object.keys(collapsibleRows).filter(key => collapsibleRows[key].level == level).map(key => {
                const segment: Segment = collapsibleRows[key];
                if (segment != undefined) {
                    if ( r <= segment.end && r > segment.start) {
                        annotation = true;
                    }
                }
            });
        }
        if (annotation) {
            return (<div style={{ ...style }} key={r+"_"+level}><div style={{backgroundColor: this.getRGB(level)}} className="vertical-line"></div></div>);
        } else {
            return (<div style={{  ...style }} key={r+"_"+level}></div>);
        }
    }
    
    collapseRows(index: number) {
        if (this.state.collapsed[index]) {
            //expand
            this.setState((prevState) => {
                const collapsed = { ...prevState.collapsed };
                collapsed[index] = false;
                return { collapsed };
            });
            let collapsedEnd = 0;
            for (let r = index + 1; r <= this.props.collapsibleRows[index].end; r++) {
                const collap = this.state.collapsed[r];
                if (collap) {
                   collapsedEnd = this.props.collapsibleRows[r] == undefined ? collapsedEnd : this.props.collapsibleRows[r].end;
                   this.props.onRowPropsChanged(r, true);
                } else if (r <= collapsedEnd) {
                    this.props.onRowPropsChanged(r, false);
                } else {
                    this.props.onRowPropsChanged(r, true);
                }
            }
        } else {
            //collapse
            for (let r = index + 1; r <= this.props.collapsibleRows[index].end; r++) {
                this.props.onRowPropsChanged(r, false);
            }
            this.setState((prevState) => {
                const collapsed = { ...prevState.collapsed };
                collapsed[index] = true;
                return { collapsed };
            });
        }
    }

    updateState(currentStructureMatchFirstRow: StructureMatchId = null) {
        if (!this.viewport.current) return;
        const height = this.viewport.current.clientHeight;
        const maxVisibleItems = height / LOG_ROW_HEIGHT;
        const visibleItems = Math.min(this.props.logFile.amountOfRows(), maxVisibleItems);
        let scrollTop;

        if(currentStructureMatchFirstRow !== null) {
            if(currentStructureMatchFirstRow + visibleItems < this.props.logFile.amountOfRows()) {
                scrollTop = currentStructureMatchFirstRow * LOG_ROW_HEIGHT;
            }else {
                scrollTop = (visibleItems < this.props.logFile.amountOfRows()) ? ((this.props.logFile.amountOfRows() - 1) - visibleItems) * LOG_ROW_HEIGHT : 0;
            }
        }else{
            scrollTop = this.viewport.current.scrollTop;
        }

        const scrollLeft = this.viewport.current.scrollLeft;
        const start = (currentStructureMatchFirstRow !== null && currentStructureMatchFirstRow + maxVisibleItems < this.props.logFile.amountOfRows()) ? currentStructureMatchFirstRow : scrollTop / LOG_ROW_HEIGHT;
        const startFloor = Math.floor(start);
        const endCeil = Math.min(Math.ceil(start + maxVisibleItems) - 1, this.props.logFile.amountOfRows() - 1);
        const state = {height, scrollLeft, scrollTop, startFloor, start, endCeil, visibleItems, rowHeight: LOG_ROW_HEIGHT};
        
        if (currentStructureMatchFirstRow !== null) {
        this.viewport.current.scrollTop = scrollTop;
        }

        this.setState({state});
        this.props.onLogViewStateChanged(state);
    }

    setColumnWidth(name: string, width: number) {
        //update the state for triggering the render
        this.setState(prevState => {
            const columnWidth = {...prevState.columnWidth};
            columnWidth[name] = width;
            return {columnWidth};
        });
    }

    columnWidth(name: string) {
        return LOG_COLUMN_WIDTH_LOOKUP[name] ?? LOG_DEFAULT_COLUMN_WIDTH;
    }

    isLight(color: string) {
        const colors = JSON.parse(color.slice(3).replace("(","[").replace(")","]"))
        const brightness = ((colors[0] * 299) + (colors[1] * 587) + (colors[2] * 114)) / 1000;
        return brightness > 110;
    }

    getRGB(level: number) {
        switch(level){
            case 0: return RGB_ANNOTATION0;
            case 1: return RGB_ANNOTATION1;
            case 2: return RGB_ANNOTATION2;
            case 3: return RGB_ANNOTATION3;
            case 4: return RGB_ANNOTATION4;
        }
    }

    getVisibleRows() {
        const { logFile, rowProperties } = this.props;
        const visibleRows = logFile.rows.filter((v, i) => rowProperties[i].isRendered);
        return visibleRows.length
    }

    getMaxLevel(){
        return Math.min(4, getSegmentMaxLevel(this.props.collapsibleRows));
    }

    renderHeader(width: number) {
        const style: React.CSSProperties = {
            width, height: '100%', position: 'absolute',
            left: this.state.state ? this.state.state.scrollLeft * -1 : 0,
        };
        const segmentWidth:number = (this.getMaxLevel() + 1) * 30 + BORDER_SIZE;
        return (
            <div style={HEADER_STYLE} className="header-background">
                <div style={style}>
                    <div style={getSegmentStyle(segmentWidth, LOG_HEADER_HEIGHT)}></div>
                    {this.props.logFile.getSelectedHeader().map((h, i) => this.renderHeaderColumn(h.name, i, true, this.columnWidth(h.name)))}
                </div>
            </div>
        );
    }

    renderHeaderColumn(value: string, columnIndex: number, isHeader: boolean, width: number) {
        const height = isHeader ? LOG_HEADER_HEIGHT : LOG_ROW_HEIGHT;
        const widthNew = width + BORDER_SIZE; //increase width with 1px, because the border is 1px
        const columnHeaderStyle = getHeaderColumnStyle(widthNew, columnIndex, height);
        const columnHeaderInnerStyle = getHeaderColumnInnerStyle(height, isHeader);
 
        return (
            <ReactResizeDetector handleWidth key={columnIndex} onResize={(width)=>this.setColumnWidth(value, width!)}>
            <div className="resizable-content" style={columnHeaderStyle} key={columnIndex}>
                <div style={columnHeaderInnerStyle}>
                    {value}
                </div>
            </div>
            </ReactResizeDetector>
        );
    }

    render() {
        const {logFile} = this.props;
        const containerHeight = this.getVisibleRows() * LOG_ROW_HEIGHT;
        const containerWidth = (logFile.amountOfColumns() * BORDER_SIZE) +
            logFile.headers.reduce((partialSum: number, h) => partialSum + this.state.columnWidth[h.name], 0);
        return (
                <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                    {this.renderHeader(containerWidth)}
                    <div style={VIEWPORT_STYLE} ref={this.viewport} onScroll={() => this.updateState()}>
                        <div style={{width: containerWidth, height: containerHeight, position: 'absolute'}} >
                            {this.renderRows()}
                        </div>
                    </div>
                </div>
        );
    }
}
