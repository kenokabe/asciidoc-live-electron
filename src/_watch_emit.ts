/// <reference types="socket.io-client" />

import { T, now } from "./timeline-monad";
import { allTL } from "./allTL";
import { Socket } from 'net';
import * as vscode from 'vscode';

interface timeline {
  type: string;
  [now: string]: unknown;
  sync: Function;
}

const watch_emit = (connectionTL: timeline) => {

  const intervalTL = T(
    (self: timeline) => {
      const f = () => (self[now] = true);
      setInterval(f, 1000);
    }
  );

  const infoTL = T();

  const changeTextTL = T(
    (self: timeline) =>
      (vscode.workspace
        .onDidChangeTextDocument(
          (info: object) => {
            self[now] = true;
          })
      )
  );

  const changeSelectionTL = T(
    (self: timeline) =>
      (vscode.window
        .onDidChangeTextEditorSelection(
          (info: object) => {
            infoTL[now] = info;
            self[now] = true;
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

  // vscode.window.activeTextEditor.document.isUntitled

  // Get the current text editor
  const textTL = T(
    (self: timeline) => allTL
      ([changeTL,
        intervalTL])
      .sync(() => vscode.window.activeTextEditor)
      .sync((editor: vscode.TextEditor) =>
        editor.document)
      .sync((doc: vscode.TextDocument) =>
        doc.getText())
      .sync((docContent: String) =>
        (self[now] = docContent))
  );

  const socketTL = ((connectionTL: timeline) =>
    T(
      (self: timeline) => self
        .sync((a: undefined) => {

          (connectionTL[now]
            === undefined)
            ? undefined
            : (connectionTL[now] as Socket)
              .emit("event", (a));

        })
    )
  )(connectionTL);

  const nonTL = textTL
    .sync(
      () => (socketTL[now] = {
        text: textTL[now],
        line: (infoTL[now] as vscode.TextEditorSelectionChangeEvent)
          .selections[0]
          .active
          .line,
        lines: (infoTL[now] as vscode.TextEditorSelectionChangeEvent)
          .textEditor
          .document
          .lineCount
      })
    );

  return true;
};

export { watch_emit };





