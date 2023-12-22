import * as vscode from 'vscode';
import fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(EditorProvider.register(context));
}

export class EditorProvider implements vscode.CustomTextEditorProvider {

	public static register(context: vscode.ExtensionContext): vscode.Disposable {
		return vscode.window.registerCustomEditorProvider(EditorProvider.viewType, new EditorProvider(context));
	}

	private static readonly viewType = 'tno.tracy';

	constructor(
		private readonly context: vscode.ExtensionContext
	) { }

	public async resolveCustomTextEditor(
		document: vscode.TextDocument, 
		webviewPanel: vscode.WebviewPanel,
		_token: vscode.CancellationToken
	): Promise<void> {
		const rulesFile = `${document.fileName}.rules`;

		// Setup initial content for the webview
		webviewPanel.webview.options = {
			enableScripts: true,
		};
		webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

		function updateWebview(message_type: string) {
			webviewPanel.webview.postMessage({
				type: message_type,
				text: document.getText(),
				rules: fs.existsSync(rulesFile) ? JSON.parse(fs.readFileSync(rulesFile, {encoding: 'utf8'})) : [],
			});
		}

		// Hook up event handlers so that we can synchronize the webview with the text document.
		//
		// The text document acts as our model, so we have to sync change in the document to our
		// editor and sync changes in the editor back to the document.
		// 
		// Remember that a single text document can also be shared between multiple custom
		// editors (this happens for example when you split a custom editor)

		const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
			if (e.document.uri.toString() === document.uri.toString()) {
				updateWebview('readFile');
			}
		});

		// Make sure we get rid of the listener when our editor is closed.
		webviewPanel.onDidDispose(() => {
			changeDocumentSubscription.dispose();
		});

		// Receive message from the webview.
		webviewPanel.webview.onDidReceiveMessage(e => {
			if (e.type === 'readFile') {
				updateWebview('readFile');
			} else if (e.type === 'saveRules') {
				fs.writeFileSync(rulesFile, JSON.stringify(e.rules));
			}
			else if (e.type === 'exportData') {
				const filename = document.fileName.split(".tracy")[0].split("_Tracy_export_")[0]
				const tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
				const _date = new Date(Date.now() - tzoffset).toISOString().slice(0,10).replace(/-/g, "");
				const _time = new Date(Date.now() - tzoffset).toISOString().slice(11,19).replace(/:/g, "");
				const exportFile = `${filename}_Tracy_export_${_date}_${_time}.tracy.json`;
				fs.writeFileSync(exportFile, JSON.stringify(e.data));
			}
		});
	}

	/**
	 * Get the static html used for the editor webviews.
	 */
	private getHtmlForWebview(webview: vscode.Webview): string {
		// Local path to script and css for the webview
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this.context.extensionUri, 'out', 'viewer', 'viewer.js'));

		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this.context.extensionUri, 'media', 'reset.css'));

		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this.context.extensionUri, 'media', 'vscode.css'));

		const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this.context.extensionUri, 'media', 'style.css'));

		// Use a nonce to whitelist which scripts can be run
		const nonce = getNonce();

		return /* html */`
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
				Use a content security policy to only allow loading images from https or from our extension directory,
				and only allow scripts that have a specific nonce.
				-->
				<!--<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
				-->
				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleResetUri}" rel="stylesheet" />
				<link href="${styleVSCodeUri}" rel="stylesheet" />
				<link href="${styleUri}" rel="stylesheet" />

				<title>Tracy</title>
			</head>
			<body>
				<div id='root'/>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}