import React from 'react';
import { LOG_HEADER_HEIGHT, LOG_ROW_HEIGHT, LOG_COLUMN_WIDTH_LOOKUP, 
         LOG_DEFAULT_COLUMN_WIDTH, BORDER, BORDER_SIZE, RGB_Annotation1 } from '../constants';
import { getHeaderColumnInnerStyle, getHeaderColumnStyle, getLogViewRowSelectionStyle, getLogViewStructureMatchStyle } from '../hooks/useStyleManager';
import { LogViewState, RowProperty, StructureMatchId } from '../types';
import LogFile from '../LogFile';
import ReactResizeDetector from 'react-resize-detector';
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";

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
    collapsibleRows: { [key: number]: number };
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
            collapsed: [],};
    }

    componentDidMount(): void {
        window.addEventListener('resize', () => this.updateState());
        this.updateState();
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>): void {
        if (prevProps.logFile !== this.props.logFile) {
            this.updateState();
        }
        if (prevProps.currentStructureMatch[0] !== this.props.currentStructureMatch[0]) {
            this.updateState(this.props.currentStructureMatch[0]);
        }
        if (prevState.columnWidth !== this.state.columnWidth) {
            this.render();
        }
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
        const {logFile, rowProperties, structureMatches,currentStructureMatch, structureMatchesLogRows} = this.props;
        let first_render = this.state.state.startFloor;
        let last_render = this.state.state.endCeil;
        let visibleRows = logFile.rows.filter((v, i) => rowProperties[i].isRendered);
        if (last_render > visibleRows.length){
            if (!this.viewport.current) return;
            const height = this.viewport.current.clientHeight;
            const maxVisibleItems = height / LOG_ROW_HEIGHT;
            last_render = visibleRows.length - 1;
            first_render = Math.max(0, Math.ceil(last_render - maxVisibleItems) - 1);
        }

        // Hide LogFile if search did not return any rows
        if ((visibleRows.length === 1) && (visibleRows[0][0] === '')) {
            first_render = 0;
            last_render = -1;
        }

        let counter = first_render;
        for (let r = first_render; counter <= last_render; r++){
            if (rowProperties[r].isRendered){
                let rowStyle;

                if(structureMatchesLogRows.includes(r)){
                    rowStyle = getLogViewStructureMatchStyle(currentStructureMatch, structureMatches, r);
                }else{
                    rowStyle = getLogViewRowSelectionStyle(rowProperties, r, counter);
                }

                result.push(
                    <div key={r} style={rowStyle} onClick={(event) => this.props.onSelectedRowsChanged(r, event)}>
                        {logFile.headers.map((h, c) => 
                        logFile.selectedColumns[c]== true &&
                            this.renderColumn(logFile.rows[r][c], c, false, this.columnWidth(h.name), logFile.columnsColors[c][r]))
                        }
                    </div>
                );
                counter++;
            }
        }
        return result;
    }

    renderSegmentAnnotation() {
        // This method only renders the annotations that are visible
        if (!this.state.state) return;
        const result: any = [];
        const { logFile, collapsibleRows, rowProperties } = this.props;
        let first_render = this.state.state.startFloor;
        let last_render = this.state.state.endCeil;
        let visibleRows = logFile.rows.filter((v, i) => rowProperties[i].isRendered);

        if (last_render > visibleRows.length) {
          if (!this.viewport.current) return;
          const height = this.viewport.current.clientHeight;
          const maxVisibleItems = height / LOG_ROW_HEIGHT;
          last_render = visibleRows.length - 1;
          first_render = Math.max(0, Math.ceil(last_render - maxVisibleItems) - 1);
        }
    
        // Hide LogFile if search did not return any rows
        if (visibleRows.length === 1 && visibleRows[0][0] === "") {
          first_render = 0;
          last_render = -1;
        }
        const style: React.CSSProperties = {
          textAlign: "center",
          alignContent: "center",
          justifyContent: "center",
          height: LOG_ROW_HEIGHT,
          color: RGB_Annotation1
        };
        let start = 0;
        let end = 0;
        let counter = first_render;
        for (let r = first_render; counter < last_render; r++){
            if(rowProperties[r].isRendered){
                if (collapsibleRows[r]) {
                    console.log("button "+ r);
                    start = r;
                    end = collapsibleRows[r];
                    result.push(
                    <VSCodeButton
                        style={style}
                        key={r}
                        appearance="icon"
                        onClick={() => this.collapseRows(r)}
                    >
                        {this.state.collapsed[r] ? (
                        <i className="codicon codicon-chevron-right" key={r} />
                        ) : (
                        <i className="codicon codicon-chevron-down" key={r} />
                        )}
                    </VSCodeButton>
                    );
                } else {
                    console.log(r + " " +start);
                    if ( r > start && !this.state.collapsed[r]) {
                        result.push(
                            <div style={{ paddingTop: "3px", ...style }} key={r}>
                            |r
                            </div>
                        );
                    } else {
                        <div style={{ paddingTop: "3px", ...style }} key={r}>
                            .
                        </div>
                    }
                }
                counter++;
            }
        }
        return result;
    }
    
    collapseRows(index: number) {
        if (this.state.collapsed[index]) {
            //expand
            for (let r = index + 1; r <= this.props.collapsibleRows[index]; r++) {
                this.props.onRowPropsChanged(r, true);
            }
            const end = this.props.collapsibleRows[index];
            this.setState((prevState) => {
                const collapsed = { ...prevState.collapsed };
                collapsed[index] = false;
                collapsed[end] = false;
                return { collapsed };
            });
        } else {
            //collapse
            for (let r = index + 1; r <= this.props.collapsibleRows[index]; r++) {
                this.props.onRowPropsChanged(r, false);
            }
            const end = this.props.collapsibleRows[index];
            this.setState((prevState) => {
                const collapsed = { ...prevState.collapsed };
                collapsed[index] = true;
                collapsed[end] = true;
                return { collapsed };
            });
        }
        this.renderSegmentAnnotation();
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
        //update the width values 
        LOG_COLUMN_WIDTH_LOOKUP[name] = width;
    }

    columnWidth(name: string) {
        return LOG_COLUMN_WIDTH_LOOKUP[name] ?? LOG_DEFAULT_COLUMN_WIDTH;
    }

    isLight(color: string) {
        const colors = JSON.parse(color.slice(3).replace("(","[").replace(")","]"))
        const brightness = ((colors[0] * 299) + (colors[1] * 587) + (colors[2] * 114)) / 1000;
        return brightness > 110;
    }

    renderHeader(width: number) {
        const style: React.CSSProperties = {
            width, height: '100%', position: 'absolute',
            left: this.state.state ? this.state.state.scrollLeft * -1 : 0,
        };
        return (
            <div style={HEADER_STYLE} className="header-background">
                <div style={style}>
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
        const containerHeight = logFile.amountOfRows() * LOG_ROW_HEIGHT;
        const containerWidth = (logFile.amountOfColumns() * BORDER_SIZE) +
            logFile.headers.reduce((partialSum: number, h) => partialSum + this.columnWidth(h.name), 0);
        return (
            <div style={{ flex: 2, display: "flex", flexDirection: "row", overflow: 'hidden' }}>
                <div className="segment">
                    <div>
                        <div style={HEADER_STYLE} className="header-background"></div>
                    </div>
                    <div>{this.renderSegmentAnnotation()}</div>
                </div>
                <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                    {this.renderHeader(containerWidth)}
                    <div style={VIEWPORT_STYLE} ref={this.viewport} onScroll={() => this.updateState()}>
                        <div style={{width: containerWidth, height: containerHeight, position: 'absolute'}}>
                            {this.renderRows()}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
