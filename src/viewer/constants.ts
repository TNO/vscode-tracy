const RGB_LIME_GREEN = '0, 208, 0';

const RGB_TURQUOISE = '69, 205, 191';

const RGB_OFFICE_GREEN = '0, 100, 0';

export const MINIMAP_COLUMN_WIDTH = 15;

export const LOG_HEADER_HEIGHT = 40;

export const LOG_ROW_HEIGHT = 28;

export const LOG_DEFAULT_COLUMN_WIDTH = 100;

export const BORDER_SIZE = 1;

export const STRUCUTURE_MATCH_BORDER_SIZE = 3;

export const SELECTED_ROW_BORDER_SIZE = 2;

export const BORDER = `${BORDER_SIZE}px solid grey`;

export const BORDER_SELECTED_ROW = `${SELECTED_ROW_BORDER_SIZE}px solid rgb(${RGB_TURQUOISE})`;

export const BACKGROUND_COLOR_SELECTED_ROW = `rgba(${RGB_TURQUOISE}, 0.5)`;

export const BORDER_STRUCTURE_MATCH_CURRENT = `${STRUCUTURE_MATCH_BORDER_SIZE}px solid rgb(${RGB_LIME_GREEN})`;

export const BACKGROUND_COLOR_MATCHED_ROW_CURRENT = `rgba(${RGB_LIME_GREEN}, 0.5)`;

export const BORDER_STRUCTURE_MATCH_OTHER = `${STRUCUTURE_MATCH_BORDER_SIZE}px solid rgb(${RGB_OFFICE_GREEN})`;

export const BACKGROUND_COLOR_MATCHED_ROW_OTHER = `rgba(${RGB_OFFICE_GREEN}, 0.5)`;

export const BORDER_SELECTED_ROW_RADIUS = `5px`;

export const RGB_Annotation1 = '255, 153, 51';

export const RGB_Annotation2 = '';

export const RGB_Annotation3 = '';

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

export enum StructureLinkDistance {
    None = "NONE",
    Min = "MIN",
    Max = "MAX"
}

export enum StructureHeaderColumnType {
    Unselected = "UNSELECTED",
    Selected = "SELECTED",
    Custom = "CUSTOM"
}

export enum RowType {
    None = "NONE",
    UserSelect = "SELECTED",
    QueryResult = "QUERY_RESULT"
}
