import React from 'react';
import LogView from './log/LogView';
import MinimapView from './minimap/MinimapView';
import LogFile from './LogFile';
import { LogViewState } from './types';
import { LOG_HEADER_HEIGHT, MINIMAP_COLUMN_WIDTH, BORDER } from './constants';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import RulesDialog from './rules/RulesDialog';
import FlagsDialog from './rules/FlagsDialog';
import Rule from './rules/Rule';
import StateBasedRule from './rules/StateBasedRule';
import MinimapHeader from './minimap/MinimapHeader';
import { display } from '@microsoft/fast-foundation';

interface Props {
}
interface State {
    logFile: LogFile;
    logViewState: LogViewState | undefined;
    showRulesDialog: boolean;
    showMinimapHeader: boolean;
    showFlagsDialog: boolean;
    rules: Rule[];
}

const COLUMN_0_HEADER_STYLE = {
    height: LOG_HEADER_HEIGHT, display: 'flex', justifyContent: 'center', alignItems: 'center', 
    borderLeft: BORDER, borderBottom: BORDER
};

const COLUMN_2_HEADER_STYLE = {
    height: '100%', display: 'flex', borderLeft: BORDER
}

export default class App extends React.Component<Props, State> {
    // @ts-ignore
    vscode = acquireVsCodeApi();

    constructor(props: Props) {
        super(props);
        this.state = {logFile: LogFile.create([], []), logViewState: undefined, 
            showRulesDialog: false, showFlagsDialog: false, showMinimapHeader: true, rules: []};

        this.onMessage = this.onMessage.bind(this);
        window.addEventListener('message', this.onMessage);
        this.vscode.postMessage({type: 'update'});
    }

    onMessage(event: MessageEvent) {
        const message = event.data;
        if (message.type === 'update') {
            const rules = message.rules.map((r) => Rule.fromJSON(r)).filter((r) => r);
            const logFile = LogFile.create(JSON.parse(message.text), rules);
            this.setState({logFile, rules});
        }
    }

    handleRulesDialogClose(newRules: Rule[]) {
        this.vscode.postMessage({type: 'save_rules', rules: newRules.map((r) => r.toJSON())});
        this.setState({rules: newRules, logFile: this.state.logFile.setRules(newRules), showRulesDialog: false});
    }

    handleFlagsDialogClose(newRules: Rule[]) {
        this.vscode.postMessage({type: 'save_rules', rules: newRules.map((r) => r.toJSON())});
        this.setState({rules: newRules, logFile: this.state.logFile.setRules(newRules), showFlagsDialog: false});
    }

    render() {
        const minimapWidth = this.state.logFile.amountOfColorColumns() * MINIMAP_COLUMN_WIDTH;
        const minimapHeight = this.state.showMinimapHeader ? '12%' : '5%' ;
        const logviewHeight = this.state.showMinimapHeader ? '88%' : '95%' ;
        return (
            <div style={{display:'flex', flexDirection: 'column', height: '100%'}}>
                <div style={{display: 'flex', flexDirection: 'row', height: minimapHeight}}>
                    {!this.state.showMinimapHeader &&
                        <div style={{flex: 1, display: 'flex', justifyContent: 'end'}}>
                            <VSCodeButton appearance='icon' onClick={() => this.setState({showMinimapHeader: true})}>
                                <i className='codicon codicon-arrow-down' />
                            </VSCodeButton>
                        </div>
                    }
                    {!this.state.showMinimapHeader && 
                        <div className='header-background' style={{width: minimapWidth}}></div>
                    }
                    {this.state.showMinimapHeader &&
                        <div style={{flex: 1, display: 'flex', justifyContent: 'end'}}>
                            <VSCodeButton appearance='icon' onClick={() => this.setState({showMinimapHeader: false})}>
                                <i className='codicon codicon-arrow-up' />
                            </VSCodeButton>
                        </div>
                    }
                    {this.state.showMinimapHeader && 
                        <div className='header-background' style={{width: minimapWidth, ...COLUMN_2_HEADER_STYLE}}>
                            <MinimapHeader logFile={this.state.logFile}/>
                        </div>
                    }
                </div>
                <div style={{display: 'flex', flexDirection: 'row', height: logviewHeight}}>
                    <div style={{flex: 1, display: 'flex'}}>
                        <LogView
                            logFile={this.state.logFile} 
                            onLogViewStateChanged={(logViewState) => this.setState({logViewState})}
                        />
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', width: minimapWidth}}>
                        <div className='header-background' style={COLUMN_0_HEADER_STYLE}>
                            <VSCodeButton appearance='icon' onClick={() => this.setState({showFlagsDialog: true})}>
                                <i className="codicon codicon-tag"/>
                            </VSCodeButton>
                            <VSCodeButton appearance='icon' onClick={() => this.setState({showRulesDialog: true})}>
                                <i className="codicon codicon-settings-gear"/>
                            </VSCodeButton>
                        </div>
                        {this.state.logViewState && 
                            <MinimapView 
                                logFile={this.state.logFile} 
                                logViewState={this.state.logViewState}/>
                        }
                    </div>
                    { this.state.showRulesDialog && 
                        <RulesDialog 
                            logFile={this.state.logFile}
                            initialRules={this.state.rules} 
                            onClose={(newRules) => this.handleRulesDialogClose(newRules)}
                        /> 
                    }
                </div>
                { this.state.showRulesDialog &&
                    <RulesDialog
                        logFile={this.state.logFile}
                        initialRules={this.state.rules}
                        onClose={(newRules) => this.handleRulesDialogClose(newRules)}
                    /> 
                }
                { this.state.showFlagsDialog &&
                    <FlagsDialog
                        logFile={this.state.logFile}
                        initialRules={this.state.rules}
                        onClose={(newRules) => this.handleFlagsDialogClose(newRules)}
                    /> 
                }
            </div>
        );
    }
}
