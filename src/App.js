import React, { useRef, useEffect, useState } from "react";
import { JsonEditor as Editor } from "jsoneditor-react";
import { Scrollbars } from "react-custom-scrollbars";
import importedComponent from "react-imported-component";
import CircularProgress from "@material-ui/core/CircularProgress";

import "./App.scss";

//import sampleData from "./sampledata";

const onError = e => {
  console.error(e);
};

const editorStyleModfiy = html => {
  let root = html.getElementsByClassName("jsoneditor jsoneditor-mode-tree")[0],
    menu = html.getElementsByClassName("jsoneditor-menu")[0],
    history = html.getElementsByClassName(
      "jsoneditor-navigation-bar nav-bar-empty"
    )[0],
    tree = html.getElementsByClassName(
      "jsoneditor-outer has-main-menu-bar has-nav-bar"
    )[0];

  //최상단
  root.style.border = "0px";

  //메뉴 바
  menu.style.position = "fixed";
  menu.style.top = "0px";
  menu.style.zIndex = 1;
  menu.style.backgroundColor = "#797979";
  menu.style.border = "0px";

  //히스토리 바
  history.style.position = "fixed";
  history.style.top = "35px";
  history.style.zIndex = 1;

  //tree
  tree.style.position = "relative";
  tree.style.top = "61px";
  tree.style.overflow = "hidden";

  html.style.display = "block";
};

function _notifyUpdateToFrame(q) {
  window.parent.postMessage(
    { mqfEditor: { event: "onUpdateQ", data: { q: q } } },
    "*"
  );
}

function App() {
  const editor = useRef();

  const [update, setUpdate] = useState(false);
  const [jsonData, setJsonData] = useState([]);

  const onChange = e => {
    checkPlugin(e);
    _notifyUpdateToFrame(e);
  };

  useEffect(() => {
    const onMessage = ev => {
      if (ev.data && ev.data.mqfEditor) {
        let event = ev.data.mqfEditor.event;
        let data = ev.data.mqfEditor.data;

        if (event === "setQ" && data.q) {
          // 편집할 Q
          setUpdate(true);
          setJsonData(data.q);

          //  Meta 입력 항목 Reset
          document.getElementById("plugin/asset").value = "";
          document.getElementById("plugin/subject").value = "";
          document.getElementById("plugin/sentence").value = "";
        } else if (event === "setMeta") {
        }
      }
    };

    window.addEventListener("message", onMessage);

    return () => {
      window.removeEventListener("message", onMessage);
    };
  });

  const JsonEditor = importedComponent(() =>
    Promise.all([
      import(/* webpackChunkName:'jsoneditor' */ "jsoneditor-react")
    ]).then(([{ JsonEditor: Editor }]) => {
      return function EditorHoc(props) {
        return <Editor ref={editor} {...props} innerRef={retHtml} />;
      };
    })
  );

  const buildEditor = data => {
    return (
      <JsonEditor
        value={data}
        onChange={onChange}
        onError={onError}
        history
        mode={Editor.modes.tree}
      />
    );
  };

  const retHtml = html => {
    if (!html) {
      return;
    }

    html.style.display = "none";

    setTimeout(() => {
      editorStyleModfiy(html);
    }, 0);
  };

  return (
    <>
      {update ? (
        <Scrollbars>{buildEditor(jsonData)}</Scrollbars>
      ) : (
        <div className="dim">
          <div>
            <CircularProgress />
          </div>
        </div>
      )}
    </>
  );
}

export default App;
