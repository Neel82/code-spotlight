import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

let panel: vscode.WebviewPanel | undefined;
let liveMode = true;
let isFullscreen = false;

export function openMagnifier(
  editor: vscode.TextEditor,
  context: vscode.ExtensionContext
) {
  if (!panel) {
    panel = vscode.window.createWebviewPanel(
      "codeSpotlight",
      "Code Spotlight",
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(context.extensionUri, "webview", "dist")
        ]
      }
    );

    panel.onDidDispose(() => (panel = undefined));

    panel.webview.html = getHtml(panel.webview, context.extensionUri);

    panel.webview.onDidReceiveMessage((msg) => {
      if (msg.type === "setLive") {
        liveMode = msg.value;

        // If Live just turned ON, push current selection immediately
        if (liveMode) {
          const editor = vscode.window.activeTextEditor;
          if (editor && panel) update(panel, editor);
        }
      } else if (msg.type === "updateOnce") {
        const editor = vscode.window.activeTextEditor;
        if (editor && panel) update(panel, editor);
      }
      if (msg.type === "toggleFullscreen") {
            if (!panel) return;

            isFullscreen = !isFullscreen;

            panel.reveal(
                isFullscreen ? vscode.ViewColumn.One : vscode.ViewColumn.Beside,
                    true // preserve focus
                );
        }
    });

    vscode.window.onDidChangeTextEditorSelection((e) => {
      if (liveMode && panel) {
        update(panel, e.textEditor);
      }
    });
  }

  if (liveMode && panel) {
    update(panel, editor);
  }
}

function update(panel: vscode.WebviewPanel, editor: vscode.TextEditor) {
  const selection = editor.selection;
  const code =
    editor.document.getText(selection) || editor.document.getText(); // fallback to entire document

  panel.webview.postMessage({
    type: "update",
    code,
    language: editor.document.languageId
  });
}

function getHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const distUri = vscode.Uri.joinPath(extensionUri, "webview", "dist");
  let html = fs.readFileSync(
    vscode.Uri.joinPath(distUri, "index.html").fsPath,
    "utf8"
  );

  // Replace relative src/href with webview URIs
  html = html.replace(/(src|href)="(.+?)"/g, (_, attr, src) => {
    if (src.startsWith("http")) return _;
    const uri = webview.asWebviewUri(
      vscode.Uri.joinPath(distUri, src.replace(/^\//, ""))
    );
    return `${attr}="${uri}"`;
  });

  return html;
}
