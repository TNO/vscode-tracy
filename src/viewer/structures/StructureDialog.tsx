import React from 'react';
import Tooltip from '@mui/material/Tooltip'
import StructureTable from './StructureTable';
import { Header, StructureEntry } from '../types';
import { StructureHeaderColumnType } from '../constants';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import { useStructureQueryConstructor } from '../hooks/useStructureRegularExpressionManager';
import { constructStructureEntriesArray, appendNewStructureEntries, removeStructureEntryFromList, toggleCellSelection, toggleStructureLink, removeLastStructureLink } from '../hooks/useStructureEntryManager'; 
import { StructureDialogBackdropStyle, StructureDialogDialogStyle } from '../hooks/useStyleManager';
import isEqual from 'lodash/isEqual';
import cloneDeep from 'lodash/cloneDeep';


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
    onDefineSegment: (entryExpression: string, exitExpression: string) => void;
}

interface State {
    structureEntries: StructureEntry[];
    isRemovingStructureEntries: boolean;
    isStructureMatching: boolean;
    structureHeaderColumnsTypes: StructureHeaderColumnType[];
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
    }

    componentDidMount(): void {
        this.props.onStructureUpdate(); //trigger manually, as update function isn't called for initial render.
    }

    shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>, nextContext: any): boolean {
        const arelogHeaderColumnsUpdating = !(isEqual(this.props.logHeaderColumns, nextProps.logHeaderColumns));
        const arelogHeaderColumnTypesUpdating = !(isEqual(this.props.logHeaderColumnsTypes, nextProps.logHeaderColumnsTypes));
        const arelogSelectedRowsUpdating = !(isEqual(this.props.logSelectedRows, nextProps.logSelectedRows));
        const isCurrentMatchIndexUpdating = !(isEqual(this.props.currentStructureMatchIndex, nextProps.currentStructureMatchIndex));
        const isNumberOfMatchesUpdating = !(isEqual(this.props.numberOfMatches, nextProps.numberOfMatches));

        const areHeaderColumnTypesUpdating = !(isEqual(this.state.structureHeaderColumnsTypes, nextState.structureHeaderColumnsTypes));
        const areStateEntriesUpdating = !(isEqual(this.state.structureEntries, nextState.structureEntries));
        const isRemovingStructureEntriesUpdating = !(isEqual(this.state.isRemovingStructureEntries, nextState.isRemovingStructureEntries));
        const isStructureMatchingUpdating = !(isEqual(this.state.isStructureMatching, nextState.isStructureMatching));    

        if(arelogHeaderColumnsUpdating || arelogHeaderColumnTypesUpdating ||  arelogSelectedRowsUpdating ||
           isCurrentMatchIndexUpdating || isNumberOfMatchesUpdating || areHeaderColumnTypesUpdating ||
           areStateEntriesUpdating || isRemovingStructureEntriesUpdating || isStructureMatchingUpdating){

            return true;
        }

        return false;
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>): void {
        if(this.props.logSelectedRows !== prevProps.logSelectedRows) {
            this.updateStructure();
        }
    }

    updateStructure(){
        const {structureHeaderColumnsTypes, structureEntries} = this.state;
        const structureEntriesCopy = cloneDeep(structureEntries);
        const newSelectedRows = this.props.logSelectedRows.filter( entry => !structureEntriesCopy.some( value => isEqual(value.row,entry)));

        if(newSelectedRows.length !== 0) {
            const newStructureEntries = constructStructureEntriesArray(structureHeaderColumnsTypes, newSelectedRows);
            const finalStructureEntries = appendNewStructureEntries(structureEntriesCopy, newStructureEntries)
            this.setState({structureEntries: finalStructureEntries, isStructureMatching: false});
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

    toggleIsCellSelected(structureEntryIndex: number, cellIndex: number, isCtrlPressed: boolean, isShiftPressed: boolean) {
        if(isCtrlPressed){
            let {structureHeaderColumnsTypes, structureEntries} = this.state;
            const structureEntriesCopy = cloneDeep(structureEntries);

            structureEntries = toggleCellSelection(structureHeaderColumnsTypes, structureEntriesCopy, structureEntryIndex, cellIndex, isShiftPressed);
    
            this.setState({structureEntries: structureEntries});
        }
    }

    toggleStructureLink(structureEntryIndex: number) {
        let {structureEntries} = this.state;
        const structureEntriesCopy = cloneDeep(structureEntries);
        structureEntries = toggleStructureLink(structureEntriesCopy, structureEntryIndex);

        this.setState({structureEntries: structureEntries});
    }

    matchStructure(){
        const structureRegExp = useStructureQueryConstructor(
            this.props.logHeaderColumns,
            this.state.structureHeaderColumnsTypes,
            this.state.structureEntries
            );

        this.props.onMatchStructure(structureRegExp);
        this.setState({isStructureMatching: true});
    }

    defineSegment(){
        
        const entryRegExp = useStructureQueryConstructor(
            this.props.logHeaderColumns,
            this.state.structureHeaderColumnsTypes,
            this.state.structureEntries.slice(0, 1)
            );
        const exitRegExp = useStructureQueryConstructor(
            this.props.logHeaderColumns,
            this.state.structureHeaderColumnsTypes,
            this.state.structureEntries.slice(-1)
            );
        this.props.onDefineSegment(entryRegExp, exitRegExp);
    }

    render() {
        const {structureEntries, isRemovingStructureEntries, isStructureMatching} = this.state;
        const structureEntriesCopy = cloneDeep(structureEntries);
        
        return (
            <div style={StructureDialogBackdropStyle}>
                <div className = 'dialog'style={StructureDialogDialogStyle}>
                <div style={{display: 'flex', justifyContent: 'space-between', flexDirection: 'row', alignItems: 'top'}}>
                    <div className='title-small'>Structure Matching</div>
                    <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                        <Tooltip title={<><h2>Help</h2><ul><li>item 1</li><li>item 2</li></ul></>} placement="right" arrow><i className='codicon codicon-question' /></Tooltip>
                        <VSCodeButton appearance='icon' onClick={() => this.props.onClose()}>
                            <i className='codicon codicon-close'/>
                        </VSCodeButton>
                    </div>
                </div>
                <StructureTable
                    headerColumns = {this.props.logHeaderColumns}
                    structureEntries = {structureEntriesCopy}
                    isRemovingStructureEntries = {isRemovingStructureEntries}
                    onToggleIsCellSelected = {(structureEntryIndex, cellIndex, isCtrlPressed, isShiftPressed) => this.toggleIsCellSelected(structureEntryIndex, cellIndex, isCtrlPressed, isShiftPressed)}
                    onToggleStructureLink = {(structureEntryIndex) => this.toggleStructureLink(structureEntryIndex)}
                    onStructureEntryRemoved = {(structureEntryIndex) => this.removeStructureEntry(structureEntryIndex)}/>
                <div style={{textAlign: 'right', padding: '5px'}}>
                    <VSCodeButton className='structure-result-element' onClick={() => {this.defineSegment();}} disabled={this.state.structureEntries.length === 1}>
                        Create Segment
                    </VSCodeButton>
                    <VSCodeButton className='structure-result-element' onClick={() => {this.toggleIsRemovingStructureEntries();}}>
                        {isRemovingStructureEntries ? 'Done' : 'Remove rows'}
                    </VSCodeButton>
                    <VSCodeButton className='structure-result-element' onClick={() => {this.matchStructure();}} disabled={isRemovingStructureEntries}>
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
        </div>);
    }
}