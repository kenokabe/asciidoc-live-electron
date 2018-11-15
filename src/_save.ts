import { Socket } from 'net';
import * as vscode from 'vscode';
import { T, now } from "./timeline-monad";
interface timeline {
  type: string;
  [now: string]: any;
  sync: Function;
}

const save = (connectionTL: timeline) => () => {
  // Display a message box to the user
  vscode.window
    .showInformationMessage('AsciiDoc Live Electron: Saving HTML of the doc on Viewer...');

  const f = (name: string) =>
    vscode.window
      .showInformationMessage("AsciiDoc Live Electron: " + name
        + ".html Saved to the same directory.");

  (connectionTL[now]
    === undefined)
    ? undefined
    : connectionTL[now]
      .send({
        cmd: "save",
        data: f
      });
}

export { save };