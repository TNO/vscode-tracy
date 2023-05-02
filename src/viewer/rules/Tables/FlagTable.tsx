import React from 'react';
import { VSCodeButton, VSCodeDivider } from '@vscode/webview-ui-toolkit/react';

interface Props {
    columns: {name?: string, width: string}[];
    rows: (JSX.Element | string)[][][];
    hideHeader?: boolean
    noRowsText?: string;
    highlightRow?: number | null;
    onAddSubconditionAction?: (condition_index: number) => void;
    onDeleteSubconditionAction?: (condition_index: number, sub_index: number) => void;
    onAddConditionAction?: () => void;
    onDeleteConditionAction?: (condition_index: number) => void;
}

const ACTIONS_WIDTH = '50px';

export default class FlagTable extends React.Component<Props> {
    render() {
        return (
            <div style={{width: '100%'}}>
                {
                    this.props.rows.map((condition, c_index) => (
                        <div key={c_index}>
                            <table style={{width: '100%', borderSpacing: 0, marginBottom: '50px'}}>
                            <tbody>
                                <tr>
                                    <td colSpan={this.props.columns.length + 1} style={{textAlign: 'center'}}>
                                        <div className='title-small'>Condition {c_index + 1}</div>
                                    </td>
                                </tr>


                                {!this.props.hideHeader &&
                                    <tr>
                                        {this.props.columns.map((c, i) => (
                                            <th key={i} style={{textAlign: 'left', width: c.width, fontWeight: 200}}>{c.name ?? ''}</th>
                                        ))}
                                        {(this.props.onDeleteSubconditionAction) && <th style={{textAlign: 'right', width: ACTIONS_WIDTH}}>Actions</th>}
                                    </tr>
                                }
                                {(condition.length > 0) && (condition.map((subcondition, s_index) => {
                                    return (
                                        <tr key={s_index} className={s_index === this.props.highlightRow ? 'list-hover-background' : ''}>
                                            {(s_index === 0) && (<td width={this.props.columns[0].width}></td>)}
                                            {(s_index > 0) && (<td width={this.props.columns[0].width}>and </td>)}
                                            {subcondition.map((r, ii) => <td key={ii} width={this.props.columns[ii].width}>{r}</td>)}
                                            {(this.props.onDeleteSubconditionAction) && (
                                                <td width={ACTIONS_WIDTH}>
                                                    <div style={{textAlign: 'right'}}>
                                                        { this.props.onDeleteSubconditionAction &&
                                                            <VSCodeButton appearance='icon' onClick={() => this.props.onDeleteSubconditionAction?.(c_index, s_index)}>
                                                                <i className='codicon codicon-trash'/>
                                                            </VSCodeButton>
                                                        }
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    )
                                }))}
                                {(this.props.onAddSubconditionAction && this.props.noRowsText && condition.length === 0) && (
                                    <tr>
                                        <td colSpan={this.props.columns.length + 1} style={{textAlign: 'center'}}>
                                            <i>{this.props.noRowsText}</i>
                                        </td>
                                    </tr>
                                )}
                                {(this.props.onAddSubconditionAction) && (
                                    <tr>
                                        <td colSpan={this.props.columns.length + 1} style={{textAlign: 'right'}}>
                                            <VSCodeButton appearance='icon' onClick={() => this.props.onAddSubconditionAction?.(c_index)}>
                                                <i className='codicon codicon-plus'/>
                                            </VSCodeButton>
                                        </td>
                                    </tr>
                                )}
                                {(this.props.onAddConditionAction) && (condition.length > 0) && (
                                    <tr>
                                        <td colSpan={this.props.columns.length + 1} style={{textAlign: 'center'}}>
                                            <VSCodeDivider style={{margin: '10px'}}/>
                                        </td>
                                    </tr>
                                )}
                                {(this.props.onAddConditionAction) && (this.props.rows.length == 1) && (condition.length > 0) && (
                                    <tr>
                                        <td colSpan={2} style={{textAlign: 'left', marginTop:'10px'}}>
                                            <VSCodeButton style={{border:'1px', borderColor:'white', borderStyle:'solid'}} appearance='icon' onClick={() => this.props.onDeleteConditionAction?.(c_index)}>
                                                Delete Condition
                                            </VSCodeButton>
                                        </td>
                                        <td colSpan={this.props.columns.length-1} style={{textAlign: 'right', marginTop:'10px'}}>
                                            <VSCodeButton style={{border:'1px', borderColor:'white', borderStyle:'solid'}} appearance='icon' onClick={() => this.props.onAddConditionAction?.()}>
                                                Add Condition
                                            </VSCodeButton>
                                        </td>
                                    </tr>
                                )}
                                {(this.props.onAddConditionAction) && (this.props.rows.length > 1) && (
                                    <tr>
                                        <td colSpan={2} style={{textAlign: 'left', marginTop:'10px'}}>
                                            <VSCodeButton style={{border:'1px', borderColor:'white', borderStyle:'solid'}} appearance='icon' onClick={() => this.props.onDeleteConditionAction?.(c_index)}>
                                                Delete Condition
                                            </VSCodeButton>
                                        </td>
                                        {(c_index === this.props.rows.length - 1) && (
                                        <td colSpan={this.props.columns.length-1} style={{textAlign: 'right', marginTop:'10px'}}>
                                            <VSCodeButton style={{border:'1px', borderColor:'white', borderStyle:'solid'}} appearance='icon' onClick={() => this.props.onAddConditionAction?.()}>
                                                Add Condition
                                            </VSCodeButton>
                                        </td>)}
                                    </tr>
                                )}
                            </tbody>
                            </table>
                        </div>
                    ))
                }
            </div>
        );
    }
}