
/// <reference types="ws" />

import * as vscode from 'vscode';
import { T, now } from "./timeline-monad";
interface timeline {
  type: string;
  [now: string]: any;
  sync: Function;
}

import { connect_observer } from "./_connect-observer";

const WebSocket = require('ws');

const client = new WebSocket("http://localhost:3999");

const connect = (connectionTL: timeline) => () => {
  // The code you place here will be executed every time your command is executed

  // Display a message box to the user
  vscode.window
    .showInformationMessage('AsciiDoc Live Electron: Connecting to Viewer...');

  (connectionTL[now] !== undefined)
    ? (() => {
      vscode.window
        .showInformationMessage('AsciiDoc Live Electron: Viewer is already Connected.');
    })()
    : (() => {

      client
        .addEventListener('open',
          () => {
            vscode.window
              .showInformationMessage('AsciiDoc Live Electron: Viewer Connected!');

            connectionTL[now] = client;
            //    connect_observer(connectionTL);
          });

      client
        .addEventListener('close',
          () => {
            vscode.window
              .showInformationMessage('AsciiDoc Live Electron: Viewer Disonnected!');

            connectionTL[now] = undefined;
          });

    })()




}

export { connect };