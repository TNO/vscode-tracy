import React from "react";
import { VSCodeButton, VSCodeDivider } from "@vscode/webview-ui-toolkit/react";

interface Props {
	columns: { name?: string; width: string }[];
	rows: (JSX.Element | string)[][][];
	hideHeader?: boolean;
	noRowsText?: string;
	highlightRow?: number | null;
	onAddConditionAction?: (transition_index: number) => void;
	onDeleteConditionAction?: (transition_index: number, condition_index: number) => void;
	onAddTransitionAction?: () => void;
	onDeleteTransitionAction?: (transition_index: number) => void;
}

const ACTIONS_WIDTH = "50px";

export default class TransitionTable extends React.Component<Props> {
	render() {
		return (
			<div style={{ width: "100%" }}>
				{this.props.rows.map((transition, t_index) => (
					<div key={t_index}>
						<table style={{ width: "100%", borderSpacing: 0, marginBottom: "50px" }}>
							<tbody>
								<tr>
									<td colSpan={this.props.columns.length + 1} style={{ textAlign: "center" }}>
										<div className="title-small">Transition {t_index + 1}</div>
									</td>
								</tr>

								{!this.props.hideHeader && (
									<tr>
										{this.props.columns.map((c, i) => (
											<th key={i} style={{ textAlign: "left", width: c.width, fontWeight: 200 }}>
												{c.name ?? ""}
											</th>
										))}
										{this.props.onDeleteConditionAction && (
											<th style={{ textAlign: "right", width: ACTIONS_WIDTH }}>Actions</th>
										)}
									</tr>
								)}
								{/* {(transition.length >= 0) && 
                                    <tr>
                                        <td rowSpan={transition.length + 1}>Transition {t_index + 1}</td>
                                    </tr>
                                } */}
								{transition.length > 0 &&
									transition.map((condition, c_index) => {
										return (
											<tr
												key={c_index}
												className={
													c_index === this.props.highlightRow ? "list-hover-background" : ""
												}
											>
												{c_index === 0 && <td width={this.props.columns[0].width}></td>}
												{c_index > 0 && <td width={this.props.columns[0].width}>and </td>}
												{condition.map((r, ii) => (
													<td key={ii} width={this.props.columns[ii].width}>
														{r}
													</td>
												))}
												{this.props.onDeleteConditionAction && (
													<td width={ACTIONS_WIDTH}>
														<div style={{ textAlign: "right" }}>
															{this.props.onDeleteConditionAction && (
																<VSCodeButton
																	appearance="icon"
																	onClick={() =>
																		this.props.onDeleteConditionAction?.(t_index, c_index)
																	}
																>
																	<i className="codicon codicon-trash" />
																</VSCodeButton>
															)}
														</div>
													</td>
												)}
											</tr>
										);
									})}
								{this.props.onAddConditionAction &&
									this.props.noRowsText &&
									transition.length === 0 && (
										<tr>
											<td colSpan={this.props.columns.length + 1} style={{ textAlign: "center" }}>
												<i>{this.props.noRowsText}</i>
											</td>
										</tr>
									)}
								{this.props.onAddConditionAction && (
									<tr>
										<td colSpan={this.props.columns.length + 1} style={{ textAlign: "right" }}>
											<VSCodeButton
												appearance="icon"
												onClick={() => this.props.onAddConditionAction?.(t_index)}
											>
												<i className="codicon codicon-plus" />
											</VSCodeButton>
										</td>
									</tr>
								)}
								{this.props.onAddTransitionAction && transition.length > 0 && (
									<tr>
										<td colSpan={this.props.columns.length + 1} style={{ textAlign: "center" }}>
											<VSCodeDivider style={{ margin: "10px" }} />
										</td>
									</tr>
								)}
								{this.props.onAddTransitionAction &&
									this.props.rows.length == 1 &&
									transition.length > 0 && (
										<tr>
											<td colSpan={2} style={{ textAlign: "left", marginTop: "10px" }}>
												<VSCodeButton
													style={{ border: "1px", borderColor: "white", borderStyle: "solid" }}
													appearance="icon"
													onClick={() => this.props.onDeleteTransitionAction?.(t_index)}
												>
													Delete Transition
												</VSCodeButton>
											</td>
											<td
												colSpan={this.props.columns.length - 1}
												style={{ textAlign: "right", marginTop: "10px" }}
											>
												<VSCodeButton
													style={{ border: "1px", borderColor: "white", borderStyle: "solid" }}
													appearance="icon"
													onClick={() => this.props.onAddTransitionAction?.()}
												>
													Add Transition
												</VSCodeButton>
											</td>
										</tr>
									)}
								{this.props.onAddTransitionAction && this.props.rows.length > 1 && (
									<tr>
										<td colSpan={2} style={{ textAlign: "left", marginTop: "10px" }}>
											<VSCodeButton
												style={{ border: "1px", borderColor: "white", borderStyle: "solid" }}
												appearance="icon"
												onClick={() => this.props.onDeleteTransitionAction?.(t_index)}
											>
												Delete Transition
											</VSCodeButton>
										</td>
										{t_index === this.props.rows.length - 1 && (
											<td
												colSpan={this.props.columns.length - 1}
												style={{ textAlign: "right", marginTop: "10px" }}
											>
												<VSCodeButton
													style={{ border: "1px", borderColor: "white", borderStyle: "solid" }}
													appearance="icon"
													onClick={() => this.props.onAddTransitionAction?.()}
												>
													Add Transition
												</VSCodeButton>
											</td>
										)}
									</tr>
								)}
							</tbody>
						</table>
					</div>
				))}
			</div>
		);
	}
}
