import React from 'react';
import StructureTable from './StructureTable';
import { Header } from '../types';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';

enum StructureLinkDistance {
    None = "NONE",
    Some = "SOME",
    Max = "MAX"
    }

interface Props {
    isOpen: boolean;
    logHeaders: Header[];
    selectedEntries: string[][];
    onClose: () => void;
    onStructureUpdate: () => void;
}

interface State {
    isEditingStructure: boolean;
    selectedEntries: string[][];
    selectedEntryAttributes: boolean[][];
    structureLinks: StructureLinkDistance[];
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
        this.state = {isEditingStructure: false, selectedEntries: this.props.selectedEntries, selectedEntryAttributes: [], structureLinks: []};
        this.props.onStructureUpdate(); //trigger first update as function isn't called for initial render.
    }

    shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>, nextContext: any): boolean {
        if((this.props.isOpen && this.props.selectedEntries !== nextProps.selectedEntries) 
            || (this.state !== nextState)) {
            return true;
        }

        return false;
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>): void {
        if(this.props.isOpen && this.props.selectedEntries.length !== 0 && this.state.selectedEntries !== this.props.selectedEntries) {
            this.updateStructure();
            this.props.onStructureUpdate();
        }
    }

    updateStructure(){
        const entriesInStructure = this.state.selectedEntries;
        const newEntries = this.props.selectedEntries.filter( entry => !entriesInStructure.includes(entry));

        if(newEntries.length !== 0) {
            newEntries.forEach(entry => entriesInStructure.push(entry));

            entriesInStructure.sort((a,b) => a[0].localeCompare(b[0]));
    
            this.setState({selectedEntries: entriesInStructure});
        }
    }

    removeEntryFromStructure(rowIndex: number) {
        const selectedRows = this.state.selectedEntries.filter((v, i) => i !== rowIndex);
        this.setState({selectedEntries: selectedRows});

        if(selectedRows.length === 0) {
            this.props.onClose();
        }
    }

    toggleIsEditingStructure() {
        const isEditingStructureOld = this.state.isEditingStructure;
        this.setState({isEditingStructure: !isEditingStructureOld});
    }

    toggleHeaderSelection() {

    }

    toggleAttributeSelection() {

    }

    toggleLinkDistance() {

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
                        logHeaders = {this.props.logHeaders}
                        entriesInStructure = {this.state.selectedEntries}
                        isEditingStructure = {this.state.isEditingStructure}
                        selectedCells = {this.state.selectedEntryAttributes}
                        onEntryRemoved = {(entryIndex) => this.removeEntryFromStructure(entryIndex)}
                        onToggleAttributeSelection = {() => this.toggleAttributeSelection()}
                        onToggleHeaderSelection = {() => this.toggleHeaderSelection()}
                        onToggleLinkDistance = {() => this.toggleLinkDistance()}/>
                    <div style={{textAlign: 'right'}}>
                        <VSCodeButton style={{marginLeft: '5px', height: '25px', width: '115px'}} onClick={() => {this.toggleIsEditingStructure();}}>
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