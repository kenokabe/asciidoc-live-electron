import { T } from "./timeline-monad";
import { allThenResetTL } from "./allThenResetTL";
import * as vscode from 'vscode';

const Path = require('path');

interface timeline {
  type: string;
  now: any;
  sync: Function;
}
interface target {
  host: string;
  port: number;
}
const consoleTL = ((console) => T(
  (self: timeline) => self.sync((a: unknown) => {
    console.log(a);
    return a;
  })
))(console);
const log = (a: unknown) => (consoleTL.now = a);

const popTL = ((popup: Function) => T(
  (self: timeline) => self
    .sync((msg: string) => {
      popup(msg);
      return msg;
    })
))(vscode.window
  .showInformationMessage);

const JsonSocket = require('json-socket-international');

const maxDelayLimit = 1000;
const minDelayLimit = 200;
const observeEmit = (target: target) => {

  console.log("observeEmit");

  const renderReadyTL = T();

  const intervalMaxTL = T(//force render ready
    (self: timeline) => {
      const f = () => (renderReadyTL.now = true);
      setInterval(f, maxDelayLimit);
    }
  );

  interface dirname {
    dir: string;
    name: string;
  }

  interface dirnameTL {
    type: string;
    now: dirname | undefined;
    sync: Function;
  }

  const getDirNameObj =
    (editor: vscode.TextEditor | undefined): dirname => {

      const path = (editor === undefined)
        ? undefined
        : editor.document.uri.fsPath;

      return (path === undefined)
        ? {
          dir: "",
          name: ""
        }
        : ((Path.extname(path) !== ".adoc")
          && (Path.extname(path) !== ".asciidoc")
          && (Path.extname(path) !== ".ad")
          && (Path.extname(path) !== ".adc"))
          ? {
            dir: "",
            name: ""
          }
          : {
            dir: Path.dirname(path),
            name: Path.basename(path)
          };
    };


  interface editorTL {
    type: string;
    now: vscode.TextEditor | undefined
    sync: Function;
  }

  //   if undefined, not triggered 
  //remove undefined of this event automatically
  const currentActiveEditorTL: editorTL = T(
    (self: editorTL) => {
      self.now = vscode.window.activeTextEditor;
      vscode.window.onDidChangeActiveTextEditor(
        (editor) => (self.now = editor))
    }
  );

  const preAdocTL = T((self: dirnameTL) =>
    self.now = {
      dir: "",
      name: ""
    });

  const cloneObj = (dirname: dirname) =>
    Object.assign({}, dirname);

  const currentAdocTL = T(
    (self: dirnameTL) => {
      currentActiveEditorTL
        .sync((editor: vscode.TextEditor) => {
          const dirname = getDirNameObj(editor);
          self.now = (dirname.dir === "")
            ? undefined// self won't trigger
            : preAdocTL.now.dir === ""//init
              ? preAdocTL.now = cloneObj(dirname)
              : dirname
        });
    }
  );

  currentAdocTL.sync(
    (dirname: dirname) => popTL.now = "AsciiDoc-Live-Electron: " + dirname.name
  );


  const currentLineTL = T(//prevent too busy
    (self: timeline) => {// VSCode events buggy
      self.now = undefined;

      const f = () => {
        const line =
          currentActiveEditorTL.now === undefined
            ? self.now
            : currentActiveEditorTL.now
              .selection.active.line;

        (self.now === line)
          ? undefined
          : self.now = line
      };
      setInterval(f, minDelayLimit);
    }
  );

  const currentLineAdocTL = currentLineTL
    .sync((line: number) =>
      currentAdocTL.now === undefined
        ? undefined //no trigger
        : line
    );

  /*
currentLineAdocTL
  .sync((line: number) =>
    popTL.now = "Line = " + line);
*/

  const changeTextTL = T(
    (self: timeline) =>
      (vscode.workspace
        .onDidChangeTextDocument(
          (info: vscode.TextDocumentChangeEvent) => {
            currentActiveEditorTL.now === undefined
              ? undefined
              : self.now = true;
          })
      )
  );

  const changeTL = T(
    (self: timeline) => {
      currentAdocTL
        .sync(() => self.now = true);

      currentLineAdocTL
        .sync(() => self.now = true);

      changeTextTL
        .sync(() => self.now = true);

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
        (self.now = docContent))
  );

  const textThenSocketTL = allThenResetTL
    ([textTL,
      renderReadyTL]
    )
    .sync(
      () => (socketTL.now = {
        text: textTL.now,
        dir_name: currentAdocTL.now,
        line: currentLineAdocTL.now
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
                renderReadyTL.now = true;
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




