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
   * @returns {HTMLElement}
   *   the newly created sieve element
   */
  function createMenuItem(action, flavour, docShell) {

    const elm2 = new SieveSimpleBoxUI(docShell);
    elm2.drag(new SieveCreateDragHandler());
    elm2.drag().flavour(flavour);
    elm2._elmType = action;

    const elm = elm2.html();
    elm.classList.add("sivMenuItem");
    elm.textContent = action.split('/')[1];

    return elm;
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

    // populate the action section
    const actions = document.querySelector("#sivActions");
    while (actions.firstChild)
      actions.removeChild(actions.firstChild);

    for (key in SieveLexer.types["action"])
      if (SieveLexer.types["action"][key].onCapable(SieveLexer.capabilities()))
        actions.appendChild(createMenuItem(key, "sieve/action", docShell));

    // populate the test section
    const tests = document.querySelector("#sivTests");
    while (tests.firstChild)
      tests.removeChild(tests.firstChild);

    for (key in SieveLexer.types["test"])
      if (SieveLexer.types["test"][key].onCapable(SieveLexer.capabilities()))
        if (key !== "test/boolean")
          tests.appendChild(createMenuItem(key, "sieve/test", docShell));

    // populate the operator section
    const operators = document.querySelector("#sivOperators");
    while (operators.firstChild)
      operators.removeChild(operators.firstChild);

    for (key in SieveLexer.types["operator"])
      if (SieveLexer.types["operator"][key].onCapable(SieveLexer.capabilities()))
        operators.appendChild(createMenuItem(key, "sieve/operator", docShell));

    // create the trash bin
    const trash = document.querySelector("#sivTrash");
    while (trash.firstChild)
      trash.removeChild(trash.firstChild);

    trash.appendChild(
      new SieveTrashBoxUI(docShell).html());
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

    const output = document.querySelector(`#divOutput`);
    while (output.firstChild)
      output.removeChild(output.firstChild);

    output.appendChild(dom2.html());
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
    document.querySelector("#infobarsubject").textContent = message;
    document.querySelector("#infobarmessage").textContent = content;
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
      .addEventListener("click", () => {
        document.querySelector('#txtOutput').value = getSieveScript(); });
    document.querySelector("#DebugRequire")
      .addEventListener("click", () => { collectRequires(); });
    document.querySelector("#DebugCompact")
      .addEventListener("click", () => { compact(); });
    document.querySelector("#DebugToggle")
      .addEventListener("click", () => { document.querySelector('#boxScript').classList.toggle("d-none"); });

    if (new URL(window.location).searchParams.has("debug"))
      document.querySelector('#boxScript').classList.remove("d-none");

    document.querySelector("#DebugDropTarget").addEventListener('dragover', (e) => {
      console.log("on drag over");
      console.dir(e.dataTransfer.getData("sieve/action"));
      e.preventDefault();
      e.stopPropagation();
    });

    document.querySelector("#DebugDropTarget").addEventListener('dragenter', function (e) {
      console.log("on drag enter");
      console.dir(e.dataTransfer.getData("sieve/action"));
      e.preventDefault();
      e.stopPropagation();
    });

    document.querySelector("#DebugDropTarget").addEventListener('drop', function (e) {
      console.log("on drop");
      console.dir(e.dataTransfer.getData("sieve/action"));
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
