// When adding new rules, don't forget to update the lookup in Rule.fromJSON
import React from 'react';
import Rule from './Rule';
import LogFile from '../LogFile';
import Table from './Tables/Table';
import FlagTable from './Tables/FlagTable';
import { VSCodeTextField, VSCodeDropdown, VSCodeOption, VSCodePanels, VSCodePanelTab, VSCodePanelView } from '@vscode/webview-ui-toolkit/react';
import { useRegularExpressionSearch } from '../hooks/useLogSearchManager';

interface Flag {name: string, conditions: Condition[][]}
interface Condition {Column: string, Operation: string, Text: string}

export default class FlagRule extends Rule {
    static ruleType = "Flag rule";
    ruleType = FlagRule.ruleType;

    readonly flags: Flag[];
    readonly defaultValue: string;
    readonly flagType: string;
    readonly selectedFlag: number;

    public constructor(column: string, description: string, defaultValue: string, flagType: string, selectedFlag: number, flags: Flag[]) {
        super(column, description);
        this.defaultValue = defaultValue;
        this.flagType = flagType;
        this.selectedFlag = selectedFlag;
        this.flags = flags;
    }

    reset = () => new FlagRule(this.column, this.description, this.defaultValue, this.flagType, 0, this.flags);
    setColumn = (column: string) => new FlagRule(column, this.description, this.defaultValue, this.flagType, this.selectedFlag, this.flags);
    setDescription = (description: string) => new FlagRule(this.column, description, this.defaultValue, this.flagType, this.selectedFlag, this.flags);
    setFlagType = (flagType: string) => new FlagRule(this.column, this.description, this.defaultValue, flagType, this.selectedFlag, this.flags);
    setSelected = (selectedFlag: number) => new FlagRule(this.column, this.description, this.defaultValue, this.flagType, selectedFlag, this.flags);
    setDefault = (defaultValue: string) => new FlagRule(this.column, this.description, defaultValue, this.flagType, this.selectedFlag, this.flags);
    setFlags = (flags: Flag[]) => new FlagRule(this.column, this.description, this.defaultValue, this.flagType, this.selectedFlag, flags);

    public toJSON() {
        const {column, description, defaultValue, flagType, flags} = this;
        const type = 'FlagRule';
        return {column, type, description, defaultValue, flagType, flags};
    }

    static fromJSON(json: {[s: string]: any}) {
        return new FlagRule(json.column, json.description, json.defaultValue, json.flagType, 0, json.flags);
    }

    public renderEdit(onEdit: (newRule: Rule) => void, keyWidth: string, textFieldWidth: string, user_columns:string[], logFile: LogFile) {

        const editFlagName = (index: number, value: string) => {
            const flags = [...this.flags];
            flags[index] = {...flags[index], ['name']: value};
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
            for (let i = 1; i < this.flags.length+2; i++) {
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
                        <VSCodeDropdown style={{width: '100%', marginBottom: '2px'}} value={sub.Column} onChange={(e) => editSubcondition(c_i, s_i, 'Column', e.target.value)}>
                            {all_columns.map((col, col_i) => <VSCodeOption key={col_i} value={col}>{col}</VSCodeOption>)}
                        </VSCodeDropdown>,
                        <VSCodeDropdown  style={{width: '100%'}} value={sub.Operation}  onChange={(e) => editSubcondition(c_i, s_i, 'Operation', e.target.value)}>
                            <VSCodeOption key='0' value='contains'>contains</VSCodeOption>
                            <VSCodeOption key='1' value='equals'>equals</VSCodeOption>
                            <VSCodeOption key='2' value='startsWith'>startsWith</VSCodeOption>
                            <VSCodeOption key='3' value='endsWith'>endsWith</VSCodeOption>
                            <VSCodeOption key='4' value='regexSearch'>regex search</VSCodeOption>
                        </VSCodeDropdown>,
                        <VSCodeTextField  style={{width: '100%'}} value={sub.Text}  onInput={(e) => editSubcondition(c_i, s_i, 'Text', e.target.value)}/>,
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
                flags[this.selectedFlag].conditions[conditionIndex] = [{Column: '', Operation: 'contains', Text: ''}];
            else 
                flags[this.selectedFlag].conditions[conditionIndex].push({Column: '', Operation: 'contains', Text: ''});
            onEdit(this.setFlags(flags));
        }

        const editSubcondition = (conditionIndex: number, subconditionIndex: number, field: 'Column' | 'Operation' | 'Text', value: string) => {
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

        const onDropdownSelect = (val: string) => {
            const index = this.flags.findIndex(x => x.name === val);
            onEdit(this.setSelected(index));
        }

        const flagDropdownRows = [
            [
                <VSCodeDropdown style={{marginLeft: '5px'}} onChange={(e) => onDropdownSelect(e.target.value)}>
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
                <VSCodePanelTab id="tab-3">Regex Capture</VSCodePanelTab>
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
                <VSCodePanelView id="view-3">                    
                    <Table
                        columns={[{name: 'Name', width: ''}]}
                        rows={flagRows}
                        noRowsText={'No capture flags have been defined (click + to add)'}
                        onAddAction={onAddFlag}
                        onDeleteAction={onDeleteFlag}
                    />
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
                let flag_found: boolean = false;
                for (const condition_set of flag.conditions) {
                    let all_conditions_satisfied: boolean = true;
                    for (const condition of condition_set) {
                        const logValue = logFile.value(condition.Column, r) ?? '';
                        if (condition.Operation === 'contains') {
                            if (!logValue.includes(condition.Text)) {
                                all_conditions_satisfied = false;
                                break;
                            }
                        }
                        else if (condition.Operation === 'equals') {
                            if (logValue !== condition.Text) {
                                all_conditions_satisfied = false;
                                break;
                            }
                        }
                        else if (condition.Operation === 'startsWith') {
                            if (!logValue.startsWith(condition.Text)) {
                                all_conditions_satisfied = false;
                                break;
                            }
                        }
                        else if (condition.Operation === 'endsWith') {
                            if (!logValue.endsWith(condition.Text)) {
                                all_conditions_satisfied = false;
                                break;
                            }
                        }
                        else if (condition.Operation === 'regexSearch') {
                            if (useRegularExpressionSearch('gs', condition.Text, logValue) === false) {
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