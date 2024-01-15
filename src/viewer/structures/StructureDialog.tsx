import React from "react";
import Tooltip, { TooltipProps, tooltipClasses } from "@mui/material/Tooltip";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from '@mui/material/IconButton';
import StructureTable from "./StructureTable";
import { ContextMenuItem, Header, StructureDefinition, StructureEntry, Wildcard } from "../types";
import { StructureHeaderColumnType } from "../constants";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
import { useStructureQueryConstructor } from "../hooks/useStructureRegularExpressionManager";
import {
	constructStructureEntriesArray,
	appendNewStructureEntries,
	removeStructureEntryFromList,
	toggleCellSelection,
	toggleStructureLink,
	removeLastStructureLink,
	addWildcardToStructureEntry,
	removeWildcardFromStructureEntry,
	updateStructureEntriesAfterWildcardDeletion,
} from "../hooks/useStructureEntryManager";
import {
	createWildcard,
	getIndicesForWildcardFromDivId,
	insertWildcardIntoCellsContents,
	removeWildcardSubstitution,
	removeWildcardSubstitutionsForStructureEntry,
	getWildcardIndex,
	removeWildcardFromCellContent,
} from "../hooks/useWildcardManager";
import { structureDialogBackdropStyle, structureDialogDialogStyle } from "../hooks/useStyleManager";
import isEqual from "react-fast-compare";
import cloneDeep from "lodash/cloneDeep";
import ContextMenu from "../contextMenu/contextMenu";
import { styled } from "@mui/material/styles";
import { StructureSettingsDropdown } from "./StructureSettingsDropdown";

interface Props {
	logHeaderColumns: Header[];
	logHeaderColumnsTypes: StructureHeaderColumnType[];
	logSelectedRows: string[][];
	loadedStructureDefinition: StructureDefinition | null;
	currentStructureMatchIndex: number | null;
	numberOfMatches: number;
	onClose: () => void;
	onStructureUpdate: () => void;
	onNavigateStructureMatches: (isGoingForward: boolean) => void;
	onMatchStructure: (expression: string) => void;
	onStructureDefinitionSave:(structureDefinition: string) => void;
	onStructureDefinitionLoad:() => void;
	onExportStructureMatches: () => void;
	onDefineSegment: (expression: string) => void;
}

interface State {
	wildcards: Wildcard[];
	structureEntries: StructureEntry[];
	isRemovingStructureEntries: boolean;
	isLoadingStructureDefintion: boolean;
	isStructureMatching: boolean;
	structureHeaderColumns: Header[];
	structureHeaderColumnsTypes: StructureHeaderColumnType[];
}

export default class StructureDialog extends React.Component<Props, State> {

	constructor(props: Props) {
		super(props);
		const { logHeaderColumns, logHeaderColumnsTypes, logSelectedRows } = this.props;
		let structureEntries = constructStructureEntriesArray(logHeaderColumnsTypes, logSelectedRows);
		structureEntries = removeLastStructureLink(structureEntries);

		this.state = {
			isRemovingStructureEntries: false,
			isLoadingStructureDefintion: false,
			isStructureMatching: this.props.numberOfMatches > 0 ? true : false,
			structureHeaderColumns: logHeaderColumns,
			structureHeaderColumnsTypes: logHeaderColumnsTypes,
			structureEntries: structureEntries,
			wildcards: [],
		};

		//bind context for all functions used by the context and dropdown menus:
		this.createWildcard = this.createWildcard.bind(this);
		this.saveStructureDefinition = this.saveStructureDefinition.bind(this);
		this.loadStructureDefinition = this.loadStructureDefinition.bind(this);
	}

	componentDidMount(): void {
		// trigger manually, as update function isn't called for initial render.
		// removing the trigger to keep persistence
		//this.props.onStructureUpdate(); 
	}

	shouldComponentUpdate(
		nextProps: Readonly<Props>,
		nextState: Readonly<State>,
		_nextContext: any,
	): boolean {
		const isLoadingStructureDefinition = (
			nextProps.loadedStructureDefinition !== null
		);
		const arelogHeaderColumnsUpdating = !isEqual(
			this.props.logHeaderColumns,
			nextProps.logHeaderColumns,
		);
		const arelogHeaderColumnTypesUpdating = !isEqual(
			this.props.logHeaderColumnsTypes,
			nextProps.logHeaderColumnsTypes,
		);
		const arelogSelectedRowsUpdating = !isEqual(
			this.props.logSelectedRows,
			nextProps.logSelectedRows,
		);
		const isCurrentMatchIndexUpdating = !isEqual(
			this.props.currentStructureMatchIndex,
			nextProps.currentStructureMatchIndex,
		);
		const isNumberOfMatchesUpdating = !isEqual(
			this.props.numberOfMatches,
			nextProps.numberOfMatches,
		);

		const areHeaderColumnTypesUpdating = !isEqual(
			this.state.structureHeaderColumnsTypes,
			nextState.structureHeaderColumnsTypes,
		);
		const areStateEntriesUpdating = !isEqual(
			this.state.structureEntries,
			nextState.structureEntries,
		);
		const areWildcardsUpdating = !isEqual(this.state.wildcards, nextState.wildcards);
		const isRemovingStructureEntriesUpdating = !isEqual(
			this.state.isRemovingStructureEntries,
			nextState.isRemovingStructureEntries,
		);
		const isStructureMatchingUpdating = !isEqual(
			this.state.isStructureMatching,
			nextState.isStructureMatching,
		);

		if (
			isLoadingStructureDefinition ||
			arelogHeaderColumnsUpdating ||
			arelogHeaderColumnTypesUpdating ||
			arelogSelectedRowsUpdating ||
			isCurrentMatchIndexUpdating ||
			isNumberOfMatchesUpdating ||
			areHeaderColumnTypesUpdating ||
			areStateEntriesUpdating ||
			areWildcardsUpdating ||
			isRemovingStructureEntriesUpdating ||
			isStructureMatchingUpdating
		) {
			return true;
		}

		return false;
	}

	componentDidUpdate(prevProps: Readonly<Props>, _prevState: Readonly<State>): void {
		const {loadedStructureDefinition, logSelectedRows} = this.props;

		if(this.state.isLoadingStructureDefintion && loadedStructureDefinition !== null) {
			this.setState({
				isLoadingStructureDefintion: false,
				isStructureMatching: false,
				structureHeaderColumns: loadedStructureDefinition.headerColumns,
				structureHeaderColumnsTypes: loadedStructureDefinition.headerColumnsTypes,
				structureEntries: loadedStructureDefinition.entries, 
				wildcards: loadedStructureDefinition.wildcards});
			
			this.props.onStructureUpdate();
		}
		else if (logSelectedRows !== prevProps.logSelectedRows) {
			this.updateStructure();
		}
	}

	updateStructure() {
		const { structureHeaderColumnsTypes, structureEntries } = this.state;
		const structureEntriesCopy = cloneDeep(structureEntries);
		const newSelectedRows = this.props.logSelectedRows.filter(
			(entry) => !structureEntriesCopy.some((value) => isEqual(value.row, entry)),
		);

		if (newSelectedRows.length !== 0) {
			const newStructureEntries = constructStructureEntriesArray(
				structureHeaderColumnsTypes,
				newSelectedRows,
			);
			const finalStructureEntries = appendNewStructureEntries(
				structureEntriesCopy,
				newStructureEntries,
			);
			this.setState({
				structureEntries: finalStructureEntries,
				isStructureMatching: false,
			});
		}

		this.props.onStructureUpdate();
	}

	getContextMenuItems() {
		const contextMenuItems: ContextMenuItem[] = [];

		const createWildcardItem: ContextMenuItem = {
			text: "Create wildcard",
			callback: () => this.createWildcard(),
		};

		contextMenuItems.push(createWildcardItem);

		if (this.state.wildcards.length > 0) {
			this.state.wildcards.forEach((wc, index) => {
				const useWildcardItem: ContextMenuItem = {
					text: `Use wildcard ?${index + 1}`,
					callback: () => this.useWildcard(index),
				};

				contextMenuItems.push(useWildcardItem);
			});

			const removeWildcardItem: ContextMenuItem = {
				text: "Remove wildcard",
				callback: (anchorDivId) => this.removeWildcard(anchorDivId),
			};

			contextMenuItems.push(removeWildcardItem);
		}

		return contextMenuItems;
	}

	removeStructureEntry(rowIndex: number) {
		const { structureEntries, wildcards } = this.state;
		const wildcardsCopy = cloneDeep(wildcards);

		const wildcardRemovalResults = removeWildcardSubstitutionsForStructureEntry(
			wildcardsCopy,
			rowIndex,
		);
		const modifiedWildcards = wildcardRemovalResults.modifiedWildcards;

		const remainingEntries = removeStructureEntryFromList(structureEntries, rowIndex);

		wildcardRemovalResults.indicesOfWildcardsToBeRemoved.forEach((index) => {
			updateStructureEntriesAfterWildcardDeletion(remainingEntries, modifiedWildcards, index);
		});

		if (remainingEntries.length === 0) {
			this.props.onClose();
		} else {
			this.props.onStructureUpdate();
			this.setState({
				structureEntries: remainingEntries,
				wildcards: modifiedWildcards,
				isStructureMatching: false,
			});
		}
	}

	toggleIsRemovingStructureEntries() {
		const isRemovingStructureEntries = this.state.isRemovingStructureEntries;
		this.setState({
			isRemovingStructureEntries: !isRemovingStructureEntries,
		});
	}

	toggleIsCellSelected(
		structureEntryIndex: number,
		cellIndex: number,
		isCtrlPressed: boolean,
		isShiftPressed: boolean,
	) {
		if (isCtrlPressed) {
			const { structureHeaderColumnsTypes, structureEntries } = this.state;
			let structureEntriesCopy = cloneDeep(structureEntries);

			structureEntriesCopy = toggleCellSelection(
				structureHeaderColumnsTypes,
				structureEntriesCopy,
				structureEntryIndex,
				cellIndex,
				isShiftPressed,
			);

			this.setState({ structureEntries: structureEntriesCopy });
		}
	}

	toggleStructureLink(structureEntryIndex: number) {
		let { structureEntries } = this.state;
		const structureEntriesCopy = cloneDeep(structureEntries);

		structureEntries = toggleStructureLink(structureEntriesCopy, structureEntryIndex);

		this.setState({ structureEntries: structureEntries });
	}

	matchStructure() {
		// pass list of wildcards and use those in regular expression construction
		const structureRegExp = useStructureQueryConstructor(
			this.state.structureHeaderColumns,
			this.state.structureHeaderColumnsTypes,
			this.state.structureEntries,
			this.state.wildcards,
		);

		this.props.onMatchStructure(structureRegExp);
		this.setState({ isStructureMatching: true });
	}

	defineSegment() {
		const segmentRegExp = useStructureQueryConstructor(
			this.state.structureHeaderColumns,
			this.state.structureHeaderColumnsTypes,
			this.state.structureEntries,
			this.state.wildcards,
		);

		this.props.onDefineSegment(segmentRegExp);
	}

	createWildcard() {
		const selection = getSelection();
		const range = selection!.getRangeAt(0);
		const startNode = range.startContainer;
		const endNode = range.endContainer;
		const startOffset = range.startOffset;
		const endOffset = range.endOffset;
		const parentDivId = (startNode.parentNode as Element).id;

		if (startNode.textContent === endNode.textContent && startOffset !== endOffset) {
			const { structureEntries, wildcards } = this.state;
			const structureEntriesCopy: StructureEntry[] = cloneDeep(structureEntries);
			let wildcardsCopy: Wildcard[] = cloneDeep(wildcards);

			const indicesForWildcard = getIndicesForWildcardFromDivId(parentDivId);

			const entryIndex = +indicesForWildcard[1];
			const cellIndex = +indicesForWildcard[2];
			const contentsIndex = +indicesForWildcard[3];

			const newWildcard = createWildcard(entryIndex, cellIndex, contentsIndex);

			wildcardsCopy.push(newWildcard);

			const wildcardIndex = wildcardsCopy.length - 1;
			const modifiedStructureEntries = addWildcardToStructureEntry(
				structureEntriesCopy,
				entryIndex,
				cellIndex,
				wildcardIndex,
			);

			const insertionResults = insertWildcardIntoCellsContents(
				structureEntriesCopy[entryIndex].row[cellIndex],
				wildcardsCopy,
				entryIndex,
				cellIndex,
				wildcardIndex,
				contentsIndex,
				startOffset,
				endOffset,
			);
			structureEntriesCopy[entryIndex].row[cellIndex] = insertionResults.cellContents;
			wildcardsCopy = insertionResults.wildcards;

			wildcardsCopy[wildcardIndex].wildcardSubstitutions[0].contentsIndex =
				insertionResults.insertedWildcardContentsIndex;

			this.setState({
				structureEntries: modifiedStructureEntries,
				wildcards: wildcardsCopy,
			});
		}
	}

	useWildcard(wildcardIndex: number) {
		const selection = getSelection();
		const range = selection!.getRangeAt(0);
		const startNode = range.startContainer;
		const endNode = range.endContainer;
		const startOffset = range.startOffset;
		const endOffset = range.endOffset;
		const parentDivId = (startNode.parentNode as Element).id;

		if (startNode.textContent === endNode.textContent && startOffset !== endOffset) {
			const { structureEntries, wildcards } = this.state;
			const structureEntriesCopy: StructureEntry[] = cloneDeep(structureEntries);
			let wildcardsCopy: Wildcard[] = cloneDeep(wildcards);

			const indicesForWildcard = getIndicesForWildcardFromDivId(parentDivId);

			const entryIndex = +indicesForWildcard[1];
			const cellIndex = +indicesForWildcard[2];
			const contentsIndex = +indicesForWildcard[3];

			const modifiedStructureEntries = addWildcardToStructureEntry(
				structureEntriesCopy,
				entryIndex,
				cellIndex,
				wildcardIndex,
			);

			const insertionResults = insertWildcardIntoCellsContents(
				structureEntriesCopy[entryIndex].row[cellIndex],
				wildcardsCopy,
				entryIndex,
				cellIndex,
				wildcardIndex,
				contentsIndex,
				startOffset,
				endOffset,
			);
			structureEntriesCopy[entryIndex].row[cellIndex] = insertionResults.cellContents;
			wildcardsCopy = insertionResults.wildcards;

			const newWildcardSubstitution = {
				entryIndex: entryIndex,
				cellIndex: cellIndex,
				contentsIndex: insertionResults.insertedWildcardContentsIndex,
			};
			wildcardsCopy[wildcardIndex].wildcardSubstitutions.push(newWildcardSubstitution);

			this.setState({
				structureEntries: modifiedStructureEntries,
				wildcards: wildcardsCopy,
			});
		}
	}

	removeWildcard(anchorDivId: string) {
		const isAnchorDivWildcard = anchorDivId[0] === "w";

		if (isAnchorDivWildcard) {
			const indicesForWildcard = anchorDivId.split("-");
			const entryIndex = +indicesForWildcard[1];
			const cellIndex = +indicesForWildcard[2];
			const contentsIndex = +indicesForWildcard[3];

			const { structureEntries, wildcards } = this.state;
			const structureEntriesCopy: StructureEntry[] = cloneDeep(structureEntries);
			let wildcardsCopy: Wildcard[] = cloneDeep(wildcards);

			const wildcardIndex = getWildcardIndex(wildcardsCopy, entryIndex, cellIndex, contentsIndex);

			const wildcardsUpdateResult = removeWildcardSubstitution(
				wildcardsCopy,
				wildcardIndex,
				entryIndex,
				cellIndex,
				contentsIndex,
			);
			wildcardsCopy = wildcardsUpdateResult.wildcards;

			let modifiedStructureEntries = removeWildcardFromStructureEntry(
				structureEntriesCopy,
				entryIndex,
				cellIndex,
				wildcardIndex,
			);

			const removalResults = removeWildcardFromCellContent(
				structureEntriesCopy[entryIndex].row[cellIndex],
				wildcardsCopy,
				entryIndex,
				cellIndex,
				contentsIndex,
			);
			structureEntriesCopy[entryIndex].row[cellIndex] = removalResults.cellContents;

			wildcardsCopy = removalResults.wildcards;

			if (wildcardsUpdateResult.isWildcardDeleted) {
				modifiedStructureEntries = updateStructureEntriesAfterWildcardDeletion(
					modifiedStructureEntries,
					wildcardsCopy,
					wildcardIndex,
				);
			}

			this.props.onStructureUpdate();

			this.setState({
				structureEntries: modifiedStructureEntries,
				wildcards: wildcardsCopy,
				isStructureMatching: false,
			});
		}
	}

	saveStructureDefinition() {
		const {structureHeaderColumns, structureHeaderColumnsTypes, structureEntries, wildcards} = this.state;
		const {onStructureDefinitionSave} = this.props;

		const structureDefiniton: StructureDefinition = { headerColumns: structureHeaderColumns, headerColumnsTypes: structureHeaderColumnsTypes, entries: structureEntries, wildcards: wildcards};
		const structureDefinitonJSON = JSON.stringify(structureDefiniton);

		onStructureDefinitionSave(structureDefinitonJSON);
	}

	loadStructureDefinition() {
		this.props.onStructureDefinitionLoad();
		this.setState({isLoadingStructureDefintion:true});
	}

	render() {
		const { structureEntries, wildcards, isRemovingStructureEntries, isStructureMatching } =
			this.state;
		const structureEntriesCopy = cloneDeep(structureEntries);
		const wildcardsCopy = cloneDeep(wildcards);
		const contextMenuItems = this.getContextMenuItems();

		const CustomWidthTooltip = styled(({ className, ...props }: TooltipProps) => (
			<Tooltip {...props} classes={{ popper: className }} />
		))({
			[`& .${tooltipClasses.tooltip}`]: {
				maxWidth: 900,
			},
		});

		const selection = getSelection();

		if (selection !== null) {
			// empty unwanted text selection resulting from Shift-click
			selection.empty();
		}

		return (
			<div style={structureDialogBackdropStyle}>
				<div className="dialog" style={structureDialogDialogStyle}>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							flexDirection: "row",
							alignItems: "top",
						}}
					>
						<div className="title-small">Structure Matching</div>
						<div
							style={{
								display: "flex",
								flexDirection: "row",
								alignItems: "center",
								justifyContent: "space-between"
							}}
						>
							<CustomWidthTooltip
								title={
									<>
										<h2 style={{ fontSize: "32px", fontWeight: "bold" }}>Help</h2>
										<ul>
											<li style={{ fontSize: "14px", padding: "10px", listStyleType: "circle" }}>
												<b>Ignoring cells</b>: Hold <b>CTRL</b> and click on a cell to ignore it or
												stop ignoring it. Hold <b>SHIFT+CTRL</b> to ignore the cell and stop
												ignoring all others, or ignore all other cells instead.{" "}
											</li>
											<li style={{ fontSize: "14px", padding: "10px", listStyleType: "circle" }}>
												<b>Constraining distance between structure rows</b>: Change the constraint
												on the distance between two rows by clicking on the link icon between them.
												This icon is three horizontal dots by default.
											</li>
											<li style={{ fontSize: "14px", padding: "10px", listStyleType: "circle" }}>
												<b>Creating wildcards</b>: Selecting a part of the text in a cell, right
												click and select &quot;<i>Create wildcard</i>&quot; to create a new
												wildcard. A wildcard can be used to abstract away any specific data.
											</li>
											<li style={{ fontSize: "14px", padding: "10px", listStyleType: "circle" }}>
												<b>Using wildcards</b>: Selecting a part of the text in a cell, right click
												and select &quot;<i>Use wildcard wildcard id</i>&quot;. Any value could be
												abstracted by the wildcard, but the value has to be the same in all places
												where this wildcard is used.
											</li>
											<li style={{ fontSize: "14px", padding: "10px", listStyleType: "circle" }}>
												<b>Removing wildcards</b>: Hover over a wildcard, right click and select
												&quot;<i>Remove wildcard</i>&quot;. If the wildcard is used in multiple
												places, only the selected one will be removed.
											</li>
											<li style={{ fontSize: "14px", padding: "10px", listStyleType: "circle" }}>
												<b>Removing rows</b>: Click on the <b>Remove rows</b> button on the bottom
												right of the dialogue. A red cross will appear to the left of every row in
												the structure, by clicking on a cross, the row will be removed from the
												structure. Click the<b>Done</b> button afterwards.
											</li>
										</ul>
									</>
								}
								sx={{ m: 1 }}
								placement="right"
								arrow
							>
								<i className="codicon codicon-question" />
							</CustomWidthTooltip>
                            <StructureSettingsDropdown
								 onStructureDefinitionSave={this.saveStructureDefinition} 
								 onStructureDefinitionLoad={this.loadStructureDefinition}/>
                            <IconButton
                                    id="close-button"
                                    aria-label="close"
                                    size="small"
									style={{ flex: 1 }}
                                    onClick={() => this.props.onClose()}>
                                <CloseIcon className="structure-dialog-icon" fontSize="small"/>
                            </IconButton>
						</div>
					</div>
					<StructureTable
						headerColumns={this.state.structureHeaderColumns}
						structureEntries={structureEntriesCopy}
						wildcards={wildcardsCopy}
						isRemovingStructureEntries={isRemovingStructureEntries}
						onToggleIsCellSelected={(
							structureEntryIndex,
							cellIndex,
							isCtrlPressed,
							isShiftPressed,
						) =>
							this.toggleIsCellSelected(
								structureEntryIndex,
								cellIndex,
								isCtrlPressed,
								isShiftPressed,
							)
						}
						onToggleStructureLink={(structureEntryIndex) =>
							this.toggleStructureLink(structureEntryIndex)
						}
						onStructureEntryRemoved={(structureEntryIndex) =>
							this.removeStructureEntry(structureEntryIndex)
						}
					/>
					<ContextMenu items={contextMenuItems} parentDivId="StructureDialog" />
					<div style={{ textAlign: "right", padding: "5px" }}>
						<VSCodeButton
							className="structure-result-element"
							onClick={() => {
								this.defineSegment();
							}}
							disabled={this.state.structureEntries.length === 1}
						>
							Create Segment
						</VSCodeButton>
						<VSCodeButton
							className="structure-result-element"
							onClick={() => {
								this.toggleIsRemovingStructureEntries();
							}}
						>
							{isRemovingStructureEntries ? "Done" : "Remove rows"}
						</VSCodeButton>
						<VSCodeButton
							className="structure-result-element"
							onClick={() => {
								this.matchStructure();
							}}
							disabled={isRemovingStructureEntries}
						>
							Search for Structure
						</VSCodeButton>
						<VSCodeButton
							className="structure-result-element"
							onClick={() => {
								this.props.onExportStructureMatches();
							}}
							disabled={this.props.numberOfMatches == 0}
						>
							Export Structures
						</VSCodeButton>
						{isStructureMatching && (
							<>
								<div
									className="structure-result-element"
									style={{
										display: "inline-block",
										padding: "3.75px",
									}}
								>
									{" "}
									{this.props.currentStructureMatchIndex === null
										? 0
										: this.props.currentStructureMatchIndex! + 1}{" "}
									of {this.props.numberOfMatches}
								</div>
								{this.props.numberOfMatches > 1 && (
									<>
										<VSCodeButton
											className="structure-result-element"
											appearance="icon"
											onClick={() => this.props.onNavigateStructureMatches(false)}
										>
											<i className="codicon codicon-chevron-up" />
										</VSCodeButton>
										<VSCodeButton
											className="structure-result-element"
											appearance="icon"
											onClick={() => this.props.onNavigateStructureMatches(true)}
										>
											<i className="codicon codicon-chevron-down" />
										</VSCodeButton>
									</>
								)}
							</>
						)}
					</div>
				</div>
			</div>
		);
	}
}
