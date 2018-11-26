import { T, now } from "./timeline-monad";
import { allThenResetTL } from "./allThenResetTL";
import * as vscode from 'vscode';

const Path = require('path');

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

const maxDelayLimit = 1000;
const observeEmit = (target: target) => {

  console.log("observeEmit");


  const renderReadyTL = T();

  const intervalTL = T(
    (self: timeline) => {
      const f = () => (renderReadyTL[now] = true);
      setInterval(f, maxDelayLimit);
    }
  );


  const lineTL = T();

  interface dirNameObj {
    dir: string;
    name: string;
  }
  const getDirNameObj = (): dirNameObj => {

    const path = (vscode.window
      .activeTextEditor === undefined)
      ? undefined
      : vscode.window
        .activeTextEditor
        .document.uri.fsPath;

    return (path === undefined)
      ? {
        dir: undefined,
        name: undefined
      }
      : ((Path.extname(path) !== ".adoc")
        && (Path.extname(path) !== ".asciidoc")
        && (Path.extname(path) !== ".ad")
        && (Path.extname(path) !== ".adc"))
        ? {
          dir: undefined,
          name: undefined
        }
        : {
          dir: Path.dirname(path),
          name: Path.basename(path)
        };
  }


  const changeTextTL = T(
    (self: timeline) =>
      (vscode.workspace
        .onDidChangeTextDocument(
          (info: object) => {
            //  console.log(changeSelectionTL[now].name);
            (getDirNameObj().name === undefined)
              ? undefined
              : self[now] = true;
          })
      )
  );


  const changeSelectionTL = T(
    (self: timeline) =>
      (vscode.window
        .onDidChangeTextEditorSelection(
          (info) => {

            const line = info.selections[0]
              .active.line;

            const dirNameObj: dirNameObj =
              getDirNameObj();

            (dirNameObj.name === undefined)
              ? undefined
              : ((line !== lineTL[now]) ||
                (dirNameObj.dir !== self[now].dir) ||
                (dirNameObj.name !== self[now].name))
                ? ((lineTL[now] = line) &&
                  (self[now] = dirNameObj))
                : false;
          })
      )
  );

  /*debug
  changeSelectionTL
    .sync((obj: dirNameObj) =>
      vscode.window
        .showInformationMessage("AsciiDoc Live Electron: " + obj.name)
    );
*/

  /*
    const changeActiveTextEditorTL = T(
      (self: timeline) =>
        (vscode.window
          .onDidChangeActiveTextEditor(
            (info) => {
              const dirNameObj = getDirNameObj();
              (dirNameObj === undefined)
                ? undefined
                : ((lineTL[now] = (info as vscode.TextEditor)
                  .selections[0]
                  .active.line) &&
                  (self[now] = dirNameObj))
            })
        )
    );
   
  */
  const changeTL = T(
    (self: timeline) => {
      changeTextTL
        .sync(() => self[now] = true);
      changeSelectionTL
        .sync(() => self[now] = true);
      /*  changeActiveTextEditorTL
          .sync(() => self[now] = true);*/
    }
  );
  //  changeTL.sync(console.log);
  // Get the current text editor
  const textTL = T(
    (self: timeline) => changeTL
      .sync(() => vscode.window.activeTextEditor)
      .sync((editor: vscode.TextEditor) =>
        editor.document)
      .sync((doc: vscode.TextDocument) =>
        doc.getText())
      .sync((docContent: String) =>
        (self[now] = docContent))
  );

  const textThenSocketTL = allThenResetTL
    ([textTL,
      renderReadyTL])
    .sync(
      () => (socketTL[now] = {
        text: textTL[now],
        dir_name: changeSelectionTL[now],
        line: lineTL[now]
      })
    );

  const socketTL = ((target: target) =>
    T(
      (self: timeline) => self
        .sync((obj: object) => {
          //   console.log("Socket sending");
          interface msg {
            cmd: string;
            data: any;
          };
          JsonSocket
            .sendSingleMessageAndReceive(
              target.port,
              target.host,
              {
                cmd: "render",
                data: obj
              },
              (err: any, msg: msg) => {
                renderReadyTL[now] = true;
                if (err) {
                  //Something went wrong
                  console.log("Socket - something went wrong");
                  throw err;
                }
                // console.log("Socket sent and received the done")
              })
        })
    )
  )(target);



  return true;
};

export { observeEmit };




