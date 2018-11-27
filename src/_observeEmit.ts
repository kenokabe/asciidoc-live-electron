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
  let count = 0;

  const renderReadyTL = T();

  const intervalMaxTL = T(//force render ready
    (self: timeline) => {
      const f = () => (renderReadyTL.now = true);
      setInterval(f, maxDelayLimit);
    }
  );

  const intervalMinTL = T(//prevent too busy
    (self: timeline) => {// VSCode events buggy
      const f = () => (self.now = true);
      setInterval(f, minDelayLimit);
    }
  );


  const lineTL = T();

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

  //   if undefined, not triggered 
  //remove undefined of this event automatically
  const currentActiveEditorTL = T(
    (self: timeline) => {
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

  const changeSelectionTL = T(
    (self: dirnameTL) => {

      (vscode.window
        .onDidChangeTextEditorSelection(
          (info) => {
            //there is VS Code bug of event
            /*  popTL.now = "" +(count++)+"  "+ JSON.stringify(info
                .textEditor.document.uri.fsPath);*/

            const dirname =
              getDirNameObj(info.textEditor);
            //popTL.now = "" + dirname.name;
            dirname.dir === ""
              ? undefined
              : (() => {
                const line = info.selections[0]
                  .active.line;

                const lineSame =
                  (line === lineTL.now);

                popTL.now = "" + line;

                lineTL.now = line;

                const dirNameSame = ((
                  dirname.dir === preAdocTL.now.dir)
                  && (dirname.name === preAdocTL.now.name));

                preAdocTL.now = cloneObj(dirname);

                dirNameSame && !lineSame
                  ? self.now = preAdocTL.now
                  : undefined;

              })()

          })
      )
    }
  );


  const changeTextTL = T(
    (self: timeline) =>
      (vscode.workspace
        .onDidChangeTextDocument(
          (info: vscode.TextDocumentChangeEvent) => {
            getDirNameObj(vscode.window.activeTextEditor)
              .dir === ""
              ? undefined
              : self.now = true;
          })
      )
  );

  const changeTL = T(
    (self: timeline) => {
      currentAdocTL
        .sync(() => self.now = true);

      changeSelectionTL
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
      renderReadyTL,
      intervalMinTL],
    )
    .sync(
      () => (socketTL.now = {
        text: textTL.now,
        dir_name: changeSelectionTL.now,
        line: lineTL.now
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




