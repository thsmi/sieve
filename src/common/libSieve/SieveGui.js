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

  /* global SieveI18n */
  /* global SieveLogger */

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
    // reset environment
    init();

    if (!script)
      script = document.querySelector('#txtScript').value;
    else
      document.querySelector('#txtScript').value = script;

    dom2.script(script);

    document.querySelector("#txtOutput")
      .value = dom2.script();

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
   * Sets the capabilities as defined in the capabilities dialog
   **/
  function setCapabilities() {

    const capabilities = [];

    document
      .querySelectorAll("#debugcapabilities [type=checkbox]:checked")
      .forEach( (item) => { capabilities.push(item.value); });

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

    const items = document
      .querySelectorAll("#debugcapabilities [type=checkbox]");

    if (value === true || value === false) {
      items.forEach((item) => { item.checked = value; });
      return;
    }

    items.forEach((item) => { item.checked = false; });

    const capabilities = SieveLexer.capabilities();

    items
      .forEach((item) => {
        if (capabilities.hasCapability(item.value))
          item.checked = true;
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
    document.querySelector("#infobarsubject > span").textContent = message;
    document.querySelector("#infobarmessage > span").textContent = content;
    $("#infobar").toggle();
  }


  /**
   * The main entry point.
   * Executed as soon as the DOM is Ready.
   */
  async function main() {

    SieveLogger.getInstance().level(0xFF);
    await (SieveI18n.getInstance()).load();

    init();

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


    document.querySelector("#CapabilitiesApply")
      .addEventListener("click", () => { setCapabilities(); });
    document.querySelector("#CapabilitiesAll")
      .addEventListener("click", () => { loadCapabilities(true); });
    document.querySelector("#CapabilitiesNone")
      .addEventListener("click", () => { loadCapabilities(false); });
    document.querySelector("#CapabilitiesReset")
      .addEventListener("click", () => { loadCapabilities(); });

    $('a[data-toggle="tab"][href="#debugcapabilities"]')
      .on('show.bs.tab', function () { loadCapabilities(); });


    document.querySelector("#DebugParse")
      .addEventListener("click", () => { setSieveScript(); });
    document.querySelector("#DebugStringify")
      .addEventListener("click", () => { $('#txtOutput').val(getSieveScript()); });
    document.querySelector("#DebugRequire")
      .addEventListener("click", () => { collectRequires(); });
    document.querySelector("#DebugCompact")
      .addEventListener("click", () => { compact(); });
    document.querySelector("#DebugToggle")
      .addEventListener("click", () => { $('#boxScript').toggle(); });

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

    document.querySelector("#infobartoggle")
      .addEventListener("click", () => { $("#infobar").toggle(); });
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
