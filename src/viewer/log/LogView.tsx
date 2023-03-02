import React from 'react';
import { LOG_COLUMNS, LOG_HEADER_HEIGHT, BORDER, BORDER_SIZE } from '../constants';
import { LogFile, LogViewState } from '../types';

interface Props {
    logFile: LogFile;
    onLogViewStateChanged: (value: LogViewState) => void;
}
interface State {
    state: LogViewState | undefined;
}

const ROW_HEIGHT = 28;
const VIEWPORT_STYLE: React.CSSProperties = {position: 'relative', flex: 1, overflow: 'scroll'};
const CONTAINER_WIDTH = LOG_COLUMNS.reduce((partialSum: number, a) => partialSum + a.width, 0) + 
    ((LOG_COLUMNS.length - 1) * BORDER_SIZE);
const HEADER_STYLE: React.CSSProperties = {
    width: '100%', height: LOG_HEADER_HEIGHT, position: 'relative', overflow: 'hidden', 
    borderBottom: BORDER,
};

export default class LogView extends React.Component<Props, State> {
    viewport: React.RefObject<HTMLDivElement>;

    constructor(props: Props) {
        super(props);
        this.viewport = React.createRef();
        this.updateState = this.updateState.bind(this);
        this.state = {state: undefined};
    }

    componentDidMount(): void {
        window.addEventListener('resize', this.updateState);
        this.updateState();
    }

    renderColumn(value: string, index: number, isHeader: boolean) {
        const height = isHeader ? LOG_HEADER_HEIGHT : ROW_HEIGHT;
        const style: React.CSSProperties = {
            overflow: 'hidden', whiteSpace: 'nowrap', display: 'inline-block', height, 
            width: LOG_COLUMNS[index].width, borderLeft: index !== 0 ? BORDER : '',
        };
        const innerStyle: React.CSSProperties = {
            display: 'flex', height, alignItems: 'center', justifyContent: isHeader ? 'center' : 'left', 
            paddingLeft: '2px'
        };
        return (
            <div style={style} key={index}>
                <div style={innerStyle}>
                    {value}
                </div>
            </div>
        );
    }

    renderRows() {
        // This method only renders the rows that are visible
        if (!this.state.state) return;
        const {startFloor, endCeil} = this.state.state;
        const result: any = [];
        for (let i = startFloor; i <= endCeil; i++) {
            const item = this.props.logFile[i];
            const style: React.CSSProperties = {
                position: 'absolute', height: ROW_HEIGHT, overflow: 'hidden', top: i * ROW_HEIGHT, borderBottom: BORDER
            };
            result.push(
                <div key={i} style={style}>
                    {Object.values(item).map((v, x) => this.renderColumn(v, x, false))}
                </div>
            );
        }
        return result;
    }

    updateState() {
        if (!this.viewport.current) return;
        const height = this.viewport.current.clientHeight;
        const scrollTop = this.viewport.current.scrollTop;
        const scrollLeft = this.viewport.current.scrollLeft;
        const maxVisibleItems = height / ROW_HEIGHT;
        const start = scrollTop / ROW_HEIGHT;
        const startFloor = Math.floor(start);
        const endCeil = Math.min(Math.ceil(start + maxVisibleItems) - 1, this.props.logFile.length - 1);
        const visibleItems = Math.min(this.props.logFile.length, maxVisibleItems);
        const state = {height, scrollLeft, scrollTop, startFloor, start, endCeil, visibleItems, rowHeight: ROW_HEIGHT};
        this.setState({state});
        this.props.onLogViewStateChanged(state);
    }

    renderHeader() {
        const style: React.CSSProperties = {
            width: CONTAINER_WIDTH, height: '100%', position: 'absolute',
            left: this.state.state ? this.state.state.scrollLeft * -1 : 0,
        };
        return (
            <div style={HEADER_STYLE} className="header-background">
                <div style={style}>
                    {LOG_COLUMNS.map((c, i) => this.renderColumn(c.name, i, true))}
                </div>
            </div>
        );
    }

    render() {
        const containerHeight = this.props.logFile.length * ROW_HEIGHT;
        return (
            <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                {this.renderHeader()}
                <div style={VIEWPORT_STYLE} ref={this.viewport} onScroll={this.updateState}>
                    <div style={{width: CONTAINER_WIDTH, height: containerHeight, position: 'absolute'}}>
                        {this.renderRows()}
                    </div>
                </div>
            </div>
        );
    }
}
