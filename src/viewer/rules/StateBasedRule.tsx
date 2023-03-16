// When adding new rules, don't forget to update the lookup in Rule.fromJSON
import React from 'react';
import Rule from './Rule';
import Table from './Table';
import { VSCodeTextField, VSCodeDropdown, VSCodeOption } from '@vscode/webview-ui-toolkit/react';
import LogFile from '../LogFile';

interface SubRule {whenInState: string, andSeeing: string, inColumn: string, changeStateTo: string};

export default class StateBasedRule extends Rule {
    static friendlyType = "State based rule";
    friendlyType = StateBasedRule.friendlyType;

    readonly initialState: string;
    readonly subRules: SubRule[];

    public constructor(column: string, description: string, initialState: string, subRules: SubRule[]) {
        super(column, description);
        this.initialState = initialState;
        this.subRules = subRules;
    }

    setColumn = (column: string) => new StateBasedRule(column, this.description, this.initialState, this.subRules);
    setDescription = (description: string) => new StateBasedRule(this.column, description, this.initialState, this.subRules);
    setInitialState = (initialState: string) => new StateBasedRule(this.column, this.description, initialState, this.subRules);
    setSubRules = (subRules: SubRule[]) => new StateBasedRule(this.column, this.description, this.initialState, subRules);

    public toJSON() {
        const {column, description, initialState, subRules} = this;
        const type = 'StateBasedRule';
        return {column, description, initialState, subRules, type};
    }

    static fromJSON(json: {[s: string]: any}) {
        return new StateBasedRule(json.column, json.description, json.initialState, json.subRules);
    }

    public renderEdit(onEdit: (newRule: Rule) => void, keyWidth: string, textFieldWidth: string, logFile: LogFile) {
        const initialStateEdit = (
            <VSCodeTextField 
                style={{width: textFieldWidth}}
                value={this.initialState} 
                onInput={(e) => onEdit(this.setInitialState(e.target.value))}/>
        );

        const editRule = (index: number, field: 'whenInState' | 'andSeeing' | 'inColumn' | 'changeStateTo', value: string) => {
            const rules = [...this.subRules];
            rules[index] = {...rules[index], [field]: value};
            onEdit(this.setSubRules(rules));
        };

        const columns = ['', ...logFile.contentHeaders];

        const subRulesRows = this.subRules.map((r, i) => {
            return [
                <VSCodeTextField  style={{width: '100%'}} initialValue={r.whenInState}  onInput={(e) => editRule(i, 'whenInState', e.target.value)}/>,
                <VSCodeTextField  style={{width: '100%'}} initialValue={r.andSeeing}  onInput={(e) => editRule(i, 'andSeeing', e.target.value)}/>,
                <VSCodeDropdown style={{width: '100%', marginBottom: '2px'}} value={r.inColumn} onChange={(e) => editRule(i, 'inColumn', e.target.value)}>
                    {columns.map((o, i) => <VSCodeOption key={i} value={o}>{o}</VSCodeOption>)}
                </VSCodeDropdown>,
                <VSCodeTextField  style={{width: '100%'}} initialValue={r.changeStateTo} onInput={(e) => editRule(i, 'changeStateTo', e.target.value)}/>,
            ];
        })

        const onDeleteAction = (index: number) => {
            onEdit(this.setSubRules(this.subRules.filter((r, i) => index !== i)));
        }

        const onAddAction = () => {
            onEdit(this.setSubRules([...this.subRules, {whenInState: '', andSeeing: '', inColumn: '', changeStateTo: ''}]));
        }

        return (
            <div>
                <Table columns={[{width: keyWidth}, {width: ''}]} rows={[['Initial state', initialStateEdit]]} hideHeader={true}/>
                <div style={{height: '5px'}}/>
                <Table
                    title='Sub-rules'
                    columns={[{name: 'When in state', width: ''}, {name: 'and seeing', width: ''}, {name: 'in column', width: ''}, {name: 'change state to', width: ''}]}
                    rows={subRulesRows} 
                    noRowsText={'No sub-rules defined yet (press + to add)'}
                    onAddAction={onAddAction}
                    onDeleteAction={onDeleteAction}
                />
            </div>
        );
    }

    public computeValues(logFile: LogFile): string[] {
        let state = this.initialState;
        const values: string[] = [];
        for (let r = 0; r < logFile.amountOfRows(); r++) {
            for (const rule of this.subRules) {
                if (state === rule.whenInState) {
                    const logValue = logFile.value(rule.inColumn, r) ?? '';
                    if (logValue.includes(rule.andSeeing)) {
                        state = rule.changeStateTo;
                        break;
                    }
                }
            }
            values[r] = state;
        }

        return values;
    }
}