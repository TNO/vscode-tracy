
// Long function to reduce number of checks
export const returnSearchIndices = (rows: string[][], columnIndex: number, searchText: string, reSearchBool: boolean, wholeSearchBool: boolean, caseSearchBool: boolean): number[] => {
    let loglineText: string;
    let searchTerms: string[]
    let indices: number[] = [];
    if (!caseSearchBool && !reSearchBool)
        searchText = searchText.toLowerCase();
    if (!wholeSearchBool)
        searchTerms = searchText.split(' ');
    else
        searchTerms = [searchText];
    if (!reSearchBool) {
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