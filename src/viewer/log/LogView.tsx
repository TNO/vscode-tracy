import React from 'react';
import { LOG_HEADER_HEIGHT, BORDER, BORDER_SIZE } from '../constants';
import { LogViewState } from '../types';
import LogFile from '../LogFile';

interface Props {
    logFile: LogFile;
    onLogViewStateChanged: (value: LogViewState) => void;
}
interface State {
    state: LogViewState | undefined;
}

const ROW_HEIGHT = 28;

const VIEWPORT_STYLE: React.CSSProperties = {position: 'relative', flex: 1, overflow: 'scroll'};
const HEADER_STYLE: React.CSSProperties = {
    width: '100%', height: LOG_HEADER_HEIGHT, position: 'relative', overflow: 'hidden', 
    borderBottom: BORDER,
};
// TODO: determine column width automatically, not hardcoded
const DEFAULT_COLUMN_WIDTH = 100;
const COLUMN_WIDTH_LOOKUP = {
    timestamp: 180, 
    level: 50, 
    threadID: 80, 
    location: 200,
    message: 400,
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
    
    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any): void {
        if (prevProps.logFile !== this.props.logFile) {
            this.updateState();
        }
    }

    renderColumn(value: string, index: number, isHeader: boolean, width: number) {
        const height = isHeader ? LOG_HEADER_HEIGHT : ROW_HEIGHT;
        const style: React.CSSProperties = {
            overflow: 'hidden', whiteSpace: 'nowrap', display: 'inline-block', height, 
            width, borderLeft: index !== 0 ? BORDER : '',
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
        const {logFile} = this.props;
        const result: any = [];
        for (let r = startFloor; r <= endCeil; r++) {
            const style: React.CSSProperties = {
                position: 'absolute', height: ROW_HEIGHT, overflow: 'hidden', top: r * ROW_HEIGHT, borderBottom: BORDER
            };
            result.push(
                <div key={r} style={style}>
                    {logFile.headers.map((h, c) => this.renderColumn(logFile.rows[r][c], c, false, this.columnWidth(h.name)))}
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
        const endCeil = Math.min(Math.ceil(start + maxVisibleItems) - 1, this.props.logFile.amountOfRows() - 1);
        const visibleItems = Math.min(this.props.logFile.amountOfRows(), maxVisibleItems);
        const state = {height, scrollLeft, scrollTop, startFloor, start, endCeil, visibleItems, rowHeight: ROW_HEIGHT};
        this.setState({state});
        this.props.onLogViewStateChanged(state);
    }

    columnWidth(name: string) {
        return COLUMN_WIDTH_LOOKUP[name] ?? DEFAULT_COLUMN_WIDTH;
    }

    renderHeader(width: number) {
        const style: React.CSSProperties = {
            width, height: '100%', position: 'absolute',
            left: this.state.state ? this.state.state.scrollLeft * -1 : 0,
        };
        return (
            <div style={HEADER_STYLE} className="header-background">
                <div style={style}>
                    {this.props.logFile.headers.map((h, i) => this.renderColumn(h.name, i, true, this.columnWidth(h.name)))}
                </div>
            </div>
        );
    }

    render() {
        const {logFile} = this.props;
        const containerHeight = logFile.amountOfRows() * ROW_HEIGHT;
        const containerWidth = ((logFile.amountOfColumns() - 1) * BORDER_SIZE) +
            logFile.headers.reduce((partialSum: number, h) => partialSum + this.columnWidth(h.name), 0);
        return (
            <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                {this.renderHeader(containerWidth)}
                <div style={VIEWPORT_STYLE} ref={this.viewport} onScroll={this.updateState}>
                    <div style={{width: containerWidth, height: containerHeight, position: 'absolute'}}>
                        {this.renderRows()}
                    </div>
                </div>
            </div>
        );
    }
}
