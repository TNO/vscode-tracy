export const escapeSpecialChars = (text: string): string => {
    let safeText = '';

    if(text !== undefined) {
        safeText = text.replace(/[\\]/g, "\\\\\\$&"); //double escaped slashes
        safeText = safeText.replace(/[\.\*\+\?\^\$\{\}\(\)\|\[\]\-]/g, "\\$&"); // replace special characters
        safeText = safeText.replace(/[\"]/g, "\\\\$&"); //double quotes

    }

    const RegExpCarriageReturnAtEnd = /\r$/;

    if(RegExpCarriageReturnAtEnd.test(text)) {
    safeText = safeText.replace(RegExpCarriageReturnAtEnd, '\\\\r');
    }

    return safeText;
};

export const useRegularExpressionSearch = (flags: string, expression: string, text: string): boolean => {
    const structureQuery = new RegExp(expression, flags);
    let result = structureQuery.exec(escapeSpecialChars(text));
    if (result === null)
        return false;
    else
        return true;
}


// Long function to reduce number of checks
export const returnSearchIndices = (rows: string[][], columnIndex: number, searchText: string, reSearchBool: boolean, wholeSearchBool: boolean, caseSearchBool: boolean): number[] => {
    let loglineText: string;
    let searchTerms: string[]
    let indices: number[] = [];
    if (!caseSearchBool && !reSearchBool)
        searchText = searchText.toLowerCase();
    if ((searchText.charAt(0) === "\"") && (searchText.slice(-1) === "\""))
        searchTerms = [searchText.slice(1,-1)];
    else
        searchTerms = searchText.split(' ');
    if (!reSearchBool && !wholeSearchBool) {
        if (columnIndex === -1) {
            if (!caseSearchBool) {
                for (let i = 0; i < rows.length; i++) {
                    loglineText = rows[i].join(" ").toLowerCase();
                    let found = true;
                    for (var term of searchTerms) {
                        if (loglineText.indexOf(term) == -1) {
                            found = false;
                            break;
                        }
                    }
                    if (found)
                        indices.push(i);
                }
            }
            else {
                for (let i = 0; i < rows.length; i++) {
                    loglineText = rows[i].join(" ");
                    let found = true;
                    for (var term of searchTerms) {
                        if (loglineText.indexOf(term) == -1) {
                            found = false;
                            break;
                        }
                    }
                    if (found)
                        indices.push(i);
                }
            }
        }
        else {
            if (!caseSearchBool) {
                for (let i = 0; i < rows.length; i++) {
                    loglineText = rows[i][columnIndex].toLowerCase();
                    let found = true;
                    for (var term of searchTerms) {
                        if (loglineText.indexOf(term) == -1) {
                            found = false;
                            break;
                        }
                    }
                    if (found)
                        indices.push(i);
                }
            }
            else {
                for (let i = 0; i < rows.length; i++) {
                    loglineText = rows[i][columnIndex];
                    let found = true;
                    for (var term of searchTerms) {
                        if (loglineText.indexOf(term) == -1) {
                            found = false;
                            break;
                        }
                    }
                    if (found)
                        indices.push(i);
                }
            }
        }
    }

    else {
        let flags: string;
        if (!caseSearchBool) 
            flags = 'gsi';
        else
            flags = 'gs';
        if (wholeSearchBool)
            for (var i = 0; i < searchTerms.length; i++)
                searchTerms[i] = '\\b' + searchTerms[i] + '\\b'
        if (columnIndex === -1) {
            for (let i = 0; i < rows.length; i++) {
                loglineText = rows[i].join(" ")
                let found = true;
                for (var term of searchTerms) {
                    if (useRegularExpressionSearch(flags, term, loglineText) === false) {
                        found = false;
                        break;
                    }
                }
                if (found)
                    indices.push(i);
            }
        }
        else {
            for (let i = 0; i < rows.length; i++) {
                loglineText = rows[i][columnIndex] //Lowercase?
                let found = true;
                for (var term of searchTerms) {
                    if (useRegularExpressionSearch(flags, term, loglineText) === false) {
                        found = false;
                        break;
                    }
                }
                if (found)
                    indices.push(i);
            }
        }
    }
    return indices;        
}


export const getRegularExpressionMatches = (expression: string, logFileAsString: string, logEntryRanges: number[][]): number[] => {
    const searchIndices: number[] = [];
    const resultingMatches: number[] = [];
    const flags = 'gs'
    const query = new RegExp(expression, flags);
    let result;
    let current_index = 0;

    while ((result = query.exec(logFileAsString)) !== null) {
        searchIndices.push(result.index);
    }

    if (searchIndices.length > 0) {
        for (let i = 0; i < logEntryRanges.length; i++) {
            if (searchIndices[current_index] >= logEntryRanges[i][0]) {
                if (searchIndices[current_index] <= logEntryRanges[i][1]) {
                    current_index += 1;
                    if (i != resultingMatches[-1])
                        resultingMatches.push(i);
                    if (current_index === searchIndices.length)
                        break;
                }
            }
        }
    }
    return resultingMatches;
}