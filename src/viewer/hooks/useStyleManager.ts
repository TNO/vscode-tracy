import { SelectedRowType, LOG_HEADER_HEIGHT, LOG_ROW_HEIGHT, STRUCTURE_LINK_HEIGHT, STRUCTURE_WIDTH, BORDER, BORDER_SELECTED_ROW_USER, SELECTED_ROW_USER_SELECT_COLOR, BORDER_SELECTED_ROW_QUERY, SELECTED_ROW_QUERY_RESULT_COLOR } from '../constants';
import { StructureEntry } from '../types';

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
    overflow:'scroll'
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

export const getHeaderColumnStyle= (columnWidth: number, columnIndex: number, height: number): React.CSSProperties => {
    const headerColumnStyle: React.CSSProperties = {
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        display: 'inline-block',
        height,
        width: columnWidth,
        borderLeft: columnIndex !== 0 ? BORDER : ''
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

export const getStructureTableEntryIconStyle= (isRemovingStructureEntries: boolean): React.CSSProperties => {
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

export const getStructureTableRowStyle= (rowIndex: number, structureLinkIndex: number): React.CSSProperties => {
    const rowStyle: React.CSSProperties = {
        position: 'absolute', 
        height: LOG_ROW_HEIGHT,
        top: rowIndex * LOG_ROW_HEIGHT + structureLinkIndex * STRUCTURE_LINK_HEIGHT,
        overflow: 'hidden',
        userSelect: 'none'
    };

    return rowStyle;
}

export const getStructureTableLinkStyle= (rowIndex: number, structureLinkIndex: number): React.CSSProperties => {
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

    if(!structureEntries[rowIndex].cellSelection[cellIndex]) {
        cellSelectionStyle = {
            display: 'flex', height: LOG_ROW_HEIGHT, alignItems: 'center', justifyContent: 'left', 
            paddingLeft: '2px', 
            color: "var(--vscode-titleBar-inactiveForeground)",
            background: 'repeating-linear-gradient(-55deg, #222222b3, #222222b3 10px, #333333b3 10px, #333333b3 20px)'
        };
    }else {
        cellSelectionStyle = {
            display: 'flex', height: LOG_ROW_HEIGHT, alignItems: 'center', justifyContent: 'left', 
            paddingLeft: '2px', backgroundColor: 'transparent'
        };
    }

    return cellSelectionStyle;
}

export const getLogViewRowSelectionStyle = (selectedRows: string[], rowIndex: number): React.CSSProperties => {
    let selectionStyle: React.CSSProperties = {};

    switch(selectedRows[rowIndex]) {
        case SelectedRowType.UserSelect:
            selectionStyle = {
                // Event row selection properties
                borderBottom: BORDER_SELECTED_ROW_USER,
                borderTop: BORDER_SELECTED_ROW_USER,
                borderRadius: '5px',
                backgroundColor: SELECTED_ROW_USER_SELECT_COLOR
            };
            break;
        case SelectedRowType.QueryResult:
            selectionStyle = {
                // Event row selection properties
                borderBottom: BORDER_SELECTED_ROW_QUERY,
                borderTop: BORDER_SELECTED_ROW_QUERY,
                borderRadius: '5px',
                backgroundColor: SELECTED_ROW_QUERY_RESULT_COLOR,
            };
            break;
        case SelectedRowType.None: 
                selectionStyle = {
                    // Event row selection properties
                    borderBottom: BORDER,
                    borderRadius: '5px',
            };
            break;
    }

    return selectionStyle;
}