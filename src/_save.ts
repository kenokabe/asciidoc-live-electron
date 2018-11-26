
import * as vscode from 'vscode';

interface target {
  host: string;
  port: number;
}

const JsonSocket = require('json-socket-international');

const save = (target: target) => {
  // Display a message box to the user
  vscode.window
    .showInformationMessage('AsciiDoc-Live-Electron: Saving HTML of the doc on Viewer...');
  interface msg {
    cmd: string;
    data: any;
  }
  JsonSocket
    .sendSingleMessageAndReceive(
      target.port,
      target.host,
      {
        cmd: "save",
        data: {}
      },
      (err: any, msg: msg) => {
        if (err) {
          //Something went wrong
          console.log("Something went wrong");
          throw err;
        }
        vscode.window
          .showInformationMessage("AsciiDoc-Live-Electron: " + msg.data
            + ".html Saved to the same directory.");
      });

}

export { save };