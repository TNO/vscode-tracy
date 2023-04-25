import React from 'react';
import Rule from './Rule';
import LogFile from '../LogFile';
import FlagRule from './FlagRule';
import Table from './Tables/Table';
import { VSCodeButton, VSCodeTextField, VSCodeDropdown, VSCodeOption } from '@vscode/webview-ui-toolkit/react';


interface Props {
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

export default class FlagsDialog extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {showEdit: false, selectedRule: -1, rules: props.initialRules}
    }

    updateRule(rule: Rule, index: number) {
        const rules = [...this.state.rules];
        rules[index] = rule;
        this.setState({rules});
    }

    renderManage() {
        const onAddAction = () => {
            const newRule = new FlagRule(`Flag${this.state.rules.filter(r => r.friendlyType === 'Flag rule').length + 1}`, '', []);
            this.setState({rules: [...this.state.rules, newRule], selectedRule: this.state.rules.length, showEdit: true});
        }

        const onEditAction = (table_index: number) => {
            const index = this.state.rules.findIndex(x => x === this.state.rules.filter(r => r.friendlyType === 'Flag rule')[table_index]);
            this.setState({showEdit: true, selectedRule: index});
        }

        const onDeleteAction = (table_index: number) => {
            const index = this.state.rules.findIndex(x => x === this.state.rules.filter(r => r.friendlyType === 'Flag rule')[table_index]);
            if (this.state.selectedRule === index) this.setState({selectedRule: -1});
            this.setState({rules: this.state.rules.filter((r, i) => i !== index)});
        }

        return (
            <div style={{marginTop: '10px'}}>
                <Table
                    // title='Manage flags'
                    columns={[{name: 'Name', width: '150px'}, {name: 'Type', width: '150px'}, {name: 'Description', width: ''}]}
                    rows={this.state.rules.filter(r => r.friendlyType === 'Flag rule').map((rule) => [rule.column, rule.friendlyType, rule.description])} 
                    noRowsText={'No flags have been defined (click + to add)'}
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
        const user_columns = this.state.rules.map((r, i) => r.column)
        const defaultRuleColumn = `Flag${ruleIndex + 1}`;
        const typeOptions = [FlagRule];
        const keyWidth = '100px';
        const textFieldWidth = '250px';
        const rows = [
            [
                ('Name'),
                <VSCodeTextField 
                    style={{width: textFieldWidth}}
                    initialValue={rule.column} 
                    onInput={(e) => this.updateRule(rule.setColumn(e.target.value || defaultRuleColumn), ruleIndex)}/>
            ],
            [
                ('Description'),
                <VSCodeTextField 
                    style={{width: '250px'}}
                    initialValue={rule.description} 
                    onInput={(e) => this.updateRule(rule.setDescription(e.target.value), ruleIndex)}/>
            ],
            [
                ('Type'),
                <VSCodeDropdown disabled style={{width: textFieldWidth, marginBottom: '2px'}} value={typeOptions.findIndex(o => rule instanceof o).toString()} onChange={() => 'TODO'}>
                    {typeOptions.map((o, i) => <VSCodeOption key={i} value={i.toString()}>{o.friendlyType}</VSCodeOption>)}
                </VSCodeDropdown>
            ],
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
                            <div className='title-big'>Annotation Columns</div>
                        }
                        {   this.state.showEdit &&
                            <div className='title-big'>Edit Flag Annotation Column</div>
                        }
                        {   this.state.showEdit &&
                            <VSCodeButton style={{marginLeft: 'auto'}} appearance='icon' onClick={() => this.setState({showEdit: false})}>
                                <i className='codicon codicon-arrow-left'/>
                            </VSCodeButton>
                        }
                            <VSCodeButton appearance='icon' onClick={() => this.props.onClose(this.state.rules)}>
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