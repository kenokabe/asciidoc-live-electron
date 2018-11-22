import { T, now } from "./timeline-monad";
import { allTL } from "./allTL";
import * as vscode from 'vscode';

const path = require('path');

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

const delay = 500;
const observeEmit = (target: target) => {

  console.log("observeEmit");


  const renderReadyTL = T();

  const intervalTL = T(
    (self: timeline) => {
      const f = () => (renderReadyTL[now] = true);
      setInterval(f, delay);
    }
  );


  const pathTL = T();

  const lineTL = T();

  const isAdoc = () => {

    pathTL[now] = (vscode.window
      .activeTextEditor === undefined)
      ? undefined
      : vscode.window
        .activeTextEditor
        .document.uri.fsPath;

    return (pathTL[now] === undefined)
      ? false
      : ((path.extname(pathTL[now]) === ".adoc")
        || (path.extname(pathTL[now]) === ".asciidoc"));
  }


  const changeTextTL = T(
    (self: timeline) =>
      (vscode.workspace
        .onDidChangeTextDocument(
          (info: object) => {
            console.log(changeSelectionTL[now].name);

            isAdoc()
              ? self[now] = true
              : undefined;
          })
      )
  );


  const changeSelectionTL = T(
    (self: timeline) =>
      (vscode.window
        .onDidChangeTextEditorSelection(
          (info) => {
            const dir_name = isAdoc()
              ? {
                dir: path.dirname(pathTL[now]),
                name: path.basename(pathTL[now])
              }
              : undefined;

            const line = info.selections[0]
              .active.line;
            (dir_name === undefined)
              ? undefined
              : ((line !== lineTL[now]) ||
                (dir_name.dir !== self[now].dir) ||
                (dir_name.name !== self[now].name))

                ? ((lineTL[now] = line) &&
                  (self[now] = dir_name))
                : false;
          })
      )
  );

  const changeTL = T(
    (self: timeline) => {
      changeTextTL
        .sync(() => self[now] = true);
      changeSelectionTL
        .sync(() => self[now] = true);
    }
  );
  changeTL.sync(console.log);
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

  const textThenSocketTL = allTL
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

          console.log("Socket sending");

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
                console.log("Socket sent and received the done")
              })
        })
    )
  )(target);



  return true;
};

export { observeEmit };




