import React, { ChangeEvent } from 'react';
import LogView from './log/LogView';
import MinimapView from './minimap/MinimapView';
import LogFile from './LogFile';
import { LogViewState } from './types';
import { LOG_HEADER_HEIGHT, MINIMAP_COLUMN_WIDTH, BORDER } from './constants';
import { VSCodeButton, VSCodeTextField, VSCodeDropdown, VSCodeOption } from '@vscode/webview-ui-toolkit/react';
import StructureDialog from './structures/StructureDialog';
import StatesDialog from './rules/Dialogs/StatesDialog';
import FlagsDialog from './rules/Dialogs/FlagsDialog';
import Rule from './rules/Rule';
import MinimapHeader from './minimap/MinimapHeader';
import SelectColDialog from './log/SelectColDialog';

interface Props {
}
interface State {
    logEntryRanges: number[][];
    logFile: LogFile;
    logFileAsString: string
    logViewState: LogViewState | undefined;
    rules: Rule[];
    showStatesDialog: boolean;
    showStructureDialog: boolean;
    showFlagsDialog: boolean;
    showMinimapHeader: boolean;
    showSelectDialog: boolean;
    searchColumn: string;
    searchText: string;
    selectedColumns: boolean[];
    selectedRows: boolean[];
    lastSelectedRow: number | undefined;
    coloredTable: boolean;
}

const COLUMN_0_HEADER_STYLE = {
    height: LOG_HEADER_HEIGHT, display: 'flex', justifyContent: 'center', alignItems: 'center', 
    borderLeft: BORDER, borderBottom: BORDER
};

const COLUMN_2_HEADER_STYLE = {
    height: '100%', display: 'flex', borderLeft: BORDER
}

let selectedLogEntries: string[][] = [];

export default class App extends React.Component<Props, State> {
    // @ts-ignore
    vscode = acquireVsCodeApi();
    child = React.createRef<HTMLDivElement>();
    constructor(props: Props) {
        super(props);
        this.state = {logEntryRanges: [], logFile: LogFile.create([], []), logFileAsString: '', logViewState: undefined,
            rules: [], showStatesDialog: false, showFlagsDialog: false, 
            showMinimapHeader: true, showStructureDialog: false, showSelectDialog: false, searchColumn: 'All', searchText: '',
            selectedColumns: [], selectedRows: [], coloredTable: false, lastSelectedRow: undefined
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

    filterOnEnter(key_press: any) {
        if (key_press === 'Enter') {
            this.vscode.postMessage({type: 'update'});
        }
    }

    findIndices(rows: string[][], col_index: number, str: string) {
        let indices: number[] = [];
        if (col_index === -1) {
            for (let i = 0; i < rows.length; i++) {
                if (rows[i].join(" ").indexOf(str) != -1)
                    indices.push(i);
            }
        }
        else {
            for (let i = 0; i < rows.length; i++) {
                if (rows[i][col_index].indexOf(str) != -1)
                    indices.push(i);
            }
        }
        return indices;        
    }

    onMessage(event: MessageEvent) {
        let logFile: LogFile;
        let newSelectedRows: boolean[];
        const message = event.data;
        
        if (message.type === 'update') {
            const rules = message.rules.map((r) => Rule.fromJSON(r)).filter((r) => r);  
            const logFileText = message.text;
            let lines = JSON.parse(message.text);
            logFile = LogFile.create(lines, rules);

            if (this.state.searchText !== '') {
                const col_index = this.state.logFile.headers.findIndex(h => h.name === this.state.searchColumn)
                const filteredIndices = this.findIndices(logFile.rows, col_index, this.state.searchText);
                let filtered_lines = lines.filter((l, i) => filteredIndices.includes(i));

                if (filtered_lines.length === 0) {
                    filtered_lines = [lines[0]]
                    for (let k of Object.keys(lines[0]))
                        filtered_lines[0][k] = ''
                }

                logFile = LogFile.create(filtered_lines, rules);
            }

            this.mapLogFileTextRangesToObject(logFileText);
            newSelectedRows = logFile.rows.map(() => false);
            this.setState({logFile, logFileAsString: logFileText, rules, selectedRows: newSelectedRows});
        }
    }

    mapLogFileTextRangesToObject(logFileAsString: string) {
        const perfStart = performance.now();
        const textRanges: number[][] = [];
        const jsonObjectsPattern = /{.+?},?\r\n/;
        const flags = 'gs';
        const jsonObjectsRegExp = new RegExp(jsonObjectsPattern, flags);

        let result = jsonObjectsRegExp.exec(logFileAsString);

        if(result !== null) {
            do{
                textRanges.push([result.index, jsonObjectsRegExp.lastIndex]);
            }
            while ((result = jsonObjectsRegExp.exec(logFileAsString)) !== null)
        }

        this.setState({logEntryRanges: textRanges})

        const perfEnd = performance.now();
        console.log(`Execution time (mapLogFileTextIndicesToObject()): ${perfEnd - perfStart} ms`);
    }

    handleDialogActions(newRules: Rule[], is_close: boolean) {
        this.vscode.postMessage({type: 'save_rules', rules: newRules.map((r) => r.toJSON())});
        if (is_close === true)
            this.setState({rules: newRules, logFile: this.state.logFile.setRules(newRules), showStatesDialog: false, showFlagsDialog: false});
        else
            this.setState({rules: newRules});
    }

    handleSelectDialog(selectedCols: boolean[], is_close: boolean) {
        if (is_close === true) {
            this.setState({selectedColumns: selectedCols, logFile: this.state.logFile.setSelectedColumns(selectedCols) ,showSelectDialog: false});
        }
    }

    handleStructureDialogActions(is_open: boolean) {    
        if (is_open === false) {
            selectedLogEntries = this.state.logFile.rows.filter((v, i) => this.state.selectedRows[i]).map((value) => value);
        
            if(selectedLogEntries.length === 0) {
                return;
            }
        }

        this.setState({showStructureDialog: !is_open});
    }

    clearSelectedRows() {
        selectedLogEntries = [];
        const clearedSelectedRows = this.state.selectedRows.map(() => {return false});
        this.setState({selectedRows: clearedSelectedRows});
    }

    handleSelectedLogRow(rowIndex: number, event: React.MouseEvent){
        let newSelectedRows = this.state.selectedRows;

        if(event.shiftKey && rowIndex !== this.state.lastSelectedRow) {

            if(this.state.lastSelectedRow !== undefined && this.state.lastSelectedRow < rowIndex) {
                for(let i = this.state.lastSelectedRow + 1; i < rowIndex + 1; i++){
                    const newvalue = !newSelectedRows[i];
                    newSelectedRows[i] = newvalue;
                }
            }
            else if(this.state.lastSelectedRow !== undefined && this.state.lastSelectedRow > rowIndex) {
                for(let i = rowIndex; i < this.state.lastSelectedRow + 1; i++){
                    const newvalue = !newSelectedRows[i];
                    newSelectedRows[i] = newvalue;
                }
            }
        }else {
            newSelectedRows = this.state.selectedRows.map((isSelected, i) => {
                return i === rowIndex ? !isSelected : isSelected;
            })
        }

        this.setState({selectedRows: newSelectedRows, lastSelectedRow: rowIndex});
    }

    handleTableCheckbox(){
        console.log('mapped ranges', this.state.logEntryRanges.length);
        if (this.state.coloredTable) {
            this.setState({coloredTable:false});
        } else {
            this.setState({coloredTable:true});
        }
    }

    render() {
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
                        <input type="checkbox" checked={this.state.coloredTable} onChange={()=>this.handleTableCheckbox()}/>
                        Color Table
                    </label>
                </div>
                <div style={{flex: 1, display: 'flex', justifyContent: 'end'}}>
                    <VSCodeDropdown style={{marginRight: '5px'}} onChange={(e) => this.setState({searchColumn: e.target.value})}>
                    {all_columns.map((col, col_i) => <VSCodeOption key={col_i} value={col}>{col}</VSCodeOption>)}
                    </VSCodeDropdown>
                    <VSCodeTextField style={{marginRight: '5px'}} placeholder="Search Text" onInput={(e) => this.setState({searchText: e.target.value})} onKeyDown={(e) => this.filterOnEnter(e.key)}>
                    <span slot="end" className="codicon codicon-search"></span>
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
                        selectedRows={this.state.selectedRows}
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
                onClose={(selectedColumns) => this.handleSelectDialog(selectedColumns, true)}/>
                }
            </div>
            <div id="StructureDialog" style={{display: 'flex', position: 'relative', boxSizing: 'border-box'}}>
                {this.state.showStructureDialog &&
                <StructureDialog
                logHeaders={this.state.logFile.headers}
                propSelectedRows={selectedLogEntries}
                isOpen = {this.state.showStructureDialog}
                onClose={() => this.handleStructureDialogActions(true)}
                onStructureUpdate={() => this.clearSelectedRows()}
                />
                }
            </div>
        </div>);
    }
}
