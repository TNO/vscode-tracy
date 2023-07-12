import { Header, StructureEntry } from '../types';
import { StructureHeaderColumnType, StructureLinkDistance } from '../constants';

const RegExpAnyCharMin = '.+?';
const RegExpAnyCharMax = '.+!';
const RegExpLineFeed = '\\r';
const RegExpCarriageReturn = '\\n';
const RegExpValuePattern = "[A-Za-z0-9 ,:~`'_=@#%&\\|\\!\\$\\^\\*\\+\\<\\>\\?\\.\\{\\}\\(\\)\\[\\]\\/\\-]*";
const RegExpjsonObject = '{.+?},?\\r\\n';
const flags = 'gs';

const getRegExpExactWhiteSpace = (amountOfWhitespace: number): string => `\\s{${amountOfWhitespace}}`;

const escapeBrackets = (text: string): string => {
    let safeText = '';

    if(text !== undefined) {
        safeText = text.replace(/[\\\.\*\+\?\^\$\{\}\(\)\|\[\]\-]/g, "\\$&"); // replace special characters
    }
        return safeText;
};

const getLineEndString = (amountOfWhiteSpace: number): string => {
    return RegExpLineFeed + RegExpCarriageReturn + getRegExpExactWhiteSpace(amountOfWhiteSpace);
};

const getCellValue = (content: string, headerColumnType: StructureHeaderColumnType, isSelected: boolean): string => {
    let value = '';

    if(isSelected && headerColumnType !== StructureHeaderColumnType.Unusable) {
        value = `"${escapeBrackets(content)}"`;
     }
     else {
         value = `"${RegExpValuePattern}"`;
     }

     return value;
};

const getRegExpForLogEntry = (logHeaders: Header[], headerTypes: StructureHeaderColumnType[], row: string[], cellSelection: boolean[]): string => {
    let objectString = '{' + getLineEndString(8);
    let rowString = '';
    let hasProcessedLastUsableColumn = false;

    for(let c = row.length - 1; c >= 0; c--) {

        const headerString = `"${logHeaders[c].name}"`;
        const headerType = headerTypes[c];
        const isCellSelected = cellSelection[c];

        if(headerType !== StructureHeaderColumnType.Unusable && row[c] !== undefined) {
            let valueString = getCellValue(row[c], headerType, isCellSelected);
            let headerAndCellString = '';

            if(hasProcessedLastUsableColumn){
                valueString = valueString.concat(',');
                headerAndCellString = headerAndCellString.concat(headerString, ": ", valueString, getLineEndString(8));
            }else {
                headerAndCellString = headerAndCellString.concat(headerString, ": ", valueString, getLineEndString(4));
            }

            rowString = headerAndCellString.concat(rowString);

            hasProcessedLastUsableColumn = true;
        }
    }

    objectString = objectString.concat(rowString, '},?', RegExpLineFeed, RegExpCarriageReturn);

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
                    structureLinkRegExp = getRegExpExactWhiteSpace(4);
                    break;
                case StructureLinkDistance.Some:
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

export const useStructureRegularExpressionSearch = (expression: string, logFileAsString: string): number[][] => {
    console.log('Starting Search: \n', expression);
    const perfStart = performance.now();
    const textRanges: number[][] = [];
    const structureQuery = new RegExp(expression, flags);
    let result;


    while ((result = structureQuery.exec(logFileAsString)) !== null) {
        // console.log(`Range is ${result.index} - ${structureQuery.lastIndex}.`);
        textRanges.push([result.index, structureQuery.lastIndex]);
    }

        const perfEnd = performance.now();
        console.log(`Execution time (useStructureRegularExpressionSearch()): ${perfEnd - perfStart} ms`);

        return textRanges;
}