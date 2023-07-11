import { StructureLinkDistance } from "../constants";
import { StructureEntry } from "../types";

export const constructStructureEntriesArray = (rows: string[][]): StructureEntry[] => {
    const structureEntries:StructureEntry[] = [];
    let structureEntry: StructureEntry;

    for(let i = 0; i < rows.length; i++){
        structureEntry = constructNewStructureEntry(rows[i]);
        structureEntries.push(structureEntry);
    }

    return structureEntries;
};

export const constructNewStructureEntry = (row:string[]):StructureEntry => {
    const allCellsSelected = row.map(() => true);
    const defaultStructureLink = StructureLinkDistance.Some;

    const newEntry:StructureEntry = {row: row, cellSelection: allCellsSelected, structureLink: defaultStructureLink};
    
    return newEntry;
};

export const appendNewStructureEntries = (currentStructureEntries: StructureEntry[], newStructureEntries: StructureEntry[]): StructureEntry[] => {
    const lastIndexOfStructureEntry = currentStructureEntries.length - 1;
    let finalStructureEntries: StructureEntry[] = currentStructureEntries;

    finalStructureEntries[lastIndexOfStructureEntry].structureLink = StructureLinkDistance.Some;

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
            structureLink = StructureLinkDistance.Some;
            break;
        case StructureLinkDistance.Some:
            structureLink = StructureLinkDistance.None;
            break;
    }

    finalStructureEntries[structureEntryIndex].structureLink = structureLink;

    return finalStructureEntries;
};

export const toggleCellSelection = (structureEntries: StructureEntry[], structureEntryIndex: number, cellIndex: number, isKeyPressed: boolean): StructureEntry[] => {
    const finalStructureEntries = structureEntries;

    const selectedCell = finalStructureEntries[structureEntryIndex].cellSelection[cellIndex];

    if(isKeyPressed){
        finalStructureEntries[structureEntryIndex].cellSelection.forEach((cell, index) => {

            if(index != cellIndex) {
                finalStructureEntries[structureEntryIndex].cellSelection[index] = !selectedCell;
            }

        });     
    }else{
        finalStructureEntries[structureEntryIndex].cellSelection[cellIndex] = !selectedCell;
    }

    return finalStructureEntries;
};

export const removeLastStructureLink = (structureEntries: StructureEntry[]): StructureEntry[] => {
    const finalStructureEntries = structureEntries;

    finalStructureEntries[finalStructureEntries.length - 1].structureLink = undefined;

    return finalStructureEntries;
};
