import React from "react";
import LogFile from "../LogFile";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
interface Props {
	logFile: LogFile;
	onClose: (selectedCol: boolean[], selectedColMini: boolean[]) => void;
}

interface State {
	showDialog: boolean;
	selectedCol: boolean[];
	selectedColMini: boolean[];
}

const BACKDROP_STYLE: React.CSSProperties = {
	width: "100vw",
	backgroundColor: "#00000030",
	position: "absolute",
	padding: "10px",
	zIndex: 100
};

const DIALOG_STYLE: React.CSSProperties = {
	height: "90",
	width: "70%",
	padding: "10px",
	display: "flex",
	flexDirection: "column",
	alignItems: "start",
	overflow: "auto",
};
const innerStyle: React.CSSProperties = {
	display: "flex",
	height: "20px",
	alignItems: "center",
	justifyContent: "center",
	flexDirection: "row",
	paddingLeft: "2px",
};
export default class SelectColDialog extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			showDialog: false,
			selectedCol: this.props.logFile.selectedColumns,
			selectedColMini: this.props.logFile.selectedColumnsMini,
		};
	}

	handleCheckbox = (e, index) => {
		const cols = [...this.state.selectedCol];
		if (e.target.checked) {
			cols[index] = true;
			this.setState({ selectedCol: cols });
		} else {
			cols[index] = false;
			this.setState({ selectedCol: cols });
		}
	};

	handleCheckboxMini = (e, index) => {
		const cols = [...this.state.selectedColMini];
		if (e.target.checked) {
			cols[index] = true;
			this.setState({ selectedColMini: cols });
		} else {
			cols[index] = false;
			this.setState({ selectedColMini: cols });
		}
	};

	renderCheckbox(name: string, index: number) {
		return (
			<div key={index}>
				<div style={innerStyle}>
					<div style={{ width: "150px" }}>{name}</div>
					<div style={{ width: "50px" }}>
						<input
							type="checkbox"
							checked={this.state.selectedCol[index]}
							onChange={(e) => this.handleCheckbox(e, index)}
							key={index}
						/>
					</div>
					<div style={{ width: "50px" }}>
						<input
							type="checkbox"
							checked={this.state.selectedColMini[index]}
							onChange={(e) => this.handleCheckboxMini(e, index)}
							key={index}
						/>
					</div>
				</div>
			</div>
		);
	}

	onDialogClick(isClose: boolean) {
		this.setState({ showDialog: false }, () => {
			if (isClose === true) this.props.onClose(this.state.selectedCol, this.state.selectedColMini);
		});
	}

	render() {
		return (
			<div style={BACKDROP_STYLE}>
				<div className="dialog" style={DIALOG_STYLE}>
					<div>
						<div style={innerStyle}>
							<div style={{ width: "150px" }}></div>
							<div style={{ width: "50px" }}>Table</div>
							<div style={{ width: "50px" }}>Minimap</div>
							<div style={{ marginLeft: "20px" }}>
								<VSCodeButton appearance="icon" onClick={() => this.onDialogClick(true)}>
									<i className="codicon codicon-close" />
								</VSCodeButton>
							</div>
						</div>
					</div>
					{this.props.logFile.headers.map((h, i) => this.renderCheckbox(h.name, i))}
				</div>
			</div>
		);
	}
}
