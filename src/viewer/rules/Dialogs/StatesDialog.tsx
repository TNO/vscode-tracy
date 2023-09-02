import React from 'react';
import Rule from '../Rule';
import LogFile from '../../LogFile';
import FlagRule from '../FlagRule';
import StateBasedRule from '../StateBasedRule';
import Table from '../Tables/Table';
import { VSCodeButton, VSCodeTextField, VSCodeDropdown, VSCodeOption } from '@vscode/webview-ui-toolkit/react';


interface Props {
    onReturn: (rules: Rule[]) => void;
    onClose: (rules: Rule[]) => void;
    initialRules: Rule[];
    logFile: LogFile;
}

interface State {
    showEdit: boolean;
    rules: Rule[];
    selectedRule: number;
}

const BACKDROP_STYLE: React.CSSProperties = {
    height: '100vh', width: '100vw', backgroundColor: '#00000030', position: 'absolute', display: 'flex', 
    justifyContent: 'center', alignItems: 'center',
}

const DIALOG_STYLE: React.CSSProperties = {height: '95%', width: '95%', padding: '10px', display: 'flex', flexDirection: 'column', overflow: 'auto'};

export default class StatesDialog extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {showEdit: false, selectedRule: -1, rules: props.initialRules}
    }

    updateRule(rule: Rule, index: number) {
        const rules = [...this.state.rules];
        if (rules[index].column != rule.column) {
            for (let i = 0; i < rules.length; i++){
                if (rules[i].ruleType === 'Flag rule') {
                    let updated_rule = rules[i] as FlagRule;
                    let updated_flags = updated_rule.flags;
                    for (let j = 0; j < updated_flags.length; j++)
                        for (let k = 0; k < updated_flags[j].conditions.length; k++)
                            for (let l = 0; l < updated_flags[j].conditions[k].length; l++)
                                if (updated_flags[j].conditions[k][l].Column === rules[index].column)
                                    updated_flags[j].conditions[k][l].Column = rule.column;
                    updated_rule.setFlags(updated_flags);
                    rules[i] = updated_rule;
                }
                else if (rules[i].ruleType === 'State based rule') {
                    let updated_rule = rules[i] as StateBasedRule;
                    let updated_states = updated_rule.ruleStates;
                    for (let j = 0; j < updated_states.length; j++) {
                        for (let k = 0; k < updated_states[j].transitions.length; k++) {
                            for (let l = 0; l < updated_states[j].transitions[k].conditions.length; l++) {
                                for (let m = 0; m < updated_states[j].transitions[k].conditions[l].length; m++) {
                                    if (updated_states[j].transitions[k].conditions[l][m].Column === rules[index].column)
                                        updated_states[j].transitions[k].conditions[l][m].Column = rule.column;

                                }
                            }
                        }
                    }
                    updated_rule.setStates(updated_states, updated_rule.initialStateIndex);
                    rules[i] = updated_rule;
                }
            }
        }
        rules[index] = rule;
        this.setState({rules});
    }

    onDialogClick(is_close: boolean) {
        const ruleIndex = this.state.selectedRule;
        if (ruleIndex !== -1) {
            const rule = this.state.rules[ruleIndex].reset();
            this.updateRule(rule, ruleIndex);
        }
        this.setState({showEdit: false}, () => {
            if (is_close === true) this.props.onClose(this.state.rules);
            else this.props.onReturn(this.state.rules);
        });
    }

    renderManage() {
        const onAddAction = () => {
            const newRule = new StateBasedRule(`StateRule${this.state.rules.filter(r => r.ruleType === 'State based rule').length + 1}`, '', 0, 0, 0, []);
            this.setState({rules: [...this.state.rules, newRule], selectedRule: this.state.rules.length, showEdit: true});
        }

        const onEditAction = (table_index: number) => {
            const index = this.state.rules.findIndex(x => x === this.state.rules.filter(r => r.ruleType === 'State based rule')[table_index]);
            this.setState({showEdit: true, selectedRule: index});
        }

        const onDeleteAction = (table_index: number) => {
            const index = this.state.rules.findIndex(x => x === this.state.rules.filter(r => r.ruleType === 'State based rule')[table_index]);
            if (this.state.selectedRule === index) this.setState({selectedRule: -1});
            this.setState({rules: this.state.rules.filter((r, i) => i !== index)});
        }

        return (
            <div style={{marginTop: '10px'}}>
                <Table
                    // title='Manage rules'
                    columns={[{name: 'Name', width: '150px'}, {name: 'Type', width: '150px'}, {name: 'Description', width: ''}]}
                    rows={this.state.rules.filter(r => r.ruleType === 'State based rule').map((rule) => [rule.column, rule.ruleType, rule.description])} 
                    noRowsText={'No rules have been defined (click + to add)'}
                    onAddAction={onAddAction}
                    onEditAction={onEditAction}
                    onDeleteAction={onDeleteAction}
                />
            </div>
        )
    }


    renderEdit() {
        if (this.state.selectedRule === -1) return;
        const ruleIndex = this.state.selectedRule;
        const rule = this.state.rules[ruleIndex];
        const user_columns = this.state.rules.map((r, i) => r.column).filter(name => name != rule.column)
        const defaultRuleColumn = `StateRule${ruleIndex + 1}`;
        const typeOptions = [StateBasedRule];
        const keyWidth = '100px';
        const textFieldWidth = '250px';
        const rows = [
            [
                ('Name'),
                <VSCodeTextField 
                    style={{width: textFieldWidth, marginBottom: '2px'}}
                    value={rule.column} 
                    onInput={(e) => this.updateRule(rule.setColumn(e.target.value || defaultRuleColumn), ruleIndex)}/>
            ],
            [
                ('Description'),
                <VSCodeTextField 
                    style={{width: textFieldWidth, marginBottom: '2px'}}
                    value={rule.description} 
                    onInput={(e) => this.updateRule(rule.setDescription(e.target.value), ruleIndex)}/>
            ]
        ];

        return (
            <div style={{marginTop: '25px'}}>
                <Table
                    // title='Edit rule'
                    hideHeader={true}
                    rows={rows}
                    columns={[{width: '100px'}, {width: ''}]}
                />
                {rule.renderEdit((newRule) => this.updateRule(newRule, ruleIndex), keyWidth, textFieldWidth, user_columns, this.props.logFile)}
            </div>
        )
    }

    render() {
        return (
            <div style={BACKDROP_STYLE}>
                <div className='dialog' style={DIALOG_STYLE}>
                    <div style={{display: 'flex', justifyContent: 'space-between', flexDirection: 'row', alignItems: 'top'}}>
                        {   !this.state.showEdit &&
                            <div className='title-big'>State-Based Annotation Columns</div>
                        }
                        {   this.state.showEdit &&
                            <div className='title-big'>Edit State-Based Annotation Column</div>
                        }
                        {   this.state.showEdit &&
                            <VSCodeButton style={{marginLeft: 'auto'}} appearance='icon' onClick={() => this.onDialogClick(false)}>
                                <i className='codicon codicon-arrow-left'/>
                            </VSCodeButton>
                        }
                            <VSCodeButton appearance='icon' onClick={() => this.onDialogClick(true)}>
                                <i className='codicon codicon-close'/>
                            </VSCodeButton>
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', flex: 1}}>
                        {!this.state.showEdit && this.renderManage()}
                        {this.state.showEdit && this.renderEdit() }
                    </div>
                </div>
            </div>
        );
    }
}