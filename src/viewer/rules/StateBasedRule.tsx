import React from 'react';
import Rule from './Rule';
import Table from './Table';
import { VSCodeTextField } from '@vscode/webview-ui-toolkit/react';

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

    public renderEdit(onEdit: (newRule: Rule) => void, keyWidth: string, textFieldWidth: string) {
        const initialStateEdit = (
            <VSCodeTextField 
                style={{width: textFieldWidth}}
                value={this.initialState} 
                onInput={(e) => onEdit(this.setInitialState(e.target.value))}/>
        );

        return (
            <div>
                <Table columns={[{width: keyWidth}, {width: ''}]} rows={[['Initial state', initialStateEdit]]} hideHeader={true}/>
            </div>
        )

        // {['When in state', 'and seeing', 'in column', 'change state to'].map((t, i) => {
    }
}