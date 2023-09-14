import React from 'react';
import { LogViewState } from '../types';
import { MINIMAP_COLUMN_WIDTH } from '../constants';
import LogFile from '../LogFile';
import { log } from 'console';

interface Props {
    logFile: LogFile;
    logViewState: LogViewState;
    onLogViewStateChanged: (value: LogViewState) => void;
    forwardRef: React.RefObject<HTMLDivElement>;
}
interface State {
    state: LogViewState | undefined;
    scale: number;
    controlDown: boolean;
}
const ROW_HEIGHT = 28;
export default class MinimapView extends React.Component<Props, State> {
    canvas: React.RefObject<HTMLCanvasElement>;

    constructor(props: Props) {
        super(props);
        this.canvas = React.createRef();
        this.handleWheel = this.handleWheel.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.state = {scale: 1, controlDown: false, state: this.props.logViewState};
    }

    componentDidMount(): void {
        window.addEventListener('resize', () => this.draw());
        window.addEventListener('keydown', (e) => this.controlDownListener(e));
        window.addEventListener('keyup', (e) => this.controlUpListener(e));
        this.draw();
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: State): void {
        this.draw();
        // console.log("draw");
        // if (prevProps.logViewState !== this.props.logViewState || prevState.scale !== this.state.scale || 
        //     prevProps.logFile !== this.props.logFile) {
        //     this.draw();
        // }
    }

    draw() {
        // Clear and scale the canvas
        const canvas = this.canvas.current;
        if (!canvas || !this.props.logViewState) return;
        canvas.height = canvas.clientHeight * window.devicePixelRatio;
        canvas.width = canvas.clientWidth * window.devicePixelRatio;
        const ctx = canvas.getContext("2d")!;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Hide Minimap if search did not return any rows
        if ((this.props.logFile.rows.length === 1) && (this.props.logFile.rows[0][0] === '')) return;

        // Compute start and end.
        const {logViewState, logFile} = this.props;
        const {rowHeight: logRowHeight, height, visibleItems: logVisibleItems, start: logStart, scrollTop: logScrollTop} = logViewState;
        const minVisibleItems = logVisibleItems;
        const maxVisibleItems = logFile.amountOfRows();
        // If scale is 0.0 all log file entries are visible, if scale is 1.0 the minimap 1:1 matches the log view
        const visibleItems = ((maxVisibleItems - minVisibleItems) * Math.abs(this.state.scale - 1)) + minVisibleItems;
        const scale = logVisibleItems / visibleItems;

        ctx.scale(1, scale)
        ctx.translate(0, logScrollTop * - 1);

        const minimapEnd = logScrollTop + (height / scale);
        const minimapCenter = logScrollTop + ((minimapEnd - logScrollTop) / 2);

        const logEnd = (logStart + logVisibleItems) * logRowHeight;
        const logCenter = logScrollTop + ((logEnd - logScrollTop) / 2);

        // Try to center the logview port in the center of the minimap. 
        // This is only possible when the user scrolled enough from top.
        // This code also makes sure that when scrolled to the end of the log file and zoomed out, the minimap stops at the bottom of the screen.
        const logMinimapCenterDiff = minimapCenter - logCenter;
        const scrollTop = Math.min(logMinimapCenterDiff, logScrollTop);
        const scrollBottom = minVisibleItems === maxVisibleItems ? 0 : Math.min((logFile.amountOfRows() * logRowHeight) + scrollTop - minimapEnd, 0);
        ctx.translate(0, scrollTop - scrollBottom);

        // Draw blocks
        let index = 0; //for caculating the position
        for (let columnIndex = 0; columnIndex < logFile.selectedColumnsMini.length; columnIndex++) {
            if (logFile.selectedColumnsMini[columnIndex]) {
                const colors = logFile.columnsColors[columnIndex];
                for (let i = 0; i < colors.length; i++) {
                    ctx.beginPath();
                    ctx.fillStyle = colors[i];
                    ctx.fillRect(index * MINIMAP_COLUMN_WIDTH, i * logRowHeight, MINIMAP_COLUMN_WIDTH, logRowHeight);
                    ctx.stroke();
                }
                index++;
            }
        }

        // Draw the log viewport on top of the minimap (grey block)
        ctx.beginPath();
        ctx.fillStyle = '#d3d3d380';
        ctx.fillRect(0, logScrollTop, canvas.width, logEnd - logScrollTop);
        ctx.stroke();
    }

    handleClick(e: React.MouseEvent<HTMLElement>) {
        const canvas = this.canvas?.current;
        if (!canvas) return;
        const bounding = canvas.getBoundingClientRect();
        let y = e.clientY;
        if (bounding != undefined) {
            y = e.clientY - bounding.top;
        }
        const {logViewState, logFile} = this.props;
        const {rowHeight: logRowHeight, visibleItems: logVisibleItems, height, start: logStart, scrollTop: logScrollTop}= logViewState;
        const minVisibleItems = logVisibleItems;
        const maxVisibleItems = logFile.amountOfRows();
        const visibleItems = ((maxVisibleItems - minVisibleItems) * Math.abs(this.state.scale - 1)) + minVisibleItems;
        const scaleItem = logVisibleItems / visibleItems;

        const minimapEnd = logScrollTop + (height / scaleItem);
        const minimapCenter = logScrollTop + ((minimapEnd - logScrollTop) / 2);
        const logEnd = (logStart + logVisibleItems) * logRowHeight;
        const logCenter = logScrollTop + ((logEnd - logScrollTop) / 2);

        const logMinimapCenterDiff = minimapCenter - logCenter;
        const scrollTopBox = Math.min(logMinimapCenterDiff, logScrollTop);
        const scrollBottom = minVisibleItems === maxVisibleItems ? 0 : Math.min((logFile.amountOfRows() * logRowHeight) + scrollTopBox - minimapEnd, 0);
        let nrOfRows = 0;
        let scrollTop = 0;
        if (scrollBottom < 0) {//scrollBottom becomes smaller than 0, when the log view scrolls to the last part of the log.
            nrOfRows = ((scrollTopBox - scrollBottom)*scaleItem - y)/(height/visibleItems); //number of rows to move, can be positive or negative
            scrollTop = (logStart - nrOfRows)*ROW_HEIGHT;
        } else {
            nrOfRows =  (y - scrollTopBox*scaleItem)/(height/visibleItems);//number of rows to move, can be positive or negative
            scrollTop = (logStart + nrOfRows)*ROW_HEIGHT;
        }

        //set scrollTop of the log to the new value
        if (!this.props.forwardRef.current) return;
        const scrollLeft = this.props.forwardRef.current.scrollLeft;
        const start = scrollTop / ROW_HEIGHT;
        const startFloor = Math.floor(start);
        const endCeil = Math.min(Math.ceil(start + maxVisibleItems) - 1, this.props.logFile.amountOfRows() - 1);
        this.props.forwardRef.current.scrollTop = scrollTop;
        const state = {height, scrollLeft, scrollTop, startFloor, start, endCeil, visibleItems: logVisibleItems, rowHeight: ROW_HEIGHT};
        const scale = this.state.scale
        this.setState({state});
        this.setState({scale});
        this.draw();
        this.props.onLogViewStateChanged(state);
    }

    handleWheel(e: React.WheelEvent<HTMLCanvasElement>) {
        if (this.state.controlDown === true) {
            const offset = Math.abs(1.02 - this.state.scale) / 5;
            let scale = this.state.scale + (e.deltaY < 0 ? offset : offset * -1);
            scale = Math.max(Math.min(1, scale), 0);
            this.setState({scale});
        } 
        else {
            const scale = e.deltaY;
            this.updateState(scale);
        }
    }

    updateState(scale: number){
        if (!this.props.forwardRef.current) return;
        const height = this.props.forwardRef.current.clientHeight;
        this.props.forwardRef.current.scrollTop = this.props.forwardRef.current.scrollTop + scale;
        const scrollTop = this.props.forwardRef.current.scrollTop;
        const scrollLeft = this.props.forwardRef.current.scrollLeft;
        const maxVisibleItems = height / ROW_HEIGHT;
        const start = scrollTop / ROW_HEIGHT;
        const startFloor = Math.floor(start);
        const endCeil = Math.min(Math.ceil(start + maxVisibleItems) - 1, this.props.logFile.amountOfRows() - 1);
        const visibleItems = Math.min(this.props.logFile.amountOfRows(), maxVisibleItems);
        const state = {height, scrollLeft, scrollTop, startFloor, start, endCeil, visibleItems, rowHeight: ROW_HEIGHT};
        this.setState({state});
        this.props.onLogViewStateChanged(state);
    }

    controlDownListener(e: any) {
        if (e.key === 'Control' && this.state.controlDown === false)
            this.setState({controlDown: true});
    }

    controlUpListener(e: any) {
        if (e.key === 'Control' && this.state.controlDown)
            this.setState({controlDown: false});
    }

    render() {
        return (
            <div style={{flex: 1, overflow: 'hidden', display: 'flex'}}>
                <canvas id= 'canvas' ref={this.canvas} style={{width: '100%', height: '100%'}} onWheel={this.handleWheel} onClick={this.handleClick}/>
            </div>
        );
    }
}
