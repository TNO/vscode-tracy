import React from 'react';
import Tooltip from '@mui/material/Tooltip'
import StructureTable from './StructureTable';
import { ContextMenuItem, Header, StructureEntry, Wildcard } from '../types';
import { StructureHeaderColumnType } from '../constants';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import { useStructureQueryConstructor } from '../hooks/useStructureRegularExpressionManager';
import { constructStructureEntriesArray, appendNewStructureEntries, removeStructureEntryFromList, toggleCellSelection, toggleStructureLink, removeLastStructureLink, addWildcardToStructureEntry, removeWildcardFromStructureEntry, updateStructureEntriesAfterWildcardDeletion } from '../hooks/useStructureEntryManager'; 
import { createWildcard, getIndicesForWildcardFromDivId, insertWildcardIntoCellsContents, getContentsIndexOfNewWildcard, removeWildcardSubstitution, removeWildcardSubstitutionForEntry, getWildcardIndex, removeWildcardFromCellContent } from '../hooks/useWildcardManager';
import { StructureDialogBackdropStyle, StructureDialogDialogStyle } from '../hooks/useStyleManager';
import isEqual from 'lodash/isEqual';
import cloneDeep from 'lodash/cloneDeep';
import ContextMenu from '../contextMenu/contextMenu';


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
    wildcards: Wildcard [];
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
            structureEntries: structureEntries,
            wildcards: []
        };

        //bind context for all functions used by the context menu:
        this.createWildcard = this.createWildcard.bind(this);
    }

    componentDidMount(): void {
        this.props.onStructureUpdate(); //trigger manually, as update function isn't called for initial render.
    }

    shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>, _nextContext: any): boolean {
        const arelogHeaderColumnsUpdating = !(isEqual(this.props.logHeaderColumns, nextProps.logHeaderColumns));
        const arelogHeaderColumnTypesUpdating = !(isEqual(this.props.logHeaderColumnsTypes, nextProps.logHeaderColumnsTypes));
        const arelogSelectedRowsUpdating = !(isEqual(this.props.logSelectedRows, nextProps.logSelectedRows));
        const isCurrentMatchIndexUpdating = !(isEqual(this.props.currentStructureMatchIndex, nextProps.currentStructureMatchIndex));
        const isNumberOfMatchesUpdating = !(isEqual(this.props.numberOfMatches, nextProps.numberOfMatches));

        const areHeaderColumnTypesUpdating = !(isEqual(this.state.structureHeaderColumnsTypes, nextState.structureHeaderColumnsTypes));
        const areStateEntriesUpdating = !(isEqual(this.state.structureEntries, nextState.structureEntries));
        const areWildcardsUpdating = !(isEqual(this.state.wildcards, nextState.wildcards));
        const isRemovingStructureEntriesUpdating = !(isEqual(this.state.isRemovingStructureEntries, nextState.isRemovingStructureEntries));
        const isStructureMatchingUpdating = !(isEqual(this.state.isStructureMatching, nextState.isStructureMatching));    

        if(arelogHeaderColumnsUpdating || arelogHeaderColumnTypesUpdating ||  arelogSelectedRowsUpdating ||
           isCurrentMatchIndexUpdating || isNumberOfMatchesUpdating || areHeaderColumnTypesUpdating ||
           areStateEntriesUpdating || areWildcardsUpdating || isRemovingStructureEntriesUpdating || 
           isStructureMatchingUpdating) {

            return true;
        }

        return false;
    }

    componentDidUpdate(prevProps: Readonly<Props>, _prevState: Readonly<State>): void {
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

    getContextMenuItems(){
        const contextMenuItems: ContextMenuItem[] = [];
        
        const createWildcardItem: ContextMenuItem = {
        text: "Create wildcard",
        callback: () => this.createWildcard()};

        contextMenuItems.push(createWildcardItem);

        if(this.state.wildcards.length > 0){
            this.state.wildcards.forEach((wc, index) => {
                const useWildcardItem: ContextMenuItem = {
                    text: `Use wildcard ?${index + 1}`,
                    callback: () => this.useWildcard(index)};

                    contextMenuItems.push(useWildcardItem);
            });

            const removeWildcardItem: ContextMenuItem = {
                text: 'Remove wildcard',
                callback: (anchorDivId) => this.removeWildcard(anchorDivId)};

                contextMenuItems.push(removeWildcardItem);
        }

        return contextMenuItems;
    }

    removeStructureEntry(rowIndex: number) {
        const {structureEntries, wildcards} = this.state;
        const wildcardsCopy = cloneDeep(wildcards);

        const modifiedWildcards = removeWildcardSubstitutionForEntry(wildcardsCopy, rowIndex);

        const remainingEntries = removeStructureEntryFromList(structureEntries, rowIndex);
        
        if(remainingEntries.length === 0) {
            this.props.onClose();
        }else{
            this.props.onStructureUpdate();
            this.setState({structureEntries: remainingEntries, wildcards: modifiedWildcards, isStructureMatching: false});
        }
    }

    toggleIsRemovingStructureEntries() {
        const isRemovingStructureEntries = this.state.isRemovingStructureEntries;
        this.setState({isRemovingStructureEntries: !isRemovingStructureEntries});
    }

    toggleIsCellSelected(structureEntryIndex: number, cellIndex: number, isCtrlPressed: boolean, isShiftPressed: boolean) {
        if(isCtrlPressed){
            const {structureHeaderColumnsTypes, structureEntries} = this.state;
            let structureEntriesCopy = cloneDeep(structureEntries);

            structureEntriesCopy = toggleCellSelection(structureHeaderColumnsTypes, structureEntriesCopy, structureEntryIndex, cellIndex, isShiftPressed);
    
            this.setState({structureEntries: structureEntriesCopy});
        }
    }

    toggleStructureLink(structureEntryIndex: number) {
        let {structureEntries} = this.state;
        const structureEntriesCopy = cloneDeep(structureEntries);
        structureEntries = toggleStructureLink(structureEntriesCopy, structureEntryIndex);

        this.setState({structureEntries: structureEntries});
    }

    matchStructure(){
        // pass list of wildcards and use those in regular expression construction
        const structureRegExp = useStructureQueryConstructor(
            this.props.logHeaderColumns,
            this.state.structureHeaderColumnsTypes,
            this.state.structureEntries,
            this.state.wildcards
            );

        this.props.onMatchStructure(structureRegExp);
        this.setState({isStructureMatching: true});
    }

    createWildcard(){
        const selection = getSelection();
        const range = selection!.getRangeAt (0);
        const startNode = range.startContainer;
        const endNode = range.endContainer;
        const startOffset = range.startOffset;
        const endOffset = range.endOffset;
        const parentDivId = (startNode.parentNode as Element).id;

        if(startNode.textContent === endNode.textContent && startOffset !== endOffset) {
            const {structureEntries, wildcards} = this.state;
            const structureEntriesCopy: StructureEntry[] = cloneDeep(structureEntries);
            let wildcardsCopy: Wildcard[] = cloneDeep(wildcards);

            const indicesForWildcard = getIndicesForWildcardFromDivId(parentDivId);
            
            const entryIndex = +indicesForWildcard[1];
            const cellIndex = +indicesForWildcard[2];
            const contentsIndex = +indicesForWildcard[3];

            //create new wildcard
            const newWildcard = createWildcard(entryIndex, cellIndex, contentsIndex);

            //update wildcards list
            wildcardsCopy.push(newWildcard);

            //update Structure Entry
            const wildcardIndex = wildcardsCopy.length - 1;
            const modifiedStructureEntries = addWildcardToStructureEntry(structureEntriesCopy, entryIndex, cellIndex, wildcardIndex);

            //update cellsWithWildcards
            const insertionResults = insertWildcardIntoCellsContents(structureEntriesCopy[entryIndex].row[cellIndex], wildcardsCopy, entryIndex, cellIndex, wildcardIndex, contentsIndex, startOffset, endOffset);
            structureEntriesCopy[entryIndex].row[cellIndex] = insertionResults.cellContents;
            wildcardsCopy = insertionResults.wildcards;

            wildcardsCopy[wildcardIndex].wildcardSubstitutions[0].contentsIndex = getContentsIndexOfNewWildcard(insertionResults.cellContents, wildcardIndex);

            this.setState({structureEntries: modifiedStructureEntries, wildcards: wildcardsCopy});
        }
    }

    useWildcard(wildcardIndex: number){
        const selection = getSelection();
        const range = selection!.getRangeAt (0);
        const startNode = range.startContainer;
        const endNode = range.endContainer;
        const startOffset = range.startOffset;
        const endOffset = range.endOffset;
        const parentDivId = (startNode.parentNode as Element).id;

        if(startNode.textContent === endNode.textContent && startOffset !== endOffset) {
            const {structureEntries, wildcards} = this.state;
            const structureEntriesCopy: StructureEntry[] = cloneDeep(structureEntries);
            let wildcardsCopy: Wildcard[] = cloneDeep(wildcards);

            const indicesForWildcard = getIndicesForWildcardFromDivId(parentDivId);
            
            const entryIndex = +indicesForWildcard[1];
            const cellIndex = +indicesForWildcard[2];
            const contentsIndex = +indicesForWildcard[3];

            //update Structure Entry
            const modifiedStructureEntries = addWildcardToStructureEntry(structureEntriesCopy, entryIndex, cellIndex, wildcardIndex);

            const insertionResults = insertWildcardIntoCellsContents(structureEntriesCopy[entryIndex].row[cellIndex], wildcardsCopy, entryIndex, cellIndex, wildcardIndex, contentsIndex, startOffset, endOffset);
            structureEntriesCopy[entryIndex].row[cellIndex] = insertionResults.cellContents;
            wildcardsCopy = insertionResults.wildcards;

            const updatedContentsIndex = getContentsIndexOfNewWildcard(insertionResults.cellContents, wildcardIndex);
            const newWildcardSubstitution = {entryIndex: entryIndex, cellIndex: cellIndex, contentsIndex: updatedContentsIndex};
            wildcardsCopy[wildcardIndex].wildcardSubstitutions.push(newWildcardSubstitution);

            // console.log(wildcardsCopy);
            this.setState({structureEntries: modifiedStructureEntries, wildcards: wildcardsCopy});
        }
    }

    removeWildcard(anchorDivId: string){
        const isAnchorDivWildcard = anchorDivId[0] === 'w';

        if(isAnchorDivWildcard) {
            const indicesForWildcard = anchorDivId.split('-');
            const entryIndex = +indicesForWildcard[1];
            const cellIndex = +indicesForWildcard[2];
            const contentsIndex = +indicesForWildcard[3];

            const {structureEntries, wildcards} = this.state;
            const structureEntriesCopy: StructureEntry[] = cloneDeep(structureEntries);
            let wildcardsCopy: Wildcard[] = cloneDeep(wildcards);

            const wildcardIndex = getWildcardIndex(wildcardsCopy, entryIndex, cellIndex, contentsIndex);

            //update Structure Entry
            let modifiedStructureEntries = removeWildcardFromStructureEntry(structureEntriesCopy, entryIndex, cellIndex, wildcardIndex);

            //update cellsWithWildcards
            const removalResults = removeWildcardFromCellContent(structureEntriesCopy[entryIndex].row[cellIndex], wildcardsCopy, entryIndex, cellIndex, contentsIndex);
            structureEntriesCopy[entryIndex].row[cellIndex] = removalResults.cellContents;
            wildcardsCopy = removalResults.wildcards;

            const wildcardsUpdateResult = removeWildcardSubstitution(wildcardsCopy, wildcardIndex, entryIndex, cellIndex, contentsIndex);
            wildcardsCopy = wildcardsUpdateResult.wildcards;

            if(wildcardsUpdateResult.isWildcardDeleted) {
                modifiedStructureEntries = updateStructureEntriesAfterWildcardDeletion(modifiedStructureEntries, wildcardsCopy, wildcardIndex);
            }

            // console.log(modifiedStructureEntries);
            // console.log(wildcardsCopy);
            
            this.setState({structureEntries: modifiedStructureEntries, wildcards: wildcardsCopy});
        }
    }

    render() {
        const {structureEntries, wildcards, isRemovingStructureEntries, isStructureMatching} = this.state;
        const structureEntriesCopy = cloneDeep(structureEntries);
        const wildcardsCopy = cloneDeep(wildcards);
        const contextMenuItems = this.getContextMenuItems();

        return (
            <div style={StructureDialogBackdropStyle}>
                <div className = 'dialog'style={StructureDialogDialogStyle}>
                <div style={{display: 'flex', justifyContent: 'space-between', flexDirection: 'row', alignItems: 'top'}}>
                    <div className='title-small'>Structure Matching</div>
                    <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                        {false && <Tooltip title={<><h2>Help</h2><ul><li>item 1</li><li>item 2</li></ul></>} placement="right" arrow><i className='codicon codicon-question' /></Tooltip>}
                        <VSCodeButton appearance='icon' onClick={() => this.props.onClose()}>
                            <i className='codicon codicon-close'/>
                        </VSCodeButton>
                    </div>
                </div>
                <StructureTable
                    headerColumns = {this.props.logHeaderColumns}
                    structureEntries = {structureEntriesCopy}
                    wildcards={wildcardsCopy}
                    isRemovingStructureEntries = {isRemovingStructureEntries}
                    onToggleIsCellSelected = {(structureEntryIndex, cellIndex, isCtrlPressed, isShiftPressed) => this.toggleIsCellSelected(structureEntryIndex, cellIndex, isCtrlPressed, isShiftPressed)}
                    onToggleStructureLink = {(structureEntryIndex) => this.toggleStructureLink(structureEntryIndex)}
                    onStructureEntryRemoved = {(structureEntryIndex) => this.removeStructureEntry(structureEntryIndex)}/>
                    <ContextMenu 
                        items={contextMenuItems}
                        parentDivId='StructureDialog'/>
                <div style={{textAlign: 'right', padding: '5px'}}>
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