import Rule from "./rules/Rule";
import { extent } from "d3-array"
import { scaleSequential } from "d3-scale"
import { interpolateTurbo } from "d3-scale-chromatic"

interface Header {name: string, type: 'string' | 'number'}

export default class LogFile {
    private readonly headerIndexLookup: {[k: string]: number};

    readonly headers: Header[];
    readonly rows: string[][];
    readonly columnsColors: string[][] = [];

    private constructor(headers: Header[], rows: string[][]) {
        this.headerIndexLookup = Object.fromEntries(headers.map((h, i) => [h.name, i]));
        this.headers = headers;
        this.rows = rows;
    }

    static create(content: {[s: string]: string}[], rules: Rule[]) {
        const headers = this.getHeaders(rules);
        const rows = content.map((l) => headers.map((h) => l[h.name]));
        const logFile = new LogFile(headers, rows);
        logFile.computeRulesValuesAndColors(rules);
        return logFile;
    }

    setRules(rules: Rule[]): LogFile {
        const headers = LogFile.getHeaders(rules);
        const logFile = new LogFile(headers, this.rows);
        logFile.computeRulesValuesAndColors(rules);
        return logFile;
    }

    private static getHeaders(rules: Rule[]) {
        // TODO: determine headers based on content
        const headers: Header[] = [
            {name: 'timestamp', type: 'string'},
            {name: 'level', type: 'string'},
            {name: 'threadID', type: 'number'},
            {name: 'location', type: 'string'},
            {name: 'message', type: 'string'},
            {name: 'listening', type: 'string'},
            ...rules.map((r): Header => {return {name: r.column, type: 'string'}}),
        ];
        return headers;
    }

    private computeRulesValuesAndColors(rules: Rule[]) {
        // Compute rules values
        const startIndex = this.headers.length - rules.length;
        const rulesValues = rules.map((r) => r.computeValues(this));
        for (let row = 0; row < this.rows.length; row++) {
            for (let column = 0; column < rulesValues.length; column++) {
                this.rows[row][column + startIndex] = rulesValues[column][row];
            }
        }

        // Compute colors
        this.headers.forEach((header, column) => {
            const values = this.rows.map((r) => r[column]);
            this.columnsColors[column] = LogFile.computeColors(header, values);
        });
    }

    private static computeColors(header: Header, values: string[]) {
        let colorizer: (s: string) => string;

        if (header.type === 'number') {
            colorizer = scaleSequential().domain(extent(values)).interpolator(interpolateTurbo);
        } else {
            const uniqueValues = [...new Set(values)].sort();
            colorizer = (v) => interpolateTurbo(uniqueValues.indexOf(v) / uniqueValues.length);
        }

        return values.map((l) => colorizer(l));
    }

    amountOfRows = () => this.rows.length;
    amountOfColumns = () => this.headers.length;
    amountOfColorColumns = () => this.columnsColors.length;

    value(column: string, row: number): string {
        return this.rows[row]?.[this.headerIndexLookup[column]];
    }
}
