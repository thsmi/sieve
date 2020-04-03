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

(function (exports) {

  "use strict";

  /* global $: false */

  /* global SieveLexer:false */
  /* global SieveDesigner */
  /* global SieveDocument */

  /* global SieveSimpleBoxUI */
  /* global SieveCreateDragHandler */
  /* global SieveTrashBoxUI*/

  /* global SieveGrammar */

  let dom2;

  /**
   * Creates a new menu item
   *
   * @param {string} action
   *   the items unique type
   * @param {string} flavour
   *   the drop flavour
   * @param {*} docShell
   *   the sieve documents shell
   *
   * @returns {jQuery}
   *   the newly created sieve element
   */
  function createMenuItem(action, flavour, docShell) {

    const elm2 = (new SieveSimpleBoxUI(docShell));
    elm2.drag(new SieveCreateDragHandler());
    elm2.drag().flavour(flavour);
    elm2._elmType = action;

    return elm2.html()
      .addClass("sivMenuItem")
      .append($(document.createTextNode(action.split('/')[1])));
  }

  /**
   * Compacts the sieve dom
   *
   **/
  function compact() {
    alert(dom2.compact());
  }


  /**
   * Initializes the sieve rendering ui and script parser
   *
   **/
  function init() {
    // Yes it's a global object
    dom2 = new SieveDocument(SieveLexer, SieveDesigner);

    const docShell = dom2;
    let key;

    let elm = $("#sivActions").empty();

    //  alert(SieveLexer.capabilities());
    for (key in SieveLexer.types["action"])
      if (SieveLexer.types["action"][key].onCapable(SieveLexer.capabilities()))
        elm.append(createMenuItem(key, "sieve/action", docShell));

    elm = $("#sivTests").empty();

    for (key in SieveLexer.types["test"])
      if (SieveLexer.types["test"][key].onCapable(SieveLexer.capabilities()))
        if (key !== "test/boolean")
          elm.append(createMenuItem(key, "sieve/test", docShell).get(0));

    elm = $("#sivOperators").empty();

    for (key in SieveLexer.types["operator"])
      if (SieveLexer.types["operator"][key].onCapable(SieveLexer.capabilities()))
        elm.append(createMenuItem(key, "sieve/operator", docShell).get(0));

    elm = $("#sivTrash").empty();
    elm
      .append($(document.createElement('div'))
        .addClass("spacer"))
      .append($(new SieveTrashBoxUI(docShell).html())
        .attr('id', 'trash'));
  }

  /**
   * Exports the current sieve script from the dom.
   * @returns {string}
   *   the current sieve script as string
   **/
  function getSieveScript() {
    return dom2.script();
  }

  /**
   * Renders the given script
   *
   * @param {string} script
   *   the sieve script which should be rendered
   * @param {object} [capabilities]
   *   the capabilities which should be enabled
   *
   */
  function setSieveScript(script, capabilities) {

    if (capabilities) {

      if (typeof capabilities === 'string' || capabilities instanceof String)
        capabilities = JSON.parse(capabilities);

      // we need some magic here, the addon returns hashmap while
      // the new parser expects an iterable.
      if (!Array.isArray(capabilities)) {
        const tmp = [];
        for (const item in capabilities)
          tmp.push(item);

        capabilities = tmp;
      }

      SieveLexer.capabilities(capabilities);
    }

    SieveGrammar.create();
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

  /**
   * Collects and shows al require statements
   *
   **/
  function collectRequires() {
    const requires = {};

    dom2.root().require(requires);

    for (const i in requires)
      alert(i);
  }

  /**
   * Sets the capabilities as defined in the capabilies dialog
   *
   **/
  function setCapabilities() {

    const capabilities = [];

    $("#debugcapabilities input:checked").each(function () {
      capabilities.push($(this).val());
    });

    setSieveScript(
      getSieveScript(), capabilities);
  }



  /**
   * Selects or deselects all capabilities in the dialog
   * @param {boolean} [value]
   *   if omitted the current capabilities are set
   *   if true all capabilities are be selected
   *   if false all capabilities are be deselected
   *
   */
  function loadCapabilities(value) {

    if (value === true || value === false) {
      $("#debugcapabilities input:checkbox").prop("checked", value);

      return;
    }

    $("#debugcapabilities input:checkbox").prop('checked', false);

    const capabilities = SieveLexer.capabilities();

    $("#debugcapabilities input:checkbox").each(function () {
      if (capabilities.hasCapability($(this).val()))
        $(this).prop("checked", true);
    });

  }


  /**
   * Shows an info box
   * @param {string} message
   *   the message's subject
   * @param {string} content
   *   the message's details
   *
   */
  function showInfoMessage(message, content) {
    $("#infobarsubject > span").text(message);
    $("#infobarmessage > span").text(content);
    $("#infobar").toggle();
  }


  /**
   * The main entry point.
   * Executed as soon as the DOM is Ready.
   */
  function main() {
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

    const toolbarLeft = $('#toolbar').offset().left;

    $(window).scroll(function () {
      $('#toolbar').css('left', toolbarLeft - $(window).scrollLeft());
    });


    $("#CapabilitiesApply")
      .click(function () { setCapabilities(); });
    $("#CapabilitiesAll")
      .click(function () { loadCapabilities(true); });
    $("#CapabilitiesNone")
      .click(function () { loadCapabilities(false); });
    $("#CapabilitiesReset")
      .click(function () { loadCapabilities(); });

    $('a[data-toggle="tab"][href="#debugcapabilities"]')
      .on('show.bs.tab', function () { loadCapabilities(); });


    $("#DebugParse")
      .click(function () { setSieveScript(); });
    $("#DebugStringify")
      .click(function () { $('#txtOutput').val(getSieveScript()); });
    $("#DebugRequire")
      .click(function () { collectRequires(); });
    $("#DebugCompact")
      .click(function () { compact(); });
    $("#DebugToggle")
      .click(function () { $('#boxScript').toggle(); });

    $("#DebugDropTarget")
      .on('dragover', function (e) {
        console.log("on drag over");
        console.dir(e.originalEvent.dataTransfer.getData("sieve/action"));
        e.preventDefault();
        e.stopPropagation();
      })
      .on('dragenter', function (e) {
        console.log("on drag enter");
        console.dir(e.originalEvent.dataTransfer.getData("sieve/action"));
        e.preventDefault();
        e.stopPropagation();
      })
      .on('drop', function (e) {
        console.log("on drop");
        console.dir(e.originalEvent.dataTransfer.getData("sieve/action"));
        e.preventDefault();
        console.dir(e.dataTransfer);
      });

    $("#infobartoggle")
      .click(function() { $("#infobar").toggle(); });
  }

  /**
   * The windows default error handler
   * @param {string} msg
   *   the error message
   * @param {string} url
   *   the file which caused the error
   * @param {string} [line]
   *   the line which caused the error
   *
   */
  // eslint-disable-next-line no-unused-vars
  function errorhandler(msg, url, line) {
    // alert(msg+"\n"+url+"\n"+line);
    showInfoMessage(msg, "");
  }

  if (document.readyState !== 'loading')
    main();
  else
    document.addEventListener('DOMContentLoaded', () => { main(); }, { once: true });

  exports.onerror = errorhandler;
  exports.setSieveScript = setSieveScript;
  exports.getSieveScript = getSieveScript;

})(window);
