import React from 'react';
import LogView from './log/LogView';
import MinimapView from './minimap/MinimapView';
import { LogFile, LogViewState } from './types';
import { LOG_HEADER_HEIGHT, MINIMAP_COLUMN_WIDTH, BORDER } from './constants';
import MinimapColors from './minimap/MinimapColors';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import RulesDialog from './rules/RulesDialog';
import Rule from './rules/Rule';
import StateBasedRule from './rules/StateBasedRule';

interface Props {
}
interface State {
    logFile: LogFile | undefined;
    minimapColors: MinimapColors | undefined;
    logViewState: LogViewState | undefined;
    showRulesDialog: boolean;
    rules: Rule[];
}

const COLUMN_2_HEADER_STYLE = {
    height: LOG_HEADER_HEIGHT, display: 'flex', justifyContent: 'center', alignItems: 'center', borderLeft: BORDER, borderBottom: BORDER
};

export default class App extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {logFile: undefined, logViewState: undefined, minimapColors: undefined, showRulesDialog: true, rules: [new StateBasedRule("FirstRule", '', '', [])]}; // TODO, make rules []

        window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'update') {
                const logFile = JSON.parse(message.text);
                const minimapColors = new MinimapColors(logFile);
                this.setState({logFile, minimapColors});
            }
        });

        // @ts-ignore
	    const vscode = acquireVsCodeApi();
        vscode.postMessage({type: 'update'});
    }

    render() {
        if (!this.state.logFile || !this.state.minimapColors) return;
        const minimapWidth = Object.keys(this.state.minimapColors.columnColors).length * MINIMAP_COLUMN_WIDTH;
        return (
            <div style={{display: 'flex', flexDirection: 'row', height: '100%'}}>
                <div style={{flex: 1, display: 'flex'}}>
                    <LogView 
                        logFile={this.state.logFile} 
                        onLogViewStateChanged={(logViewState) => this.setState({logViewState})}
                    />
                </div>
                <div style={{display: 'flex', flexDirection: 'column', width: minimapWidth}}>
                    <div className='header-background' style={COLUMN_2_HEADER_STYLE}>
                        <VSCodeButton appearance='icon' onClick={() => this.setState({showRulesDialog: true})}>
                            <i className="codicon codicon-settings-gear"/>
                        </VSCodeButton>
                    </div>
                    {this.state.logViewState && 
                        <MinimapView 
                            logFile={this.state.logFile} 
                            logColors={this.state.minimapColors} 
                            logViewState={this.state.logViewState}/>
                    }
                </div>
                { this.state.showRulesDialog && 
                    <RulesDialog 
                        rules={this.state.rules} 
                        onClose={() => this.setState({showRulesDialog: false})}
                        setRules={(rules) => this.setState({rules})}
                    /> 
                }
            </div>
        );
    }
}
