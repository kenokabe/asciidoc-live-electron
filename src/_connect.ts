
import * as vscode from 'vscode';
import { T, now } from "./timeline-monad";
interface timeline {
  type: string;
  [now: string]: any;
  sync: Function;
}
interface target {
  host: string;
  port: number;
}

const JsonSocket = require('json-socket-international');

const connect = (target: target) => {
  vscode.window
    .showInformationMessage('AsciiDoc Live Electron: Ping-Testing to Viewer...');

  interface msg {
    cmd: string;
    data: any;
  }

  JsonSocket
    .sendSingleMessageAndReceive(
      target.port,
      target.host,
      {
        cmd: "ping",
        data: {}
      },
      (err: any, msg: msg) => {
        if (err) {
          //Something went wrong
          throw err;
        }
        vscode.window
          .showInformationMessage("AsciiDoc Live Electron: " + msg.data);
      });

}
export { connect };