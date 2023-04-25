// When adding new rules, don't forget to update the lookup in Rule.fromJSON
import React from 'react';
import Rule from './Rule';
import LogFile from '../LogFile';
import FlagTable from './Tables/FlagTable';
import { VSCodeTextField, VSCodeDropdown, VSCodeOption, VSCodeDivider, VSCodePanels, VSCodePanelTab, VSCodePanelView } from '@vscode/webview-ui-toolkit/react';


interface Condition {searchColumn: string, searchOperation: string, searchText: string}

export default class FlagRule extends Rule {
    static friendlyType = "Flag rule";
    friendlyType = FlagRule.friendlyType;

    readonly conditions: Condition[][];

    public constructor(column: string, description: string, conditions: Condition[][]) {
        super(column, description);
        this.conditions = conditions;
    }

    reset = () => new FlagRule('', '', this.conditions);
    setColumn = (column: string) => new FlagRule(column, this.description, this.conditions);
    setDescription = (description: string) => new FlagRule(this.column, description, this.conditions);
    setConditions = (conditions: Condition[][]) => new FlagRule(this.column, this.description, conditions);

    public toJSON() {
        const {column, description, conditions} = this;
        const type = 'FlagRule';
        return {column, type, description, conditions};
    }

    static fromJSON(json: {[s: string]: any}) {
        return new FlagRule(json.column, json.description, json.conditions);
    }

    public renderEdit(onEdit: (newRule: Rule) => void, keyWidth: string, textFieldWidth: string, user_columns:string[], logFile: LogFile) {

        const all_columns = ['', ...logFile.contentHeaders, ...user_columns];

        let ruleRows: any[][] = [];
        if (this.conditions.length === 0) 
            ruleRows.push([]);
        if (this.conditions.length > 0) {
            for (let c_i = 0; c_i < this.conditions.length; c_i++) {
                const condition_set = this.conditions[c_i];
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
            const new_conditions = [...this.conditions];
            new_conditions.push([])
            onEdit(this.setConditions(new_conditions));
        }

        const onDeleteCondition = (conditionIndex: number) => {
            const new_conditions = this.conditions.filter((r, i) => conditionIndex !== i);
            onEdit(this.setConditions(new_conditions));
        }

        const onAddSubcondition = (conditionIndex: number) => {
            const new_conditions = [...this.conditions];
            if (new_conditions.length === 0)
                new_conditions[conditionIndex] = [{searchColumn: '', searchOperation: 'contains', searchText: ''}];
            else 
                new_conditions[conditionIndex].push({searchColumn: '', searchOperation: 'contains', searchText: ''});
            onEdit(this.setConditions(new_conditions));
        }

        const editSubcondition = (conditionIndex: number, subconditionIndex: number, field: 'searchColumn' | 'searchOperation' | 'searchText', value: string) => {
            const existing_conditions = [...this.conditions];
            existing_conditions[conditionIndex][subconditionIndex] = {...existing_conditions[conditionIndex][subconditionIndex], [field]: value};
            onEdit(this.setConditions(existing_conditions));
        }

        const onDeleteSubcondition = (conditionIndex: number, subconditionIndex: number) => {
            const updated_conditions = this.conditions[conditionIndex].filter((r, i) => subconditionIndex !== i);
            this.conditions[conditionIndex] = updated_conditions;
            onEdit(this.setConditions(this.conditions));
        }


        return (
            <div style={{height: "100%", width:"100%", display: "flex"}}>
                <VSCodePanels aria-label="Logic-Panels">
                    <VSCodePanelTab id="tab-1">Conditions</VSCodePanelTab>
                    <VSCodePanelView id="view-1">
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
            values[r] = '';
            for (const condition_set of this.conditions) {
                for (const condition of condition_set){
                    const logValue = logFile.value(condition.searchColumn, r) ?? '';
                    if (condition.searchOperation === 'contains') {
                        if (logValue.includes(condition.searchText)) {
                            values[r] = this.column;
                            break;
                        }
                    }
                    else if (condition.searchOperation === 'equals') {
                        if (logValue === condition.searchText) {
                            values[r] = this.column;
                            break;
                        }
                    }
                    else if (condition.searchOperation === 'startsWith') {
                        if (logValue.startsWith(condition.searchText)) {
                            values[r] = this.column;
                            break;
                        }
                    }
                    else if (condition.searchOperation === 'endsWith') {
                        if (logValue.endsWith(condition.searchText)) {
                            values[r] = this.column;
                            break;
                        }
                    }
                }
            }
        }
        return values;
    }
}