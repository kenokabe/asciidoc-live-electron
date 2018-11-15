import { Socket } from 'net';
import * as vscode from 'vscode';
import { T, now } from "./timeline-monad";
interface timeline {
  type: string;
  [now: string]: unknown;
  sync: Function;
}


const save = (connectionTL: timeline) => () => {
  // Display a message box to the user
  vscode.window
    .showInformationMessage('AsciiDoc Live Electron: Saving HTML of the doc on Viewer...');

  const f = () =>
    vscode.window
      .showInformationMessage('AsciiDoc Live Electron: HTML file Saved to the same directory.');

  (connectionTL[now]
    === undefined)
    ? undefined
    : (connectionTL[now] as Socket)
      .emit("save", f);
}

export { save };