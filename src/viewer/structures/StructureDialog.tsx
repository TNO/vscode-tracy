import React from 'react';
import ReactResizeDetector from 'react-resize-detector'
import { Header } from '../types';
import { LOG_HEADER_STYLE, LOG_HEADER_HEIGHT, LOG_ROW_HEIGHT, BORDER, BORDER_SIZE, LOG_COLUMN_WIDTH_LOOKUP, LOG_DEFAULT_COLUMN_WIDTH } from '../constants';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';

interface Props {
    isOpen: boolean;
    logHeaders: Header[];
    propSelectedRows: string[][];
    onClose: () => void;
    onStructureUpdate: () => void;
}

interface State {
    editStructure: boolean;
    columnWidth: { [id: string]: number };
    stateSelectedRows: string[][];
}

const BACKDROP_STYLE: React.CSSProperties = {
    position: 'fixed',
    bottom: '10px',
    height: 'auto',
    minHeight: '25vh', 
    width: '100vw',
    backgroundColor: '#00000030',
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center',
    overflow: 'visible', 
}

const DIALOG_STYLE: React.CSSProperties = {
    height: '100%',
    width: '98%', 
    padding: '10px', 
    display: 'flex', 
    flexDirection: 'column',
    overflow:'scroll',
}

export default class StructureDialog extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {editStructure: false, columnWidth: LOG_COLUMN_WIDTH_LOOKUP, stateSelectedRows: []};
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
        return this.columnWidth[name] ?? LOG_DEFAULT_COLUMN_WIDTH;
    }

    renderHeaderColumn(value: string, index: number, isHeader: boolean, width: number) {
        const height = isHeader ? LOG_HEADER_HEIGHT : LOG_ROW_HEIGHT;
        const widthNew = index !== 0 ? width + BORDER_SIZE : width; //increase width with 1px, because the border is 1px
        const style: React.CSSProperties = {
            overflow: 'hidden', whiteSpace: 'nowrap', display: 'inline-block', height, 
            width: widthNew, borderLeft: index !== 0 ? BORDER : '',
        };
        const innerStyle: React.CSSProperties = {
            display: 'flex', height, alignItems: 'center', justifyContent: isHeader ? 'center' : 'left', 
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

    renderHeader(width: number) {
        const style: React.CSSProperties = {
            width, height: '100%', position: 'absolute',
        };
        return (
            <div style={LOG_HEADER_STYLE} className="header-background">
                <div style={style}>
                    {this.props.logHeaders.map((h, i) => this.renderHeaderColumn(h.name, i, true, this.columnWidth(h.name)))}
                </div>
            </div>
        );
    }

    render() {
        const containerWidth = ((this.props.logHeaders.length - 1) * BORDER_SIZE) +
        this.props.logHeaders.reduce((partialSum: number, h) => partialSum + this.columnWidth(h.name), 0);
        
        return (
            <div style={BACKDROP_STYLE}>
                <div className = 'dialog'style={DIALOG_STYLE}>
                    <div style={{display: 'flex', justifyContent: 'space-between', flexDirection: 'row', alignItems: 'top'}}>
                        <div className='title-big'>Structure</div>
                        <VSCodeButton appearance='icon' onClick={() => this.closeDialog()}>
                            <i className='codicon codicon-close'/>
                        </VSCodeButton>
                    </div>
                    <div style={{display: 'flex'}}>
                        <div style={{width: '2%', border: '1px solid red'}}>sequence div</div>
                        <div style={{width: '98%', border: '1px solid yellow', flex: 1, display: 'flex', flexDirection: 'column'}}>
                        {this.renderHeader(containerWidth)}
                        </div>
                    </div>
                    <div style={{textAlign: 'right', padding: '10px'}}>
                        <VSCodeButton style={{marginLeft: '5px', height: '25px', width: '115px'}}>
                            Edit Structure
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