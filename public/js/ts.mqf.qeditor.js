////////////////////////////////////////////////////////////////////////////////
//  tsQeditor

window.tsQeditor = window.tsQeditor || { _cfg: {} };

/*  storage
        quiData
    resolver
        quiData
    plugin
        qsetUi
        meta
    listener
        sensor, trace
    ui
        contentRatio: Float, Qset 실행창 Ratio. 가로 기준 세로 비율. 없으면 저작기의 기본값으로 그냥 표시
        title: String, TOOL 명칭
*/
tsQeditor.set = function(/*String*/ group, /*String*/ key, value) {
  this._cfg[group] = this._cfg[group] || {};
  this._cfg[group][key] = value;
};

tsQeditor.get = function(/*String*/ group, /*String*/ key /*Value|undefined*/) {
  if (this._cfg[group]) return this._cfg[group][key];
};

tsQeditor.init = function(onSucc, onErr) {
  var _this = this;

  this._cfg.storage.quiData.call(
    this,
    function(/*{}*/ quiData) {
      //  quiData에 service.storage[theme].alias 처리
      for (var i in quiData) {
        if (quiData[i].service && quiData[i].service.storage) {
          var buf = quiData[i].service.storage;

          for (var j in buf) {
            if (buf[j].alias) {
              if (
                quiData[buf[j].alias] &&
                quiData[buf[j].alias].service &&
                quiData[buf[j].alias].service.storage &&
                quiData[buf[j].alias].service.storage[j]
              ) {
                buf[j] = bx.$cloneObject(
                  {},
                  quiData[buf[j].alias].service.storage[j]
                );
              } else {
                console.error(
                  "[Pando-QF] Invalid Qui alias. From=" +
                    i +
                    ", To=" +
                    buf[j].alias
                );
              }
            }
          }
        }
      }

      _this.quiData = quiData;

      if (onSucc) onSucc();
    },
    function(err) {
      if (onErr) onErr(Err);
    }
  );

  //  Meta Plugin 파악
  this.metaPluginList = {};

  if (this._cfg.plugin) {
    for (var i in this._cfg.plugin) {
      if (this._cfg.plugin[i] && this._cfg.plugin[i].type == "meta") {
        this.metaPluginList[i] = true;
      }
    }
  }

  //  Editor Event Window-Listener
  window.addEventListener(
    "message",
    function(ev) {
      if (ev.data && ev.data.mqfEditor) {
        var event = ev.data.mqfEditor.event;
        var data = ev.data.mqfEditor.data;

        if (event == "onUpdateQ" && data.q) {
          // Q가 변경됨
          _this.Q = data.q;
        } else if (event == "onEditMeta") {
          // Meta나 Asset의 편집이 요청됨. Plubgin으로 'edit' command 전송
          var targetIF;

          for (var i in _this.metaPluginList) {
            if ((targetIF = document.getElementById(i))) {
              if (i == data.target) {
                targetIF.style.display = "block";
                targetIF.contentWindow.postMessage(
                  { mqfEditor: { event: "edit", data: data } },
                  "*"
                );
              } else {
                targetIF.style.display = "none";
              }
            }
          }
        } else if (event == "onSetMeta") {
          // Plugin에서 Meta 수정 정보가 전달됨. Editor로 'setMeta' command 전송
          document
            .getElementById("editorIF")
            .contentWindow.postMessage(
              { mqfEditor: { event: "setMeta", data: data } },
              "*"
            );
        } else if (event == "onListMeta" && data.type && data.value) {
          // Meta 값의 Trace를 지원하기 위하여 각 Plugin이 전솧안 Meta 목록
          tsQeditor[data.type] = data.value;
        }
      }
    },
    false
  );

  //  Listener-sensor
  window.addEventListener(
    "message",
    function(ev) {
      if (!(_this._cfg.listener && _this._cfg.listener.sensor)) return;
      if (!(ev.data && ev.data.pando)) return;

      tsPando.toConsole.call(_this, ev.data.pando, function(msg) {
        _this._cfg.listener.sensor.call(_this, msg);
      });
    },
    false
  );
};

/*  targetTheme
        이것이 지정되면 이 Theme을 지원하는 것만 추가함
*/
tsQeditor.qsetBuild = function(
  q,
  /*Enum|undefined*/ targetTheme /*Qset{}|undefined*/
) {
  if (!this.quiData) return;

  return tsPando.qsetBuildByQ(this.quiData, "$EDIT", q, targetTheme);
};

//  새로운 File을 편집기에 지정하는 일련의 절차
tsQeditor.fileLoad = function() {
  console.error(this.Q);
  if (!this.Q) return;

  //  Q{} Data를 Editor로 전송함
  document
    .getElementById("editorIF")
    .contentWindow.postMessage(
      { mqfEditor: { event: "setQ", data: { q: tsQeditor.Q } } },
      "*"
    );

  //  Meta Plugin에 reset 명령을 보냄
  var targetIF;

  for (var i in this.metaPluginList) {
    if ((targetIF = document.getElementById(i))) {
      targetIF.contentWindow.postMessage(
        { mqfEditor: { event: "reset", data: {} } },
        "*"
      );
    }
  }
};

//  Meta 항목을 꺼내고 다시 저장하는 로직. 반드시 이것을 사용할 필요는 없으나 사용할 수 있도록 함수를 추가함
tsQeditor.metaTag = function(/*{}*/ q /*{key:value, ...}*/) {
  //  Meta/Asset Plugin 부분 연동을 위한 Button을 항목별로 생성함. 이러한 UI는 설계 연동 시험 목적임
  var meta = {};

  //  Asset 부분
  var item;

  for (var i = 0; i < q.Body.length; i++) {
    for (var j = 0; j < q.Body[i].Content.length; j++) {
      if ((item = q.Body[i].Content[j])) {
        if (
          item.Type == "image" ||
          item.Type == "audio" ||
          item.Type == "video"
        ) {
          meta["asset|" + item.Type + "|B|" + i + "|" + j] = item.Data; // Key와 값을 구성함. 이 Key로 Plugin과 통신하려고 함
        }
      }
    }
  }
  if (q.choice) {
    for (var i = 0; i < q.choice.length; i++) {
      for (var j = 0; j < q.choice[i].Content.length; j++) {
        if ((item = q.choice[i].Content[j])) {
          if (
            item.Type == "image" ||
            item.Type == "audio" ||
            item.Type == "video"
          ) {
            meta["asset|" + item.Type + "|C|" + i + "|" + j] = item.Data; // Key와 값을 구성함. 이 Key로 Plugin과 통신하려고 함
          }
        }
      }
    }
  }

  //  Subject, Sentence
  if (q.meta) {
    if (q.meta.subject) meta["subject||"] = q.meta.subject;
    if (q.meta.sentence) meta["sentence||"] = q.meta.sentence;
  } else if (q.caliper) {
    for (var i = 0; i < q.caliper.length; i++) {
      if (q.caliper[i].meta) {
        if (q.caliper[i].meta.subject)
          meta["subject||" + i] = q.caliper[i].meta.subject;
        if (q.caliper[i].meta.sentence)
          meta["sentence||" + i] = q.caliper[i].meta.sentence;
      }
    }
  }

  return meta;
};

//  qLastQ 파일에 meta{}를 적용함. 적용할 곳이 없으면 false Return
tsQeditor.metaUntag = function(/*{}*/ qLastQ, /*{}*/ meta /*Boolean*/) {
  //  편집 Object의 Reference는 매번 변경되므로, 정보를 기반으로 항목을 직접 찾아서 지정해야 함
  var tr = meta.trId.split("|");
  var item;

  if (tr[0] == "asset") {
    if (tr[2] == "B") {
      if (qLastQ.Body[tr[3]]) {
        if ((item = qLastQ.Body[tr[3]].Content[tr[4]]) && item.Type == tr[1]) {
          item.Data = meta.value;
          return true;
        }
      }
    } else if (tr[2] == "C") {
      if (qLastQ.choice && qLastQ.choice[tr[3]]) {
        if (
          (item = qLastQ.choice[tr[3]].Content[tr[4]]) &&
          item.Type == tr[1]
        ) {
          item.Data = meta.value;
          return true;
        }
      }
    }
  } else if (tr[0] == "subject" || tr[0] == "sentence") {
    if (tr[2]) {
      // Caliper인 경우
      if (qLastQ.caliper && qLastQ.caliper[tr[2]]) {
        if (meta.value) {
          qLastQ.caliper[tr[2]].meta = qLastQ.caliper[tr[2]].meta || {}; // meta()가 없으면 생성함
          qLastQ.caliper[tr[2]].meta[tr[0]] = meta.value;
        } else {
          if (qLastQ.caliper[tr[2]].meta)
            qLastQ.caliper[tr[2]].meta[tr[0]] = meta.value;
        }
        return true;
      }
    } else {
      if (meta.value) {
        qLastQ.meta = qLastQ.meta || {}; // meta()가 없으면 생성함
        qLastQ.meta[tr[0]] = meta.value;
      } else {
        if (qLastQ.meta) qLastQ.meta[tr[0]] = meta.value;
      }
      return true;
    }
  }
  return false;
};
