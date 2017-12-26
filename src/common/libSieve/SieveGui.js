/*
 * The contents of this file are licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via
 * email from the author.
 *
 * Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 *
 */

"use strict";

/* global window:false */

(function (exports) {

  // hints for jshint

  /* global $: false */

  /* global SieveLexer:false */
  /* global SieveDesigner */
  /* global SieveDocument */

  /* global SieveEditableBoxUI */
  /* global SieveCreateDragHandler */
  /* global SieveTrashBoxUI*/

  /* global console:false */
  /* global document:false */

  let dom2;

  $(document).ready(function () {
    init();

    /* i += 1;
    $(this).find("span").text( "mouse over x " + i );
  }).mouseout(function(){
    $(this).find("span").text("mouse out ");
  })*/
    $("#divOutput").mouseover(function (ev) {

      switch (ev.target.nodeName) {
        case "INPUT":
        case "TEXTAREA":
          $("[draggable=true]").attr("draggable", "false");
          break;

        default:
          $("[draggable=false]").attr("draggable", "true");
      }

      $("#draggable").val(ev.target.nodeName);
    });

    let toolbarLeft = $('#toolbar').offset().left;

    $(window).scroll(function () {
      $('#toolbar').css('left', toolbarLeft - $(window).scrollLeft());
    });

    $("#CapabilityOverlay")
      .click(function () { $('#Capabilities').hide(); });
    $("#CapabilitiesHide")
      .click(function () { $('#Capabilities').hide(); });

    $("#CapabilitiesApply")
      .click(function () { setCapabilities(); });
    $("#CapabilitiesAll")
      .click(function () { selectAllCapabilities(); });

    $("#DebugParse")
      .click(function () { setSieveScript(); });
    $("#DebugStringify")
      .click(function () { $('#txtOutput').val(getSieveScript()); });
    $("#DebugRequire")
      .click(function () { collectRequires(); });
    $("#DebugCompact")
      .click(function () { compact(); });
    $("#DebugCapabilities")
      .click(function () { showCapabilities(); });
    $("#DebugToggle")
      .click(function () { $('#boxScript').toggle(); });

    $("#DebugDropTarget")
      .on('dragover', function (e) {
        console.dir(e.originalEvent.dataTransfer.getData("sieve/action"));
        e.preventDefault();
        e.stopPropagation();
      })
      .on('dragenter', function (e) {
        console.dir(e.originalEvent.dataTransfer.getData("sieve/action"));
        e.preventDefault();
        e.stopPropagation();
      })
      .on('drop', function (e) {
        console.dir(e.originalEvent.dataTransfer.getData("sieve/action"));
        e.preventDefault();
        console.dir(e.dataTransfer);
      });

  });

  function setSieveScript(script, capabilities) {
    if (capabilities)
      SieveLexer.capabilities(capabilities);
    // reset environemnt
    init();

    if (!script)
      script = $('#txtScript').val();
    else
      $('#txtScript').val(script);

    dom2.script(script);

    $("#txtOutput")
      .val(dom2.script());

    $("#divOutput")
      .empty()
      .append(dom2.html());
  }

  function getSieveScript() {
    return dom2.script();
  }

  function collectRequires() {
    let requires = {};

    dom2.root().require(requires);

    for (let i in requires)
      alert(i);
  }

  function showCapabilities() {

    $("#Capabilities input:checkbox").removeAttr('checked');

    let capabilities = SieveLexer.capabilities();
    $("#Capabilities input:checkbox").each(function () {
      if (capabilities[$(this).val()])
        $(this).prop("checked", true);
    });
    $('#Capabilities').show();
  }

  function selectAllCapabilities() {
    $("#Capabilities input:checkbox").each(function () {
      $(this).prop("checked", true);
    });
  }

  function setCapabilities() {
    $('#Capabilities').hide();

    let capabilities = {};

    $("#Capabilities input:checked").each(function () {
      capabilities[$(this).val()] = true;
    });

    SieveLexer.capabilities(capabilities);
    setSieveScript();
  }

  function compact() {
    alert(dom2.compact());
  }
  function debug(obj) {
    // var logger = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);

    let str = "";
    for (let tempVar in obj)
      str += tempVar + "\n";

    alert(str);
    // logger.logStringMessage(str);
  }

  function createMenuItem(action, flavour, docShell) {
    let elm2 = (new SieveEditableBoxUI(docShell));
    elm2.drag(new SieveCreateDragHandler());
    elm2.drag().flavour(flavour);
    elm2._elmType = action;

    return elm2.html()
      .addClass("sivMenuItem")
      .append($(document.createTextNode(action.split('/')[1])));
  }

  function init() {
    // Yes it's a global object
    dom2 = new SieveDocument(SieveLexer, SieveDesigner);

    let docShell = dom2;
    let key;

    let elm = $("#sivActions").empty();

    elm.append($("<div/>").text("Actions"));

    //  alert(SieveLexer.capabilities());
    for (key in SieveLexer.types["action"])
      if (SieveLexer.types["action"][key].onCapable(SieveLexer.capabilities()))
        elm.append(createMenuItem(key, "sieve/action", docShell));

    elm.append($("<div/>").text("Tests"));

    for (key in SieveLexer.types["test"])
      if (SieveLexer.types["test"][key].onCapable(SieveLexer.capabilities()))
        if (key !== "test/boolean")
          elm.append(createMenuItem(key, "sieve/test", docShell).get(0));


    elm.append($("<div/>").text("Operators"));

    for (key in SieveLexer.types["operator"])
      if (SieveLexer.types["operator"][key].onCapable(SieveLexer.capabilities()))
        elm.append(createMenuItem(key, "sieve/operator", docShell).get(0));

    elm
      .append($(document.createElement('div'))
        .addClass("spacer"))
      .append($(new SieveTrashBoxUI(docShell).html())
        .attr('id', 'trash'));
  }

  function showInfoMessage(message, content) {
    $("#infobarsubject > span").text(message);
    $("#infobarmessage > span").text(content);
    $("#infobar").toggle();
  }

  function errorhandler(msg, url, line) {
    // alert(msg+"\n"+url+"\n"+line);
    showInfoMessage(msg, "");
  }

  exports.onerror = errorhandler;
  exports.setSieveScript = setSieveScript;
  exports.getSieveScript = getSieveScript;


})(window);
