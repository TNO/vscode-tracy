import Rule from "./rules/Rule";
import { extent } from "d3-array";
import { Header } from "./types";
import { scaleSequential } from "d3-scale";
import { interpolateTurbo } from "d3-scale-chromatic";

// TODO: determine column type automatically, not hardcoded
const DEFAULT_HEADER_TYPE = "string";
const HEADER_TYPE_LOOKUP = {
	threadID: "number",
};

export default class LogFile {
	private readonly headerIndexLookup: { [k: string]: number };

	readonly contentHeaders: string[];
	readonly rows: string[][];
	readonly columnsColors: string[][] = [];
	headers: Header[];
	selectedColumns: boolean[];
	selectedColumnsMini: boolean[];

	private constructor(contentHeaders: string[], headers: Header[], rows: string[][]) {
		this.contentHeaders = contentHeaders;
		this.headerIndexLookup = Object.fromEntries(headers.map((h, i) => [h.name, i]));
		this.headers = headers;
		this.rows = rows;
		this.selectedColumns = new Array(headers.length).fill(true);
		this.selectedColumnsMini = new Array(headers.length).fill(true);
	}

	static create(content: { [s: string]: string }[], rules: Rule[]) {
		const contentHeaders = this.getContentHeaders(content);
		const headers = this.getHeaders(contentHeaders, rules);
		const rows = content.map((l) => headers.map((h) => l[h.name]));
		const logFile = new LogFile(contentHeaders, headers, rows);
		logFile.computeDefaultColumnColors();
		logFile.computeRulesValuesAndColors(rules);
		return logFile;
	}

	updateRules(rules: Rule[]): LogFile {
		this.updateSelectedColumns(rules);
		this.updateHeaders(rules);
		this.computeRulesValuesAndColors(rules);
		return this;
	}

	updateSelectedColumns(rules: Rule[]) {
		let existingHeaders = this.headers.map(h => h.name);
		let updatedSelected = this.selectedColumns.slice(0, this.contentHeaders.length);
		let updatedSelectedMini = this.selectedColumnsMini.slice(0, this.contentHeaders.length);

		for (let i = 0; i < rules.length; i++) {
			let existingIndex = existingHeaders.indexOf(rules[i].column);
			if (existingIndex > -1) {
				updatedSelected.push(this.selectedColumns[existingIndex]);
				updatedSelectedMini.push(this.selectedColumnsMini[existingIndex]);
			}
			else {
				updatedSelected.push(true);
				updatedSelectedMini.push(true);
			}
		}
		this.setSelectedColumns(updatedSelected, updatedSelectedMini);
	}

	setSelectedColumns(selected: boolean[], selectedMini: boolean[]) {
		for (let column = 0; column < this.selectedColumns.length; column++) {
			if (selected[column] !== undefined) {
				this.selectedColumns[column] = selected[column];
			}
		}
		for (let column = 0; column < this.selectedColumnsMini.length; column++) {
			if (selectedMini[column] !== undefined) {
				this.selectedColumnsMini[column] = selectedMini[column];
			}
		}
		return this;
	}

	getSelectedHeader(): Header[] {
		const selectedHeaders = this.headers.filter((h, i) => this.selectedColumns[i] == true);
		return selectedHeaders;
	}

	getSelectedHeaderMini(): Header[] {
		const selectedHeadersMini = this.headers.filter((h, i) => this.selectedColumnsMini[i] == true);
		return selectedHeadersMini;
	}

	private static getContentHeaders(content: { [s: string]: string }[]) {
		// Headers are all keys that are present in the first object (row)
		const first = content[0] ?? {};
		return Object.keys(first);
	}

	private static getHeaders(contentHeaders: string[], rules: Rule[]) {
		const allHeaders = [...contentHeaders, ...rules.map((r) => r.column)];
		return allHeaders.map((name) => {
			const type = HEADER_TYPE_LOOKUP[name] ?? DEFAULT_HEADER_TYPE;
			return { name, type };
		});
	}

	private updateHeaders(rules: Rule[]) {
		const allHeaders = [...this.contentHeaders, ...rules.map((r) => r.column)];
		this.headers = allHeaders.map((name) => {
			const type = HEADER_TYPE_LOOKUP[name] ?? DEFAULT_HEADER_TYPE;
			return { name, type };
		});
	}

	private computeDefaultColumnColors() {
		for (let i = 0; i < this.contentHeaders.length; i++) {
			const values = this.rows.map((r) => r[i]);
			this.columnsColors[i] = LogFile.computeColors(this.headers[i], values);
		}
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
		for (let i = startIndex; i < this.headers.length; i++) {
			const values = this.rows.map((r) => r[i]);
			this.columnsColors[i] = LogFile.computeColors(this.headers[i], values);
		}
	}

	private static computeColors(header: Header, values: string[]) {
		let colorizer: (s: string) => string;

		if (header.type === "number") {
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
