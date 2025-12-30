import * as vscode from "vscode";
import { openMagnifier } from "./magnifierPanel";

export function activate(context: vscode.ExtensionContext) {
  const command = vscode.commands.registerCommand(
    "codeSpotlight.magnify",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("No active editor");
        return;
      }

      openMagnifier(editor, context);
    }
  );

  context.subscriptions.push(command);
}

export function deactivate() {}
