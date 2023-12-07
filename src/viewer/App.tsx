import React from "react";
import LogFile from "./LogFile";
import LogView from "./log/LogView";
import MinimapView from "./minimap/MinimapView";
import Tooltip from "@mui/material/Tooltip";
import { LogViewState, StructureMatchId, RowProperty, Segment, LogEntryCharMaps } from "./types";
import {
	COLUMN_0_HEADER_STYLE,
	COLUMN_2_HEADER_STYLE,
	MINIMAP_COLUMN_WIDTH,
	SelectedRowType,
	StructureHeaderColumnType,
	defaultAppState,
} from "./constants";
import {
	VSCodeButton,
	VSCodeTextField,
	VSCodeDropdown,
	VSCodeOption,
} from "@vscode/webview-ui-toolkit/react";
import {
	useGetCharIndicesForLogEntries,
	useStructureRegularExpressionSearch,
	useStructureRegularExpressionNestedSearch
} from "./hooks/useStructureRegularExpressionManager";
import { getRegularExpressionMatches, returnSearchIndices } from "./hooks/useLogSearchManager";
import { constructNewRowProperty, constructNewSegment } from "./hooks/useRowProperty";
import StructureDialog from "./structures/StructureDialog";
import StatesDialog from "./rules/Dialogs/StatesDialog";
import FlagsDialog from "./rules/Dialogs/FlagsDialog";
import Rule from "./rules/Rule";
import MinimapHeader from "./minimap/MinimapHeader";
import SelectColDialog from "./log/SelectColDialog";

interface Props { }
interface State {
	logFile: LogFile;
	logViewState: LogViewState | undefined;
	rules: Rule[];
	showStatesDialog: boolean;
	showStructureDialog: boolean;
	showFlagsDialog: boolean;
	showSelectDialog: boolean;
	showMinimapHeader: boolean;
	selectedColumns: boolean[];
	selectedColumnsMini: boolean[];
	coloredTable: boolean;

	// Search related
	reSearch: boolean;
	wholeSearch: boolean;
	caseSearch: boolean;
	filterSearch: boolean;
	searchMatches: number[];
	currentSearchMatch: number | null;
	currentSearchMatchIndex: number | null;

	// Structure related
	logFileAsString: string;
	logEntryCharIndexMaps: LogEntryCharMaps | null;
	selectedLogRows: string[][];
	rowProperties: RowProperty[];
	lastSelectedRow: number | undefined;
	structureMatches: number[][];
	currentStructureMatch: number[];
	currentStructureMatchIndex: StructureMatchId;

	//Collapsible Table
	collapsibleRows: { [key: number]: Segment };
}


let searchTimeoutId;
let searchText: string = "";
let searchColumn: string = "All";
let logHeaderColumnTypes: StructureHeaderColumnType[] = [];

export default class App extends React.Component<Props, State> {
	// @ts-ignore
	vscode = acquireVsCodeApi();
	previousSession = this.vscode.getState();
	child = React.createRef<HTMLDivElement>();
	constructor(props: Props) {
		super(props);
		this.updateSearchMatches = this.updateSearchMatches.bind(this);

		this.state = defaultAppState;
		if (this.previousSession !== undefined) {
			searchText = this.previousSession.searchText;
			searchColumn = this.previousSession.searchColumn;
			["searchColumn", "searchText"].forEach(e => delete this.previousSession[e]);
			const { showFlagsDialog, showStatesDialog, showStructureDialog, ...updatedState } = this.previousSession;
			this.state = { ...this.state, ...updatedState }
		}

		this.onMessage = this.onMessage.bind(this);
		window.addEventListener("message", this.onMessage);
		document.addEventListener("contextmenu", (event) => {
			event.preventDefault();
		});
		this.vscode.postMessage({ type: "readFile" });
	}

	componentDidUpdate(prevProps: Props, prevState: State) {
		if (this.state !== prevState) {
			const { rules, logFile, logFileAsString, logEntryCharIndexMaps, ...updatedState } = this.state;
			this.vscode.setState({ ...updatedState, searchText, searchColumn })
		}
		if (this.state.logFile !== prevState.logFile ||
			this.state.collapsibleRows !== prevState.collapsibleRows) {
			this.render();
		}
	}

	onMessage(event: MessageEvent) {
		const message = event.data;
		if (message.type === "readFile") {
			const rules = message.rules.map((r) => Rule.fromJSON(r)).filter((r) => r);
			const lines = JSON.parse(message.text);
			const logFileText = JSON.stringify(lines, null, 2);
			const logEntryCharIndexMaps = useGetCharIndicesForLogEntries(logFileText);
			const logFile = LogFile.create(lines, rules);
			logFile.setSelectedColumns(this.state.selectedColumns, this.state.selectedColumnsMini);
			this.extractHeaderColumnTypes(logFile, rules);
			this.setState({
				rules,
				logFile,
				logFileAsString: logFileText,
				logEntryCharIndexMaps: logEntryCharIndexMaps,
			});

			if (!this.previousSession) {
				const newRowsProps = logFile.rows.map(() =>
					constructNewRowProperty(true, SelectedRowType.None),
				);
				this.setState({ rowProperties: newRowsProps });
			}
			else {
				const showFlagsDialog = this.previousSession.showFlagsDialog;
				const showStatesDialog = this.previousSession.showStatesDialog;
				const showStructureDialog = this.previousSession.showStructureDialog;
				this.setState({ showFlagsDialog, showStatesDialog, showStructureDialog });
			}
		}
	}

	extractHeaderColumnTypes(logFile: LogFile, rules: Rule[]) {
		logHeaderColumnTypes = [];
		for (let h = 0; h < logFile.headers.length; h++) {
			let headerType = StructureHeaderColumnType.Selected;

			if (logFile.headers[h].name.toLowerCase() === "timestamp") {
				headerType = StructureHeaderColumnType.Unselected;
			} else if (logFile.headers[h].name === "Line") {
				headerType = StructureHeaderColumnType.Custom;
			}

			rules.forEach((rule) => {
				if (rule.column === logFile.headers[h].name) {
					headerType = StructureHeaderColumnType.Custom;
				}
			});

			logHeaderColumnTypes.push(headerType);
		}
	}

	updateSearchField() {
		clearTimeout(searchTimeoutId);
		searchTimeoutId = setTimeout(this.updateSearchMatches, 1000);
	}

	clearSearchField() {
		searchText = "";
		const newRowsProps = this.clearRowsTypes();
		this.setState({
			filterSearch: false,
			rowProperties: newRowsProps,
			searchMatches: [],
			currentSearchMatch: null,
			currentSearchMatchIndex: null
		});
	}

	updateSearchMatches() {
		if (searchText === "")
			this.clearSearchField();
		else {
			const colIndex = this.state.logFile.headers.findIndex((h) => h.name === searchColumn);
			const searchMatches = returnSearchIndices(
				this.state.logFile.rows,
				colIndex,
				searchText,
				this.state.reSearch,
				this.state.wholeSearch,
				this.state.caseSearch,
			);

			const currentSearchMatch = searchMatches[0];
			const currentSearchMatchIndex = 0;
			const [rowProperties, filterSearch] = this.updateVisibleSearchMatches(searchMatches, this.state.filterSearch);

			this.setState({ searchMatches, currentSearchMatch, currentSearchMatchIndex, rowProperties, filterSearch });
		}
	}

	updateVisibleSearchMatches(searchMatches: number[], filterSearch: boolean) {
		let rowProperties;
		if (!filterSearch) {
			rowProperties = this.state.logFile.rows.map((row, index) => {
				if (searchMatches.includes(index))
					return constructNewRowProperty(true, SelectedRowType.SearchResult);
				else return constructNewRowProperty(true, SelectedRowType.None);
			});
		}
		else {
			rowProperties = this.state.logFile.rows.map((row, index) => {
				if (searchMatches.includes(index))
					return constructNewRowProperty(true, SelectedRowType.SearchResult);
				else return constructNewRowProperty(false, SelectedRowType.None);
			});
		}
		this.setState({ rowProperties, filterSearch });
		return [rowProperties, filterSearch];
	}

	handleAnnotationDialog(newRules: Rule[], isClose: boolean) {
		this.vscode.postMessage({ type: "saveRules", rules: newRules.map((r) => r.toJSON()) });
		if (isClose === true)
			this.setState({
				rules: newRules,
				logFile: this.state.logFile.updateLogFile(newRules, []),
				showStatesDialog: false,
				showFlagsDialog: false,
			});
		else this.setState({ rules: newRules });
	}

	handleSelectDialog(selectedCols: boolean[], selectedColsMini: boolean[], isClose: boolean) {
		if (isClose === true) {
			this.setState({
				selectedColumns: selectedCols,
				selectedColumnsMini: selectedColsMini,
				logFile: this.state.logFile.setSelectedColumns(selectedCols, selectedColsMini),
				showSelectDialog: false,
			});
		}
	}

	handleStructureDialog(isClosing: boolean) {
		if (isClosing === true) {
			this.handleStructureUpdate(isClosing);
		} else {
			const { logFile, rowProperties, rules, showStructureDialog } = this.state;

			const selectedLogRows = logFile.rows.filter(
				(v, i) => rowProperties[i].rowType === SelectedRowType.UserSelect,
			);

			if (selectedLogRows.length === 0) {
				return;
			}

			if (!showStructureDialog) {
				this.extractHeaderColumnTypes(logFile, rules);
				this.setState({ showStructureDialog: true });
			}

			this.setState({ selectedLogRows: selectedLogRows });
		}
	}

	handleRowCollapse(rowIndex: number, isRendered: boolean) {
		const newRowProps = this.state.rowProperties;
		newRowProps[rowIndex].isRendered = isRendered;
		this.setState({ rowProperties: newRowProps });
	}

	handleRowSelect(rowProperties: RowProperty[], rowIndex: number) {
		if (rowProperties[rowIndex].rowType !== SelectedRowType.UserSelect)
			return SelectedRowType.UserSelect;
		else if (this.state.searchMatches.includes(rowIndex))
			return SelectedRowType.SearchResult;
		else
			return SelectedRowType.None;
	}

	handleSelectedLogRow(rowIndex: number, event: React.MouseEvent) {
		if (event.ctrlKey) {
			const newRowProps = this.state.rowProperties;
			const { structureMatches, lastSelectedRow } = this.state;

			const structureMatchesLogRows = structureMatches.flat(1);

			if (!structureMatchesLogRows.includes(rowIndex)) {
				if (event.shiftKey && rowIndex !== this.state.lastSelectedRow) {
					// Shift click higher in the event log
					if (lastSelectedRow !== undefined && lastSelectedRow < rowIndex) {
						for (let i = lastSelectedRow + 1; i < rowIndex + 1; i++) {
							newRowProps[i].rowType = this.handleRowSelect(newRowProps, rowIndex);
						}
					}
					// Shift click lower in the event log
					else if (lastSelectedRow !== undefined && lastSelectedRow > rowIndex) {
						for (let i = rowIndex; i < lastSelectedRow + 1; i++) {
							newRowProps[i].rowType = this.handleRowSelect(newRowProps, rowIndex);
						}
					}
				} else {
					newRowProps[rowIndex].rowType = this.handleRowSelect(newRowProps, rowIndex);
				}

				this.setState({ rowProperties: newRowProps, lastSelectedRow: rowIndex });
			}
		}
	}

	clearRowsTypes(): RowProperty[] {
		const clearedSelectedRows = this.state.rowProperties.map(() =>
			constructNewRowProperty(true, SelectedRowType.None),
		);
		return clearedSelectedRows;
	}

	handleStructureUpdate(isClosing: boolean) {
		const clearedSelectedRows = this.clearRowsTypes();

		this.setState({
			showStructureDialog: !isClosing,
			rowProperties: clearedSelectedRows,
			structureMatches: [],
			currentStructureMatchIndex: null,
			currentStructureMatch: [],
			logFile: this.state.logFile.updateLogFile(this.state.rules, [])
		});
	}

	handleStructureMatching(expression: string) {
		const rowProperties = this.clearRowsTypes();
		const { logFileAsString, logEntryCharIndexMaps } = this.state;
		let { currentStructureMatch, currentStructureMatchIndex } = this.state;

		const structureMatches = useStructureRegularExpressionSearch(
			expression,
			logFileAsString,
			logEntryCharIndexMaps!,
		);

		if (structureMatches.length >= 1) {
			currentStructureMatchIndex = 0;
			currentStructureMatch = structureMatches[0];
		} else {
			currentStructureMatchIndex = null;
			currentStructureMatch = [];
		}

		this.setState({
			rowProperties,
			structureMatches,
			currentStructureMatch,
			currentStructureMatchIndex,
			logFile: this.state.logFile.updateLogFile(this.state.rules, structureMatches)
		});
	}

	handleNavigation(isGoingForward: boolean, isStructureMatching: boolean) {
		let matches, currentMatchIndex;
		if (!isStructureMatching) {
			matches = this.state.searchMatches;
			currentMatchIndex = this.state.currentSearchMatchIndex;
		}
		else {
			matches = this.state.structureMatches;
			currentMatchIndex = this.state.currentStructureMatchIndex;
		}

		if (currentMatchIndex !== null) {
			if (isGoingForward) {
				currentMatchIndex =
					currentMatchIndex < matches.length - 1
						? currentMatchIndex + 1
						: 0;
			} else {
				currentMatchIndex =
					currentMatchIndex > 0
						? currentMatchIndex - 1
						: matches.length - 1;
			}

			if (!isStructureMatching) {
				this.setState({
					currentSearchMatchIndex: currentMatchIndex,
					currentSearchMatch: matches[currentMatchIndex]
				});
			}
			else {
				this.setState({
					currentStructureMatch: matches[currentMatchIndex],
					currentStructureMatchIndex: currentMatchIndex,
				});
			}
		}
	}

	handleSegmentation(expression: string) {
		const { logFileAsString, logEntryCharIndexMaps } = this.state;
		const { collapsibleRows } = this.state;

		const segmentMatches = useStructureRegularExpressionNestedSearch(
			expression,
			logFileAsString,
			logEntryCharIndexMaps!,
		);

		let entryMatches: number[] = [];
		let exitMatches: number[] = [];
		segmentMatches.forEach((match) => {
			entryMatches.push(match[0])
			exitMatches.push(match[match.length - 1])
		})

		const stack: number[] = [];
		const maximumLevel = 5;
		let nextEntry = entryMatches.shift()!;
		let nextExit = exitMatches.shift()!;

		while (nextEntry !== undefined && nextExit !== undefined) {
			if (nextEntry < nextExit) {
				stack.push(nextEntry);
				nextEntry = entryMatches.shift()!;
			} else {
				const entry = stack.pop()!;
				if (stack.length <= maximumLevel - 1)
					collapsibleRows[entry] = constructNewSegment(entry, nextExit, stack.length);
				else console.log(`Maximum segment level reached: Discarding (${entry}, ${nextExit})`);
				nextExit = exitMatches.shift()!;
			}
		}
		if (nextExit !== undefined) {
			const entry = stack.pop()!;
			collapsibleRows[entry] = constructNewSegment(entry, nextExit, 0);
		}

		this.setState({ collapsibleRows });
	}

	clearSegmentation() {
		this.setState({ collapsibleRows: {} });
	}

	switchBooleanState(name: string) {
		switch (name) {
			case "coloredTable":
				this.setState(({ coloredTable }) => ({ coloredTable: !coloredTable }));
				break;
			case "reSearch":
				this.setState(({ reSearch }) => ({ reSearch: !reSearch }));
				break;
			case "wholeSearch":
				this.setState(({ wholeSearch }) => ({ wholeSearch: !wholeSearch }));
				break;
			case "caseSearch":
				this.setState(({ caseSearch }) => ({ caseSearch: !caseSearch }));
				break;
			case "filterSearch":
				this.setState(({ filterSearch }) => ({ filterSearch: !filterSearch }));
				break;
		}
	}

	exportData(exportIndices: number[]) {
		var exportObjects: Object[] = []
		const originalColumns = this.state.logFile.headers;
		if (exportIndices.length === 0)
			exportIndices = Array.from(Array(this.state.logFile.amountOfRows()).keys())
		for (var index of exportIndices) {
			var rowObject = {};
			const row = this.state.logFile.rows[index]
			for (var columnIndex = 0; columnIndex <= originalColumns.length-1; columnIndex++)
				rowObject[originalColumns[columnIndex].name] = row[columnIndex];
			exportObjects.push(rowObject)
		}
		this.vscode.postMessage({ type: "exportData", data: exportObjects });
	}

	render() {
		const minimapCounter = this.state.logFile.selectedColumnsMini.filter(Boolean).length;
		const minimapWidth = minimapCounter * MINIMAP_COLUMN_WIDTH;
		const minimapHeight = this.state.showMinimapHeader ? "12%" : "5%";

		const allColumns = [
			"All",
			...this.state.logFile.contentHeaders,
			...this.state.rules.map((i) => i.column),
		];
		return (
			<div
				id="container"
				style={{
					display: "flex",
					flexDirection: "column",
					height: "100vh",
					boxSizing: "border-box",
				}}
			>
				<div
					id="header"
					style={{
						display: "flex",
						flexDirection: "row",
						height: minimapHeight,
						boxSizing: "border-box",
					}}
				>
					<div style={{ display: "flex" }}>
						<VSCodeButton
							style={{ marginLeft: "5px", height: "25px", width: "125px" }}
							onClick={() => this.setState({ showSelectDialog: true })}
						>
							Choose Columns
						</VSCodeButton>
						<VSCodeButton
							style={{ marginLeft: "5px", height: "25px", width: "110px" }}
							onClick={() => this.exportData(this.state.searchMatches)}
						>
							Export
						</VSCodeButton>
					</div>
					<div style={{ flex: 1, display: "flex", justifyContent: "end" }}>
						<VSCodeDropdown
							key="searchDropdown"
							value={searchColumn}
							style={{ marginRight: "5px" }}
							onChange={(e) => { searchColumn = e.target.value; this.updateSearchField(); }}
						>
							{allColumns.map((col, col_i) => (
								<VSCodeOption key={col_i} value={col}>
									{col}
								</VSCodeOption>
							))}
						</VSCodeDropdown>
						<VSCodeTextField
							key="searchTextField"
							style={{ marginRight: "5px" }}
							placeholder="Search Text"
							value={searchText}
							onInput={(e) => { searchText = e.target.value; this.updateSearchField(); }}
							autofocus
						>
							<Tooltip title={<h3>Match Case</h3>} placement="bottom" arrow>
								<span
									slot="end"
									style={{
										backgroundColor: this.state.caseSearch ? "dodgerblue" : "",
										borderRadius: "20%",
										marginRight: "5px",
										cursor: "pointer",
									}}
									className="codicon codicon-case-sensitive"
									onClick={() => this.switchBooleanState("caseSearch")}
								></span>
							</Tooltip>
							<Tooltip title={<h3>Match Whole Word</h3>} placement="bottom" arrow>
								<span
									slot="end"
									style={{
										backgroundColor: this.state.wholeSearch ? "dodgerblue" : "",
										borderRadius: "20%",
										marginRight: "5px",
										cursor: "pointer",
									}}
									className="codicon codicon-whole-word"
									onClick={() => this.switchBooleanState("wholeSearch")}
								></span>
							</Tooltip>
							<Tooltip title={<h3>Use Regular Expression</h3>} placement="bottom" arrow>
								<span
									slot="end"
									style={{
										backgroundColor: this.state.reSearch ? "dodgerblue" : "",
										borderRadius: "20%",
										marginRight: "5px",
										cursor: "pointer",
									}}
									className="codicon codicon-regex"
									onClick={() => this.switchBooleanState("reSearch")}
								></span>
							</Tooltip>
							<Tooltip title={<h3>Clear</h3>} placement="bottom" arrow>
								<span
									slot="end"
									style={{ cursor: "pointer" }}
									className="codicon codicon-close"
									onClick={() => this.clearSearchField()}
								></span>
							</Tooltip>
						</VSCodeTextField>
						{" "}
						{this.state.searchMatches.length === 0
							? "No Results"
							: `${this.state.currentSearchMatchIndex! + 1} of ${this.state.searchMatches.length}`
						}
						<VSCodeButton
							className="structure-result-element"
							appearance="icon"
							disabled={this.state.searchMatches.length < 2}
							onClick={() => this.handleNavigation(false, false)}
						>
							<i className="codicon codicon-chevron-up" />
						</VSCodeButton>
						<VSCodeButton
							className="structure-result-element"
							appearance="icon"
							disabled={this.state.searchMatches.length < 2}
							onClick={() => this.handleNavigation(true, false)}
						>
							<i className="codicon codicon-chevron-down" />
						</VSCodeButton>
						{this.state.filterSearch && (
							<VSCodeButton
								className="structure-result-element"
								appearance="icon"
								disabled={this.state.searchMatches.length < 1}
								onClick={() => { this.updateVisibleSearchMatches(this.state.searchMatches, false); }}
							>
								<i className="codicon codicon-filter-filled" />
							</VSCodeButton>
						)}
						{!this.state.filterSearch && (
							<VSCodeButton
								className="structure-result-element"
								appearance="icon"
								disabled={this.state.searchMatches.length < 1}
								onClick={() => { this.updateVisibleSearchMatches(this.state.searchMatches, true); }}
							>
								<i className="codicon codicon-filter" />
							</VSCodeButton>
						)}
						{this.state.showMinimapHeader && (
							<VSCodeButton
								appearance="icon"
								onClick={() => this.setState({ showMinimapHeader: false })}
							>
								<i className="codicon codicon-arrow-down" />
							</VSCodeButton>
						)}
						{!this.state.showMinimapHeader && (
							<VSCodeButton
								appearance="icon"
								onClick={() => this.setState({ showMinimapHeader: true })}
							>
								<i className="codicon codicon-arrow-up" />
							</VSCodeButton>
						)}
					</div>
					{!this.state.showMinimapHeader && (
						<div className="header-background" style={{ width: minimapWidth }}></div>
					)}
					{this.state.showMinimapHeader && (
						<div
							className="header-background"
							style={{ width: minimapWidth, ...COLUMN_2_HEADER_STYLE }}
						>
							<MinimapHeader logFile={this.state.logFile} />
						</div>
					)}
				</div>
				<div
					id="LogViewAndMinimap"
					style={{
						display: "flex",
						flexDirection: "row",
						height: `calc(100% - ${minimapHeight})`,
						overflow: "auto",
						boxSizing: "border-box",
					}}
				>
					<div style={{ flex: 1, display: "flex" }}>
						<LogView
							logFile={this.state.logFile}
							previousSessionLogView={this.previousSession?.logViewState}
							onLogViewStateChanged={(logViewState) => this.setState({ logViewState })}
							forwardRef={this.child}
							filterSearch={this.state.filterSearch}
							coloredTable={this.state.coloredTable}
							rowProperties={this.state.rowProperties}
							structureMatches={this.state.structureMatches}
							currentStructureMatch={this.state.currentStructureMatch}
							currentSearchMatch={this.state.currentSearchMatch}
							onSelectedRowsChanged={(index, e) => this.handleSelectedLogRow(index, e)}
							onRowPropsChanged={(index, isRendered) => this.handleRowCollapse(index, isRendered)}
							collapsibleRows={this.state.collapsibleRows}
							clearSegmentation={() => this.clearSegmentation()}
						/>
					</div>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							width: minimapWidth,
							boxSizing: "border-box",
						}}
					>
						<div className="header-background" style={COLUMN_0_HEADER_STYLE}>
							<Tooltip
								title={<h3>Create a structure from selected rows</h3>}
								placement="bottom"
								arrow
							>
								<VSCodeButton
									appearance="icon"
									onClick={() => this.handleStructureDialog(false)}
								>
									<i className="codicon codicon-three-bars" />
								</VSCodeButton>
							</Tooltip>
							<Tooltip
								title={<h3>Create/Modify Flag Annotations Columns</h3>}
								placement="bottom"
								arrow
							>
								<VSCodeButton
									appearance="icon"
									onClick={() => this.setState({ showFlagsDialog: true })}
								>
									<i className="codicon codicon-tag" />
								</VSCodeButton>
							</Tooltip>
							<Tooltip
								title={<h3>Create/Modify State-Based Annotation Columns</h3>}
								placement="bottom"
								arrow
							>
								<VSCodeButton
									appearance="icon"
									onClick={() => this.setState({ showStatesDialog: true })}
								>
									<i className="codicon codicon-settings-gear" />
								</VSCodeButton>
							</Tooltip>
							<VSCodeButton
								appearance="icon"
								onClick={() => this.switchBooleanState("coloredTable")}
							>
								<i className="codicon codicon-symbol-color" />
							</VSCodeButton>
						</div>
						{this.state.logViewState && (
							<MinimapView
								logFile={this.state.logFile}
								logViewState={this.state.logViewState}
								onLogViewStateChanged={(logViewState) => this.setState({ logViewState })}
								forwardRef={this.child}
								rowProperties={this.state.rowProperties}
							/>
						)}
					</div>
					{this.state.showStatesDialog && (
						<StatesDialog
							logFile={this.state.logFile}
							initialRules={this.state.rules}
							onClose={(newRules) => this.handleAnnotationDialog(newRules, true)}
							onReturn={(newRules) => this.handleAnnotationDialog(newRules, false)}
						/>
					)}
					{this.state.showFlagsDialog && (
						<FlagsDialog
							logFile={this.state.logFile}
							initialRules={this.state.rules}
							onClose={(newRules) => this.handleAnnotationDialog(newRules, true)}
							onReturn={(newRules) => this.handleAnnotationDialog(newRules, false)}
						/>
					)}
					{this.state.showSelectDialog && (
						<SelectColDialog
							logFile={this.state.logFile}
							onClose={(selectedColumns, selectedColumnsMini) =>
								this.handleSelectDialog(selectedColumns, selectedColumnsMini, true)
							}
						/>
					)}
				</div>
				<div
					id="StructureDialog"
					style={{ display: "flex", position: "relative", boxSizing: "border-box" }}
				>
					{this.state.showStructureDialog && (
						<StructureDialog
							logHeaderColumns={this.state.logFile.headers}
							logHeaderColumnsTypes={logHeaderColumnTypes}
							logSelectedRows={this.state.selectedLogRows}
							currentStructureMatchIndex={this.state.currentStructureMatchIndex}
							numberOfMatches={this.state.structureMatches.length}
							onClose={() => this.handleStructureDialog(true)}
							onStructureUpdate={() => this.handleStructureUpdate(false)}
							onMatchStructure={(expression) => this.handleStructureMatching(expression)}
							onDefineSegment={(expression) => this.handleSegmentation(expression)}
							onNavigateStructureMatches={(isGoingForward) =>
								this.handleNavigation(isGoingForward, true)
							}
							onExportStructureMatches={() => this.exportData(this.state.structureMatches.flat(1))}
						/>
					)}
				</div>
			</div>
		);
	}
}
