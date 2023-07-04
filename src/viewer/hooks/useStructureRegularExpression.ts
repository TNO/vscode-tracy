import { Header } from '../types';
import { StructureLinkDistance } from '../constants';

const RegExpAnyCharMin = '.+?';
const RegExpAnyCharMax = '.+!';
const RegExpLineFeed = '\\r';
const RegExpCarriageReturn = '\\n';
const RegExpjsonObject = '{.+?},?\\r\\n';
const flags = 'gs';

const getRegExpExactWhiteSpace = (amountOfWhitespace: number): string => `\\s{${amountOfWhitespace}}`;

const getAttributeValue = (content: string, isSelected: boolean): string => {
    let value = '';

    if(!isSelected) {
        value = `"${content}"`;
     }
     else {
         value = `"${RegExpAnyCharMin}"`;
     }

     return value;
};

const getRegExpForLogEntry = (logHeaders: Header[], row: string[], selectedEntryAttributes: boolean[]): string => {
    const lineEndString = RegExpLineFeed + RegExpCarriageReturn + getRegExpExactWhiteSpace(8);
    const rowString = getRegExpExactWhiteSpace(4) + '{' + lineEndString;

    for(let c = 0; c < row.length; c++) {
        const isAttributeSelected = selectedEntryAttributes[c];
        const attributeString = '';
        const headerString = logHeaders[c].name;
        const valueString = getAttributeValue(row[c], isAttributeSelected);

        if((c !== row.length - 1)) {
            valueString.concat(',');
        }

        attributeString.concat(headerString, ": ", valueString, lineEndString);
        rowString.concat(attributeString)
    }

    rowString.concat('},?', RegExpLineFeed, RegExpCarriageReturn);

    return rowString;
};

export const useStructureQueryConstructor = (logHeaders: Header[],
                                       selectedEntries: string[][],
                                       selectedEntryAttributes: boolean[][],
                                       structureLinks: StructureLinkDistance[]):string => {
    // 1. Loop through all the rows
    // 2. Loop through all the cells and concate them with headers and then in result string
            // - if cell is not selected use a wildcard
            // - after row concatenate link type

    const regularExp = '';

    for(let r = 0; r < selectedEntries.length; r++){
        const rowRegExp = getRegExpForLogEntry(logHeaders, selectedEntries[r], selectedEntryAttributes[r]);

        regularExp.concat(rowRegExp);

        if(structureLinks[r] !== undefined) {
            let linkRegExp = '';

            switch (structureLinks[r]) {
                case StructureLinkDistance.None:
                    linkRegExp = '';
                    break;
                case StructureLinkDistance.Some:
                    linkRegExp = RegExpAnyCharMin;
                    break;
                case StructureLinkDistance.Max:
                    linkRegExp = RegExpAnyCharMax;
                    break;
            }

            regularExp.concat(linkRegExp);
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

export const useStructureQuery = (expression: string, logFileAsString: string): number[][] => {
    const perfStart = performance.now();
    let result;
    const textRanges: number[][] = [];

    const structureQuery = new RegExp(expression, flags);
    // const result = this.state.logFileText.matchAll(example);

    while ((result = structureQuery.exec(logFileAsString)) !== null) {
        //console.log(`Range is ${result.index} - ${result.lastIndex}.`);
        textRanges.push([result.index, result.lastIndex]);
    }

        const perfEnd = performance.now();
        console.log(`Execution time (Matching regular expression): ${perfEnd - perfStart} ms`);

        return result;
}