import React, { ReactNode } from "react";
import { WildcardStyle } from "./useStyleManager";
import { Wildcard, CellContents, WildcardSubstitution } from "../types";

export const createWildcard = (structureEntryIndex: number, cellIndex: number, contentsIndex: number) => {
    let newWildcard: Wildcard = {
        wildcardSubstitutions: [{
            entryIndex: structureEntryIndex,
            cellIndex: cellIndex,
            contentsIndex: contentsIndex
        }]
    };

    return newWildcard;
}

export const updateCellContentsIndices = (cellContents: CellContents[], startingIndex: number): CellContents[] => {
    let newIndex = startingIndex;
    const modifiedContents = cellContents;
    for(let i = 0; i < modifiedContents.length; i++) {
        modifiedContents[i].contentsIndex = newIndex;
        newIndex++;
    }

    return modifiedContents;
};

export const getContentsIndexOfNewWildcard = (cellContents: CellContents[], wildcardIndex: number): number => {
    let contentsIndex = -1;

    cellContents.forEach(contents => {
        if(contents.wildcardIndex === wildcardIndex){
            contentsIndex = contents.contentsIndex;
        }
    });

    return contentsIndex;
};

export const getContentsIndexOfExistingWildcard = (cellContents: CellContents[], wildcardIndex: number, previousContentsIndex: number): number => {
    let contentsIndex = -1;

    cellContents.forEach((contents, ind) => {
        if(ind === previousContentsIndex && contents.wildcardIndex === wildcardIndex){
            contentsIndex = contents.contentsIndex;
        }
    });

    return contentsIndex;
};

export const getIndicesForWildcardFromDivId = (divId: string):string[] => {
    const indicesForWildcard: string[] = [];
    const chars = divId.split('-');

    chars.map((val) => indicesForWildcard.push(val));

    return indicesForWildcard;
}

export const insertWildcardIntoCellsContents = (cellContents: CellContents[], wildcards: Wildcard[], structureEntryIndex: number, cellIndex: number, wildcardIndex: number, contentsIndex: number, startIndex: number, endIndex: number): {wildcards: Wildcard[], cellContents: CellContents[]} => {
    let finalCellContents: CellContents[] = [];

    const contentsBeforeCurrent = cellContents.slice(0, contentsIndex);
    const contentsAfterCurrent = cellContents.slice(contentsIndex + 1);

    const contentsToBeModified = cellContents[contentsIndex];
    const contentsToBeModifiedText = contentsToBeModified.textValue!;

    const isFirst = contentsBeforeCurrent.length === 0;
    const isLast = contentsAfterCurrent.length === 0;


    const modifiedCellContents = getCellContentsFromTextValue(contentsToBeModifiedText, wildcardIndex, contentsIndex, startIndex, endIndex);

    if(!isFirst) {
        finalCellContents.push.apply(finalCellContents, contentsBeforeCurrent);
    }

    finalCellContents.push.apply(finalCellContents, modifiedCellContents);

    if(!isLast) {
        finalCellContents.push.apply(finalCellContents, contentsAfterCurrent);
    }

    wildcards.forEach(wildcard => {
        const nrOfSteps = modifiedCellContents.length -1;

        for( let s=0; s < wildcard.wildcardSubstitutions.length; s++){
            if(wildcard.wildcardSubstitutions[s].entryIndex === structureEntryIndex && wildcard.wildcardSubstitutions[s].cellIndex === cellIndex){
                if(wildcard.wildcardSubstitutions[s].contentsIndex > contentsIndex){
                    wildcard.wildcardSubstitutions[s].contentsIndex = wildcard.wildcardSubstitutions[s].contentsIndex + nrOfSteps;
                }
            }
        }
    });

    finalCellContents = updateCellContentsIndices(finalCellContents, 0);

    return {wildcards: wildcards, cellContents: finalCellContents};
}

const getCellContentsFromTextValue = (textValue: string, wildcardIndex: number, contentsIndex: number, startIndex: number, endIndex: number) => {
    const cellContents: CellContents[] = [];
    let chars = [...textValue]

    const stringBeforeWildcard = chars.slice(0, startIndex);

    if(stringBeforeWildcard.length > 0){
        const textContentsBeforeWildcard = getCellContents(contentsIndex, stringBeforeWildcard.join(""), null);
        cellContents.push(textContentsBeforeWildcard);
    }

    const textToBeSubstitutedByWildcard = chars.slice(startIndex, endIndex);
    const wildcardContents = getCellContents(contentsIndex + 1,textToBeSubstitutedByWildcard.join(""), wildcardIndex);
    cellContents.push(wildcardContents);

    const stringAfterWildcard = chars.slice(endIndex);

    if(stringAfterWildcard.length > 0){

        const textContentsAfterWildcard = getCellContents(contentsIndex + 2, stringAfterWildcard.join(""), null);
        cellContents.push(textContentsAfterWildcard);
    }

    return cellContents;
}

export const removeWildcardSubstitution= (wildcards: Wildcard[], wildcardIndex: number, entryIndex: number, cellIndex: number, contentsIndex: number): {wildcards: Wildcard[], isWildcardDeleted: boolean} => {
    let modifiedWildcards = wildcards;
    let isDeleted;
    const wildcard = modifiedWildcards[wildcardIndex];

    const filteredSubstitutions = wildcard.wildcardSubstitutions.filter(value => entryIndex !== value.entryIndex || cellIndex !== value.cellIndex || contentsIndex !== value.contentsIndex)
    if(filteredSubstitutions.length === 0){
        modifiedWildcards = modifiedWildcards.filter((val, ind) => ind !== wildcardIndex);
        isDeleted = true;
    }

    return {wildcards: modifiedWildcards, isWildcardDeleted: isDeleted};    
}

export const removeWildcardSubstitutionForEntry= (wildcards: Wildcard[], entryIndex: number) => {
    let modifiedWildcards = wildcards;
    const indicesOfWildcardsToBeRemoved: number[] = [];

    modifiedWildcards.forEach((wildcard, ind) => {
        const filteredSubstitutions =  wildcard.wildcardSubstitutions.filter(substitution => substitution.entryIndex !== entryIndex);

        if(filteredSubstitutions.length == 0){
            indicesOfWildcardsToBeRemoved.push(ind)
        }else{
            wildcard.wildcardSubstitutions = filteredSubstitutions;
        }
    });

    modifiedWildcards = modifiedWildcards.filter((wildcard, ind) => !indicesOfWildcardsToBeRemoved.some( value => value === ind));

    return modifiedWildcards;
}

export const removeWildcardFromCellContent = (cellContents: CellContents[], wildcards: Wildcard[], entryIndex: number, cellIndex: number, contentsIndex: number): {wildcards: Wildcard[], cellContents: CellContents[]} => {
    let finalCellContents: CellContents[] = [];
    let contentsToBeRemoved = cellContents[contentsIndex];
    let nrOfSteps = 1;

    if(contentsIndex === 0) {
        let contentsAfterCurrent = cellContents.slice(contentsIndex + 1);
        contentsAfterCurrent[0].textValue = contentsToBeRemoved.textValue + contentsAfterCurrent[0].textValue;

        contentsAfterCurrent = updateCellContentsIndices(contentsAfterCurrent, 0);

        finalCellContents = contentsAfterCurrent;
    } else if(contentsIndex === cellContents.length - 1) {
        let contentsBeforeCurrent = cellContents.slice(0, contentsIndex);
        contentsBeforeCurrent[contentsIndex - 1].textValue = contentsBeforeCurrent[contentsIndex - 1].textValue + contentsToBeRemoved.textValue;

        finalCellContents = contentsBeforeCurrent;

        nrOfSteps = 0;
    }else {
        let contentsBeforeCurrent = cellContents.slice(0, contentsIndex);
        let contentsAfterCurrent = cellContents.slice(contentsIndex + 1);
        let newCellContents: CellContents[] = [];
        
        //both are wildcards
        if(contentsBeforeCurrent[contentsBeforeCurrent.length - 1].wildcardIndex !== null && contentsAfterCurrent[0].wildcardIndex !== null){
            //console.log("both are wildcards");
            contentsToBeRemoved.wildcardIndex = null;

            newCellContents.push.apply(contentsBeforeCurrent);
            newCellContents.push(contentsToBeRemoved);
            newCellContents.push.apply(contentsAfterCurrent);

            nrOfSteps = 0;
        }
        //both are text
        else if(contentsBeforeCurrent[contentsBeforeCurrent.length - 1].wildcardIndex === null && contentsAfterCurrent[0].wildcardIndex === null){
            //console.log("both are text");
            const newContentsTextValue = contentsBeforeCurrent[contentsBeforeCurrent.length - 1].textValue + contentsToBeRemoved.textValue + contentsAfterCurrent[0].textValue;
            let newContents: CellContents = {contentsIndex: contentsBeforeCurrent.length - 1, textValue: newContentsTextValue, wildcardIndex: null};

            contentsBeforeCurrent = cellContents.slice(0, newContents.contentsIndex);
            contentsAfterCurrent = cellContents.slice(newContents.contentsIndex + 3, cellContents.length);

            if(contentsBeforeCurrent.length !== 0)
                newCellContents = newCellContents.concat(contentsBeforeCurrent);

            newCellContents.push(newContents);
                
            if(contentsAfterCurrent.length !== 0)
                newCellContents = newCellContents.concat(contentsAfterCurrent);

            nrOfSteps = 2;
        }
        // before is text, after is wildcard
        else if(contentsBeforeCurrent[contentsBeforeCurrent.length - 1].wildcardIndex === null && contentsAfterCurrent[0].wildcardIndex !== null){
            //console.log("before is text, after is wildcard");
            const newContentsTextValue = contentsBeforeCurrent[contentsBeforeCurrent.length - 1] + contentsToBeRemoved.textValue;
            let newContents: CellContents = {contentsIndex: contentsBeforeCurrent.length - 1, textValue: newContentsTextValue, wildcardIndex: null};

            contentsBeforeCurrent = cellContents.slice(0, newContents.contentsIndex);

            if(contentsBeforeCurrent.length !== 0)
            newCellContents = newCellContents.concat(contentsBeforeCurrent);

            newCellContents.push(newContents);
            newCellContents = newCellContents.concat(contentsAfterCurrent);
        }
        // before is wildcard, after is text
        else{
            //console.log("before is wildcard, after is text");
            const newContentsTextValue = contentsToBeRemoved.textValue + contentsAfterCurrent[0].textValue;
            let newContents: CellContents = {contentsIndex: contentsIndex, textValue: newContentsTextValue, wildcardIndex: null};

            contentsAfterCurrent = cellContents.slice(newContents.contentsIndex);

            newCellContents = newCellContents.concat(contentsBeforeCurrent);
            newCellContents.push(newContents);
                
            if(contentsAfterCurrent.length !== 0)
                newCellContents = newCellContents.concat(contentsAfterCurrent);
        }

        newCellContents = updateCellContentsIndices(newCellContents, 0);
        finalCellContents = newCellContents;
    }

    wildcards.forEach(wildcard => {
            
        for( let s=0; s < wildcard.wildcardSubstitutions.length; s++){
            if(wildcard.wildcardSubstitutions[s].entryIndex === entryIndex && wildcard.wildcardSubstitutions[s].cellIndex === cellIndex){
                if(wildcard.wildcardSubstitutions[s].contentsIndex > contentsIndex){
                    wildcard.wildcardSubstitutions[s].contentsIndex = wildcard.wildcardSubstitutions[s].contentsIndex - nrOfSteps;
                }
            }
        }
    });

    return {wildcards: wildcards, cellContents: finalCellContents};
}

export const getCellContents = (contentsIndex: number, textValue: string, wildcardIndex: number | null): CellContents => {
    const newCellContent: CellContents = {
        contentsIndex: contentsIndex,
        textValue: textValue,
        wildcardIndex: wildcardIndex
    };

    return newCellContent;
}

export const getReactElementsFromCellContents = (entryIndex: number, cellIndex: number, contentsIndex: number, wildcardIndex: number | null, textValue: string | null): ReactNode => {
    if(wildcardIndex !== null){
        return <div key ={`w-${entryIndex}-${cellIndex}-${contentsIndex}`} id={`w-${entryIndex}-${cellIndex}-${contentsIndex}`} style={WildcardStyle}>?{wildcardIndex + 1}</div>
    }else{
        return <div key={`t-${entryIndex}-${cellIndex}-${contentsIndex}`} id={`t-${entryIndex}-${cellIndex}-${contentsIndex}`}>{textValue}</div>
    }
    
}

export const getWildcardIndex = (wildcards: Wildcard[], structureEntryIndex: number, cellIndex: number, contentsIndex: number) => {
    let wildcardIndex = -1;

    for(let w = 0; w < wildcards.length; w++) {
       const substitutions = wildcards[w].wildcardSubstitutions;

       for(let s = 0; s < substitutions.length; s++){
            
        if(substitutions[s].entryIndex === structureEntryIndex && 
           substitutions[s].cellIndex === cellIndex && 
           substitutions[s].contentsIndex == contentsIndex)
            {
                wildcardIndex =  w;
            }
       }
    }

    return wildcardIndex;
}

