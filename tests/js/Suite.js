// Create the namespace...

/* global window */


// Our server is implemented within an anonymous method...

(function (exports) {

  "use strict";

  /* global $: false */
  /* global net */
  /* global tests */
  /* global document */

  // Create the namespace, even if we are inside an anonymous method...
  if (!exports.net)
    exports.net = {};

  if (!exports.net.tschmid)
    exports.net.tschmid = {};

  if (!exports.net.tschmid.yautt)
    exports.net.tschmid.yautt = {};

  if (!exports.net.tschmid.yautt.test)
    exports.net.tschmid.yautt.test = {};

  if (!exports.net.tschmid.yautt.test.server)
    exports.net.tschmid.yautt.test.server = {};

  if (!exports.net.tschmid.yautt.test.server.queue)
    exports.net.tschmid.yautt.test.server.queue = [];

  if (!exports.net.tschmid.yautt.test.server.current)
    exports.net.tschmid.yautt.test.server.current = null;

  exports.net.tschmid.yautt.test.server.onMessage = function (event) {

    let msg = JSON.parse(event.data);

    if (msg.type === "LOG") {
      this.log(msg.data, msg.level);
      return;
    }

    let that = this;

    if (msg.type === "FAIL") {

      this.log("##### Test failed: " + msg.description, "Fail");

      if (msg.details)
        this.log("" + msg.details, "Trace");

      // The post event blocks both window. So defere processing...
      window.setTimeout(function () { that.next(); }, 10);

      $("#tests input[value='" + this.current + "']").parent("div").css("color", "red");

      return;
    }

    if (msg.type === "SUCCEED") {
      this.log("##### Test succeeded.", "Success");
      // The post event blocks both window. So defere processing...
      window.setTimeout(function () { that.next(); }, 10);

      $("#tests input[value='" + this.current + "']").parent("div").css("color", "green");
      return;
    }

    alert("Unknown post received");
  };

  net.tschmid.yautt.test.server.log = function (message, style) {

    if (typeof (style) !== "string")
      style = "logInfo";
    else
      style = "log" + style;

    $("<div/>")
      .addClass(style)
      .text(message)
      .appendTo("#divOutput > div:last-child");
  };

  net.tschmid.yautt.test.server.logTrace = function (message) {
    this.log(message, "Trace");
  };

  net.tschmid.yautt.test.server.logError = function (message) {
    this.log(message, "Error");
  };

  net.tschmid.yautt.test.server.startLog = function (test) {
    $("<div/>")
      .attr("testprofile", test)
      .appendTo("#divOutput");
  };

  net.tschmid.yautt.test.server.extend = function (name) {

    let base = exports.net.tschmid.yautt.test.config[name];
    let scripts = [];

    if (!base)
      return [];

    if (base.extend)
      scripts = this.extend(base.extend);

    if (!base.require)
      return scripts;

    // TODO Check/ensure if require is an array...
    $.each(base.require, function (idx, value) {
      scripts.push(value);
    });

    return scripts;
  };

  net.tschmid.yautt.test.server.next = function () {

    this.current = this.queue.shift();

    if (typeof (this.current) === "undefined")
      return;

    this.startLog(this.current);
    this.log("Test profile '" + this.current + "'", "Header");
    let scripts = this.extend(this.current);

    let tests = exports.net.tschmid.yautt.test.config;

    scripts.push("./../js/Unit.js");
    scripts.push(tests[this.current].script);
    scripts.push("./../js/UnitInit.js");


    let that = this;

    $("#divFrame")
      .empty()
      .append($("<iframe/>")
        .attr("id", "testFrame")
        .load(function () {
          let iframe = document.getElementById("testFrame").contentWindow;
          that.logTrace("Injecting Scripts for " + that.current + " ...");

          $.each(scripts, function (idx, script) {

            let msg = { type: "IMPORT", data: script };

            iframe.postMessage("" + JSON.stringify(msg), "*");
          });
        })
        .attr("src", "./tests/tests.html"));
  };

  /**
   * Adds the test configuration to this server.
   * Existing items are replaced silently
   *
   * @param{object} tests
   *   the tests which should be performed
   * @returns{undefined}
   */
  net.tschmid.yautt.test.server.add = function (tests) {

    let config = exports.net.tschmid.yautt.test.config;

    if (config === null || typeof (config) === "undefined")
      config = {};

    $.each(tests, function (name, value) {
      if (typeof (value) === "undefined")
        return;

      config[name] = value;
    });

    exports.net.tschmid.yautt.test.config = config;
  };

  net.tschmid.yautt.test.server.run = function () {

    let that = this;

    this.queue = [];

    let tests = exports.net.tschmid.yautt.test.config;

    $.each(tests, function (name, value) {
      // Loop through tests..
      if (typeof (value) === "undefined")
        return;

      if (value.disabled)
        return;

      if (!value.script)
        return;

      that.queue.push(name);
    });

    this.next();
    // TODO add a timeout watchdog.
  };

  /**
   * Clears all results...
   * @returns{undefined}
   */
  net.tschmid.yautt.test.server.clear = function () {
    $("#divOutput").empty();

    $("#tests div").each(function () {
      $(this).css("color", "");
    });
  };

  net.tschmid.yautt.test.server.init = function () {
    let that = this;
    window.addEventListener("message", function (event) { that.onMessage(event); }, false);
  };


  $(document).ready(function () {

    net.tschmid.yautt.test.server.init();

    $("#toggleTrace").click(function () {
      $(".logTrace").toggle();
    });

    $("#start").click(function () {

      let tests = exports.net.tschmid.yautt.test.config;

      $.each(tests, function (name, value) {
        if (value.disabled)
          value.disabled = false;
      });

      let items = $("#tests input:checkbox:not(:checked)");
      items.each(function (idx, elm) {
        let name = $(this).val();

        if (tests[name].script)
          tests[name].disabled = true;
      });

      net.tschmid.yautt.test.server.clear();
      net.tschmid.yautt.test.server.run();
    });

    $("#tests-none").click(function () {
      $("#tests input:checkbox").each(function () {
        $(this).prop("checked", false);
      });
    });

    $("#tests-all").click(function () {
      $("#tests input:checkbox").each(function () {
        $(this).prop("checked", true);
      });
    });

    $("#result-clear").click(function () {
      $("#divOutput").empty();

      $("#tests div").each(function () {
        $(this).css("color", "");
      });
    });


    let elm = $("#tests");
    let tests = exports.net.tschmid.yautt.test.config;

    $.each(tests, function (name) {

      if (!tests[name].script)
        return;

      function gotoTest(name) {
        var items = $("#divOutput [testprofile='" + name + "']");

        items.last().get(0).scrollIntoView();
      }

      elm.append(
        $("<div />")
          .append($("<input />", { type: "checkbox", "checked": "checked" }).val(name))
          .append($("<span />").text(name).click(function () { gotoTest(name); })));

    });
  });

})(window);
