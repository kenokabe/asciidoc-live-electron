/// <reference types="socket.io-client" />

import { T, now } from "./timeline-monad";
import { allTL } from "./allTL";
import { Socket } from 'net';
import * as vscode from 'vscode';

interface timeline {
  type: string,
  [now: string]: unknown,
  sync: Function
}

const watch_emit = (socket: Socket) => {

  const intervalTL = T(
    (self: timeline) => {
      const f = () => (self[now] = true);
      setInterval(f, 1000);
    }
  );

  const infoTL = T();

  const triggerTL = T(
    (self: timeline) =>
      (vscode.window
        .onDidChangeTextEditorSelection(
          (info: object) => {
            infoTL[now] = info;
            self[now] = true;
          })
      )
  );

  // Get the current text editor
  const selectTL = T(
    (self: timeline) => allTL([triggerTL, intervalTL])
      .sync(() => vscode.window.activeTextEditor)
      .sync((editor: vscode.TextEditor) =>
        editor.document)
      .sync((doc: vscode.TextDocument) =>
        doc.getText())
      .sync((docContent: String) =>
        (self[now] = docContent))
  );

  const socketTL = ((socket: Socket) =>
    T(
      (self: timeline) => self
        .sync((a: undefined) => {
          socket.emit("event", (a));
          return a;
        })
    )
  )(socket);

  const nonTL = selectTL
    .sync(
      () => (socketTL[now] = { 1: selectTL[now], 2: infoTL[now] })
    );

  return true;
};

export { watch_emit };





