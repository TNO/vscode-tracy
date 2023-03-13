import React from 'react';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';

interface Props {
    title?: string;
    columns: {name?: string, width: string}[];
    rows: (JSX.Element | string)[][];
    hideHeader?: boolean
    noRowsText?: string;
    onAddAction?: () => void;
    highlightRow?: number | null;
    onDeleteAction?: (index: number) => void;
    onEditAction?: (index: number) => void;
}

const ACTIONS_WIDTH = '50px';

export default class Table extends React.Component<Props> {
    render() {
        return (
            <div style={{width: '100%'}}>
                {this.props.title && <div className='title-small'>{this.props.title}</div>}
                <table style={{width: '100%', borderSpacing: 0}}>
                    <tbody>
                    {!this.props.hideHeader &&
                        <tr>
                            {this.props.columns.map((c, i) => (
                                <th key={i} style={{textAlign: 'left', width: c.width, fontWeight: 200}}>{c.name ?? ''}</th>
                            ))}
                            {(this.props.onDeleteAction || this.props.onEditAction) && <th style={{textAlign: 'left', width: ACTIONS_WIDTH}}>Actions</th>}
                        </tr>
                    }
                    {this.props.rows.map((row, i) => {
                        return (
                            <tr key={i} className={i === this.props.highlightRow ? 'list-hover-background' : ''}>
                                {row.map((r, ii) => <td key={ii} width={this.props.columns[ii].width}>{r}</td>)}
                                {(this.props.onDeleteAction || this.props.onEditAction) && (
                                    <td width={ACTIONS_WIDTH}>
                                        <div style={{display: 'flex', justifyContent: (this.props.onDeleteAction && this.props.onEditAction) ? 'space-between' : 'center'}}>
                                            { this.props.onEditAction &&
                                                <VSCodeButton appearance='icon' onClick={() => this.props.onEditAction?.(i)}>
                                                    <i className='codicon codicon-pencil'/>
                                                </VSCodeButton>
                                            }
                                            { this.props.onDeleteAction &&
                                                <VSCodeButton appearance='icon' onClick={() => this.props.onDeleteAction?.(i)}>
                                                    <i className='codicon codicon-trash'/>
                                                </VSCodeButton>
                                            }
                                        </div>
                                    </td>
                                )}
                            </tr>
                        )
                    })}
                    {(this.props.onAddAction && this.props.noRowsText && this.props.rows.length === 0) && (
                        <tr>
                            <td colSpan={this.props.columns.length + 1} style={{textAlign: 'center'}}>
                                <i>{this.props.noRowsText}</i>
                            </td>
                        </tr>
                    )}
                    {this.props.onAddAction && (
                        <tr>
                            <td colSpan={this.props.columns.length + 1} style={{textAlign: 'right'}}>
                                <VSCodeButton appearance='icon' onClick={() => this.props.onAddAction?.()}>
                                    <i className='codicon codicon-plus'/>
                                </VSCodeButton>
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        );
    }
}