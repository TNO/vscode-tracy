import { RowType, LOG_HEADER_HEIGHT, LOG_ROW_HEIGHT, STRUCTURE_LINK_HEIGHT, STRUCTURE_WIDTH, BORDER, BORDER_SELECTED_ROW, BORDER_STRUCTURE_MATCH_CURRENT, BORDER_STRUCTURE_MATCH_OTHER, BACKGROUND_COLOR_MATCHED_ROW_CURRENT, BACKGROUND_COLOR_MATCHED_ROW_OTHER, BACKGROUND_COLOR_SELECTED_ROW } from '../constants';
import { RowProperty, StructureEntry } from '../types';

const getLogViewRowStyle = (rowIndex: number): React.CSSProperties => {
    const rowStyle: React.CSSProperties = {
        position: 'absolute',
        height: LOG_ROW_HEIGHT,
        overflow: 'hidden',
        top: rowIndex * LOG_ROW_HEIGHT,
        userSelect: 'none',
        borderRadius: '5px'
    };

    return rowStyle;
};

export const StructureDialogBackdropStyle: React.CSSProperties = {
    bottom: '10px',
    width: '100%',
    backgroundColor: '#00000030',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible'
};

export const StructureDialogDialogStyle: React.CSSProperties = {
    width: '98%',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'scroll'
};

export const getStructureTableHeaderStyle = (containerWidth: number): React.CSSProperties => {
    const headerStyle: React.CSSProperties = {
        width: containerWidth,
        height: LOG_HEADER_HEIGHT,
        position: 'relative',
        userSelect: 'none',
        left: STRUCTURE_WIDTH,
        display: "flex"
    };

    return headerStyle;
};

export const getHeaderColumnStyle = (columnWidth: number, columnIndex: number, height: number): React.CSSProperties => {
    const headerColumnStyle: React.CSSProperties = {
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        display: 'inline-block',
        height,
        width: columnWidth,
        borderLeft: BORDER
    };

    return headerColumnStyle;
};

export const getHeaderColumnInnerStyle = (height: number, isHeader: boolean): React.CSSProperties => {
    const headerColumnInnerStyle: React.CSSProperties = {
        display: 'flex',
        height,
        alignItems: 'center',
        justifyContent: isHeader ? 'center' : 'left',
        paddingLeft: '2px'
    };

    return headerColumnInnerStyle;
};

export const getStructureTableEntryIconStyle = (isRemovingStructureEntries: boolean): React.CSSProperties => {
    const structureEntryIconStyle: React.CSSProperties = {
        width: STRUCTURE_WIDTH,
        height: LOG_ROW_HEIGHT,
        display: 'inline-block',
        verticalAlign: 'top',
        textAlign: 'center',
        lineHeight: `${LOG_ROW_HEIGHT}px`,
        color: isRemovingStructureEntries ? 'red' : ''
    };

    return structureEntryIconStyle;
}

export const getStructureTableRowStyle = (rowIndex: number, structureLinkIndex: number): React.CSSProperties => {
    const rowStyle: React.CSSProperties = {
        position: 'absolute',
        height: LOG_ROW_HEIGHT,
        top: rowIndex * LOG_ROW_HEIGHT + structureLinkIndex * STRUCTURE_LINK_HEIGHT,
        overflow: 'hidden'
    };

    return rowStyle;
}

export const getStructureTableLinkStyle = (rowIndex: number, structureLinkIndex: number): React.CSSProperties => {
    const structureLinkStyle: React.CSSProperties = {
        position: 'absolute',
        height: STRUCTURE_LINK_HEIGHT,
        top: (rowIndex + 1) * LOG_ROW_HEIGHT + structureLinkIndex * STRUCTURE_LINK_HEIGHT,
        overflow: 'hidden',
        userSelect: 'none',
        width: STRUCTURE_WIDTH,
        textAlign: 'center'
    };

    return structureLinkStyle;
}

export const getStructureTableColumnStyle = (columnWidth: number, columnIndex: number): React.CSSProperties => {
    const columnStyle: React.CSSProperties = {
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        display: 'inline-block',
        height: LOG_ROW_HEIGHT,
        width: columnWidth,
        verticalAlign: 'top',
        borderLeft: columnIndex !== 0 ? BORDER : '',
        borderTop: BORDER,
        borderBottom: BORDER
    };

    return columnStyle;
};

export const getStructureTableCellSelectionStyle = (structureEntries: StructureEntry[], rowIndex: number, cellIndex: number): React.CSSProperties => {
    let cellSelectionStyle: React.CSSProperties;

    if (!structureEntries[rowIndex].cellSelection[cellIndex]) {
        cellSelectionStyle = {
            display: 'flex', height: LOG_ROW_HEIGHT, alignItems: 'center', justifyContent: 'left',
            paddingLeft: '2px',
            color: "var(--vscode-titleBar-inactiveForeground)",
            background: 'repeating-linear-gradient(-55deg, #222222b3, #222222b3 10px, #333333b3 10px, #333333b3 20px)',
            userSelect: 'none'
        };
    } else {
        cellSelectionStyle = {
            display: 'flex', 
            height: LOG_ROW_HEIGHT, 
            alignItems: 'center', 
            justifyContent: 'left', 
            paddingLeft: '2px', 
            backgroundColor: 'transparent',
            userSelect: 'text'
        };
    }

    return cellSelectionStyle;
}

export const getLogViewRowSelectionStyle = (selectedRows: RowProperty[], rowIndex: number, index: number): React.CSSProperties => {
    let rowSelectionStyle: React.CSSProperties = {};

    switch (selectedRows[rowIndex].rowType) {
        case RowType.UserSelect:
            rowSelectionStyle = {
                borderBottom: BORDER_SELECTED_ROW,
                borderTop: BORDER_SELECTED_ROW,
                backgroundColor: BACKGROUND_COLOR_SELECTED_ROW
            };
            break;
        case RowType.None:
            rowSelectionStyle = {
                borderBottom: BORDER,
            };
            break;
    }

    rowSelectionStyle = {...getLogViewRowStyle(index), ...rowSelectionStyle};

    return rowSelectionStyle;
}

export const getLogViewStructureMatchStyle = (currentStructureMatch: number[], structureMatches: number[][], rowIndex: number): React.CSSProperties => {
    const isCurrentMatch = currentStructureMatch.includes(rowIndex) ? true : false;
    let structureMatchRowStyle = getLogViewRowStyle(rowIndex);
    const currentStructureMatchLastIndex = currentStructureMatch.length - 1;

    const structureMatchFirstAndLastRowStyle = {
        borderTop: isCurrentMatch ? BORDER_STRUCTURE_MATCH_CURRENT : BORDER_STRUCTURE_MATCH_OTHER,
        borderBottom: isCurrentMatch ? BORDER_STRUCTURE_MATCH_CURRENT : BORDER_STRUCTURE_MATCH_OTHER,
        backgroundColor: isCurrentMatch ? BACKGROUND_COLOR_MATCHED_ROW_CURRENT : BACKGROUND_COLOR_MATCHED_ROW_OTHER
    };
    const structureMatchFirstRowStyle = {
        borderTop: isCurrentMatch ? BORDER_STRUCTURE_MATCH_CURRENT : BORDER_STRUCTURE_MATCH_OTHER,
        borderBottom: BORDER,
        backgroundColor: isCurrentMatch ? BACKGROUND_COLOR_MATCHED_ROW_CURRENT : BACKGROUND_COLOR_MATCHED_ROW_OTHER
    };
    const structureMatchMiddleRowStyle = {
        backgroundColor: isCurrentMatch ? BACKGROUND_COLOR_MATCHED_ROW_CURRENT : BACKGROUND_COLOR_MATCHED_ROW_OTHER,
        borderBottom: BORDER
    };
    const structureMatchLastRowStyle = {
        borderBottom: isCurrentMatch ? BORDER_STRUCTURE_MATCH_CURRENT : BORDER_STRUCTURE_MATCH_OTHER,
        backgroundColor: isCurrentMatch ? BACKGROUND_COLOR_MATCHED_ROW_CURRENT : BACKGROUND_COLOR_MATCHED_ROW_OTHER
    };


    if (rowIndex === currentStructureMatch[0] && currentStructureMatch.length === 1) {
        structureMatchRowStyle = { ...structureMatchRowStyle, ...structureMatchFirstAndLastRowStyle };
    } else if (rowIndex === currentStructureMatch[0]) {
        structureMatchRowStyle = { ...structureMatchRowStyle, ...structureMatchFirstRowStyle };
    } else if (rowIndex === currentStructureMatch[currentStructureMatchLastIndex]) {
        structureMatchRowStyle = { ...structureMatchRowStyle, ...structureMatchLastRowStyle };
    } else if (currentStructureMatch[0] < rowIndex && rowIndex < currentStructureMatch[currentStructureMatchLastIndex]) {
        structureMatchRowStyle = { ...structureMatchRowStyle, ...structureMatchMiddleRowStyle };
    }
    else {
        structureMatches = structureMatches.filter(match => match !== currentStructureMatch);

        for (let i = 0; i < structureMatches.length; i++) {
            const match = structureMatches[i];

            if ((match.length > 1 && rowIndex <= match[match.length - 1]) || rowIndex <= match[0]) {
                if (rowIndex === match[0] && match.length === 1) {
                    structureMatchRowStyle = { ...structureMatchRowStyle, ...structureMatchFirstAndLastRowStyle };
                } else if (rowIndex === match[0]) {
                    structureMatchRowStyle = { ...structureMatchRowStyle, ...structureMatchFirstRowStyle };
                } else if (rowIndex === match[match.length - 1]) {
                    structureMatchRowStyle = { ...structureMatchRowStyle, ...structureMatchLastRowStyle };
                } else {
                    structureMatchRowStyle = { ...structureMatchRowStyle, ...structureMatchMiddleRowStyle };
                }

                break;
            }
        }
    }

    return structureMatchRowStyle;
};