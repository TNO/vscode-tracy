import React from 'react';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';

interface Props {
    onClose: () => void;
}

interface State {
}

const BACKDROP_STYLE: React.CSSProperties = {
    height: '100vh', width: '100vw', backgroundColor: '#d3d3d3C0', position: 'absolute', display: 'flex', justifyContent: 'center', alignItems: 'center',
}

const DIALOG_STYLE: React.CSSProperties = {height: '95%', width: '95%', backgroundColor: 'white', paddingLeft: '10px', borderRadius: '5px'};

export default class RulesDialog extends React.Component<Props, State> {
    render() {
        return (
            <div style={BACKDROP_STYLE}>
                <div style={DIALOG_STYLE}>
                    <div style={{display: 'flex', justifyContent: 'space-between', flexDirection: 'row', paddingRight: '10px', alignItems: 'center'}}>
                        <h3>Manage rules</h3>
                        <VSCodeButton appearance='icon' onClick={() => this.props.onClose()}><i className="codicon codicon-close"></i></VSCodeButton>

                        
                    </div>
                </div>
            </div>
        );
    }
}