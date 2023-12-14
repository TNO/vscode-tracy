import { StructureHeaderColumnType, StructureLinkDistance } from "../constants";
import { StructureEntry, Wildcard } from "../types";

export const constructStructureEntriesArray = (
	headerColumnTypes: StructureHeaderColumnType[],
	selectedRows: string[][],
): StructureEntry[] => {
	const structureEntries: StructureEntry[] = [];
	let structureEntry: StructureEntry;

	for (let i = 0; i < selectedRows.length; i++) {
		structureEntry = constructNewStructureEntry(headerColumnTypes, selectedRows[i]);
		structureEntries.push(structureEntry);
	}

	return structureEntries;
};

export const constructNewStructureEntry = (
	headerColumnType: StructureHeaderColumnType[],
	row: string[],
): StructureEntry => {
	const rowCellContents = row.map((v, _i) => {
		return [{ contentsIndex: 0, textValue: v, wildcardIndex: null }];
	});

	const allCellsSelected = row.map((_v, i) => {
		if (headerColumnType[i] === StructureHeaderColumnType.Selected) {
			return true;
		}
		return false;
	});

	const defaultStructureLink = StructureLinkDistance.Min;

	const arraysForWilcardIndexes: number[][] = [];
	row.map(() => {
		arraysForWilcardIndexes.push([]);
	});

	const newEntry: StructureEntry = {
		row: rowCellContents,
		cellSelection: allCellsSelected,
		structureLink: defaultStructureLink,
		wildcardsIndices: arraysForWilcardIndexes,
	};

	return newEntry;
};

export const appendNewStructureEntries = (
	currentStructureEntries: StructureEntry[],
	newStructureEntries: StructureEntry[],
): StructureEntry[] => {
	const lastIndexOfStructureEntry = currentStructureEntries.length - 1;
	let modifiedStructureEntries: StructureEntry[] = currentStructureEntries;

	modifiedStructureEntries[lastIndexOfStructureEntry].structureLink = StructureLinkDistance.Min;

	newStructureEntries.forEach((newEntry) => {
		modifiedStructureEntries.push(newEntry);
	});

	modifiedStructureEntries.sort((a, b) =>
		a.row[0][0].textValue.localeCompare(b.row[0][0].textValue),
	);

	modifiedStructureEntries = removeLastStructureLink(modifiedStructureEntries);

	return modifiedStructureEntries;
};

export const removeStructureEntryFromList = (
	structureEntries: StructureEntry[],
	indexOfRowToBeRemoved: number,
): StructureEntry[] => {
	const lastIndexOfStructureEntry = structureEntries.length - 1;
	const modifiedStructureEntries = structureEntries.filter((_v, i) => i !== indexOfRowToBeRemoved);

	if (indexOfRowToBeRemoved === lastIndexOfStructureEntry && modifiedStructureEntries.length != 0) {
		modifiedStructureEntries[lastIndexOfStructureEntry - 1].structureLink = undefined;
	}

	return modifiedStructureEntries;
};

export const updateStructureEntriesAfterWildcardDeletion = (
	structureEntries: StructureEntry[],
	wildcards: Wildcard[],
	deletedWildcardIndex: number,
): StructureEntry[] => {
	const modifiedStructureEntries = structureEntries;

	for (let e = 0; e < modifiedStructureEntries.length; e++) {
		for (let c = 0; c < modifiedStructureEntries[e].row.length; c++) {
			for (let w = 0; w < modifiedStructureEntries[e].wildcardsIndices[c].length; w++) {
				if (modifiedStructureEntries[e].wildcardsIndices[c][w] > deletedWildcardIndex) {
					modifiedStructureEntries[e].wildcardsIndices[c][w] -= 1;
				}
			}

			for (let cc = 0; cc < modifiedStructureEntries[e].row[c].length; cc++) {
				if (
					modifiedStructureEntries[e].row[c][cc].wildcardIndex &&
					modifiedStructureEntries[e].row[c][cc].wildcardIndex! > deletedWildcardIndex
				) {
					modifiedStructureEntries[e].row[c][cc].wildcardIndex! -= 1;
				}
			}
		}
	}

	return modifiedStructureEntries;
};

export const toggleStructureLink = (
	structureEntries: StructureEntry[],
	structureEntryIndex: number,
): StructureEntry[] => {
	const modifiedStructureEntries = structureEntries;

	let structureLink = modifiedStructureEntries[structureEntryIndex].structureLink;

	switch (structureLink) {
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

	modifiedStructureEntries[structureEntryIndex].structureLink = structureLink;

	return modifiedStructureEntries;
};

export const toggleCellSelection = (
	headerColumnType: StructureHeaderColumnType[],
	structureEntries: StructureEntry[],
	structureEntryIndex: number,
	cellIndex: number,
	isShiftPressed: boolean,
): StructureEntry[] => {
	const modifiedStructureEntries = structureEntries;
	let selectedCell = modifiedStructureEntries[structureEntryIndex].cellSelection[cellIndex];

	if (headerColumnType[cellIndex] !== StructureHeaderColumnType.Custom) {
		modifiedStructureEntries[structureEntryIndex].cellSelection[cellIndex] = !selectedCell;
		selectedCell = modifiedStructureEntries[structureEntryIndex].cellSelection[cellIndex];

		if (isShiftPressed) {
			//toggle the selection of all the other cells
			modifiedStructureEntries[structureEntryIndex].cellSelection.forEach((cell, index) => {
				if (index != cellIndex && headerColumnType[index] !== StructureHeaderColumnType.Custom) {
					modifiedStructureEntries[structureEntryIndex].cellSelection[index] = !selectedCell;
				}
			});
		}
	}

	return modifiedStructureEntries;
};

export const removeLastStructureLink = (structureEntries: StructureEntry[]): StructureEntry[] => {
	const modifiedStructureEntries = structureEntries;

	modifiedStructureEntries[modifiedStructureEntries.length - 1].structureLink = undefined;

	return modifiedStructureEntries;
};

export const addWildcardToStructureEntry = (
	structureEntries: StructureEntry[],
	structureEntryIndex: number,
	cellIndex: number,
	wildcardIndex: number,
): StructureEntry[] => {
	const modifiedStructureEntries = structureEntries;
	modifiedStructureEntries[structureEntryIndex].wildcardsIndices[cellIndex].push(wildcardIndex);

	return modifiedStructureEntries;
};

export const removeWildcardFromStructureEntry = (
	structureEntries: StructureEntry[],
	structureEntryIndex: number,
	cellIndex: number,
	wildcardIndex: number,
): StructureEntry[] => {
	const modifiedStructureEntries = structureEntries;
	let wildcardsInCell = modifiedStructureEntries[structureEntryIndex].wildcardsIndices[cellIndex];

	wildcardsInCell = wildcardsInCell.filter((value) => value !== wildcardIndex);

	modifiedStructureEntries[structureEntryIndex].wildcardsIndices[cellIndex] = wildcardsInCell;

	return modifiedStructureEntries;
};
