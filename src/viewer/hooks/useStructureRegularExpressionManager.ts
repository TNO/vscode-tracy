import { Header, StructureEntry } from '../types';
import { StructureHeaderColumnType, StructureLinkDistance } from '../constants';

const RegExpAnyCharMin = '.+?';
const RegExpAnyCharMax = '.+';
const RegExpLineFeed = '\\n';
const RegExpTimeStampPattern = "[A-Za-z0-9 ,:_=@|*+.\\(\\)\\[\\]\\/\\-]*?";
const RegExpValuePattern = "[A-Za-z0-9 ,:~`'\"_=@#%&|!$^*+<>?.{}()\\[\\]\\/\\\\-]*?";
const RegExpjsonObject = '{.+?},?\\n';
const flags = 'gs';

const getRegExpExactWhiteSpace = (amountOfWhitespace: number): string => `\\s{${amountOfWhitespace}}`;

const escapeSpecialChars = (text: string): string => {
    let safeText = '';

    if(text !== undefined) {
        safeText = text.replace(/[\.\*\+\?\^\$\{\}\(\)\|\[\]\-]/g, "\\$&"); // replace special characters
        safeText = safeText.replace(/[\"]/g, "\\\\$&"); // replace special characters and double quotes
    }


    const RegExpCarriageReturnAtEnd = /\r$/;

    if(RegExpCarriageReturnAtEnd.test(text)) {
    safeText = safeText.replace(RegExpCarriageReturnAtEnd, '\\\\r');
    }

    return safeText;
};

const getLineEndString = (amountOfWhiteSpace: number): string => {
    return RegExpLineFeed + getRegExpExactWhiteSpace(amountOfWhiteSpace);
};

const getCellValue = (content: string, header: Header, headerColumnType: StructureHeaderColumnType, isSelected: boolean): string => {
    let value = '';

    if(isSelected && headerColumnType !== StructureHeaderColumnType.Custom) {
        value = (content !== null) ? `"${escapeSpecialChars(content)}"` :  'null';
     }
     else {
         value = (header.name.toLowerCase() === 'timestamp') ? `"${RegExpTimeStampPattern}"` : `"${RegExpValuePattern}"`;
     }

     return value;
};

const getRegExpForLogEntry = (logHeaders: Header[], headerTypes: StructureHeaderColumnType[], row: string[], cellSelection: boolean[]): string => {
    let objectString = '{' + getLineEndString(4);
    let rowString = '';
    let hasProcessedLastUsableColumn = false;

    for(let c = row.length - 1; c >= 0; c--) {

        const headerString = `"${logHeaders[c].name}"`;
        const headerType = headerTypes[c];
        const isCellSelected = cellSelection[c];

        if(headerType !== StructureHeaderColumnType.Custom && row[c] !== undefined) {
            let valueString = getCellValue(row[c], logHeaders[c], headerType, isCellSelected);
            let headerAndCellString = '';

            if(hasProcessedLastUsableColumn){
                valueString = valueString.concat(',');
                headerAndCellString = headerAndCellString.concat(headerString, ": ", valueString, getLineEndString(4));
            }else {
                headerAndCellString = headerAndCellString.concat(headerString, ": ", valueString, getLineEndString(2));
            }

            rowString = headerAndCellString.concat(rowString);

            hasProcessedLastUsableColumn = true;
        }
    }

    objectString = objectString.concat(rowString, '},?', RegExpLineFeed);

    return objectString;
};

export const useStructureQueryConstructor = (logHeaders: Header[],
                                       headerColumnTypes: StructureHeaderColumnType[],
                                       structureEntries: StructureEntry[]):string => {
    let regularExp = '';

    for(let r = 0; r < structureEntries.length; r++){
        const structureEntry = structureEntries[r];

        const rowRegExp = getRegExpForLogEntry(logHeaders, headerColumnTypes, structureEntry.row, structureEntry.cellSelection);
        regularExp = regularExp.concat(rowRegExp);

        if(structureEntry.structureLink !== undefined) {
            let structureLinkRegExp = '';

            switch (structureEntry.structureLink) {
                case StructureLinkDistance.None:
                    structureLinkRegExp = getRegExpExactWhiteSpace(2);
                    break;
                case StructureLinkDistance.Min:
                    structureLinkRegExp = RegExpAnyCharMin;
                    break;
                case StructureLinkDistance.Max:
                    structureLinkRegExp = RegExpAnyCharMax;
                    break;
            }

            regularExp = regularExp.concat(structureLinkRegExp);
        }
    }

    return regularExp;
}

export const useJsonObjectToTextRangesMap = (logFileAsString: string): number[][] => {
    const perfStart = performance.now();
    const textRanges: number[][] = [];
    const jsonObjectsRegExp = new RegExp(RegExpjsonObject, flags);

    let result = jsonObjectsRegExp.exec(logFileAsString);

    if(result !== null) {
        do{
            textRanges.push([result.index, jsonObjectsRegExp.lastIndex]);
        }
        while ((result = jsonObjectsRegExp.exec(logFileAsString)) !== null)
    }

    const perfEnd = performance.now();
    console.log(`Execution time (mapLogFileTextIndicesToObject()): ${perfEnd - perfStart} ms`);

    return textRanges;
}

export const useStructureRegularExpressionSearch = (expression: string, logFileAsString: string, logEntryRanges: number[][]): number[][] => {
    console.log('Starting Structure Matching: \n', expression);
    const perfStart = performance.now();
    const textRanges: number[][] = [];
    const resultingMatches: number[][] = [];
    const structureQuery = new RegExp(expression, flags);
    let result;

    while ((result = structureQuery.exec(logFileAsString)) !== null) {
        // console.log(`Range is ${result.index} - ${structureQuery.lastIndex}.`);
        textRanges.push([result.index, structureQuery.lastIndex]);
    }

    const perfEnd = performance.now();
    console.log(`Execution time (useStructureRegularExpressionSearch()): ${perfEnd - perfStart} ms`);

    textRanges.forEach(matchRanges => {
        const indexesOfEntriesInMatch: number[] = [];
        let startingIndexOfMatch = 0;
        let endingIndexOfMatch = -1;

        for(let i = 0; i < logEntryRanges.length; i++) {

            if(matchRanges[0] === logEntryRanges[i][0]) {
                startingIndexOfMatch = i;
            }

            if(matchRanges[1] === logEntryRanges[i][1]){
                endingIndexOfMatch = i;
                break;
            }
        }

            for(let o = startingIndexOfMatch; o <= endingIndexOfMatch; o++){
                indexesOfEntriesInMatch.push(o);
            }

        resultingMatches.push(indexesOfEntriesInMatch);
    });

    return resultingMatches;
}