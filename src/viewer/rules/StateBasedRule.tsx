// When adding new rules, don't forget to update the lookup in Rule.fromJSON
import React from 'react';
import Rule from './Rule';
import { VSCodeTextField, VSCodeDropdown, VSCodeOption, VSCodeDivider, VSCodePanels, VSCodePanelTab, VSCodePanelView } from '@vscode/webview-ui-toolkit/react';
import LogFile from '../LogFile';
import Table from './Tables/Table';
import StateTable from './Tables/StateTable';
import TransitionTable from './Tables/TransitionTable';


interface State {name: string, transitions: Transition[]};
interface Transition {destination: string, conditions: TransitionCondition[][]};
interface TransitionCondition {Column: string, Operation: string, Text: string}


export default class StateBasedRule extends Rule {
    static friendlyType = "State based rule";
    friendlyType = StateBasedRule.friendlyType;

    readonly ruleStates: State[];
    readonly initialStateIndex: number;
    readonly originIndex: number;
    readonly destinationIndex: number;

    public constructor(column: string, description: string, initialStateIndex: number, originIndex: number, destinationIndex: number, ruleStates: State[]) {
        super(column, description);
        this.ruleStates = ruleStates;
        this.originIndex = originIndex;
        this.destinationIndex = destinationIndex;
        this.initialStateIndex = initialStateIndex;
    }

    reset = () => new StateBasedRule(this.column, this.description, this.initialStateIndex, 0, 0, this.ruleStates);
    setColumn = (column: string) => new StateBasedRule(column, this.description, this.initialStateIndex, this.originIndex, this.destinationIndex, this.ruleStates);
    setDescription = (description: string) => new StateBasedRule(this.column, description, this.initialStateIndex, this.originIndex, this.destinationIndex, this.ruleStates);
    setInitialState = (initialStateIndex: number) => new StateBasedRule(this.column, this.description, initialStateIndex, this.originIndex, this.destinationIndex, this.ruleStates);
    setTransition = (originIndex: number, destinationIndex: number) => new StateBasedRule(this.column, this.description, this.initialStateIndex, originIndex, destinationIndex, this.ruleStates);
    setStates = (states: State[], initialStateIndex: number) =>  new StateBasedRule(this.column, this.description, initialStateIndex, this.originIndex, this.destinationIndex, states);


    public toJSON() {
        const {column, description, initialStateIndex, ruleStates} = this;
        const type = 'StateBasedRule';
        return {column, type, description, initialStateIndex, ruleStates};
    }

    static fromJSON(json: {[s: string]: any}) {
        return new StateBasedRule(json.column, json.description, json.initialStateIndex, 0, 0, json.ruleStates);
    }


    public renderEdit(onEdit: (newRule: Rule) => void, keyWidth: string, textFieldWidth: string, user_columns:string[], logFile: LogFile) {

        const editStateName = (state_index: number, value: string) => {
            const states = [...this.ruleStates];
            const previous_name = states[state_index].name
            for (let i=0; i<states.length; i++){
                for (let j=0; j<states[i].transitions.length; j++){
                    if (states[i].transitions[j].destination === previous_name)
                        states[i].transitions[j].destination = value
                }
            }
            states[state_index] = {...states[state_index], ['name']: value};
            onEdit(this.setStates(states, this.initialStateIndex));
        };

        const stateRows = this.ruleStates.map((r, i) => {
            return [
                <VSCodeTextField initialValue={r.name}  onInput={(e) => editStateName(i, e.target.value)}/>,
            ]
        })

        const onAddState = () => {
            let new_name;
            let existing_states = this.ruleStates.map((n, i) => n.name);
            for (let i = 1; i < this.ruleStates.length+2; i++){
                new_name = 'State ' + i.toString()
                if (existing_states.indexOf(new_name) == -1) break;
            }
            onEdit(this.setStates([...this.ruleStates, {name: new_name, transitions: [{destination:new_name, conditions: []}]}], this.initialStateIndex));
        }

        const onSetInitialState = (index: number) => {
            onEdit(this.setInitialState(index));
        }

        const onDeleteState = (index: number) => {
            const states = [...this.ruleStates];
            const state_name = states[index].name
            for (let i=0; i<states.length; i++){
                states[i].transitions = states[i].transitions.filter((r, i) => r.destination != state_name);
            }
            if (index === this.initialStateIndex) onEdit(this.setStates(states.filter((r, i) => index !== i), 0));
            else if (index < this.initialStateIndex) onEdit(this.setStates(states.filter((r, i) => index !== i), this.initialStateIndex-1));
            else onEdit(this.setStates(states.filter((r, i) => index !== i), this.initialStateIndex));
        }


        const all_columns = ['', ...logFile.contentHeaders, ...user_columns];

        let transitionRows: any[][] = [];
        if (this.ruleStates.length > 0) {
            if (this.ruleStates[this.originIndex].transitions[this.destinationIndex].conditions.length === 0) transitionRows.push([]);
            for (let t_i = 0; t_i < this.ruleStates[this.originIndex].transitions[this.destinationIndex].conditions.length; t_i++) {
                const condition_set = this.ruleStates[this.originIndex].transitions[this.destinationIndex].conditions[t_i];
                transitionRows.push(condition_set.map((r, c_i) => {
                        return [
                            <VSCodeDropdown style={{width: '100%', marginBottom: '2px'}} value={r.Column} onChange={(e) => editTransition(t_i, c_i, 'Column', e.target.value)}>
                                {all_columns.map((o, c_i) => <VSCodeOption key={c_i} value={o}>{o}</VSCodeOption>)}
                            </VSCodeDropdown>,
                            <VSCodeDropdown  style={{width: '100%'}} initialValue={r.Operation}  onChange={(e) => editTransition(t_i, c_i, 'Operation', e.target.value)}>
                                <VSCodeOption key='0' value='contains'>contains</VSCodeOption>
                                <VSCodeOption key='1' value='equals'>equals</VSCodeOption>
                                <VSCodeOption key='2' value='startsWith'>startsWith</VSCodeOption>
                                <VSCodeOption key='3' value='endsWith'>endsWith</VSCodeOption>
                            </VSCodeDropdown>,
                            <VSCodeTextField  style={{width: '100%'}} initialValue={r.Text}  onInput={(e) => editTransition(t_i, c_i, 'Text', e.target.value)}/>,
                        ];
                    }));
                }
        }

        const onAddCondition = (transitionIndex: number) => {
            const states = [...this.ruleStates];
            if (states[this.originIndex].transitions[this.destinationIndex].conditions.length === 0)
                states[this.originIndex].transitions[this.destinationIndex].conditions[transitionIndex] = [{Column: '', Operation: 'contains', Text: ''}];
            else 
                states[this.originIndex].transitions[this.destinationIndex].conditions[transitionIndex].push({Column: '', Operation: 'contains', Text: ''});
            onEdit(this.setStates(states, this.initialStateIndex));
        }

        const editTransition = (transitionIndex: number, conditionIndex: number, field: 'Column' | 'Operation' | 'Text', value: string) => {
            const existing_conditions = [...this.ruleStates[this.originIndex].transitions[this.destinationIndex].conditions];
            existing_conditions[transitionIndex][conditionIndex] = {...existing_conditions[transitionIndex][conditionIndex], [field]: value};
            this.ruleStates[this.originIndex].transitions[this.destinationIndex].conditions = existing_conditions
            onEdit(this.setStates(this.ruleStates, this.initialStateIndex));
        }

        const onDeleteCondition = (transitionIndex: number, conditionIndex: number) => {
            const updated_conditions = this.ruleStates[this.originIndex].transitions[this.destinationIndex].conditions[transitionIndex].filter((r, i) => conditionIndex !== i);
            this.ruleStates[this.originIndex].transitions[this.destinationIndex].conditions[transitionIndex] = updated_conditions;
            onEdit(this.setStates(this.ruleStates, this.initialStateIndex));
        }

        const onAddTransition = () => {
            const states = [...this.ruleStates];
            states[this.originIndex].transitions[this.destinationIndex].conditions.push([])
            onEdit(this.setStates(states, this.initialStateIndex));
        }

        const onDeleteTransition = (transitionIndex: number) => {
            const updated_conditions = this.ruleStates[this.originIndex].transitions[this.destinationIndex].conditions.filter((r, i) => transitionIndex !== i);
            this.ruleStates[this.originIndex].transitions[this.destinationIndex].conditions = updated_conditions;
            onEdit(this.setStates(this.ruleStates, this.initialStateIndex));
        }

        const onOriginChange = (origin_name: string) => {
            const dest_name = this.ruleStates[this.originIndex].transitions[this.destinationIndex].destination

            const new_origin = this.ruleStates.findIndex(x => x.name === origin_name)
            const new_dest = this.ruleStates[new_origin].transitions.findIndex(x => x.destination === dest_name)

            if (new_dest > -1) onEdit(this.setTransition(new_origin, new_dest));
            else {
                this.ruleStates[new_origin].transitions.push({destination: dest_name, conditions: []})
                onEdit(this.setTransition(new_origin, this.ruleStates[new_origin].transitions.length-1));
            }
        }

        const onDestinationChange = (dest_name: string) => {
            const new_dest = this.ruleStates[this.originIndex].transitions.findIndex(x => x.destination === dest_name)
            if (new_dest > -1) onEdit(this.setTransition(this.originIndex, new_dest));
            else {
                this.ruleStates[this.originIndex].transitions.push({destination: dest_name, conditions: []})
                onEdit(this.setTransition(this.originIndex, this.ruleStates[this.originIndex].transitions.length-1));
            }
        }

        const stateDropdownRows = [
            [
                ('From:'),
                <VSCodeDropdown style={{marginLeft: '20px'}} onChange={(e) => onOriginChange(e.target.value)}>
                    {this.ruleStates.map((state, index) =>
                        <VSCodeOption value={state.name} key={index}>{state.name}</VSCodeOption>)}
                </VSCodeDropdown>
            ],
            [
                ('To:'),
                <VSCodeDropdown style={{marginLeft: '20px'}} onChange={(e) => onDestinationChange(e.target.value)}>
                    {this.ruleStates.map((state, index) =>
                        <VSCodeOption value={state.name} key={index}>{state.name}</VSCodeOption>)}
                </VSCodeDropdown>
            ],
        ];



        return (
            <div style={{height: "100%", width:"100%", display: "flex"}}>
                <VSCodePanels aria-label="Logic-Panels">
                    <VSCodePanelTab id="tab-1">States</VSCodePanelTab>
                    <VSCodePanelTab id="tab-2">Transitions</VSCodePanelTab>
                    <VSCodePanelView id="view-1">
                    <StateTable
                        columns={[{name: 'Name', width: ''}]}
                        rows={stateRows}
                        start_state={this.initialStateIndex}
                        noRowsText={'No states have been defined (click + to add)'}
                        onAddAction={onAddState}
                        onSetAction={onSetInitialState}
                        onDeleteAction={onDeleteState}
                    />
                    </VSCodePanelView>
                    <VSCodePanelView id="view-2">
                        <div style={{marginTop: '20px', marginRight: '50px'}}>
                            <Table
                                hideHeader={true}
                                rows={stateDropdownRows}
                                columns={[{width: '70px'}, {width: ''}]}
                            />
                        </div>

                        <div style={{width: '100%', float: 'right', margin: '1%'}}>
                            <TransitionTable
                                columns={[ {width: '30px'}, {name: 'Column', width: '150px'}, {name: 'Operation', width: '150px'}, {name: 'Text', width: ''}]}
                                rows={transitionRows}
                                noRowsText={'No conditions have been defined (click + to add)'}
                                onAddConditionAction={onAddCondition}
                                onDeleteConditionAction={onDeleteCondition}
                                onAddTransitionAction={onAddTransition}
                                onDeleteTransitionAction={onDeleteTransition}
                            />
                        </div>
                    </VSCodePanelView>
                </VSCodePanels>
            </div>
        );
    }

    public computeValues(logFile: LogFile): string[] {
        let current_state;
        if (this.ruleStates.length === 0) current_state = '';
        else current_state = this.ruleStates[this.initialStateIndex].name;
        const values: string[] = [];
        values[0] = current_state;
        for (let r = 1; r < logFile.amountOfRows(); r++) {
            let state_transitions = this.ruleStates.filter(st => st.name === current_state)[0].transitions
            state_transitions = state_transitions.filter(tr => tr.conditions.length > 0)
            for (const transition of state_transitions) {
                let transition_found: boolean = false;
                for (const condition_set of transition.conditions) {
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
                    }
                    if (all_conditions_satisfied === true) {
                        current_state = transition.destination;
                        transition_found = true;
                        break;
                    }
                }
                if (transition_found === true) break;
            }
            values[r] = current_state;
        }
        return values;
    }
}