'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

import * as vscode from 'vscode';

import { T, now } from "./timeline-monad";

import { connect } from "./_connect";

import { observeEmit } from "./_observeEmit";

import { save } from "./_save";

const port = 3999;
//The same port that the server is listening on
const host = '127.0.0.1';

const target = {
  host: host,
  port: port
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "asciidoc-live-electron" is now active!');

  observeEmit(target);

  let disposable =
    vscode.commands
      .registerCommand('extension.asciidoc-live-electron-connect',
        () => connect(target));

  let disposable1 =
    vscode.commands
      .registerCommand('extension.asciidoc-live-electron-saveHTML', () => save(target));

  context.subscriptions.push(disposable);
  context.subscriptions.push(disposable1);
}

// this method is called when your extension is deactivated
export function deactivate() {
}