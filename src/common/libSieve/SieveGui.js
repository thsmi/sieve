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

import { SieveI18n } from "./toolkit/utils/SieveI18n.js";
import { SieveLogger } from "./toolkit/utils/SieveLogger.js";
import { SieveTemplate } from "./toolkit/utils/SieveTemplate.js";

import { SieveLexer } from "./toolkit/SieveLexer.js";
import { SieveDesigner } from "./toolkit/SieveDesigner.js";
import { SieveDocument } from "./toolkit/SieveScriptDOM.js";

import { SieveSimpleBoxUI, SieveTrashBoxUI } from "./toolkit/widgets/Boxes.js";
import { SieveCreateDragHandler } from "./toolkit/events/DragHandler.js";

import { SieveGrammar } from "./toolkit/logic/GenericElements.js";

const BRIEF_MAX_LENGTH = 256;
const NAME = 1;
const DEFAULT_LOG_LEVEL = 0xFF;

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
  elm.classList.add("bg-light");
  elm.classList.add("border");
  elm.classList.add("rounded");
  elm.textContent = action.split('/')[NAME];

  return elm;
}

/**
 * Compacts the sieve dom
 **/
function compact() {
  SieveLogger.getInstance()
    .logWidget(`Removed ${dom2.compact()} stale elements`);
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
 * Sets the capabilities as defined in the capabilities dialog
 **/
function setCapabilities() {

  const capabilities = [];

  document
    .querySelectorAll("#debugcapabilities [type=checkbox]:checked")
    .forEach((item) => { capabilities.push(item.value); });

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
 */
function showInfoMessage(message, content) {

  document.querySelector("#infobar-subject")
    .textContent = message;
  document.querySelector("#infobar-message")
    .textContent = content;
  document.querySelector("#infobar-brief-message")
    .textContent = content.substring(0, BRIEF_MAX_LENGTH) + "...";

  document.querySelector("#infobar-brief-message")
    .classList.remove("d-none");
  document.querySelector("#infobar-message")
    .classList.add("d-none");

  document.querySelector("#infobar")
    .classList.remove("d-none");
}


/**
 * The main entry point.
 * Executed as soon as the DOM is Ready.
 */
async function main() {

  // Connect the error handler...
  window.addEventListener("error", (event) => {
    showInfoMessage(event.message, event.error.stack);
  });

  document.querySelector("#infobar-close")
    .addEventListener("click", () => {
      document.querySelector("#infobar").classList.add("d-none");
    });

  document.querySelector("#infobar-brief-message")
    .addEventListener("click", () => {
      document.querySelector("#infobar-brief-message").classList.add("d-none");
      document.querySelector("#infobar-message").classList.remove("d-none");
    });

  SieveLogger.getInstance().level(DEFAULT_LOG_LEVEL);
  await (SieveI18n.getInstance()).load();

  const debug = document.querySelector(`#debug2`);
  while (debug.firstChild)
    debug.removeChild(debug.firstChild);

  // ... and append the new element
  debug.appendChild(
    (await (new SieveTemplate()).load("./templates/debug.html")));

  // Clear any existing left overs...
  const sidebar = document.querySelector(`#toolbar`);
  while (sidebar.firstChild)
    sidebar.removeChild(sidebar.firstChild);

  // ... and append the new element
  sidebar.appendChild(
    (await (new SieveTemplate()).load("./templates/sidebar.html")));

  init();

  document.querySelector("#CapabilitiesApply")
    .addEventListener("click", () => { setCapabilities(); });
  document.querySelector("#CapabilitiesAll")
    .addEventListener("click", () => { loadCapabilities(true); });
  document.querySelector("#CapabilitiesNone")
    .addEventListener("click", () => { loadCapabilities(false); });
  document.querySelector("#CapabilitiesReset")
    .addEventListener("click", () => { loadCapabilities(); });

  document.querySelector('a[data-toggle="tab"][href="#debugcapabilities"]')
    .addEventListener('show.bs.tab', function () { loadCapabilities(); });


  document.querySelector("#DebugParse")
    .addEventListener("click", () => { setSieveScript(); });
  document.querySelector("#DebugStringify")
    .addEventListener("click", () => {
      document.querySelector('#txtOutput').value = getSieveScript();
    });

  document.querySelector("#DebugCompact")
    .addEventListener("click", () => { compact(); });

  const url = new URL(window.location);
  if (url.searchParams.has("debug"))
    document.querySelector('#boxScript').classList.remove("d-none");

  if (url.searchParams.get("capabilities") === "all") {
    loadCapabilities(true);
    setCapabilities();
  }

}

if (document.readyState !== 'loading')
  main();
else
  document.addEventListener('DOMContentLoaded', () => { main(); }, { once: true });

export { setSieveScript };
export { getSieveScript };

window.setSieveScript = setSieveScript;
window.getSieveScript = getSieveScript;
