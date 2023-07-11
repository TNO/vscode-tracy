import React from 'react';
import StructureTable from './StructureTable';
import { Header, StructureEntry } from '../types';
import { StructureHeaderColumnType } from '../constants';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import { useStructureQueryConstructor } from '../hooks/useStructureRegularExpression';
import { constructStructureEntriesArray, appendNewStructureEntries, removeStructureEntryFromList, toggleCellSelection, toggleStructureLink, removeLastStructureLink } from '../hooks/useManageStructure'; 


interface Props {
    isOpen: boolean;
    logHeaderColumns: Header[];
    logHeaderColumnsTypes: StructureHeaderColumnType[];
    logSelectedRows: string[][];
    onClose: () => void;
    onStructureUpdate: () => void;
    onSearch: (expression: string) => void;
}

interface State {
    structureEntries: StructureEntry[];
    isRemovingStructureEntries: boolean;
    structureHeaderColumnsTypes: StructureHeaderColumnType[];
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

        let structureEntries = constructStructureEntriesArray(logSelectedRows);
        structureEntries = removeLastStructureLink(structureEntries);


        this.state = {
            isRemovingStructureEntries: false, 
            structureHeaderColumnsTypes: logHeaderColumnsTypes, 
            structureEntries: structureEntries
        };

        this.props.onStructureUpdate(); //trigger manually, as update function isn't called for initial render.
    }

    shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>, nextContext: any): boolean {
        // console.log("shouldComponentUpdate()");

        if((this.props.logSelectedRows !== nextProps.logSelectedRows) 
            || (this.state !== nextState)) {
                console.log("yes");
            return true;
        }

        return false;
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>): void {
        // console.log("componentDidUpdate()");
        if(this.props.logSelectedRows !== prevProps.logSelectedRows) {
            console.log("structure will update");
            this.updateStructure();
        }
    }

    updateStructure(){
        const {structureEntries} = this.state;
        const newEntries = this.props.logSelectedRows.filter( entry => structureEntries.map( value => value.row !== entry));

        if(newEntries.length !== 0) {
            const newStructureEntries = constructStructureEntriesArray(newEntries);
            const finalStructureEntries = appendNewStructureEntries(structureEntries, newStructureEntries)
            this.setState({structureEntries: finalStructureEntries});
            console.log(finalStructureEntries);
        }
        
        this.props.onStructureUpdate();
    }

    removeStructureEntry(rowIndex: number) {
        const {structureEntries} = this.state;
        const remainingEntries = removeStructureEntryFromList(structureEntries, rowIndex);
        
        if(remainingEntries.length === 0) {
            this.props.onClose();
        }else{
            this.setState({structureEntries: remainingEntries});
        }
    }

    toggleIsRemovingStructureEntries() {
        const isRemovingStructureEntries = this.state.isRemovingStructureEntries;
        this.setState({isRemovingStructureEntries: !isRemovingStructureEntries});
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

    toggleIsCellSelected(structureEntryIndex: number, cellIndex: number, isKeyPressed: boolean) {
        let {structureEntries} = this.state;
        console.log(isKeyPressed);
        structureEntries = toggleCellSelection(structureEntries, structureEntryIndex, cellIndex, isKeyPressed);

        this.setState({structureEntries: structureEntries});
    }

    toggleStructureLink(structureEntryIndex: number) {
        let {structureEntries} = this.state;
        structureEntries = toggleStructureLink(structureEntries, structureEntryIndex);

        this.setState({structureEntries: structureEntries});
    }

    searchForStructure(){
        const structureRegExp = useStructureQueryConstructor(
            this.props.logHeaderColumns,
            this.state.structureHeaderColumnsTypes,
            this.state.structureEntries
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
                        structureEntries = {this.state.structureEntries}
                        isRemovingStructureEntries = {this.state.isRemovingStructureEntries}
                        onToggleIsCellSelected = {(structureEntryIndex, cellIndex, isKeyPressed) => this.toggleIsCellSelected(structureEntryIndex, cellIndex, isKeyPressed)}
                        onToggleIsHeaderColumnSelected = {(headerIndex) => this.toggleIsHeaderColumnSelected(headerIndex)}
                        onToggleStructureLink = {(structureEntryIndex) => this.toggleStructureLink(structureEntryIndex)}
                        onStructureEntryRemoved = {(structureEntryIndex) => this.removeStructureEntry(structureEntryIndex)}/>
                    <div style={{textAlign: 'right'}}>
                        <VSCodeButton style={{marginLeft: '5px', height: '25px', width: '115px'}} onClick={() => {this.toggleIsRemovingStructureEntries();}}>
                            {this.state.isRemovingStructureEntries ? 'Done' : 'Remove rows'}
                        </VSCodeButton>
                        <VSCodeButton style={{marginLeft: '5px', height: '25px', width: '145px'}} onClick={() => {this.searchForStructure();}} disabled={this.state.isRemovingStructureEntries}>
                            Search for Structure
                        </VSCodeButton>
                    </div>
                </div>
            </div>
    );
    }
}