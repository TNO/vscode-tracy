import React from 'react';
import LogFile from '../LogFile';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
interface Props {
    logFile: LogFile;
    onClose: (selectedCol: boolean[]) => void;
}

interface State {
    showDialog: boolean;
    selectedCol: boolean[];
}

const BACKDROP_STYLE: React.CSSProperties = {
    width: '100vw', backgroundColor: '#00000030', position: 'absolute', padding: '10px'
}

const DIALOG_STYLE: React.CSSProperties = {height: '90', width: '70%', padding: '10px', display: 'flex', flexDirection: 'row', alignItems: 'center', overflow: 'auto'};

export default class SelectColDialog extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {showDialog: false, selectedCol: this.props.logFile.selectedColumns};
    }

    // isSelected(index: number){
    //     return this.props.logFile.selectedColumns[index];
    // }

    handleCheckbox = (e, index) => {
        const cols = [...this.state.selectedCol];
        if (e.target.checked) {
            cols[index] = true;
            this.setState({selectedCol: cols});
        } else {
            cols[index] = false;
            this.setState({selectedCol: cols});
        }
    }

    renderCheckbox(name: string, index: number) {
        const innerStyle: React.CSSProperties = {
            display: 'flex', height: '20px', alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
            paddingLeft: '2px'
        };
        return (
            <div key={index}>
                <div style={innerStyle}>
                    <input type="checkbox" checked={this.state.selectedCol[index]} onChange={(e)=>this.handleCheckbox(e, index)} key={index}/>{name}
                </div>
            </div>
        );
    }

    onDialogClick(is_close: boolean) {
        
        this.setState({showDialog: false}, () => {
            if (is_close === true) this.props.onClose(this.state.selectedCol);
        });
    }

    render() {
        return (
            <div style={BACKDROP_STYLE}>
                <div className='dialog' style={DIALOG_STYLE}>
                    {this.props.logFile.headers.map((h, i) => this.renderCheckbox(h.name, i))}
                    <VSCodeButton appearance='icon' onClick={() => this.onDialogClick(true)}>
                        <i className='codicon codicon-close'/>
                    </VSCodeButton>
                </div>
            </div>
        );
    }
}