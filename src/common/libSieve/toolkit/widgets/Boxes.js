/*
 * The contents of this file are licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via
 * email from the author.
 *
 * Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

/* global bootstrap */

import { SieveTemplate } from "./../utils/SieveTemplate.js";

import { SieveMoveDragHandler } from "./../events/DragHandler.js";

import {
  SieveTestDropHandler,
  SieveDropHandler,
  SieveTrashBoxDropHandler
} from "./../events/DropHandler.js";


const UNKNOWN_ID = -1;
const RANDOM_SEED_SIZE = 10000000;
const HEX_STRING = 16;

/**
 * An abstract base class to render sieve elements as html.
 */
class SieveAbstractBoxUI {

  /**
   * Creates a new instance
   *
   * @param {SieveAbstractElement|SieveDocument} elm
   *   sieve element is bound to this box.
   */
  constructor(elm) {
    if (!elm)
      throw new Error("Element expected");

    if (!elm.document && !elm.root)
      throw new Error("Neither a Sieve Element nor a Sieve Document");

    this._elm = elm;
    this._handler = {};

    // create a unique id, which makes identifying the dom object easier.
    this.uniqueId = "siv-" + Math.floor(Math.random() * RANDOM_SEED_SIZE).toString(HEX_STRING) + Date.now().toString(HEX_STRING);
  }

  /**
   * Return the nested unique id. In case no sieve element is bound to
   * this element it return -1
   *
   * @returns {int}
   *   An Integer as unique identifier for the nested sieve element.
   */
  id() {
    if (this._elm.document)
      return this._elm.id();

    return UNKNOWN_ID;
  }

  /**
   * Returns the sieve Element bound to this box.
   * In case no element is bound, an exception will be thrown
   *
   * @returns {SieveAbstractElement}
   *   the sieve object bound to this box
   */
  getSieve() {
    if (!this._elm.document)
      throw new Error("No Sieve Element bound to this box");

    return this._elm;
  }

  /**
   * A reference to the sieve document which hosts this element.
   *
   * @returns {SieveDocument}
   *   the sieve document for this context
   */
  document() {
    if (this._elm.document)
      return this._elm.document();

    return this._elm;
  }

  /**
   * Creates the html content for the box.
   * It appends the content to the parent element.
   * @abstract
   *
   * @param {HTMLElement} parent
   *   the parent element to which this box should be appended.
   *
   * @returns {HTMLElement}
   *   the created element. It may nest the parent element.
   */
  createHtml(parent) {
    throw new Error(`Implement html(${parent}`);
  }

  /**
   * Renders the current sieve element into the html dom.
   * It is using a cache to speedup rendering.
   *
   * Use the invalidate parameter to bypass this cache and
   * force the element to be rendered again
   *
   * @param {boolean} [invalidate]
   *   optional if true the cache will be ignored and it will force to render
   *   the element again.
   *
   * @returns {HTMLElement}
   *   the html representation of the object.
   */
  html(invalidate) {
    if (this._domElm && !invalidate)
      return this._domElm;

    this._domElm = this.createHtml(document.createElement('div'));

    if (this.id() !== UNKNOWN_ID)
      this._domElm.id = `sivElm${this.id()}`;

    // update all our event handlers
    for (const topic in this._handler)
      if (this._handler[topic].attach)
        this._handler[topic].attach(this._domElm);

    return this._domElm;
  }

  /**
   * Reflows means it will reset the html elements and replaces the box
   * content with a clean rendering.
   */
  reflow() {
    if (this.id() < 0)
      throw new Error("Invalid id");

    const item = document.querySelectorAll(`#sivElm${this.id()}`);

    if ((!item.length) || (item.length > 1))
      throw new Error(`${item.length} Elements found for #sivElm${this.id()}`);

    item[0].parentElement.replaceChild(this.html(true), item[0]);
  }

  /**
   * Converts the element to a sieve script
   * @returns {string}
   *   the script as string.
   */
  toScript() {
    if (this._elm.document)
      return this._elm.toScript();

    return "";
  }


  /**
   * The drop element handler
   * @param {} [handler]
   * @param {} [sibling]
   * @returns {SieveAbstractBoxUI}
   *   a self reference
   */
  drop(handler, sibling) {
    if (typeof (handler) === "undefined")
      return this._handler["drop"];

    // release old handler
    if (this._handler["drop"])
      this._handler["drop"].bind(null);

    this._handler["drop"] = handler;
    this._handler["drop"].bind(this, sibling);

    return this;
  }

  /**
   *
   * @param {*} [handler]
   * @returns {SieveAbstractBoxUI}
   *   a self reference
   */
  drag(handler) {
    if (typeof (handler) === "undefined")
      return this._handler["drag"];

    // release old handler
    if (this._handler["drag"])
      this._handler["drag"].bind(null);

    this._handler["drag"] = handler;
    this._handler["drag"].bind(this);

    return this;
  }
}

/**
 * Implements a drop target.
 * It acts as a endpoint for drag an drop operation.
 */
class SieveDropBoxUI extends SieveAbstractBoxUI {

  /**
   * Creates a new instance.
   *
   * @param {SieveAbstractBoxUI} parent
   *   The parent Sieve Element, to which dropped Elements will be added.
   *
   * @param {string} name
   *   the drop targets class name. It is used to distinguish
   *   and style drop targets
   */
  constructor(parent, name) {
    if (!parent)
      throw new Error("Parent expected");

    if ((typeof (name) === "undefined") || (name === null))
      throw new Error("No Class specified");

    if (parent.document)
      super(parent.document());
    else if (parent.root)
      super(parent);
    else
      throw new Error("Either a docshell or an elements expected");

    if (parent.document)
      this._parent = parent;

    this.drop(new SieveDropHandler());

    this.name = name;
  }

  /**
   * @inheritdoc
   */
  createHtml(parent) {
    parent.classList.add("sivDropBox");
    parent.classList.add(this.name);
    parent.appendChild(document.createElement("div"));

    return parent;
  }

  /**
   * Gets the parent UI element/ Widget
   *
   * @returns {SieveAbstractBoxUI}
   *   the parent element.
   */
  parent() {
    return this._parent;
  }
}


/**
 * The trash box is used to delete elements via drag and drop
 */
class SieveTrashBoxUI extends SieveDropBoxUI {

  /**
   * @inheritdoc
   */
  constructor(docshell) {
    super(docshell, "sivTrashBin");
    this.drop(new SieveTrashBoxDropHandler());
  }
}

/**
 * A simple box which toggles between a summary view with widgets and a code view.
 */
class SieveSourceBoxUI extends SieveAbstractBoxUI {

  /**
   * Toggles the current view.
   * This means in case the summary is currently visible it will
   * show the source and vice versa.
   */
  toggleView() {
    if (document.querySelector(`#${this.uniqueId}-summary`).classList.contains("d-none"))
      this.showSummary();
    else
      this.showSource();
  }

  /**
   * Called when the view was toggled.
   *
   * @param {Event} e
   *   the event listener.
   *
   * @returns {boolean}
   *   always true.
   */
  onToggleView(e) {
    this.toggleView();
    e.preventDefault();
    e.stopPropagation();
    return true;
  }

  /**
   * Shows the summary and hides the code view.
   * It does not reload the summary view.
   */
  showSummary() {
    document.querySelector(`#${this.uniqueId}-summary`).classList.remove("d-none");
    document.querySelector(`#${this.uniqueId}-code`).classList.add("d-none");
  }

  /**
   * Shows the code view and hides the summary view.
   * It will automatically replace the code with the most recently changed.
   */
  showSource() {

    // update the code section
    const code = document.querySelector(`#${this.uniqueId}-code > code`);
    while (code.firstChild)
      code.removeChild(code.firstChild);

    code.textContent = this.getSieve().toScript();

    document.querySelector(`#${this.uniqueId}-summary`).classList.add('d-none');
    document.querySelector(`#${this.uniqueId}-code`).classList.remove('d-none');
  }
}


/**
 * Implements an abstract box for elements without any ui elements
 */
class SieveSimpleBoxUI extends SieveAbstractBoxUI {

  /**
   * @inheritdoc
   */
  createHtml(parent) {
    if (typeof (parent) === "undefined")
      throw new Error("parent parameter is missing");

    if (!this.getSummary)
      return parent;

    const summary = document.createElement("div");
    summary.classList.add("sivSummaryContent");
    summary.id = `${this.uniqueId}-summary`;
    summary.appendChild(this.getSummary());

    parent.appendChild(summary);

    return parent;
  }
}


/**
 * Provides a UI with a tabbed modal dialog.
 **/
class SieveDialogBoxUI extends SieveSourceBoxUI {

  /**
   * Called when the user clicks on the save button in the dialog.
   *
   * It triggers the onSave() method. In case this returned true,
   * the dialog will be hidden and the summary is updated.
   */
  save() {

    // Check if on save was canceled...
    if (!this.onSave())
      return;

    const body = document.querySelector("#sivDialogBody");
    while (body.firstChild)
      body.removeChild(body.firstChild);

    // Hide the dialog...
    bootstrap.Modal
      .getInstance(document.querySelector('#sivDialog2'))
      .hide();

    // update the summary section
    const summary = document.querySelector(`#${this.uniqueId}-summary`);
    while (summary.firstChild)
      summary.removeChild(summary.firstChild);

    summary.appendChild(this.getSummary());

    // update the code section
    const code = document.querySelector(`#${this.uniqueId}-code > code`);
    while (code.firstChild)
      code.removeChild(code.firstChild);

    code.textContent = this.getSieve().toScript();
  }

  /**
   * Shows the sieve element's ui to edit the element.
   */
  async showEditor() {

    // TODO hide the save button in case we have only a help tab...
    (new bootstrap.Modal(document.querySelector('#sivDialog2'))).show();

    const save = () => { this.save(); };

    document.querySelector('#sivDialogSave').addEventListener("click", save);

    document
      .querySelector('#sivDialog2')
      .addEventListener('hide.bs.modal', function () {
        document
          .querySelector("#sivDialogSave")
          .removeEventListener("click", save);
      });

    // Empty the existing dialog.
    const dialogTabs = document.querySelector("#sivDialogTabs");
    while (dialogTabs.firstChild)
      dialogTabs.removeChild(dialogTabs.firstChild);

    const dialogBody = document.querySelector("#sivDialogBody");
    while (dialogBody.firstChild)
      dialogBody.removeChild(dialogBody.firstChild);


    const template = await (new SieveTemplate()).load(this.getTemplate());

    const tabs = template.querySelector("#template-tabs");
    if (!tabs)
      throw new Error("Failed to load template, no tab section specified");

    while (tabs.children.length)
      dialogTabs.appendChild(tabs.firstChild);


    const content = template.querySelector("#template-content");
    if (!content)
      throw new Error("Failed to load template, no content section specified");

    while (content.children.length)
      dialogBody.appendChild(content.firstChild);

    this.onLoad();
  }

  /**
   * @inheritdoc
   */
  createHtml(parent) {

    if (typeof (parent) === "undefined")
      throw new Error("parent parameter is missing");

    const FRAGMENT =
      `<div>
           <div class="sivSummaryContent">
             </div>
           <div class="sivSummaryCode d-none">
             <code></code>
           </div>
           <div class="sivSummaryControls">
             <span class="sivIconEdit"></span>
             <span class="sivIconCode"></span>
           </div>
         </div>`;

    const elm = (new SieveTemplate()).convert(FRAGMENT);

    // First assign unique ids...
    const content = elm.querySelector(".sivSummaryContent");
    content.id = `${this.uniqueId}-summary`;

    const code = elm.querySelector(".sivSummaryCode");
    code.id = this.uniqueId + "-code";

    const controls = elm.querySelector(".sivSummaryControls");
    controls.id = this.uniqueId + "-control";

    controls.querySelector(".sivIconCode").addEventListener("click", (e) => {
      return this.onToggleView(e);
    });

    parent.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      this.showEditor();
      return true;
    });

    content.appendChild(this.getSummary());

    // We need this container to make customizing the box easier.
    // e.g. for the allof/anyof operator.
    const div = document.createElement("div");
    div.classList.add("sivEditableElement");

    div.appendChild(content);
    div.appendChild(code);
    div.appendChild(controls);

    parent.appendChild(div);

    return parent;
  }

  /**
   * Gets the url from which the html fragment should be loaded.
   * @abstract
   *
   * @returns {string}
   *   an url which points to an html fragment.
   */
  getTemplate() {
    throw new Error("Implement getTemplate()");
  }

  /**
   * Renders the element's summary view.
   * @abstract
   *
   * @returns {HTMLElement}
   *   the element's summary
   */
  getSummary() {
    throw new Error("Implement getSummary()");
  }

  /**
   * Called when the user clicks on the save button.
   *
   * Intended to be overwritten by a child. The default implementation just
   * returns true and does nothing.
   *
   * @returns {boolean}
   *   true in case the element was saved and the dialog can be closed.
   *   false in case the dialog needs to stay open.
   */
  onSave() {
    return true;
  }

  /**
   * Called when the dialog is about to be shown and is used to initialized
   * the dialog content.
   *
   * Intended to be overwritten by a child. The default implementation does
   * nothing.
   */
  onLoad() {
  }
}


/**
 * Provides a basic UI for a sieve test
 */
class SieveActionDialogBoxUI extends SieveDialogBoxUI {

  /**
   * @inheritdoc
   */
  constructor(elm) {
    // Call parent constructor...
    super(elm);
    this.drag(new SieveMoveDragHandler());
  }

  /**
   * @inheritdoc
   */
  createHtml(parent) {
    const elm = super.createHtml(parent);
    elm.classList.add("sivAction");
    return elm;
  }
}


/**
 * Provides an UI for an abstract test dialog
 */
class SieveTestDialogBoxUI extends SieveDialogBoxUI {

  /**
   * @inheritdoc
   */
  constructor(elm) {
    super(elm);

    this.drag(new SieveMoveDragHandler("sieve/test"));
    this.drop(new SieveTestDropHandler());
  }

  /**
   * @inheritdoc
   */
  createHtml(parent) {
    const elm = super.createHtml(parent);
    elm.classList.add("sivTest");
    return elm;
  }
}


export {
  SieveAbstractBoxUI,
  SieveSimpleBoxUI,
  SieveSourceBoxUI,

  SieveDropBoxUI,
  SieveTrashBoxUI,

  SieveDialogBoxUI,
  SieveActionDialogBoxUI,
  SieveTestDialogBoxUI
};
