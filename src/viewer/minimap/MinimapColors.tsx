import { LogFile, LogColumn } from "../types";
import { LOG_COLUMNS } from '../constants';
import { extent } from "d3-array"
import { scaleSequential } from "d3-scale"
import { interpolateTurbo } from "d3-scale-chromatic"

export default class MinimapColors {
    readonly logFile: LogFile;
    readonly columnColors: {[s: string]: string[]} = {};

    constructor(logFile: LogFile) {
        this.logFile = logFile;
        LOG_COLUMNS.forEach((l) => this.computeColors(l));
    }

    private computeColors(column: LogColumn) {
        const values = this.logFile.map((l) => l[column.name]);
        let colorizer: (s: string) => string;

        if (column.type === 'number') {
            colorizer = scaleSequential().domain(extent(values)).interpolator(interpolateTurbo);
        } else {
            const uniqueValues = [...new Set(values)].sort();
            colorizer = (v) => interpolateTurbo(uniqueValues.indexOf(v) / uniqueValues.length);
        }

        const colors = values.map((l) => colorizer(l))
        this.columnColors[column.name] = colors;
    }
}