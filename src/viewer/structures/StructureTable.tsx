import React from 'react';
import ReactResizeDetector from 'react-resize-detector'
import Tooltip from '@mui/material/Tooltip'
import { Header, StructureEntry } from '../types';
import { LOG_HEADER_HEIGHT, LOG_ROW_HEIGHT, BORDER_SIZE, LOG_COLUMN_WIDTH_LOOKUP, LOG_DEFAULT_COLUMN_WIDTH, STRUCTURE_WIDTH, STRUCTURE_LINK_HEIGHT, StructureLinkDistance} from '../constants';
import { getStructureTableColumnStyle, getStructureTableHeaderStyle, getHeaderColumnStyle, getHeaderColumnInnerStyle, 
         getStructureTableCellSelectionStyle, getStructureTableEntryIconStyle, getStructureTableRowStyle, getStructureTableLinkStyle } from '../hooks/useStyleManager';

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

    renderHeaderColumn(value: string, columnIndex: number, width: number) {
        const height = LOG_HEADER_HEIGHT;
        const widthNew = width + BORDER_SIZE; //increase width with 1px, because the border is 1px
        const headerColumnStyle = getHeaderColumnStyle(widthNew, columnIndex, height);
        const headerColumnInnerStyle = getHeaderColumnInnerStyle(height, true);
        return (
            <ReactResizeDetector handleWidth key={columnIndex} onResize={(width)=>this.setColumnWidth(value, width!)}>
            <div className="resizable-content" style={headerColumnStyle} key={columnIndex}>
                <div style={headerColumnInnerStyle}>
                    {value}
                </div>
            </div>
            </ReactResizeDetector>
        );
    }

    renderHeader(containerWidth: number) {
        const style = getStructureTableHeaderStyle(containerWidth);

        return (
            <div id='structureHeader' style={style}>
                <div className="header-background">
                    {this.props.headerColumns.map((h, i) => this.renderHeaderColumn(h.name, i, this.columnWidth(h.name)))}
                </div>
            </div> 
        );
    }

    renderColumn(value: string, rowIndex: number, index: number, width: number) {
        const widthNew = width + BORDER_SIZE; //increase width with 1px, because the border is 1px
        const columnStyle = getStructureTableColumnStyle(widthNew, index);
        const columnInnerStyle = getStructureTableCellSelectionStyle(this.props.structureEntries, rowIndex, index);

        return (
            <div style={columnStyle} key={index}>
                <div style={columnInnerStyle} onClick={(event) => this.props.onToggleIsCellSelected(rowIndex, index, event.ctrlKey)}>
                    {value}
                </div>
            </div>
        );
    }

    renderRows(containerWidth: number, containerHeight: number) {
        const newContainerWidth = containerWidth + STRUCTURE_WIDTH;
        const result: any = [];
        const {structureEntries, isRemovingStructureEntries, headerColumns, onStructureEntryRemoved} = this.props;
        const structureEntryIconStyle = getStructureTableEntryIconStyle(isRemovingStructureEntries);
        let structureLinkIndex = 0;

        for (let r = 0; r < structureEntries.length; r++) {
            const rowStyle = getStructureTableRowStyle(r, structureLinkIndex);

            result.push(
                <div key={r} style={rowStyle}>
                    {!isRemovingStructureEntries && <div style={structureEntryIconStyle}><i style={{padding: '6px'}}className='codicon codicon-circle-filled'/></div>}
                    {isRemovingStructureEntries && <div style={structureEntryIconStyle} onClick={() => {onStructureEntryRemoved(r)}}><i style={{padding: '6px'}} className='codicon codicon-close'/></div>}
                    {headerColumns.map((h, c) => 
                        this.renderColumn(structureEntries[r].row[c], r, c, this.columnWidth(h.name)))
                    }
                </div>
            );

            if(r !== structureEntries.length - 1) {
                const structureLinkStyle = getStructureTableLinkStyle(r, structureLinkIndex);

                const structureLinkDistance = structureEntries[r].structureLink;

                result.push(
                    <div key={'l' + structureLinkIndex} style={structureLinkStyle} onClick={() => this.props.onToggleStructureLink(r)}>
                        {structureLinkDistance === StructureLinkDistance.Max && <Tooltip title={<h3>Allow maximal number of rows in-between</h3>} placement="right" arrow><i className='codicon codicon-kebab-vertical' /></Tooltip>}
                        {structureLinkDistance === StructureLinkDistance.None && <Tooltip title={<h3>Disallow rows in-between</h3>} placement="right" arrow><i className='codicon codicon-arrow-down' /></Tooltip>}
                        {structureLinkDistance === StructureLinkDistance.Min && <Tooltip title={<h3>Allow minimal number of rows in-between</h3>} placement="right" arrow><i className='codicon codicon-ellipsis' /></Tooltip>}
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
        const containerWidth = (headerColumns.length * BORDER_SIZE) +
        headerColumns.reduce((partialSum: number, h) => partialSum + this.columnWidth(h.name), 0);
        
        return (
            <div id="structureTable" style={{flex: 1, display: 'inline-block', flexDirection: 'column', overflow: 'auto'}}>
                    {this.renderHeader(containerWidth)}
                    {this.renderRows(containerWidth, containerHeight)}
            </div>
    );
    }
}