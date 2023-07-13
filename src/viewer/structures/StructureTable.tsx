import React from 'react';
import ReactResizeDetector from 'react-resize-detector'
import { Header, StructureEntry } from '../types';
import { LOG_HEADER_HEIGHT, LOG_ROW_HEIGHT, BORDER, BORDER_SIZE, LOG_COLUMN_WIDTH_LOOKUP, LOG_DEFAULT_COLUMN_WIDTH, STRUCTURE_WIDTH, STRUCTURE_LINK_HEIGHT, StructureLinkDistance} from '../constants';

interface Props {
    headerColumns: Header[];
    structureEntries: StructureEntry[]; 
    isRemovingStructureEntries: boolean;
    onToggleStructureLink: (structureEntryIndex: number) => void;
    onStructureEntryRemoved: (structureEntryIndex: number) => void;
    onToggleIsCellSelected: (structureEntryIndex: number, cellIndex: number, isKeyPressed: boolean) => void;
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

    getCellSelectionStyle(rowIndex: number, cellIndex: number): React.CSSProperties {
        let selectionStyle: React.CSSProperties;

        if(!this.props.structureEntries[rowIndex].cellSelection[cellIndex]) {
            selectionStyle = {
                display: 'flex', height: LOG_ROW_HEIGHT, alignItems: 'center', justifyContent: 'left', 
                paddingLeft: '2px', 
                color: "var(--vscode-titleBar-inactiveForeground)",
                background: 'repeating-linear-gradient(-55deg, #222222b3, #222222b3 10px, #333333b3 10px, #333333b3 20px)'
            };
        }else{
            selectionStyle = {
                display: 'flex', height: LOG_ROW_HEIGHT, alignItems: 'center', justifyContent: 'left', 
                paddingLeft: '2px', backgroundColor: 'transparent'
            };
        }

        return selectionStyle;
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

    renderColumn(value: string, rowIndex: number, index: number, width: number) {
        const widthNew = index !== 0 ? width + BORDER_SIZE : width; //increase width with 1px, because the border is 1px
        const style: React.CSSProperties = {
            overflow: 'hidden', 
            whiteSpace: 'nowrap', 
            display: 'inline-block', 
            height: LOG_ROW_HEIGHT, 
            width: widthNew,
            verticalAlign: 'top',
            borderLeft: index !== 0 ? BORDER : '',
            borderTop: BORDER,
            borderBottom: BORDER
        };
        const innerStyle = this.getCellSelectionStyle(rowIndex, index);

        return (
            <div style={style} key={index}>
                <div style={innerStyle} onClick={(event) => this.props.onToggleIsCellSelected(rowIndex, index, event.ctrlKey)}>
                    {value}
                </div>
            </div>
        );
    }

    renderRows(containerWidth: number, containerHeight: number) {
        const newContainerWidth = containerWidth + STRUCTURE_WIDTH;
        const result: any = [];
        const {structureEntries, isRemovingStructureEntries, headerColumns, onStructureEntryRemoved} = this.props;

        const structureEntryIconStyle: React.CSSProperties = {
            width: STRUCTURE_WIDTH,
            height: LOG_ROW_HEIGHT,
            display: 'inline-block',
            verticalAlign: 'top',
            textAlign: 'center',
            lineHeight: `${LOG_ROW_HEIGHT}px`,
            color: isRemovingStructureEntries ? 'red' : ''
        }

        let structureLinkIndex = 0;

        for (let r = 0; r < structureEntries.length; r++) {
            const style: React.CSSProperties = {
                position: 'absolute', 
                height: LOG_ROW_HEIGHT,
                top: r * LOG_ROW_HEIGHT + structureLinkIndex * STRUCTURE_LINK_HEIGHT,
                overflow: 'hidden',
                userSelect: 'none'
            };

            result.push(
                <div key={r} style={style}>
                    {!isRemovingStructureEntries && <div style={structureEntryIconStyle}><i style={{padding: '6px'}}className='codicon codicon-circle-filled'/></div>}
                    {isRemovingStructureEntries && <div style={structureEntryIconStyle} onClick={() => {onStructureEntryRemoved(r)}}><i style={{padding: '6px'}} className='codicon codicon-close'/></div>}
                    {headerColumns.map((h, c) => 
                        this.renderColumn(structureEntries[r].row[c], r, c, this.columnWidth(h.name)))
                    }
                </div>
            );

            if(r !== structureEntries.length - 1) {
                const structureLinkStyle: React.CSSProperties = {
                    position: 'absolute', 
                    height: STRUCTURE_LINK_HEIGHT,
                    top: (r + 1) * LOG_ROW_HEIGHT + structureLinkIndex * STRUCTURE_LINK_HEIGHT,
                    overflow: 'hidden',
                    userSelect: 'none',
                    width: STRUCTURE_WIDTH,
                    textAlign: 'center'
                };

                const structureLinkSomeDistance = (structureEntries[r].structureLink === StructureLinkDistance.Some);

                result.push(
                    <div key={'l' + structureLinkIndex} style={structureLinkStyle} onClick={() => this.props.onToggleStructureLink(r)}>
                        {structureLinkSomeDistance && <i className='codicon codicon-kebab-vertical'/>}
                        {!structureLinkSomeDistance && <i className='codicon codicon-arrow-down'/>}
                    </div>
                );
                structureLinkIndex++;
            }
        }

        return(
            <div id="structureRows" style={{width: newContainerWidth, height: containerHeight, position: 'relative', overflow: 'auto'}}>
                {result}
            </div>
        );
    }

    render() {
        const {headerColumns, structureEntries} = this.props;
        const numberOfRows = structureEntries.length;
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