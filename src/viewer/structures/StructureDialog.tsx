import React from 'react';
import StructureTable from './StructureTable';
import { Header } from '../types';
import { StructureHeaderColumnType, StructureLinkDistance } from '../constants';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import { useStructureQueryConstructor } from '../hooks/useStructureRegularExpression';


interface Props {
    isOpen: boolean;
    logHeaderColumns: Header[];
    logHeaderColumnsTypes: StructureHeaderColumnType[];
    logSelectedRows: string[][];
    onClose: () => void;
    onSearch: (expression: string) => void;
    onStructureUpdate: () => void;
}

interface State {
    isRemovingRows: boolean;
    structureRows: string[][];
    structureLinks: StructureLinkDistance[];
    structureHeaderColumnsTypes: StructureHeaderColumnType[];
    selectedCells: boolean[][];
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

export default class StructureDialog extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        const {logHeaderColumnsTypes, logSelectedRows} = this.props;

        const initSelectedCells = logSelectedRows.map((row) => row.map(() => true));
        const initStructureLinks: StructureLinkDistance[] = [];

        for(let i = 0; i < logSelectedRows.length -1; i++) {
            initStructureLinks.push(StructureLinkDistance.Some);
        }

        this.state = {
            isRemovingRows: false, 
            structureHeaderColumnsTypes: logHeaderColumnsTypes, 
            structureRows: logSelectedRows, 
            selectedCells: initSelectedCells, 
            structureLinks: initStructureLinks
        };

        this.props.onStructureUpdate(); //trigger manually, as update function isn't called for initial render.
    }

    shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>, nextContext: any): boolean {    
        if((this.props.isOpen && this.props.logSelectedRows !== nextProps.logSelectedRows) 
            || (this.state !== nextState)) {
            return true;
        }

        return false;
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>): void {
        if(this.props.isOpen && this.props.logSelectedRows.length !== 0 && this.state.structureRows !== this.props.logSelectedRows) {
            this.updateStructure();
        }
    }

    updateStructure(){  
        const structureRows = this.state.structureRows;
        const newEntries = this.props.logSelectedRows.filter( entry => !structureRows.includes(entry));

        const newStructureLinks: StructureLinkDistance[] = [];

        if(newEntries.length !== 0) {
            newEntries.forEach(entry => structureRows.push(entry));

            structureRows.sort((a,b) => a[0].localeCompare(b[0]));

            for(let i = 0; i < structureRows.length - 1; i++) {
                newStructureLinks.push(StructureLinkDistance.Some);
            }

            this.setState({structureRows: structureRows, structureLinks: newStructureLinks});
        }
        
        this.props.onStructureUpdate();
    }

    removeRowFromStructure(rowIndex: number) {
        const {structureRows, structureLinks, selectedCells} = this.state;
        const remainingRows = structureRows.filter((v, i) => i !== rowIndex);
        const remainingSelectedCells = selectedCells.filter((v, i) => i !== rowIndex);
        let remainingLinks = structureLinks;
        
        if(rowIndex < this.state.structureRows.length -1) {
            remainingLinks = remainingLinks.filter((v, i) => i !== rowIndex);
        } else{
            remainingLinks = remainingLinks.filter((v, i) => i !== (rowIndex - 1));
        }     

        this.setState({structureRows: remainingRows, structureLinks: remainingLinks, selectedCells: remainingSelectedCells});

        if(remainingRows.length === 0) {
            this.props.onClose();
        }
    }

    toggleIsRemovingRows() {
        const isRemovingRows = this.state.isRemovingRows;
        this.setState({isRemovingRows: !isRemovingRows});
    }

    toggleIsHeaderColumnSelected(headerIndex: number) {
        // let newHeaderType;
        // let {structureHeaderColumnsTypes} = this.state;
        // let newSelectedEntryAttributes = this.state.selectedCells;
        // let isSelected = true;

        // if(structureHeaderColumnsTypes[headerIndex] === StructureHeaderColumnType.Selected){
        //     newHeaderType = StructureHeaderColumnType.Unselected;
        //     isSelected = false;
        // }
        // else if(structureHeaderColumnsTypes[headerIndex] === StructureHeaderColumnType.Unselected){
        //     newHeaderType = StructureHeaderColumnType.Selected;
        // }

        // newSelectedEntryAttributes.forEach(row => {
        //     row[headerIndex] = isSelected;
        // });
    }

    toggleIsCellSelected() {

    }

    toggleStructureLink(previousStructureRowIndex: number) {
        const currentLinkDistance = this.state.structureLinks;

        if (currentLinkDistance[previousStructureRowIndex] === StructureLinkDistance.Some) {
            currentLinkDistance[previousStructureRowIndex] = StructureLinkDistance.None;
        }
        else if (currentLinkDistance[previousStructureRowIndex] === StructureLinkDistance.None) {
            currentLinkDistance[previousStructureRowIndex] = StructureLinkDistance.Some;
        }

        this.setState({})
    }

    searchForStructure(){
        const structureRegExp = useStructureQueryConstructor(
            this.props.logHeaderColumns,
            this.state.structureHeaderColumnsTypes,
            this.state.structureRows,
            this.state.selectedCells,
            this.state.structureLinks
            );

        this.props.onSearch(structureRegExp);
    }

    render() {
        return (
            <div style={BACKDROP_STYLE}>
                <div className = 'dialog'style={DIALOG_STYLE}>
                    <div style={{display: 'flex', justifyContent: 'space-between', flexDirection: 'row', alignItems: 'top'}}>
                        <div className='title-small'>Structure Matching</div>
                        <VSCodeButton appearance='icon' onClick={() => this.props.onClose()}>
                            <i className='codicon codicon-close'/>
                        </VSCodeButton>
                    </div>
                    <StructureTable
                        headerColumns = {this.props.logHeaderColumns}
                        structureRows = {this.state.structureRows}
                        isRemovingRows = {this.state.isRemovingRows}
                        selectedCells = {this.state.selectedCells}
                        structureLinks={this.state.structureLinks}
                        onRowRemoved = {(entryIndex) => this.removeRowFromStructure(entryIndex)}
                        onToggleIsCellSelected = {() => this.toggleIsCellSelected()}
                        onToggleIsHeaderColumnSelected = {(headerIndex) => this.toggleIsHeaderColumnSelected(headerIndex)}
                        onToggleLink = {(previousRowIndex) => this.toggleStructureLink(previousRowIndex)}/>
                    <div style={{textAlign: 'right'}}>
                        <VSCodeButton style={{marginLeft: '5px', height: '25px', width: '115px'}} onClick={() => {this.toggleIsRemovingRows();}}>
                            {this.state.isRemovingRows ? 'Done' : 'Remove rows'}
                        </VSCodeButton>
                        <VSCodeButton style={{marginLeft: '5px', height: '25px', width: '145px'}} onClick={() => {this.searchForStructure();}} disabled={this.state.isRemovingRows}>
                            Search for Structure
                        </VSCodeButton>
                    </div>
                </div>
            </div>
    );
    }
}