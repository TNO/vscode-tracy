import React from 'react';
import ReactResizeDetector from 'react-resize-detector'
import { Header } from '../types';
import { LOG_HEADER_HEIGHT, LOG_ROW_HEIGHT, BORDER, BORDER_SIZE, LOG_COLUMN_WIDTH_LOOKUP, LOG_DEFAULT_COLUMN_WIDTH, STRUCTURE_WIDTH, STRUCTURE_LINK_HEIGHT, StructureLinkDistance} from '../constants';

interface Props {
    headerColumns: Header[];
    structureRows: string[][];
    selectedCells: boolean[][];
    structureLinks: StructureLinkDistance[];
    isRemovingRows: boolean;
    onRowRemoved: (rowIndex: number) => void;
    onToggleIsCellSelected: () => void;
    onToggleIsHeaderColumnSelected: (headerIndex: number) => void;
    onToggleLink: (previousRowIndex) => void;
}

interface State {
    columnWidth: { [id: string]: number };
}

export default class StructureTable extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {columnWidth: LOG_COLUMN_WIDTH_LOOKUP};
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>): void {
        if(prevState.columnWidth !== this.state.columnWidth) {
            this.render();
        }
    }

    setColumnWidth(name: string, width: number) {
        this.setState(prevState => {
            const columnWidth = {...prevState.columnWidth};
            columnWidth[name] = width;
            return {columnWidth};
        });
    }

    columnWidth(name: string) {
        return this.state.columnWidth[name] ?? LOG_DEFAULT_COLUMN_WIDTH;
    }

    renderHeaderColumn(value: string, index: number, width: number) {
        const height = LOG_HEADER_HEIGHT;
        const widthNew = index !== 0 ? width + BORDER_SIZE : width; //increase width with 1px, because the border is 1px
        const style: React.CSSProperties = {
            overflow: 'hidden', whiteSpace: 'nowrap', display: 'inline-block', height, 
            width: widthNew, borderLeft: index !== 0 ? BORDER : '',
        };
        const innerStyle: React.CSSProperties = {
            display: 'flex', height, alignItems: 'center', justifyContent:'center', 
            paddingLeft: '2px'
        };
        return (
            <ReactResizeDetector handleWidth key={index} onResize={(width)=>this.setColumnWidth(value, width!)}>
            <div className="resizable-content" style={style} key={index}>
                <div style={innerStyle}>
                    {value}
                </div>
            </div>
            </ReactResizeDetector>
        );
    }

    renderHeader(containerWidth: number) {
        const style: React.CSSProperties = {
            width: containerWidth, 
            height: LOG_HEADER_HEIGHT, 
            position: 'relative',
            userSelect: 'none',
            left: STRUCTURE_WIDTH,
            display: "flex"
        };

        return (
            <div id='structureHeader' style={style}>
                <div className="header-background">
                    {this.props.headerColumns.map((h, i) => this.renderHeaderColumn(h.name, i, this.columnWidth(h.name)))}
                </div>
            </div> 
        );
    }

    renderColumn(value: string, index: number, width: number) {
        const height = LOG_ROW_HEIGHT;
        const widthNew = index !== 0 ? width + BORDER_SIZE : width; //increase width with 1px, because the border is 1px
        const color = 'transparent';
        
        const style: React.CSSProperties = {
            overflow: 'hidden', 
            whiteSpace: 'nowrap', 
            display: 'inline-block', 
            height, 
            width: widthNew,
            verticalAlign: 'top',
            borderLeft: index !== 0 ? BORDER : '',
            borderTop: BORDER,
            borderBottom: BORDER
        };
        const innerStyle: React.CSSProperties = {
            display: 'flex', height, alignItems: 'center', justifyContent: 'left', 
            paddingLeft: '2px', backgroundColor: color
        };
        return (
            <div style={style} key={index}>
                <div style={innerStyle}>
                    {value}
                </div>
            </div>
        );
    }

    renderRows(containerWidth: number, containerHeight: number) {
        const newContainerWidth = containerWidth + STRUCTURE_WIDTH;
        const result: any = [];
        const {structureRows, isRemovingRows, headerColumns, onRowRemoved} = this.props;

        const sequenceVertexStyle: React.CSSProperties = {
            width: STRUCTURE_WIDTH,
            height: LOG_ROW_HEIGHT,
            display: 'inline-block',
            verticalAlign: 'top',
            textAlign: 'center',
            lineHeight: `${LOG_ROW_HEIGHT}px`,
            color: isRemovingRows ? 'red' : ''
        }

        let sequenceEdgeIndex = 0;

        for (let r = 0; r < structureRows.length; r++) {
            const style: React.CSSProperties = {
                position: 'absolute', 
                height: LOG_ROW_HEIGHT,
                top: r * LOG_ROW_HEIGHT + sequenceEdgeIndex * STRUCTURE_LINK_HEIGHT,
                overflow: 'hidden',
                userSelect: 'none'
            };

            result.push(
                <div key={r} style={style}>
                    {!isRemovingRows && <div style={sequenceVertexStyle}><i style={{padding: '6px'}}className='codicon codicon-circle-filled'/></div>}
                    {isRemovingRows && <div style={sequenceVertexStyle} onClick={() => {onRowRemoved(r)}}><i style={{padding: '6px'}} className='codicon codicon-close'/></div>}
                    {headerColumns.map((h, c) => 
                        this.renderColumn(structureRows[r][c], c, this.columnWidth(h.name)))
                    }
                </div>
            );

            if(r !== structureRows.length - 1) {
                const sequenceEdgeStyle: React.CSSProperties = {
                    position: 'absolute', 
                    height: STRUCTURE_LINK_HEIGHT,
                    top: (r + 1) * LOG_ROW_HEIGHT + sequenceEdgeIndex * STRUCTURE_LINK_HEIGHT,
                    overflow: 'hidden',
                    userSelect: 'none',
                    width: STRUCTURE_WIDTH,
                    textAlign: 'center'
                };

                const distanceSome = (this.props.structureLinks[r] === StructureLinkDistance.Some);

                result.push(
                    <div key={'b' + sequenceEdgeIndex} style={sequenceEdgeStyle} onClick={() => this.props.onToggleLink(r)}>
                        {distanceSome && <i className='codicon codicon-kebab-vertical'/>}
                        {!distanceSome && <i className='codicon codicon-arrow-down'/>}
                    </div>
                );
                sequenceEdgeIndex++;
            }
        }

        return(
            <div id="structureRows" style={{width: newContainerWidth, height: containerHeight, position: 'relative', overflow: 'auto'}}>
                {result}
            </div>
        );
    }

    render() {
        const {headerColumns, structureRows} = this.props;
        const numberOfRows = structureRows.length;
        const containerHeight = numberOfRows * LOG_ROW_HEIGHT + (numberOfRows - 1) * STRUCTURE_LINK_HEIGHT;
        const containerWidth = ((headerColumns.length - 1) * BORDER_SIZE) +
        headerColumns.reduce((partialSum: number, h) => partialSum + this.columnWidth(h.name), 0);
        
        return (
            <div id="structureTable" style={{flex: 1, display: 'inline-block', flexDirection: 'column', overflow: 'auto'}}>
                    {this.renderHeader(containerWidth)}
                    {this.renderRows(containerWidth, containerHeight)}
            </div>
    );
    }
}