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

import { SieveI18n } from "./toolkit/utils/SieveI18n.mjs";
import { SieveLogger } from "./toolkit/utils/SieveLogger.mjs";
import { SieveTemplate } from "./toolkit/utils/SieveTemplate.mjs";

import { SieveDesigner } from "./toolkit/SieveDesigner.mjs";

import { SieveSimpleBoxUI, SieveTrashBoxUI } from "./toolkit/widgets/Boxes.mjs";
import { SieveCreateDragHandler } from "./toolkit/events/DragHandler.mjs";

import { SieveGrammar } from "./toolkit/logic/GenericElements.mjs";

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
  elm.classList.add("sivTertiaryBackground");
  elm.classList.add("border");
  elm.classList.add("rounded");
  elm.textContent = action.split('/')[NAME];
  elm.classList.add("siv-" + action.replace("/", "-"));

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
 * Triggers a complete UI reflow.
 */
function reflow() {
  dom2.root().widget().reflow();
}

/**
 * Initializes the sieve rendering ui and script parser
 *
 * @param {object} capabilities
 *   the server's capabilities.
 **/
function init(capabilities) {

  // Yes it's a global object
  dom2 = SieveGrammar.create(capabilities, SieveDesigner);

  const docShell = dom2;

  for (const name of ["Action", "Test", "Operator"]) {
    const items = document.querySelector(`#siv${name}s`);
    while (items.firstChild)
      items.firstChild.remove();

    for (const type of docShell.getSpecsByType(`@${name.toLowerCase()}`)) {
      if (!type.onCapable(docShell.capabilities()))
        continue;

      if (type.spec.id.node === "test/boolean")
        continue;

      items.append(createMenuItem(type.spec.id.node, `sieve/${name.toLowerCase()}`, docShell));
    }
  }

  // create the trash bin
  const trash = document.querySelector("#sivTrash");
  while (trash.firstChild)
    trash.firstChild.remove();

  trash.append(
    new SieveTrashBoxUI(docShell).html());
}

/**
 * Exports the current sieve script from the dom.
 * @returns {string}
 *   the current sieve script as string
 **/
function getSieveScript() {
  return dom2.getScript();
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
  }

  // reset environment
  init(capabilities);

  if (!script)
    script = document.querySelector('#txtScript').value;
  else
    document.querySelector('#txtScript').value = script;

  dom2.setScript(script);

  document.querySelector("#txtOutput")
    .value = dom2.getScript();

  const output = document.querySelector(`#divOutput`);
  while (output.firstChild)
    output.firstChild.remove();

  output.append(dom2.html());
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

  const capabilities = dom2.capabilities();

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

  // Enable dark mode if the system's color-scheme is dark
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-bs-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-bs-theme', 'light');
  }

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
    debug.firstChild.remove();

  // ... and append the new element
  debug.append(
    (await (new SieveTemplate()).load("./templates/debug.html")));

  // Clear any existing left overs...
  const sidebar = document.querySelector(`#toolbar`);
  while (sidebar.firstChild)
    sidebar.firstChild.remove();

  // ... and append the new element
  sidebar.append(
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

  document.querySelector('a[data-bs-toggle="tab"][href="#debugcapabilities"]')
    .addEventListener('show.bs.tab', function () { loadCapabilities(); });


  document.querySelector("#DebugParse")
    .addEventListener("click", () => { setSieveScript(); });
  document.querySelector("#DebugStringify")
    .addEventListener("click", () => {
      document.querySelector('#txtOutput').value = getSieveScript();
    });

  document.querySelector("#DebugCompact")
    .addEventListener("click", () => { compact(); });

  document.querySelector("#DebugReflow")
    .addEventListener("click", () => { reflow(); });

  const url = new URL(window.location);

  if (!url.searchParams.has("embedded"))
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
