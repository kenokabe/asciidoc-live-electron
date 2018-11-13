'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
/// <reference types="socket.io-client" />

import * as vscode from 'vscode';

import { T, now } from "./timeline-monad";
import { watch_emit } from "./watch_emit";
import { Socket } from "net";

const io = require("socket.io-client");

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "asciidoc-live-electron" is now active!');
    const connectionTL = T();
    connectionTL[now] = false;
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = (connectionTL => vscode.commands.registerCommand('extension.asciidoc-live-electron-connect', () => {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user
        vscode.window
            .showInformationMessage('AsciiDoc Live Electron: Connecting to Viewer...');

        const socket: Socket = (connectionTL[now] === false)
            ? io('http://localhost:3999')
                .on('connect', () => {
                    vscode.window
                        .showInformationMessage('AsciiDoc Live Electron: Viewer Connected!');

                    connectionTL[now] = true;

                    watch_emit(socket);
                })
                .on('event', (data: object) => {

                })
                .on('disconnect', () => {
                    connectionTL[now] = false;
                })
            : (() => {
                vscode.window
                    .showInformationMessage('AsciiDoc Live Electron: Viewer is already Connected.');

            })();






    }))(connectionTL);

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}