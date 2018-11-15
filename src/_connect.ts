/// <reference types="socket.io-client" />

import * as vscode from 'vscode';
import { T, now } from "./timeline-monad";
interface timeline {
  type: string;
  [now: string]: any;
  sync: Function;
}

import { connect_observer } from "./_connect-observer"

const io = require("socket.io-client");

const connect = (connectionTL: timeline) => () => {
  // The code you place here will be executed every time your command is executed

  // Display a message box to the user
  vscode.window
    .showInformationMessage('AsciiDoc Live Electron: Connecting to Viewer...');

  connectionTL[now] =
    (connectionTL[now] !== undefined)
      ? (() => {
        vscode.window
          .showInformationMessage('AsciiDoc Live Electron: Viewer is already Connected.');
        return undefined;
      })()
      : io('http://localhost:3999', {
        reconnection: false
      });

  connectionTL[now]
    .on('connect', () => {

      vscode.window
        .showInformationMessage('AsciiDoc Live Electron: Viewer Connected!');

      connect_observer(connectionTL);
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