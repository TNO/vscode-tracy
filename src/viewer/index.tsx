import React, { Profiler } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "@vscode/codicons/dist/codicon.css";

function onRender(
	id: string,
	phase: string,
	actualDuration: number,
	baseDuration: number,
	startTime: number,
	endTime: number,
) {
	console.log(
		`Profiling ${id} \n phase: ${phase},\n actualDuration: ${actualDuration},\n baseDuration: ${baseDuration}`,
	);
}
const container = document.getElementById("root");
const root = createRoot(container!);
root.render(<App />);
// root.render(<Profiler id='App' onRender={onRender}><App/></Profiler>);
