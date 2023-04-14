import React from 'react';
import { LOG_HEADER_HEIGHT, MINIMAP_COLUMN_WIDTH, BORDER, BORDER_SIZE } from '../constants';
import LogFile from '../LogFile';
interface Props {
    logFile: LogFile;
}

export default class MinimapHeader extends React.Component<Props> {
    constructor(props: Props) {
        super(props);
    }

    renderHeader(name: string, index: number) {
        const style: React.CSSProperties = {
            whiteSpace: 'nowrap',
            width: MINIMAP_COLUMN_WIDTH, display: 'inline-block',
        };
        const innerStyle: React.CSSProperties = {
            display: 'flex', height: '100%', paddingLeft: '2px'
        };
        return (
            <div style={style} >
                <div style={innerStyle} className='rotate'>
                    {name}
                </div>
            </div>
        );
    }

    render() {
        return (
            <div style={{flex: 1, overflow: 'hidden', display: 'flex'}}>
                {this.props.logFile.headers.map((h, i) => this.renderHeader(h.name, i))}
            </div>
        );
    }
}