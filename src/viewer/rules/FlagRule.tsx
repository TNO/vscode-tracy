// When adding new rules, don't forget to update the lookup in Rule.fromJSON
import React from 'react';
import Rule from './Rule';
import LogFile from '../LogFile';
import Table from './Tables/Table';
import FlagTable from './Tables/FlagTable';
import { VSCodeTextField, VSCodeDropdown, VSCodeOption, VSCodeDivider, VSCodePanels, VSCodePanelTab, VSCodePanelView } from '@vscode/webview-ui-toolkit/react';

interface Flag {name: string, conditions: Condition[][]}
interface Condition {searchColumn: string, searchOperation: string, searchText: string}

export default class FlagRule extends Rule {
    static friendlyType = "Flag rule";
    friendlyType = FlagRule.friendlyType;

    readonly flags: Flag[];
    readonly defaultValue: string;
    readonly selectedFlag: number;

    public constructor(column: string, description: string, defaultValue: string, selectedFlag, flags: Flag[]) {
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

        const editFlagName = (_index: number, value: string) => {
            const flags = [...this.flags];
            flags[_index] = {...flags[_index], ['name']: value};
            onEdit(this.setFlags(flags));
        };

        const flagRows = this.flags.map((r, i) => {
            return [
                <VSCodeTextField initialValue={r.name} onInput={(e) => editFlagName(i, e.target.value)}/>,
            ]
        })

        const onAddFlag = () => {
            let new_name;
            let existing_flags = this.flags.map((n, i) => n.name);
            for (let i = 1; i < this.flags.length+2; i++){
                new_name = 'Flag ' + i.toString()
                if (existing_flags.indexOf(new_name) == -1) break;
            }
            onEdit(this.setFlags([...this.flags, {name: new_name, conditions: []}]));
        }

        const onDeleteFlag = (index: number) => {
            const flags = [...this.flags];
            onEdit(this.setFlags(flags.filter((r, i) => index !== i)));
        }

        const all_columns = ['', ...logFile.contentHeaders, ...user_columns];
        let ruleRows: any[][] = [];
        if (this.flags.length > 0) {
            if (this.flags[this.selectedFlag].conditions.length === 0) ruleRows.push([]);
            for (let c_i = 0; c_i < this.flags[this.selectedFlag].conditions.length; c_i++) {
                const condition_set = this.flags[this.selectedFlag].conditions[c_i];
                ruleRows.push(condition_set.map((sub, s_i) => {
                    return [
                        <VSCodeDropdown style={{width: '100%', marginBottom: '2px'}} value={sub.searchColumn} onChange={(e) => editSubcondition(c_i, s_i, 'searchColumn', e.target.value)}>
                            {all_columns.map((col, col_i) => <VSCodeOption key={col_i} value={col}>{col}</VSCodeOption>)}
                        </VSCodeDropdown>,
                        <VSCodeDropdown  style={{width: '100%'}} initialValue={sub.searchOperation}  onChange={(e) => editSubcondition(c_i, s_i, 'searchOperation', e.target.value)}>
                            <VSCodeOption key='0' value='contains'>contains</VSCodeOption>
                            <VSCodeOption key='1' value='equals'>equals</VSCodeOption>
                            <VSCodeOption key='2' value='startsWith'>startsWith</VSCodeOption>
                            <VSCodeOption key='3' value='endsWith'>endsWith</VSCodeOption>
                        </VSCodeDropdown>,
                        <VSCodeTextField  style={{width: '100%'}} initialValue={sub.searchText}  onInput={(e) => editSubcondition(c_i, s_i, 'searchText', e.target.value)}/>,
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
            const new_conditions = this.flags[this.selectedFlag].conditions.filter((r, i) => transitionIndex !== i);
            this.flags[this.selectedFlag].conditions = new_conditions;
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
            const existing_conditions = [...this.flags[this.selectedFlag].conditions];
            existing_conditions[conditionIndex][subconditionIndex] = {...existing_conditions[conditionIndex][subconditionIndex], [field]: value};
            this.flags[this.selectedFlag].conditions = existing_conditions
            onEdit(this.setFlags(this.flags));
        }

        const onDeleteSubcondition = (conditionIndex: number, subconditionIndex: number) => {
            const updated_conditions = this.flags[this.selectedFlag].conditions[conditionIndex].filter((r, i) => subconditionIndex !== i);
            this.flags[this.selectedFlag].conditions[conditionIndex] = updated_conditions;
            onEdit(this.setFlags(this.flags));
        }

        const flagDropdownRows = [
            [
                <VSCodeDropdown style={{marginLeft: '5px'}} onChange={(e) => this.setSelected(e.key)}>
                    {this.flags.map((state, index) =>
                        <VSCodeOption value={state.name} key={index}>{state.name}</VSCodeOption>)}
                </VSCodeDropdown>
            ],
        ];

        return (
            <div style={{height: "100%", width:"100%", display: "flex"}}>
                <VSCodePanels aria-label="Logic-Panels">
                <VSCodePanelTab id="tab-1">Flags</VSCodePanelTab>
                <VSCodePanelTab id="tab-2">Conditions</VSCodePanelTab>
                <VSCodePanelView id="view-1">
                    {/* <div>
                    Default:
                    <VSCodeTextField onInput={(e) => onEdit(this.setDefault(e.target.value))}/>
                    </div> */}
                    
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
            for (const flag of this.flags){
                let flag_found: boolean = false;
                for (const condition_set of flag.conditions) {
                    let all_conditions_satisfied: boolean = true;
                    for (const condition of condition_set){
                        const logValue = logFile.value(condition.searchColumn, r) ?? '';
                        if (condition.searchOperation === 'contains') {
                            if (!logValue.includes(condition.searchText)) {
                                all_conditions_satisfied = false;
                                break;
                            }
                        }
                        else if (condition.searchOperation === 'equals') {
                            if (logValue !== condition.searchText) {
                                all_conditions_satisfied = false;
                                break;
                            }
                        }
                        else if (condition.searchOperation === 'startsWith') {
                            if (!logValue.startsWith(condition.searchText)) {
                                all_conditions_satisfied = false;
                                break;
                            }
                        }
                        else if (condition.searchOperation === 'endsWith') {
                            if (!logValue.endsWith(condition.searchText)) {
                                all_conditions_satisfied = false;
                                break;
                            }
                        }
                    }
                    if (all_conditions_satisfied === true) {
                        flag_found = true;
                        break;
                    }
                }
                if (flag_found === true) {
                    values[r] = flag.name;
                    break;
                }
            }
        }
        return values;
    }
}