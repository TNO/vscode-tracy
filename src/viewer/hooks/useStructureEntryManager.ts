import { StructureHeaderColumnType, StructureLinkDistance} from "../constants";
import { StructureEntry } from "../types";

export const constructStructureEntriesArray = (headerColumnTypes: StructureHeaderColumnType[], selectedRows: string[][]): StructureEntry[] => {
    const structureEntries:StructureEntry[] = [];
    let structureEntry: StructureEntry;

    for(let i = 0; i < selectedRows.length; i++){
        structureEntry = constructNewStructureEntry(headerColumnTypes,selectedRows[i]);
        structureEntries.push(structureEntry);
    }

    return structureEntries;
};

export const constructNewStructureEntry = (headerColumnType: StructureHeaderColumnType[], row:string[]):StructureEntry => {
    const allCellsSelected = row.map((v, i) => {
        if(headerColumnType[i] === StructureHeaderColumnType.Selected){
            return true;
        }
        return false;
    });
    const defaultStructureLink = StructureLinkDistance.Min;

    const newEntry:StructureEntry = {row: row, cellSelection: allCellsSelected, structureLink: defaultStructureLink};
    
    return newEntry;
};

export const appendNewStructureEntries = (currentStructureEntries: StructureEntry[], newStructureEntries: StructureEntry[]): StructureEntry[] => {
    const lastIndexOfStructureEntry = currentStructureEntries.length - 1;
    let finalStructureEntries: StructureEntry[] = currentStructureEntries;

    finalStructureEntries[lastIndexOfStructureEntry].structureLink = StructureLinkDistance.Min;

    newStructureEntries.forEach(newEntry => {finalStructureEntries.push(newEntry)});

    finalStructureEntries.sort((a,b) => a.row[0].localeCompare(b.row[0]));

    finalStructureEntries = removeLastStructureLink(finalStructureEntries);

    return finalStructureEntries;
};

export const removeStructureEntryFromList = (structureEntries: StructureEntry[], indexOfRowToBeRemoved: number): StructureEntry[] => {
    const lastIndexOfStructureEntry = structureEntries.length - 1;
    const finalStructureEntries = structureEntries.filter((v, i) => i !== indexOfRowToBeRemoved);

    if(indexOfRowToBeRemoved === lastIndexOfStructureEntry && finalStructureEntries.length != 0) {
        finalStructureEntries[lastIndexOfStructureEntry - 1].structureLink = undefined;
    }

    return finalStructureEntries;
};

export const toggleStructureLink = (structureEntries: StructureEntry[], structureEntryIndex: number): StructureEntry[] => {
    const finalStructureEntries = structureEntries;

    let structureLink = finalStructureEntries[structureEntryIndex].structureLink;

    switch(structureLink) {
        case StructureLinkDistance.None:
            structureLink = StructureLinkDistance.Min;
            break;
        case StructureLinkDistance.Min:
            structureLink = StructureLinkDistance.Max;
            break;
        case StructureLinkDistance.Max:
            structureLink = StructureLinkDistance.None;
            break;
    }

    finalStructureEntries[structureEntryIndex].structureLink = structureLink;

    return finalStructureEntries;
};

export const toggleCellSelection = (headerColumnType: StructureHeaderColumnType[], structureEntries: StructureEntry[], structureEntryIndex: number, cellIndex: number, isShiftPressed: boolean): StructureEntry[] => {
    const finalStructureEntries = structureEntries;
    let selectedCell = finalStructureEntries[structureEntryIndex].cellSelection[cellIndex];

    if(headerColumnType[cellIndex] !== StructureHeaderColumnType.Custom) {
        finalStructureEntries[structureEntryIndex].cellSelection[cellIndex] = !selectedCell;
        selectedCell = finalStructureEntries[structureEntryIndex].cellSelection[cellIndex];

        if(isShiftPressed){ //toggle the selection of all the other cells
            finalStructureEntries[structureEntryIndex].cellSelection.forEach((cell, index) => {
    
                if(index != cellIndex && headerColumnType[index] !== StructureHeaderColumnType.Custom) {
                    finalStructureEntries[structureEntryIndex].cellSelection[index] = !selectedCell;
                }
            });
        }
    }

    return finalStructureEntries;
};

export const removeLastStructureLink = (structureEntries: StructureEntry[]): StructureEntry[] => {
    const finalStructureEntries = structureEntries;

    finalStructureEntries[finalStructureEntries.length - 1].structureLink = undefined;

    return finalStructureEntries;
};
