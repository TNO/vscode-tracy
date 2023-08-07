import React from 'react';
import Tooltip from '@mui/material/Tooltip'
import LogView from './log/LogView';
import MinimapView from './minimap/MinimapView';
import LogFile from './LogFile';
import { LogViewState, StructureMatchId } from './types';
import { LOG_HEADER_HEIGHT, MINIMAP_COLUMN_WIDTH, BORDER, SelectedRowType, StructureHeaderColumnType} from './constants';
import { VSCodeButton, VSCodeTextField, VSCodeDropdown, VSCodeOption } from '@vscode/webview-ui-toolkit/react';
import { useJsonObjectToTextRangesMap, useStructureRegularExpressionSearch } from './hooks/useStructureRegularExpressionManager'
import { returnSearchIndices, useRegularExpressionSearch } from './hooks/useTextOperationManager'
import StructureDialog from './structures/StructureDialog';
import StatesDialog from './rules/Dialogs/StatesDialog';
import FlagsDialog from './rules/Dialogs/FlagsDialog';
import Rule from './rules/Rule';
import MinimapHeader from './minimap/MinimapHeader';
import SelectColDialog from './log/SelectColDialog';

interface Props {
}
interface State {
    logFile: LogFile;
    logViewState: LogViewState | undefined;
    rules: Rule[];
    showStatesDialog: boolean;
    showStructureDialog: boolean;
    showFlagsDialog: boolean;
    showMinimapHeader: boolean;
    showSelectDialog: boolean;
    searchColumn: string;
    selectedColumns: boolean[];
    selectedColumnsMini: boolean[];
    coloredTable: boolean;
    reSearch: boolean;
    wholeSearch: boolean;
    caseSearch: boolean;

    // Structure related
    logFileAsString: string
    logEntryRanges: number[][];
    selectedLogRows: string[][];
    selectedRowsTypes: SelectedRowType[];
    lastSelectedRow: number | undefined;
    structureMatches: number[][];
    structureMatchesLogRows: number[];
    currentStructureMatch: number[];
    currentStructureMatchIndex: StructureMatchId;
}

const COLUMN_0_HEADER_STYLE = {
    height: LOG_HEADER_HEIGHT, display: 'flex', justifyContent: 'center', alignItems: 'center', 
    borderLeft: BORDER, borderBottom: BORDER
};

const COLUMN_2_HEADER_STYLE = {
    height: '100%', display: 'flex', borderLeft: BORDER
}

let logHeaderColumnTypes: StructureHeaderColumnType[] = [];
let searchText: string = '';

export default class App extends React.Component<Props, State> {
    // @ts-ignore
    vscode = acquireVsCodeApi();
    child = React.createRef<HTMLDivElement>();
    constructor(props: Props) {
        super(props);
        this.state = {
            logFile: LogFile.create([], []), logFileAsString: '', logViewState: undefined, coloredTable: false, showMinimapHeader: true, 
            rules: [], showStatesDialog: false, showFlagsDialog: false, 
            showSelectDialog: false, selectedColumns: [], selectedColumnsMini: [],
            searchColumn: 'All', reSearch: false, wholeSearch: false, caseSearch: false,
            selectedLogRows: [], selectedRowsTypes: [], logEntryRanges: [],
            showStructureDialog: false, structureMatches: [], structureMatchesLogRows: [], currentStructureMatchIndex: null, currentStructureMatch: [], lastSelectedRow: undefined,
        };

        this.onMessage = this.onMessage.bind(this);
        window.addEventListener('message', this.onMessage);
        this.vscode.postMessage({type: 'update'});
    }

    componentDidUpdate(prevProps: Props, prevState: State) {
        if (this.state.logFile !== prevState.logFile) {
            this.render();
        }
    }

    onMessage(event: MessageEvent) {
        let logFile: LogFile;
        let newSelectedRowsTypes: SelectedRowType[];
        const message = event.data;
        
        if (message.type === 'update') {
            const rules = message.rules.map((r) => Rule.fromJSON(r)).filter((r) => r);
            let lines = JSON.parse(message.text);
            const logFileText = JSON.stringify(lines, null, 2);
            logFile = LogFile.create(lines, rules);

            if (searchText !== '') {
                const col_index = this.state.logFile.headers.findIndex(h => h.name === this.state.searchColumn)
                const filteredIndices = returnSearchIndices(logFile.rows, col_index, searchText, this.state.reSearch, this.state.wholeSearch, this.state.caseSearch);
                let filtered_lines = lines.filter((l, i) => filteredIndices.includes(i));

                if (filtered_lines.length === 0) {
                    filtered_lines = [lines[0]]
                    for (let k of Object.keys(lines[0]))
                        filtered_lines[0][k] = ''
                }

                logFile = LogFile.create(filtered_lines, rules);
            }

            const textRanges = useJsonObjectToTextRangesMap(logFileText);
            newSelectedRowsTypes = logFile.rows.map(() => SelectedRowType.None);
            this.setState({logFile, logFileAsString: logFileText, logEntryRanges: textRanges, rules, selectedRowsTypes: newSelectedRowsTypes});
        }
    }

    actionPress(action: any) {
        if (action === 'Clear') {
            searchText = '';
            this.vscode.postMessage({type: 'update'});
        }
        else if (action === 'Enter') {
            this.vscode.postMessage({type: 'update'});
        }
    }

    handleDialogActions(newRules: Rule[], is_close: boolean) {
        this.vscode.postMessage({type: 'save_rules', rules: newRules.map((r) => r.toJSON())});
        if (is_close === true)
            this.setState({rules: newRules, logFile: this.state.logFile.setRules(newRules), showStatesDialog: false, showFlagsDialog: false});
        else
            this.setState({rules: newRules});
    }

    handleSelectDialog(selectedCols: boolean[], selectedColsMini: boolean[], is_close: boolean) {
        if (is_close === true) {
            this.setState({selectedColumns: selectedCols, logFile: this.state.logFile.setSelectedColumns(selectedCols, selectedColsMini) ,showSelectDialog: false});
        }
    }

    handleStructureDialogActions(isClosing: boolean) {

        if (isClosing === true){
            logHeaderColumnTypes = [];
            this.handleStructureUpdate(isClosing);
        }else {
            const {logFile, selectedRowsTypes, rules, showStructureDialog} = this.state;

            const selectedLogRows = logFile.rows.filter((v, i) => selectedRowsTypes[i] === SelectedRowType.UserSelect);
            
            if(selectedLogRows.length === 0) {
                return;
            }

            if(!showStructureDialog) {

                for(let h = 0; h < logFile.headers.length; h++){
                    let headerType = StructureHeaderColumnType.Selected;
    
                    if(logFile.headers[h].name.toLowerCase() === 'timestamp'){
                        headerType = StructureHeaderColumnType.Unselected;
                    }
    
                    rules.forEach(rule => {
                        if(rule.column === logFile.headers[h].name){
                            headerType = StructureHeaderColumnType.Custom;
                        }
                    });

                    logHeaderColumnTypes.push(headerType);
                }

                this.setState({showStructureDialog: true});
            }

            this.setState({selectedLogRows: selectedLogRows});
        }
    }

    handleSelectedLogRow(rowIndex: number, event: React.MouseEvent){
        const {structureMatchesLogRows, lastSelectedRow} = this.state;
        const newSelectedRows = this.state.selectedRowsTypes;

        if(!structureMatchesLogRows.includes(rowIndex)) {
            if(event.shiftKey && rowIndex !== this.state.lastSelectedRow) {

                // Shift click higher in the event log
                if(lastSelectedRow !== undefined && lastSelectedRow < rowIndex) {
    
                    for(let i = lastSelectedRow + 1; i < rowIndex + 1; i++){
                        newSelectedRows[i] = (newSelectedRows[i] === SelectedRowType.None) ? SelectedRowType.UserSelect : SelectedRowType.None;
                    }
    
                }
                // Shift click lower in the event log
                else if(lastSelectedRow !== undefined && lastSelectedRow > rowIndex) {
                    for(let i = rowIndex; i < lastSelectedRow + 1; i++){
                        newSelectedRows[i] = (newSelectedRows[i] === SelectedRowType.None) ? SelectedRowType.UserSelect : SelectedRowType.None;
                    }
                }
            }else {
                newSelectedRows[rowIndex] = (newSelectedRows[rowIndex] === SelectedRowType.None) ? SelectedRowType.UserSelect : SelectedRowType.None;
            }
    
            this.setState({selectedRowsTypes: newSelectedRows, lastSelectedRow: rowIndex});
        }        
    }

    clearSelectedRowsTypes(): SelectedRowType[] {
        const clearedSelectedRows = this.state.selectedRowsTypes.map(() => SelectedRowType.None);
        return clearedSelectedRows;
    }

    handleStructureUpdate(isClosing: boolean) {
        const clearedSelectedRows = this.clearSelectedRowsTypes();

        this.setState({showStructureDialog:!isClosing ,selectedRowsTypes: clearedSelectedRows, structureMatches: [], structureMatchesLogRows: [], currentStructureMatchIndex: null, currentStructureMatch: []});
    }

    handleStructureMatching(expression:string) {
        const selectedRowsTypes = this.clearSelectedRowsTypes();
        const {logFileAsString, logEntryRanges} = this.state;
        let {currentStructureMatch, currentStructureMatchIndex} = this.state;

        const structureMatches = useStructureRegularExpressionSearch(expression, logFileAsString, logEntryRanges);
        let structureMatchesLogRows:number[] = [];

        structureMatches.forEach(matchArray => {
            structureMatchesLogRows = structureMatchesLogRows.concat(matchArray);
        });
        
        if(structureMatches.length >= 1) {
            currentStructureMatchIndex = 0;
            currentStructureMatch = structureMatches[0];
        }else {
            currentStructureMatchIndex = null;
            currentStructureMatch = [];
        }

        this.setState({selectedRowsTypes, structureMatches, structureMatchesLogRows, currentStructureMatch, currentStructureMatchIndex});
    }

    handleNavigateStructureMatches(isGoingForward: boolean) {
        const {currentStructureMatch, currentStructureMatchIndex, structureMatches} = this.state;
        let newCurrentStructureMatch = [...currentStructureMatch];
        let newCurrentStructureMatchIndex;

        if(currentStructureMatchIndex !== null) {

            if(isGoingForward) {
                newCurrentStructureMatchIndex = (currentStructureMatchIndex < structureMatches.length - 1) ? currentStructureMatchIndex + 1 : 0;
            }else {
                newCurrentStructureMatchIndex = (currentStructureMatchIndex > 0) ? currentStructureMatchIndex - 1 : structureMatches.length - 1
            }

            newCurrentStructureMatch = structureMatches[newCurrentStructureMatchIndex];

            this.setState({currentStructureMatch: newCurrentStructureMatch, currentStructureMatchIndex: newCurrentStructureMatchIndex});
        }
    }


    switchBooleanState(name: string){
        if (name === 'coloredTable')
            this.setState(({ coloredTable }) => ({ coloredTable: !coloredTable }));
        else if (name === 'reSearch')
            this.setState(({ reSearch }) => ({ reSearch: !reSearch }));
        else if (name === 'wholeSearch')
            this.setState(({ wholeSearch }) => ({ wholeSearch: !wholeSearch }));
        else if (name === 'caseSearch')
            this.setState(({ caseSearch }) => ({ caseSearch: !caseSearch }));
    }

    render() {
        var txt = '';
        const minimapWidth = this.state.logFile.amountOfColorColumns() * MINIMAP_COLUMN_WIDTH;
        const minimapHeight = this.state.showMinimapHeader ? '12%' : '5%' ;

        const all_columns = ['All', ...this.state.logFile.contentHeaders, ...this.state.rules.map(i=>i.column)];
        return (
        <div id="container" style={{display:'flex', flexDirection: 'column', height: '100vh', boxSizing: 'border-box'}}>
            <div id="header" style={{display: 'flex', flexDirection: 'row', height: minimapHeight, boxSizing: 'border-box'}}>
                <div style={{display: 'flex'}}>
                    <VSCodeButton style={{marginLeft: '5px', height: '25px', width: '150px'}}
                        onClick={() => this.setState({showSelectDialog: true})}>
                        Choose Columns
                    </VSCodeButton>
                    <label>
                        <input type="checkbox" checked={this.state.coloredTable} onChange={()=>this.switchBooleanState('coloredTable')}/>
                        Color Table
                    </label>
                </div>
                <div style={{flex: 1, display: 'flex', justifyContent: 'end'}}>
                    <VSCodeDropdown style={{marginRight: '5px'}} onChange={(e) => this.setState({searchColumn: e.target.value})}>
                    {all_columns.map((col, col_i) => <VSCodeOption key={col_i} value={col}>{col}</VSCodeOption>)}
                    </VSCodeDropdown>
                    <VSCodeTextField style={{marginRight: '5px'}} placeholder="Search Text" value={searchText} onInput={(e) => searchText = e.target.value} onKeyUp={(e) => this.actionPress(e.key)}>                    
                    
                    <Tooltip title={<h3>Match Case</h3>} placement="bottom" arrow>
                    <span slot="end" style={{backgroundColor: this.state.caseSearch ? 'dodgerblue' : '', borderRadius: '20%', marginRight: '5px', cursor:'pointer'}} className="codicon codicon-case-sensitive" onClick={() => this.switchBooleanState('caseSearch')}></span>
                    </Tooltip><Tooltip title={<h3>Match Whole Word</h3>} placement="bottom" arrow>
                    <span slot="end" style={{backgroundColor: this.state.wholeSearch ? 'dodgerblue' : '', borderRadius: '20%', marginRight: '5px', cursor:'pointer'}} className="codicon codicon-whole-word" onClick={() => this.switchBooleanState('wholeSearch')}></span>
                    </Tooltip>
                    <Tooltip title={<h3>Use Regular Expression</h3>} placement="bottom" arrow>
                        <span slot="end" style={{backgroundColor: this.state.reSearch ? 'dodgerblue' : '', borderRadius: '20%', marginRight: '5px', cursor:'pointer'}} className="codicon codicon-regex" onClick={() => this.switchBooleanState('reSearch')}></span>
                    </Tooltip>
                    <Tooltip title={<h3>Clear</h3>} placement="bottom" arrow>
                        <span slot="end" style={{cursor:'pointer'}} className="codicon codicon-close" onClick={() => this.actionPress('Clear')}></span>
                    </Tooltip>
                    
                    </VSCodeTextField>
                    {this.state.showMinimapHeader &&
                    <VSCodeButton appearance='icon' onClick={() => this.setState({showMinimapHeader: false})}>
                    <i className='codicon codicon-arrow-down' />
                    </VSCodeButton>
                    }
                    {!this.state.showMinimapHeader &&
                    <VSCodeButton appearance='icon' onClick={() => this.setState({showMinimapHeader: true})}>
                    <i className='codicon codicon-arrow-up' />
                    </VSCodeButton>
                    }
                </div>          
                {!this.state.showMinimapHeader &&
                <div className='header-background' style={{width: minimapWidth}}></div>
                }
                {this.state.showMinimapHeader &&
                <div className='header-background' style={{width: minimapWidth, ...COLUMN_2_HEADER_STYLE}}>
                <MinimapHeader logFile={this.state.logFile}/>
                </div>
                }
            </div>
            <div id="LogViewAndMinimap" style={{display: 'flex', flexDirection: 'row', height: `calc(100% - ${minimapHeight})`, overflow: 'auto', boxSizing: 'border-box'}}>                
                <div style={{flex: 1, display: 'flex'}}>
                    <LogView
                        logFile={this.state.logFile} 
                        onLogViewStateChanged={(logViewState) => this.setState({logViewState})}
                        forwardRef={this.child}
                        coloredTable={this.state.coloredTable}
                        selectedRows={this.state.selectedRowsTypes}
                        structureMatches={this.state.structureMatches}
                        structureMatchesLogRows={this.state.structureMatchesLogRows}
                        currentStructureMatch = {this.state.currentStructureMatch}
                        onSelectedRowsChanged={(index, e) => this.handleSelectedLogRow(index, e)}
                    />
                </div>                    
                <div style={{display: 'flex', flexDirection: 'column', width: minimapWidth, boxSizing: 'border-box'}}>
                    <div className='header-background' style={COLUMN_0_HEADER_STYLE}>
                        <VSCodeButton appearance='icon' onClick={() => this.handleStructureDialogActions(false)}>
                        <i className="codicon codicon-three-bars"/>
                        </VSCodeButton>
                        <VSCodeButton appearance='icon' onClick={() => this.setState({showFlagsDialog: true})}>
                        <i className="codicon codicon-tag"/>
                        </VSCodeButton>
                        <VSCodeButton appearance='icon' onClick={() => this.setState({showStatesDialog: true})}>
                        <i className="codicon codicon-settings-gear"/>
                        </VSCodeButton>
                        <VSCodeButton appearance='icon' onClick={()=>this.switchBooleanState('coloredTable')}>
                        <i className="codicon codicon-symbol-color"/>
                        </VSCodeButton>
                    </div>
                    {this.state.logViewState &&
                    <MinimapView
                    logFile={this.state.logFile}
                    logViewState={this.state.logViewState}
                    onLogViewStateChanged={(logViewState) => this.setState({logViewState})}
                    forwardRef={this.child}
                    />
                    }
                </div>
                { this.state.showStatesDialog &&
                <StatesDialog
                logFile={this.state.logFile}
                initialRules={this.state.rules}
                onClose={(newRules) => this.handleDialogActions(newRules, true)}
                onReturn={(newRules) => this.handleDialogActions(newRules, false)}
                />
                }
                { this.state.showFlagsDialog &&
                <FlagsDialog
                logFile={this.state.logFile}
                initialRules={this.state.rules}
                onClose={(newRules) => this.handleDialogActions(newRules, true)}
                onReturn={(newRules) => this.handleDialogActions(newRules, false)}
                /> 
                }
                {this.state.showSelectDialog &&
                <SelectColDialog
                logFile={this.state.logFile}
                onClose={(selectedColumns, selectedColumnsMini) => this.handleSelectDialog(selectedColumns, selectedColumnsMini, true)}/>
                }
            </div>
            <div id="StructureDialog" style={{display: 'flex', position: 'relative', boxSizing: 'border-box'}}>
                {this.state.showStructureDialog &&
                <StructureDialog
                logHeaderColumns={this.state.logFile.headers}
                logHeaderColumnsTypes = {logHeaderColumnTypes}
                logSelectedRows={this.state.selectedLogRows}
                currentStructureMatchIndex={this.state.currentStructureMatchIndex}
                numberOfMatches={this.state.structureMatches.length}
                onClose={() => this.handleStructureDialogActions(true)}
                onStructureUpdate={() => this.handleStructureUpdate(false)}
                onMatchStructure={(expression) => this.handleStructureMatching(expression)}
                onNavigateStructureMatches={(isGoingForward) => this.handleNavigateStructureMatches(isGoingForward)}
                />
                }
            </div>
        </div>);
    }
}
 