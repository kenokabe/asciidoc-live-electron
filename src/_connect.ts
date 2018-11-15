/// <reference types="socket.io-client" />

import * as vscode from 'vscode';
import { T, now } from "./timeline-monad";
interface timeline {
  type: string;
  [now: string]: unknown;
  sync: Function;
}

import { watch_emit } from "./_watch_emit"

const io = require("socket.io-client");

const connect = (connectionTL: timeline) => () => {
  // The code you place here will be executed every time your command is executed

  // Display a message box to the user
  vscode.window
    .showInformationMessage('AsciiDoc Live Electron: Connecting to Viewer...');

  const socket =
    (connectionTL[now] !== undefined)
      ? (() => {
        vscode.window
          .showInformationMessage('AsciiDoc Live Electron: Viewer is already Connected.');

      })()
      : io('http://localhost:3999', {
        reconnection: false
      })
        .on('connect', () => {

          connectionTL[now] = socket;

          vscode.window
            .showInformationMessage('AsciiDoc Live Electron: Viewer Connected!');

          watch_emit(connectionTL);
        })
        .on('event', (data: object) => {

        })
        .on('disconnect', () => {
          connectionTL[now] = undefined;

          vscode.window
            .showInformationMessage('AsciiDoc Live Electron: Viewer Disonnected!');
        });



}

export { connect };