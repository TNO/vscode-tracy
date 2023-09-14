// When adding new rules, don't forget to update the lookup in Rule.fromJSON
import React from 'react';
import Rule from './Rule';
import LogFile from '../LogFile';
import Table from './Tables/Table';
import FlagTable from './Tables/FlagTable';
import { VSCodeTextField, VSCodeDropdown, VSCodeOption, VSCodePanels, VSCodePanelTab, VSCodePanelView } from '@vscode/webview-ui-toolkit/react';

interface Flag {name: string, conditions: Condition[][]}
interface Condition {searchColumn: string, searchOperation: string, searchText: string}

export default class FlagRule extends Rule {
    static friendlyType = "Flag rule";
    friendlyType = FlagRule.friendlyType;

    readonly flags: Flag[];
    readonly defaultValue: string;
    readonly selectedFlag: number;

    public constructor(column: string, description: string, defaultValue: string, selectedFlag: number, flags: Flag[]) {
        super(column, description);
        this.defaultValue = defaultValue;
        this.selectedFlag = selectedFlag;
        this.flags = flags;
    }

    reset = () => new FlagRule(this.column, this.description, this.defaultValue, 0, this.flags);
    setColumn = (column: string) => new FlagRule(column, this.description, this.defaultValue, this.selectedFlag, this.flags);
    setDescription = (description: string) => new FlagRule(this.column, description, this.defaultValue, this.selectedFlag, this.flags);
    setSelected = (selectedFlag: number) => new FlagRule(this.column, this.description, this.defaultValue, selectedFlag, this.flags);
    setDefault = (defaultValue: string) => new FlagRule(this.column, this.description, defaultValue, this.selectedFlag, this.flags);
    setFlags = (flags: Flag[]) => new FlagRule(this.column, this.description, this.defaultValue, this.selectedFlag, flags);

    public toJSON() {
        const {column, description, defaultValue, flags} = this;
        const type = 'FlagRule';
        return {column, type, description, defaultValue, flags};
    }

    static fromJSON(json: {[s: string]: any}) {
        return new FlagRule(json.column, json.description, json.defaultValue, 0, json.flags);
    }

    public renderEdit(onEdit: (newRule: Rule) => void, keyWidth: string, textFieldWidth: string, user_columns:string[], logFile: LogFile) {

        const editFlagName = (index: number, value: string) => {
            const flags = [...this.flags];
            flags[index] = {...flags[index], ['name']: value};
            onEdit(this.setFlags(flags));
        };

        const flagRows = this.flags.map((r, i) => {
            return [
                <VSCodeTextField 
                    initialValue={r.name} 
                    key='Text'
                    onInput={(e) => editFlagName(i, e.target.value)}/>,
            ]
        })

        const onAddFlag = () => {
            let newName;
            const existingFlags = this.flags.map((n, i) => n.name);
            for (let i = 1; i < this.flags.length+2; i++) {
                newName = 'Flag ' + i.toString()
                if (existingFlags.indexOf(newName) == -1) break;
            }
            onEdit(this.setFlags([...this.flags, {name: newName, conditions: []}]));
        }

        const onDeleteFlag = (index: number) => {
            const flags = [...this.flags];
            onEdit(this.setFlags(flags.filter((r, i) => index !== i)));
        }

        const allColumns = ['', ...logFile.contentHeaders, ...user_columns];
        const ruleRows: any[][] = [];
        if (this.flags.length > 0) {
            if (this.flags[this.selectedFlag].conditions.length === 0) ruleRows.push([]);
            for (let columnIndex = 0; columnIndex < this.flags[this.selectedFlag].conditions.length; columnIndex++) {
                const conditionSet = this.flags[this.selectedFlag].conditions[columnIndex];
                ruleRows.push(conditionSet.map((sub, s_i) => {
                    return [
                        <VSCodeDropdown 
                            style={{width: '100%', marginBottom: '2px'}} 
                            key='Dropdown'
                            value={sub.searchColumn} onChange={(e) => editSubcondition(columnIndex, s_i, 'searchColumn', e.target.value)}>{allColumns.map((col, col_i) => 
                            <VSCodeOption 
                                key={col_i} 
                                value={col}>{col}
                            </VSCodeOption>)}
                        </VSCodeDropdown>,
                        <VSCodeDropdown  
                            style={{width: '100%'}} 
                            key='Dropdown'
                            value={sub.searchOperation}  
                            onChange={(e) => editSubcondition(columnIndex, s_i, 'searchOperation', e.target.value)}>
                                <VSCodeOption key='0' value='contains'>contains</VSCodeOption>
                                <VSCodeOption key='1' value='equals'>equals</VSCodeOption>
                                <VSCodeOption key='2' value='startsWith'>startsWith</VSCodeOption>
                                <VSCodeOption key='3' value='endsWith'>endsWith</VSCodeOption>
                        </VSCodeDropdown>,
                        <VSCodeTextField  
                            style={{width: '100%'}} 
                            key='searchText'
                            value={sub.searchText}  
                            onInput={(e) => editSubcondition(columnIndex, s_i, 'searchText', e.target.value)}/>,
                    ];
                }));
            }
        }

        const onAddCondition = () => {
            const flags = [...this.flags];
            flags[this.selectedFlag].conditions.push([]);
            onEdit(this.setFlags(flags));
        }

        const onDeleteCondition = (transitionIndex: number) => {
            const newConditions = this.flags[this.selectedFlag].conditions.filter((r, i) => transitionIndex !== i);
            this.flags[this.selectedFlag].conditions = newConditions;
            onEdit(this.setFlags(this.flags));
        }

        const onAddSubcondition = (conditionIndex: number) => {
            const flags = [...this.flags];
            if (flags[this.selectedFlag].conditions.length === 0)
                flags[this.selectedFlag].conditions[conditionIndex] = [{searchColumn: '', searchOperation: 'contains', searchText: ''}];
            else 
                flags[this.selectedFlag].conditions[conditionIndex].push({searchColumn: '', searchOperation: 'contains', searchText: ''});
            onEdit(this.setFlags(flags));
        }

        const editSubcondition = (conditionIndex: number, subconditionIndex: number, field: 'searchColumn' | 'searchOperation' | 'searchText', value: string) => {
            const existingConditions = [...this.flags[this.selectedFlag].conditions];
            existingConditions[conditionIndex][subconditionIndex] = {...existingConditions[conditionIndex][subconditionIndex], [field]: value};
            this.flags[this.selectedFlag].conditions = existingConditions
            onEdit(this.setFlags(this.flags));
        }

        const onDeleteSubcondition = (conditionIndex: number, subconditionIndex: number) => {
            const updatedConditions = this.flags[this.selectedFlag].conditions[conditionIndex].filter((r, i) => subconditionIndex !== i);
            this.flags[this.selectedFlag].conditions[conditionIndex] = updatedConditions;
            onEdit(this.setFlags(this.flags));
        }

        const onDropdownSelect = (val: string) => {
            const index = this.flags.findIndex(x => x.name === val);
            onEdit(this.setSelected(index));
        }

        const flagDropdownRows = [
            [
                <VSCodeDropdown 
                    style={{marginLeft: '5px'}}
                    key='Dropdown'
                    onChange={(e) => onDropdownSelect(e.target.value)}>{this.flags.map((state, index) =>
                    <VSCodeOption 
                        value={state.name}
                        key={index}>{state.name}
                    </VSCodeOption>)}
                </VSCodeDropdown>
            ],
        ];

        return (
            <div style={{height: "100%", width:"100%", display: "flex"}}>
                <VSCodePanels aria-label="Logic-Panels">
                <VSCodePanelTab id="tab-1">Flags</VSCodePanelTab>
                <VSCodePanelTab id="tab-2">Conditions</VSCodePanelTab>
                <VSCodePanelView id="view-1">                    
                    <Table
                        columns={[{name: 'Name', width: ''}]}
                        rows={flagRows}
                        noRowsText={'No flags have been defined (click + to add)'}
                        onAddAction={onAddFlag}
                        onDeleteAction={onDeleteFlag}
                    />
                    </VSCodePanelView>
                    <VSCodePanelView id="view-2">
                        <div style={{marginTop: '20px', marginRight: '50px'}}>
                            <Table
                                hideHeader={true}
                                rows={flagDropdownRows}
                                columns={[{width: ''}]}
                            />
                        </div>

                        <div style={{width: '100%', float: 'right', margin: '1%'}}>
                            <FlagTable
                                columns={[ {width: '30px'}, {name: 'Column', width: '150px'}, {name: 'Operation', width: '150px'}, {name: 'Text', width: ''}]}
                                rows={ruleRows}
                                noRowsText={'No conditions have been defined (click + to add)'}
                                onAddConditionAction={onAddCondition}
                                onDeleteConditionAction={onDeleteCondition}
                                onAddSubconditionAction={onAddSubcondition}
                                onDeleteSubconditionAction={onDeleteSubcondition}
                            />
                        </div>
                    </VSCodePanelView>
                </VSCodePanels>
            </div>
        );
    }

    public computeValues(logFile: LogFile): string[] {
        const values: string[] = [];
        for (let r = 0; r < logFile.amountOfRows(); r++) {
            values[r] = this.defaultValue;
            for (const flag of this.flags) {
                let flagFound = false;
                for (const conditionSet of flag.conditions) {
                    let allConditionsSatisfied = true;
                    for (const condition of conditionSet) {
                        const logValue = logFile.value(condition.searchColumn, r) ?? '';
                        if (condition.searchOperation === 'contains') {
                            if (!logValue.includes(condition.searchText)) {
                                allConditionsSatisfied = false;
                                break;
                            }
                        }
                        else if (condition.searchOperation === 'equals') {
                            if (logValue !== condition.searchText) {
                                allConditionsSatisfied = false;
                                break;
                            }
                        }
                        else if (condition.searchOperation === 'startsWith') {
                            if (!logValue.startsWith(condition.searchText)) {
                                allConditionsSatisfied = false;
                                break;
                            }
                        }
                        else if (condition.searchOperation === 'endsWith') {
                            if (!logValue.endsWith(condition.searchText)) {
                                allConditionsSatisfied = false;
                                break;
                            }
                        }
                    }
                    if (allConditionsSatisfied === true) {
                        flagFound = true;
                        break;
                    }
                }
                if (flagFound === true) {
                    values[r] = flag.name;
                    break;
                }
            }
        }
        return values;
    }
}