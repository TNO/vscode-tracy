import React from 'react';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
interface Props {
    onClose: () => void
}

interface State {
    showDialog: boolean;
}

const BACKDROP_STYLE: React.CSSProperties = {
    position: 'fixed',
    bottom: '0',
    height: '20vh', 
    width: '100vw',
    backgroundColor: '#00000030',
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center',
    overflow: 'auto', 
    minHeight: '20vh'
}

const DIALOG_STYLE: React.CSSProperties = {
    height: '95%', 
    width: '95%', 
    padding: '10px', 
    display: 'flex', 
    flexDirection: 'column', 

}

export default class StructureDialog extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.setState({showDialog: false});
    }

    onDialogClick(is_close: boolean) { 
        this.setState({showDialog: false},  
            () => {if (is_close === true) this.props.onClose();})
    }


    render() {
        return (
                <div style={BACKDROP_STYLE}>
                        <div className = 'dialog'style={DIALOG_STYLE}>
                            <VSCodeButton appearance='icon' onClick={() => this.onDialogClick(true)}>
                                <i className='codicon codicon-close'/>
                            </VSCodeButton>
                        </div>
                </div>
        );
    }
}