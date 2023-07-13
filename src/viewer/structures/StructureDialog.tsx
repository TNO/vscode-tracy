import React from 'react';
import StructureTable from './StructureTable';
import { Header, StructureEntry } from '../types';
import { StructureHeaderColumnType } from '../constants';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import { useStructureQueryConstructor } from '../hooks/useStructureRegularExpression';
import { constructStructureEntriesArray, appendNewStructureEntries, removeStructureEntryFromList, toggleCellSelection, toggleStructureLink, removeLastStructureLink } from '../hooks/useManageStructure'; 


interface Props {
    logHeaderColumns: Header[];
    logHeaderColumnsTypes: StructureHeaderColumnType[];
    logSelectedRows: string[][];
    currentStructureMatchIndex: number | null;
    numberOfMatches: number;
    onClose: () => void;
    onStructureUpdate: () => void;
    onNavigateStructureMatches: (isGoingForward: boolean) => void;
    onMatchStructure: (expression: string) => void;
}

interface State {
    structureEntries: StructureEntry[];
    isRemovingStructureEntries: boolean;
    isStructureMatching: boolean;
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
        let structureEntries = constructStructureEntriesArray(logHeaderColumnsTypes, logSelectedRows);
        structureEntries = removeLastStructureLink(structureEntries);

        this.state = {
            isRemovingStructureEntries: false, 
            isStructureMatching: false, 
            structureHeaderColumnsTypes: logHeaderColumnsTypes, 
            structureEntries: structureEntries
        };

        this.props.onStructureUpdate(); //trigger manually, as update function isn't called for initial render.
    }

    shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>, nextContext: any): boolean {
        if((this.props !== nextProps) 
            || (this.state !== nextState)) {
                console.log("structureDialog updating");
            return true;
        }

        return false;
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>): void {
        if(this.props.logSelectedRows !== prevProps.logSelectedRows) {
            console.log("structure will update");
            this.updateStructure();
        }
    }

    updateStructure(){
        const {structureHeaderColumnsTypes, structureEntries} = this.state;
        const newSelectedRows = this.props.logSelectedRows.filter( entry => structureEntries.map( value => value.row !== entry));

        if(newSelectedRows.length !== 0) {
            const newStructureEntries = constructStructureEntriesArray(structureHeaderColumnsTypes, newSelectedRows);
            const finalStructureEntries = appendNewStructureEntries(structureEntries, newStructureEntries)
            this.setState({structureEntries: finalStructureEntries, isStructureMatching: false});
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
            this.props.onStructureUpdate();
            this.setState({structureEntries: remainingEntries, isStructureMatching: false});
        }
    }

    toggleIsRemovingStructureEntries() {
        const isRemovingStructureEntries = this.state.isRemovingStructureEntries;
        this.setState({isRemovingStructureEntries: !isRemovingStructureEntries});
    }

    toggleIsCellSelected(structureEntryIndex: number, cellIndex: number, isKeyPressed: boolean) {
        let {structureHeaderColumnsTypes, structureEntries} = this.state;
        structureEntries = toggleCellSelection(structureHeaderColumnsTypes, structureEntries, structureEntryIndex, cellIndex, isKeyPressed);

        this.setState({structureEntries: structureEntries});
    }

    toggleStructureLink(structureEntryIndex: number) {
        let {structureEntries} = this.state;
        structureEntries = toggleStructureLink(structureEntries, structureEntryIndex);

        this.setState({structureEntries: structureEntries});
    }

    MatchStructure(){
        const structureRegExp = useStructureQueryConstructor(
            this.props.logHeaderColumns,
            this.state.structureHeaderColumnsTypes,
            this.state.structureEntries
            );

        this.props.onMatchStructure(structureRegExp);
        this.setState({isStructureMatching: true});
    }

    render() {
        const {structureEntries, isRemovingStructureEntries, isStructureMatching} = this.state;
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
                        structureEntries = {structureEntries}
                        isRemovingStructureEntries = {isRemovingStructureEntries}
                        onToggleIsCellSelected = {(structureEntryIndex, cellIndex, isKeyPressed) => this.toggleIsCellSelected(structureEntryIndex, cellIndex, isKeyPressed)}
                        onToggleStructureLink = {(structureEntryIndex) => this.toggleStructureLink(structureEntryIndex)}
                        onStructureEntryRemoved = {(structureEntryIndex) => this.removeStructureEntry(structureEntryIndex)}/>
                    <div style={{textAlign: 'right', padding: '5px'}}>
                        <VSCodeButton className='structure-result-element' onClick={() => {this.toggleIsRemovingStructureEntries();}}>
                            {isRemovingStructureEntries ? 'Done' : 'Remove rows'}
                        </VSCodeButton>
                        <VSCodeButton className='structure-result-element' onClick={() => {this.MatchStructure();}} disabled={isRemovingStructureEntries}>
                            Search for Structure
                        </VSCodeButton>
                        { isStructureMatching &&
                            <>
                                <div className='structure-result-element' style={{display: 'inline-block', padding: '3.75px'}}> {(this.props.currentStructureMatchIndex === null) ? 0 : this.props.currentStructureMatchIndex! + 1} of {this.props.numberOfMatches}</div>
                                { this.props.numberOfMatches > 1 &&
                                    <>
                                    <VSCodeButton className='structure-result-element' appearance='icon' onClick={() => this.props.onNavigateStructureMatches(false)}>
                                         <i className='codicon codicon-chevron-up' />
                                    </VSCodeButton>
                                    <VSCodeButton className='structure-result-element' appearance='icon' onClick={() => this.props.onNavigateStructureMatches(true)}>
                                        <i className='codicon codicon-chevron-down' />
                                    </VSCodeButton>
                                    </>
                                }
                            </>
                        }
                    </div>
                </div>
            </div>
    );
    }
}