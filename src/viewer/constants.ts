import LogFile from "./LogFile";

export const defaultAppState = {
	rules: [],
	logFile: LogFile.create([], []),
	logFileAsString: "",
	logViewState: undefined,
	coloredTable: false,
	showMinimapHeader: true,
	showStatesDialog: false,
	showFlagsDialog: false,
	showSelectDialog: false,
	selectedColumns: [],
	selectedColumnsMini: [],
	reSearch: false,
	wholeSearch: false,
	caseSearch: false,
	filterSearch: false,
	searchMatches: [],
	currentSearchMatch: null,
	currentSearchMatchIndex: null,
	selectedLogRows: [],
	rowProperties: [],
	logEntryCharIndexMaps: null,
	showStructureDialog: false,
	structureMatches: [],
	currentStructureMatchIndex: null,
	currentStructureMatch: [],
	lastSelectedRow: undefined,
	collapsibleRows: {},
}

const RGB_LIME_GREEN = "0, 208, 0";

const RGB_TURQUOISE = "69, 205, 191";

const RGB_OFFICE_GREEN = "0, 100, 0";

const RGB_OFF_ORANGE = "244, 157, 71";

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

export const BACKGROUND_COLOR_SEARCH_ROW = `rgba(${RGB_OFF_ORANGE}, 0.5)`;

export const BORDER_STRUCTURE_MATCH_CURRENT = `${STRUCUTURE_MATCH_BORDER_SIZE}px solid rgb(${RGB_LIME_GREEN})`;

export const BACKGROUND_COLOR_MATCHED_ROW_CURRENT = `rgba(${RGB_LIME_GREEN}, 0.5)`;

export const BORDER_STRUCTURE_MATCH_OTHER = `${STRUCUTURE_MATCH_BORDER_SIZE}px solid rgb(${RGB_OFFICE_GREEN})`;

export const BACKGROUND_COLOR_MATCHED_ROW_OTHER = `rgba(${RGB_OFFICE_GREEN}, 0.5)`;

export const BORDER_SELECTED_ROW_RADIUS = `5px`;

export const RGB_ANNOTATION0 = `rgb(223, 90, 90)`;

export const RGB_ANNOTATION1 = `rgb(71, 186, 89)`;

export const RGB_ANNOTATION2 = `rgb(46, 111, 179)`;

export const RGB_ANNOTATION3 = `rgb(255, 165, 0)`;

export const RGB_ANNOTATION4 = `rgb(128, 0, 128)`;

export const COLUMN_0_HEADER_STYLE = {
	height: LOG_HEADER_HEIGHT,
	display: "flex",
	justifyContent: "center",
	alignItems: "center",
	borderLeft: BORDER,
	borderBottom: BORDER,
};

export const COLUMN_2_HEADER_STYLE = {
	height: "100%",
	display: "flex",
	borderLeft: BORDER,
};

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
	Max = "MAX",
}

export enum StructureHeaderColumnType {
	Unselected = "UNSELECTED",
	Selected = "SELECTED",
	Custom = "CUSTOM",
}

export enum SelectedRowType {
	None = "NONE",
	UserSelect = "SELECTED",
	QueryResult = "QUERY_RESULT",
	SearchResult = "SEARCH_RESULT"
}
