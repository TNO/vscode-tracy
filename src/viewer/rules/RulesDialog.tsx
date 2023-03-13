import React from 'react';
import Rule from './Rule';
import { VSCodeButton, VSCodeDivider, VSCodeDropdown, VSCodeOption, VSCodeTextField } from '@vscode/webview-ui-toolkit/react';
import StateBasedRule from './StateBasedRule';
import Table from './Table';

interface Props {
    onClose: (rules: Rule[]) => void;
    initialRules: Rule[];
}

interface State {
    selectedRule: undefined | number;
    rules: Rule[];
}

const BACKDROP_STYLE: React.CSSProperties = {
    height: '100vh', width: '100vw', backgroundColor: '#00000030', position: 'absolute', display: 'flex', 
    justifyContent: 'center', alignItems: 'center',
}

const DIALOG_STYLE: React.CSSProperties = {height: '95%', width: '95%', padding: '10px', display: 'flex', flexDirection: 'column'};

export default class RulesDialog extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {selectedRule: undefined, rules: props.initialRules}
    }

    renderManage() {
        const onAddAction = () => {
            const newRule = new StateBasedRule(`Rule${this.state.rules.length + 1}`, '', '', []);
            this.setState({rules: [...this.state.rules, newRule], selectedRule: this.state.rules.length});
        }

        const onDeleteAction = (index: number) => {
            if (this.state.selectedRule === index) this.setState({selectedRule: undefined});
            this.setState({rules: this.state.rules.filter((r, i) => index !== i)});
        }

        return (
            <div style={{marginTop: '10px'}}>
                <Table
                    title='Manage rules'
                    columns={[{name: 'Column', width: '15%'}, {name: 'Type', width: '15%'}, {name: 'Description', width: ''}]}
                    rows={this.state.rules.map((rule) => [rule.column, rule.friendlyType, rule.description])} 
                    noRowsText={'No rules defined yet (press + to add)'}
                    onAddAction={onAddAction}
                    onEditAction={(selectedRule) => this.setState({selectedRule})}
                    onDeleteAction={onDeleteAction}
                    highlightRow={this.state.selectedRule}
                />
            </div>
        )
    }

    updateRule(rule: Rule, index: number) {
        const rules = [...this.state.rules];
        rules[index] = rule;
        this.setState({rules});
    }

    renderEdit() {
        if (this.state.selectedRule === undefined) return;
        const rule = this.state.rules[this.state.selectedRule];
        const ruleIndex = this.state.selectedRule;
        const defaultRuleColumn = `Rule${ruleIndex + 1}`;
        const typeOptions = [StateBasedRule];
        const keyWidth = '100px';
        const textFieldWidth = '250px';
        const rows = [
            [
                ('Column'),
                <VSCodeTextField 
                    style={{width: textFieldWidth}}
                    initialValue={rule.column} 
                    onInput={(e) => this.updateRule(rule.setColumn(e.target.value || defaultRuleColumn), ruleIndex)}/>
            ],
            [
                ('Type'),
                <VSCodeDropdown style={{width: textFieldWidth, marginBottom: '2px'}} value={typeOptions.findIndex(o => rule instanceof o).toString()} onChange={() => 'TODO'}>
                    {typeOptions.map((o, i) => <VSCodeOption key={i} value={i.toString()}>{o.friendlyType}</VSCodeOption>)}
                </VSCodeDropdown>
            ],
            [
                ('Description'),
                <VSCodeTextField 
                    style={{width: '250px'}}
                    initialValue={rule.description} 
                    onInput={(e) => this.updateRule(rule.setDescription(e.target.value), ruleIndex)}/>
            ],
        ];

        return (
            <div>
                <Table
                    title='Edit rule'
                    hideHeader={true}
                    rows={rows}
                    columns={[{width: '100px'}, {width: ''}]}
                />
                {rule.renderEdit((newRule) => this.updateRule(newRule, ruleIndex), keyWidth, textFieldWidth)}
            </div>
        )
    }

    render() {
        return (
            <div style={BACKDROP_STYLE}>
                <div className='dialog' style={DIALOG_STYLE}>
                    <div style={{display: 'flex', justifyContent: 'space-between', flexDirection: 'row', alignItems: 'top'}}>
                        <div className='title-big'>Rules</div>
                        <VSCodeButton appearance='icon' onClick={() => this.props.onClose(this.state.rules)}>
                            <i className='codicon codicon-close'/>
                        </VSCodeButton>
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', flex: 1}}>
                        {this.renderManage()}
                        <VSCodeDivider style={{marginTop: '20px', marginBottom: '20px'}}/>
                        {this.renderEdit()}
                    </div>
                </div>
            </div>
        );
    }
}