export const MINIMAP_COLUMN_WIDTH = 15;

export const LOG_HEADER_HEIGHT = 40;

export const LOG_ROW_HEIGHT = 28;

export const LOG_DEFAULT_COLUMN_WIDTH = 100;

export const BORDER_SIZE = 1;

export const BORDER = `${BORDER_SIZE}px solid grey`;

export const BORDER_SELECT_ROW_SIZE = 2;

export const BORDER_SELECTED_ROW = `${BORDER_SELECT_ROW_SIZE}px solid green`;

export const BORDER_SELECTED_ROW_RADIUS = `5px`;

// TODO: determine column width automatically, not hardcoded
export const LOG_COLUMN_WIDTH_LOOKUP = {
    timestamp: 180, 
    level: 50, 
    threadID: 80, 
    location: 200,
    message: 400,
};

export const STRUCTURE_WIDTH = 28;

export const STRUCTURE_LINK_HEIGHT = 16;
