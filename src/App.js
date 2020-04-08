import React, { useRef, useEffect, useState } from "react";
import { JsonEditor as Editor } from "jsoneditor-react";
import { Scrollbars } from "react-custom-scrollbars";
import importedComponent from "react-imported-component";

import "./App.scss";

import sampleData from "./sampledata";
import schema from "./schema";

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

  if (!root) {
    return;
  }

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
  const [jsonData, setJsonData] = useState({});
  const [lastQ, setLastQ] = useState({});

  const dataSchema = schema;

  const checkPlugin = q => {
    let metaList = ["asset", "subject", "sentence"];
    let meta = window.tsQeditor.metaTag(q);

    metaList.forEach(function(item) {
      let sendValue = [];
      for (let i in meta) {
        if (i.indexOf(item + "|") === 0) {
          sendValue.push({ data: i, value: meta[i] });
        }
      }

      window.parent.postMessage(
        {
          mqfEditor: {
            event: "onEditMeta",
            data: {
              target: `${item}Manager`,
              value: sendValue
            }
          }
        },
        "*"
      );
    });
    setLastQ(q);
  };

  //  수신된 Meta 지정 요청을 수행함
  const onSetMeta = data => {
    if (lastQ) {
      if (window.tsQeditor.metaUntag(lastQ, /*{}*/ data)) {
        setUpdate(true);
        setJsonData(lastQ);
        _notifyUpdateToFrame(lastQ);
      } else {
        console.error("Unknown Meta", data); // Exception 상황 추적 목적
      }
    }
  };

  const onChange = e => {
    //checkPlugin(e);
    _notifyUpdateToFrame(e);
  };

  useEffect(() => {
    const onMessage = ev => {
      if (ev.data && ev.data.mqfEditor) {
        let event = ev.data.mqfEditor.event;
        let data = ev.data.mqfEditor.data;
        if (event === "setQ" && data.q) {
          // 편집할 Q
          checkPlugin(data.q);
          setUpdate(true);
          setJsonData(data.q);
        } else if (event === "setMeta") {
          setUpdate(false);
          onSetMeta(data);
        }
      }
    };

    window.addEventListener("message", onMessage);

    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, [update]);

  const JsonEditor = importedComponent(() =>
    Promise.all([import("jsoneditor-react")]).then(
      ([{ JsonEditor: Editor }]) => {
        return function EditorHoc(props) {
          return <Editor ref={editor} {...props} innerRef={retHtml} />;
        };
      }
    )
  );

  function onCreateMenu(items, node) {
    const path = node.path;
    const JSONEditor = editor.current.jsonEditor;

    let jsondata = JSONEditor.get();

    console.log("items:", items, "node:", node);

    // let removeItem = items.filter(function(item) {
    //   return item.text === "Remove";
    // });

    // let duplicateItem = items.filter(function(item) {
    //   return item.text === "Duplicate";
    // });

    //items = [];

    function pathTojq() {
      let pathString = "";

      path.forEach(function(segment, index) {
        console.log("segment:", segment, "index:", index);
        if (typeof segment == "number") {
          pathString += "[" + segment + "]";
        } else {
          pathString += '."' + segment + '"';
        }
      });

      //alert(pathString); // show it to the user.
      return pathString;
    }

    if (path) {
      // 최 상위 루트
      if (path.length === 0) {
        const DATA_DUMMY = {
          Type: "null",
          Data: "",
          bg: { image: "", fontSize: 0 },
          dropAlign: "N",
          autoFit: "H",
          sub: ""
        };
        const META_DUMMY = { subject: [], sentence: [], service: {} };

        const SENSOR_DUMMY = {
          id: "",
          item: { IndexOfBody: true },
          meta: META_DUMMY
        };

        let subMenuItems = [];
        subMenuItems.push(
          {
            text: "choice",
            className: "jsoneditor-insert",
            click: function() {
              if (!jsondata.hasOwnProperty("choice")) {
                jsondata["choice"] = [
                  {
                    Type: "null",
                    Content: [DATA_DUMMY],
                    answer: "",
                    comment: DATA_DUMMY
                  }
                ];
                JSONEditor.update(jsondata);
                JSONEditor.expandAll();
                _notifyUpdateToFrame(jsondata);
              }
            }
          },
          {
            text: "meta",
            className: "jsoneditor-insert",
            click: function() {
              if (!jsondata.hasOwnProperty("meta")) {
                jsondata["meta"] = [META_DUMMY];
                JSONEditor.update(jsondata);
                JSONEditor.expandAll();
                _notifyUpdateToFrame(jsondata);
              }
            }
          },
          {
            text: "correctResponse",
            className: "jsoneditor-insert",
            click: function() {
              if (!jsondata.hasOwnProperty("correctResponse")) {
                jsondata["correctResponse"] = [
                  [
                    {
                      answer: [],
                      comment: DATA_DUMMY,
                      countSubmit: 1,
                      countMax: 1
                    }
                  ]
                ];
                JSONEditor.update(jsondata);
                JSONEditor.expandAll();
                _notifyUpdateToFrame(jsondata);
              }
            }
          },
          {
            text: "caliper",
            className: "jsoneditor-insert",
            click: function() {
              if (!jsondata.hasOwnProperty("caliper")) {
                jsondata["caliper"] = [SENSOR_DUMMY];
                JSONEditor.update(jsondata);
                JSONEditor.expandAll();
                _notifyUpdateToFrame(jsondata);
              }
            }
          }
        );

        items.push({
          text: "Insert",
          title: "Insert a new field",
          submenuTitle: "Select the type of the field to be inserted",
          className: "jsoneditor-insert",
          submenu: subMenuItems
        });
      }
      if (path.length > 0) {
        let regType = /^[A-Z]/g;
        const chkReg = regType.test(path[path.length - 1]);
        if (!chkReg) {
          items.push({
            text: "Remove Custom",
            title: "Remove this field",
            className: "jsoneditor-remove",
            click: function() {
              console.error(jsondata, node.paths[0]);

              //test.forEach(function(item) {

              // var serachData = function() {
              //   console.error(list[number]);

              //   for (var obj in test) {
              //     console.error(obj);
              //     if (test.hasOwnProperty(obj)) {
              //       if (obj == list[number]) {
              //         console.error(test[obj]);
              //         test = test[obj];
              //         number++;
              //         delete jsondata[test];
              //         serachData();
              //         break;
              //       }
              //     }
              //   }
              // };

              // serachData();

              // console.error("최종 :", test);

              // //});

              //delete jsondata.Body;

              // console.error(
              //   test.forEach(function(item) {
              //     return [item];
              //   })
              // );

              //delete jsondata[path[path.length - 1]];
              JSONEditor.update(jsondata);
              _notifyUpdateToFrame(jsondata);
            }
          });
        }
      }
      // if (duplicateItem[0]) {
      //   duplicateItem = duplicateItem[0];
      //   duplicateItem.title = "Duplicate this field";
      // }
      // if (removeItem[0]) {
      //   removeItem = removeItem[0];
      //   removeItem.title = "Remove this field";
      // }
      // let chkReg = regType.test(path[path.length - 1]);
      // if (!chkReg) {
      //   if (node.type !== "append") {
      //     items.push(duplicateItem);
      //     items.push(removeItem);

      //   }
      // }

      //depth 1
      //if (path.length === 1 && path[0] !== "Body") {

      //}
    }

    items.forEach(function(item, index, items) {
      if ("submenu" in item) {
        items[index].className += " submenu-highlight";
      } else {
        items[index].className += " rainbow";
      }
    });

    return items;
  }

  function onEditable(node) {
    // let field = node.field;
    // let path = node.path;

    // let regType = /^[A-Z]/g;
    // if (regType.test(field)) {
    //   return {
    //     field: false,
    //     value: true
    //   };
    // }

    // if (path && path.length === 1) {
    //   return {
    //     field: false,
    //     value: true
    //   };
    // }

    // return true;

    return {
      field: false,
      value: true
    };
  }

  const buildEditor = data => {
    if (JSON.stringify(data) === "{}") {
      if (JSON.stringify(lastQ) === "{}") {
        return <></>;
      }
      data = sampleData;
    }

    return (
      <JsonEditor
        value={data}
        onChange={onChange}
        onError={onError}
        onCreateMenu={onCreateMenu}
        onEditable={onEditable}
        history={true}
        mode={Editor.modes.tree}
        enableSort={false}
        enableTransform={false}
        schema={dataSchema}
      />
    );
  };

  const retHtml = html => {
    if (!html) {
      return;
    }

    html.style.display = "none";

    setTimeout(() => {
      editor.current.expandAll();
      editorStyleModfiy(html);
    }, 0);
  };

  return (
    <>
      {update &&
        JSON.stringify(jsonData) !== "{}" &&
        JSON.stringify(lastQ) !== "{}" && (
          <Scrollbars>{buildEditor(jsonData)}</Scrollbars>
        )}
    </>
  );
}

export default App;
