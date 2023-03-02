import { LogColumn } from "./types";

export const MINIMAP_COLUMN_WIDTH = 15;

export const LOG_HEADER_HEIGHT = 40;

export const BORDER_SIZE = 1;

export const BORDER = `${BORDER_SIZE}px solid grey`;

export const LOG_COLUMNS: LogColumn[] = [
    {name: 'timestamp', width: 180, type: 'string'},
    {name: 'level', width: 50, type: 'string'},
    {name: 'threadID', width: 80, type: 'number'},
    {name: 'location', width: 200, type: 'string'},
    {name: 'message', width: 400, type: 'string'},
    {name: 'listening', width: 100, type: 'string'},
];
