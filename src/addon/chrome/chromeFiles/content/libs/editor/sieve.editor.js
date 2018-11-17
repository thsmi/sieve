/* global document */
/* global window */

(function (exports) {

  "use strict";

  /* global net */

  function SieveTextEditorClient(id) {
    this.broker = new net.tschmid.sieve.Broker(id);
    this.id = id;
  }

  SieveTextEditorClient.prototype = {

    broker: null,
    listener: null,
    callbacks: null,
    id: null,

    setListener: function (listener) {
      this.listener = listener;

      let that = this;
      this.broker.setListener(function (event, data) { that.onMessage(event, data); });
    },


    onCallback: function (event, data) {

      if (!this.callbacks)
        return;

      if (!this.callbacks[event])
        return;

      if (!Array.isArray(this.callbacks[event]))
        return;

      this.callbacks[event].forEach(
        function (element) { element(data); }
      );

      delete this.callbacks[event];
    },

    onListener: function (event, data) {

      if (!this.listener)
        return;

      if (event === "onChange")
        this.listener.onChange();

      /* if (event == "onGetScript")
         this.listener.onGetScript(data);*/

      if (event === "onActiveLineChange")
        this.listener.onActiveLineChange();

      if (event === "onStringFound")
        this.listener.onStringFound();
    },


    onMessage: function (event, data) {
      // we first handle call backs...
      this.onCallback(event, data);
      // and then the default listeners
      this.onListener(event, data);
    },

    addCallback: function (id, callback) {

      if (!this.callbacks)
        this.callbacks = {};

      if (!this.callbacks[id])
        this.callbacks[id] = [];

      this.callbacks[id].push(callback);
    },

    loadScript: function (script, callback) {

      if (callback)
        this.addCallback("onScriptLoaded", callback);

      this.broker.sendMessage("loadScript", script);
    },

    getScript: function (callback) {
      if (callback)
        this.addCallback("onGetScript", callback);

      this.broker.sendMessage("getScript");
    },

    setScript: function (script) {
      this.broker.sendMessage("setScript", script);
    },

    replaceSelection: function (text) {
      this.broker.sendMessage("replaceSelection", text);
    },

    selectAll: function () {
      this.broker.sendMessage("selectAll");
    },

    undo: function () {
      this.broker.sendMessage("undo");
    },

    redo: function () {
      this.broker.sendMessage("redo");
    },

    findString: function (token, isCaseSensitive, isReverse) {
      let data = {};
      data.token = token;
      data.isCaseSensitive = isCaseSensitive;
      data.isReverse = isReverse;

      this.broker.sendMessage("findString", data);
    },

    replaceString: function (oldToken, newToken, isCaseSensitive, isReverse) {
      let data = {};
      data.oldToken = oldToken;
      data.newToken = newToken;
      data.isCaseSensitive = isCaseSensitive;
      data.isReverse = isReverse;

      this.broker.sendMessage("replaceString", data);
    },

    focus: function () {
      document.getElementById(this.id).focus();
      this.broker.sendMessage("focus");
    },

    getStatus: function (callback) {

      if (!callback)
        throw new Error("No valid callback for getStatus");

      let proxy = function (msg) {
        // we use the built in function to determin if cut, copy and paste is possible
        let controller = document.commandDispatcher.getControllerForCommand("cmd_cut");
        msg.canCut = controller.isCommandEnabled("cmd_cut");

        controller = document.commandDispatcher.getControllerForCommand("cmd_copy");
        msg.canCopy = controller.isCommandEnabled("cmd_copy");

        controller = document.commandDispatcher.getControllerForCommand("cmd_paste");
        msg.canPaste = controller.isCommandEnabled("cmd_paste");

        callback(msg);
      };

      this.addCallback("onGetStatus", proxy);
      this.broker.sendMessage("getStatus");
    },

    setOptions: function (options) {
      this.broker.sendMessage("setOptions", options);
    }

  };

  if (!exports.net)
    exports.net = {};

  if (!exports.net.tschmid)
    exports.net.tschmid = {};

  if (!exports.net.tschmid.sieve)
    exports.net.tschmid.sieve = {};

  if (!exports.net.tschmid.sieve.editor)
    exports.net.tschmid.sieve.editor = {};

  if (!exports.net.tschmid.sieve.editor.text)
    exports.net.tschmid.sieve.editor.text = {};

  // Export the constructor...
  exports.net.tschmid.sieve.editor.text.Client = SieveTextEditorClient;

})(window);
