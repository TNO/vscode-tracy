import React from 'react';
import ReactResizeDetector from 'react-resize-detector'
import { Header } from '../types';
import { LOG_HEADER_HEIGHT, LOG_ROW_HEIGHT, BORDER, BORDER_SIZE, LOG_COLUMN_WIDTH_LOOKUP, LOG_DEFAULT_COLUMN_WIDTH } from '../constants';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';

interface Props {
    isOpen: boolean;
    logHeaders: Header[];
    propSelectedRows: string[][];
    onClose: () => void;
    onStructureUpdate: () => void;
}

interface State {
    isEditingStructure: boolean;
    columnWidth: { [id: string]: number };
    stateSelectedRows: string[][];
}

const BACKDROP_STYLE: React.CSSProperties = {
    bottom: '10px',
    width: '100%',
    backgroundColor: '#00000030',
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center',
    overflow: 'visible', 
}

const DIALOG_STYLE: React.CSSProperties = {
    width: '98%', 
    padding: '10px', 
    display: 'flex', 
    flexDirection: 'column',
    overflow:'scroll',
}

const STRUCTURE_SEQUENCE_DIV_WIDTH = LOG_ROW_HEIGHT;
const SEQUENCE_EDGE_HEIGHT = 24;

export default class StructureDialog extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {isEditingStructure: false, columnWidth: LOG_COLUMN_WIDTH_LOOKUP, stateSelectedRows: []};
    }

    shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>, nextContext: any): boolean {
        if((this.props.isOpen && this.props.propSelectedRows !== nextProps.propSelectedRows) 
            || (this.state !== nextState)) {
            return true;
        }

        return false;
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>): void {
        if(this.props.isOpen && this.props.propSelectedRows.length !== 0 && this.state.stateSelectedRows !== this.props.propSelectedRows) {
            this.updateStructure();
            this.props.onStructureUpdate();
        }

        if(prevState.columnWidth !== this.state.columnWidth) {
            this.render();
        }
    }

    updateStructure(){
        const entriesInStructure = this.state.stateSelectedRows;
        const newEntries = this.props.propSelectedRows.filter( entry => !entriesInStructure.includes(entry));

        if(newEntries.length !== 0) {
            newEntries.forEach(entry => entriesInStructure.push(entry));

            entriesInStructure.sort((a,b) => a[0].localeCompare(b[0]));
    
            this.setState({stateSelectedRows: entriesInStructure});
        }
    }

    removeEntryFromStructure(rowIndex: number) {
        const selectedRows = this.state.stateSelectedRows.filter((v, i) => i !== rowIndex);
        this.setState({stateSelectedRows: selectedRows});

        if(selectedRows.length === 0) {
            this.closeDialog();
        }
    }

    toggleEditingStructure() {
        const isEditingStructureOld = this.state.isEditingStructure;
        this.setState({isEditingStructure: !isEditingStructureOld});
    }

    closeDialog() {  
        this.props.onClose();
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
            borderBottom: BORDER,
            userSelect: 'none',
            left: STRUCTURE_SEQUENCE_DIV_WIDTH,
            display: "flex"
        };

        return (
            <div id='structureHeader' style={style}>
                <div className="header-background">
                    {this.props.logHeaders.map((h, i) => this.renderHeaderColumn(h.name, i, this.columnWidth(h.name)))}
                </div>
            </div> 
        );
    }

    renderColumn(value: string, index: number, width: number) {
        const height = LOG_ROW_HEIGHT;
        const widthNew = index !== 0 ? width + BORDER_SIZE : width; //increase width with 1px, because the border is 1px
        const color = 'transparent';
        
        const style: React.CSSProperties = {
            overflow: 'hidden', whiteSpace: 'nowrap', display: 'inline-block', height, 
            width: widthNew, borderLeft: index !== 0 ? BORDER : '', verticalAlign: 'top' 
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
        const newContainerWidth = containerWidth + STRUCTURE_SEQUENCE_DIV_WIDTH;
        const result: any = [];
        const {stateSelectedRows, isEditingStructure} = this.state;
        const sequenceVertexStyle: React.CSSProperties = {
            width: STRUCTURE_SEQUENCE_DIV_WIDTH,
            height: LOG_ROW_HEIGHT,
            display: 'inline-block',
            verticalAlign: 'top',
            textAlign: 'center',
            lineHeight: `${LOG_ROW_HEIGHT}px`,
            color: isEditingStructure ? 'red' : ''
        }

        let sequenceEdgeIndex = 0;

        for (let r = 0; r < stateSelectedRows.length; r++) {
            const style: React.CSSProperties = {
                position: 'absolute', 
                height: LOG_ROW_HEIGHT,
                top: r * LOG_ROW_HEIGHT + sequenceEdgeIndex * SEQUENCE_EDGE_HEIGHT,
                overflow: 'hidden',
                borderBottom: BORDER,
                borderTop: (r > 0) ? BORDER: '',
                userSelect: 'none'
            };

            result.push(
                <div key={r} style={style}>
                    {!isEditingStructure && <div style={sequenceVertexStyle}><i className='codicon codicon-circle-filled'/></div>}
                    {isEditingStructure && <div style={sequenceVertexStyle} onClick={() => {this.removeEntryFromStructure(r)}}><i className='codicon codicon-close'/></div>}
                    {this.props.logHeaders.map((h, c) => 
                        this.renderColumn(stateSelectedRows[r][c], c, this.columnWidth(h.name)))
                    }
                </div>
            );

            if(r !== stateSelectedRows.length - 1) {
                const sequenceEdgeStyle: React.CSSProperties = {
                    position: 'absolute', 
                    height: SEQUENCE_EDGE_HEIGHT,
                    top: (r + 1) * LOG_ROW_HEIGHT + sequenceEdgeIndex * SEQUENCE_EDGE_HEIGHT,
                    overflow: 'hidden',
                    userSelect: 'none'
                };

                result.push(
                    <div key={'b' + sequenceEdgeIndex} style={sequenceEdgeStyle}>
                        <p>link between rows</p>
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
        const numberOfRows = this.state.stateSelectedRows.length;
        const containerHeight = numberOfRows * LOG_ROW_HEIGHT + (numberOfRows - 1) * SEQUENCE_EDGE_HEIGHT;
        const containerWidth = ((this.props.logHeaders.length - 1) * BORDER_SIZE) +
        this.props.logHeaders.reduce((partialSum: number, h) => partialSum + this.columnWidth(h.name), 0);
        
        return (
            <div style={BACKDROP_STYLE}>
                <div className = 'dialog'style={DIALOG_STYLE}>
                    <div style={{display: 'flex', justifyContent: 'space-between', flexDirection: 'row', alignItems: 'top'}}>
                        <div className='title-small'>Structure Matching</div>
                        <VSCodeButton appearance='icon' onClick={() => this.closeDialog()}>
                            <i className='codicon codicon-close'/>
                        </VSCodeButton>
                    </div>
                    <div id="structureTable" style={{flex: 1, display: 'inline-block', flexDirection: 'column', overflow: 'auto'}}>
                            {this.renderHeader(containerWidth)}
                            {this.renderRows(containerWidth, containerHeight)}
                    </div>
                    <div style={{textAlign: 'right'}}>
                        <VSCodeButton style={{marginLeft: '5px', height: '25px', width: '115px'}} onClick={() => {this.toggleEditingStructure();}}>
                            {this.state.isEditingStructure ? 'Done' : 'Edit Structure'}
                        </VSCodeButton>
                        <VSCodeButton style={{marginLeft: '5px', height: '25px', width: '145px'}}>
                            Search for Structure
                        </VSCodeButton>
                    </div>
                </div>
            </div>
    );
    }
}