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

import { SieveDesigner } from "./../SieveDesigner.js";
import { SieveTemplate } from "./../utils/SieveTemplate.js";

const DEFAULT_STRING_LIST_MIN = 1;

/**
 * Provides a string list UI.
 */
class SieveStringListWidget {

  /**
   * Initializes the list widget
   * @param {string} selector
   *   the selector which points to the dom element which
   *   should host the string list.
   */
  constructor(selector) {
    this._selector = selector;
    this._min = DEFAULT_STRING_LIST_MIN;
  }

  /**
   * Checks if the strings contained in the list are unique.
   *
   * @returns {boolean}
   *   true in case all strings are unique otherwise false
   */
  isUnique() {
    // We add the values to a set, this guarantees uniqueness
    // and drops duplicate elements.
    return (new Set(this.values()).size === this.values().length);
  }

  /**
   * Checks if the list contains only empty elements.
   *
   * @returns {boolean}
   *   true in case the list contains a only empty element.
   */
  isEmpty() {

    for (const item of this.values()) {
      if (item.trim() !== "")
        continue;

      return true;
    }

    return false;
  }

  /**
   * Checks if String list has a reference to a drop down menu.
   *
   * @returns {boolean}
   *   true in case the widget as a drop down otherwise false
   */
  hasDropDown() {
    if (document.querySelector(this._selector).dataset.listDropdown)
      return true;

    return false;
  }

  /**
   * Called when a new item was added.
   *
   * @param {HTMLElement} item
   *   the item's dom element
   * @param {string} value
   *   the default value to set
   *
   */
  onItemAdded(item, value) {

    const target = item.querySelector("input[type=text], input[type=email]");
    target.value = value;
    target.focus();

    // Connect the delete button
    item
      .querySelector(".sieve-stringlist-delete")
      .addEventListener("click", () => {
        if (this._min >= this.items().length)
          return;

        item.parentNode.removeChild(item);
      });

    // connect the drop down menu...
    if (!this.hasDropDown())
      return;

    // Get the dropdown selector
    const id = document.querySelector(this._selector).dataset.listDropdown;

    // Try to load the template, in case it does not exist we fail silently.
    const template = document.querySelector(id);
    if (!template)
      return;

    const elm = template.firstElementChild.cloneNode(true);

    // Show the dropdown button.
    item
      .querySelector(".sieve-stringlist-dropdown")
      .classList.remove("d-none");

    // and connect the cloned menu
    item
      .querySelector(".sieve-stringlist-dropdown")
      .insertAdjacentElement('beforebegin', elm);

    for (const menu of elm.querySelectorAll(".dropdown-item")) {
      menu.addEventListener("click", () => {
        this.onItemSelected(item, menu);
      });
    }
  }

  /**
   * Called when a dropdown item is selected
   *
   * @param {HTMLElement} item
   *   the string list widget.
   * @param {HTMLElement} menuItem
   *   the menu item which was clicked
   */
  onItemSelected(item, menuItem) {

    let value = menuItem.textContent;

    if (menuItem.dataset.value !== undefined)
      value = menuItem.dataset.value;

    const target = item.querySelector("input[type=text], input[type=email]");

    if (target === null)
      return;

    target.value = value;
    target.focus();
  }

  /**
   * Adds a textbox with the give value to the UI
   *
   * @param {string} [value]
   *   the value which should be added. If omitted an empty string is added.
   *
   * @returns {SieveStringListWidget}
   *   a self reference
   */
  async addItem(value) {

    if (typeof (value) === "undefined" || value === null)
      value = "";

    const container = document.createElement("div");

    const item = document.querySelector(`${this._selector} .sieve-stringlist-items`);
    item.appendChild(container);

    const template = (await (new SieveTemplate())
      .load("./toolkit/templates/SieveStringListWidget.html"))
      .querySelector(".string-list-item-template");

    container.appendChild(template);
    this.onItemAdded(container, value);

    return this;
  }

  /**
   * Initializes the widget.
   *
   * @param {string[] | SieveStringList} [values]
   *   the initial values
   * @returns {SieveStringListWidget}
   *   a self reference
   */
  init(values) {

    const elm = document.querySelector(this._selector);

    while (elm.firstChild)
      elm.removeChild(elm.firstChild);

    const items = document.createElement("div");
    items.classList.add("sieve-stringlist-items");

    const controls = document.createElement("div");
    controls.classList.add("sieve-stringlist-control");

    elm.appendChild(items);
    elm.appendChild(controls);


    (async () => {
      const template = (await (new SieveTemplate())
        .load("./toolkit/templates/SieveStringListWidget.html"))
        .querySelector(".sieve-stringlist-add");

      controls.appendChild(template);
      controls
        .addEventListener("click", () => { this.addItem(); });
    })();

    this._min = parseInt(elm.dataset.listMin, 10);

    if (isNaN(this._min))
      this._min = DEFAULT_STRING_LIST_MIN;

    // init values if possible
    if (values === null || typeof (values) === "undefined")
      return this;

    // in case it is neither an array nor a string we call the value method.
    if (!Array.isArray(values) && !(typeof (values) === 'string') && !(values instanceof String))
      values = values.values();

    this.values(values);
    return this;
  }

  /**
   * Saves the current widget into a sieve element.
   * @param {SieveStringList} elm
   *   the sieve element which should be updated.
   *
   */
  save(elm) {
    elm.values(this.values());
  }

  /**
   * Returns all input elements which are associated with this string list.
   *
   * @returns {NodeList}
   *   the input elements.
   */
  items() {

    const id = this._selector;

    return document
      .querySelectorAll(`${id} input[type='text'], ${id} input[type='email']`);
  }

  /**
   * Gets and/or sets the string lists values.
   *
   * @param  {string[]} [values]
   *   an optional array of string which should be sets
   *
   * @returns {string[]}
   *   the string lists elements as array.
   **/
  values(values) {

    if (typeof (values) !== "undefined") {

      if (Array.isArray(values) === false)
        throw new Error("Values is not an array");

      values.forEach(async (value) => {
        await this.addItem(value);
      });
    }

    // Convert the items into a string array...
    const result = [];

    for (const item of this.items())
      result.push(item.value);

    return result;
  }
}

/**
 * Provides a widget for dropdown
 * e.g. the address part uses it
 */
class SieveDropDownWidget {

  /**
   * Creates a new instance
   * @param {string} nodeType
   *   the widgets node type
   * @param {string} selector
   *   an selector which identifies the parent dom element
   */
  constructor(nodeType, selector) {
    this.selector = selector;
    this.nodeType = nodeType;
  }

  /**
   * Initializes the widgets' dropdown items.
   * @param {SieveAbstractElement} sivElement
   *   the sieve element which should
   *
   */
  initWidgets(sivElement) {
    const widgets = SieveDesigner.getWidgetsByClass(this.nodeType, this.selector);

    for (const widget of widgets)
      widget.init(sivElement);
  }

  /**
   * Initializes and renders the dropdown widget.
   *
   * @param {SieveAbstractElement} sivElement
   *   the sieve element which should be rendered.
   *
   */
  async init(sivElement) {

    const template = await (new SieveTemplate()).load("./toolkit/templates/SieveDropDownWidget.html");

    const elm = document.querySelector(this.selector);
    while (elm.firstChild)
      elm.removeChild(elm.firstChild);

    while (template.children.length)
      elm.appendChild(template.firstChild);

    this.initWidgets(sivElement);
  }

  /**
   * Persist the sieve settings into the given sieve element
   * @param {SieveAbstractElement} sivElement
   *   the parent sieve element
   *
   */
  save(sivElement) {

    const widgets = SieveDesigner.getWidgetsByClass(this.nodeType, this.selector);
    for (const widget of widgets)
      widget.save(sivElement);
  }
}

/**
 * An abstract item for radiobuttons and dropdowns.
 */
class SieveAbstractItemWidget {
  /**
   * Creates a new instance.
   * @param {string} selector
   *   a selector which identifies the parent element.
   */
  constructor(selector) {
    this.selector = selector;
  }

  /**
   * Gets the node type.
   * @abstract
   *
   * @returns {string}
   *   the element's node type as string
   */
  static nodeType() {
    throw new Error("Implement a nodeType()");
  }

  /**
   * Gets the node name.
   * @abstract
   *
   * @returns {string}
   *   the elements node name as string.
   */
  static nodeName() {
    throw new Error("Implement a nodeName()");
  }

  /**
   * Checks if the element is compatible.
   *
   * @returns {boolean}
   *   the element's capabilities
   */
  static isCapable() {
    return true;
  }

  /**
   * The radio groups unique name
   * @returns {string}
   *   the name as string
   *
   * @abstract
   */
  getName() {
    throw new Error("Implement getName()");
  }


  /**
   * Returns the URL to the html template.
   * @returns {string}
   *   the url which points to the template
   *
   * @abstract
   */
  getTemplate() {
    throw new Error("Implement getTemplate()");
  }

  /**
   * @inheritdoc
   */
  getElement() {
    throw new Error("Implement getElement()");
  }

  /**
   * Renders the UI Component.
   * Keep in mind rendering may be async.
   *
   * @param {SieveAbstractElement} sivElement
   *   selects the current matchtype in case it is true.
   *
   * @returns {HTMLElement}
   *   a reference to the newly initialized html element.
   */
  async init(sivElement) {

    const template = await (new SieveTemplate()).load(this.getTemplate());

    const container = document.createElement("div");

    while (template.children.length)
      container.appendChild(template.firstChild);

    container.dataset.nodename = this.constructor.nodeName();

    this.getElement().appendChild(container);

    this.load(sivElement);

    return this.getElement();
  }

  /**
   * Called when the UI Element is loaded.
   *
   * @param {SieveAbstractElement} sivElement
   *   the parent sieve element
   *
   */
  load(sivElement) {
    throw new Error(`Implement load ${sivElement}`);
  }

  /**
   * Called when the UI Element is saved.
   *
   * @param {SieveElement} sivElement
   *   the parent sieve element
   *
   */
  save(sivElement) {
    throw new Error(`Implement load ${sivElement}`);
  }
}

/**
 * An abstract radio group widget
 */
class SieveDropDownItemWidget extends SieveAbstractItemWidget {

  /**
   * Called upon loading the UI element.
   *
   * @param {SieveElement} sivElement
   *   the parent sieve element
   */
  // eslint-disable-next-line no-unused-vars
  onLoad(sivElement) {
    this.select();
  }

  /**
   * Called when the UI element should be persisted to a sieve script.
   *
   * @param {SieveElement} sivElement
   *   the parent sieve element
   *
   */
  onSave(sivElement) {
    sivElement.setElement(this.getActiveItem().dataset.value);
  }

  /**
   * Selects the this item and sets is as active item
   *
   */
  select() {
    const menuElement = this.getMenuItem().cloneNode(true);
    const activeElement = this.getActiveItem();

    while (activeElement.firstChild)
      activeElement.removeChild(activeElement.firstChild);

    while (menuElement.firstChild)
      activeElement.appendChild(menuElement.firstChild);

    activeElement.dataset.nodename = this.constructor.nodeName();
    activeElement.dataset.value = menuElement.dataset.value;
  }

  /**
   * Gets the currently active dropdown item. It does not necessarily be this item.
   *
   * @returns {HTMLElement}
   *   the active dropdown item.
   */
  getActiveItem() {
    return document.querySelector(`${this.selector} .sivDropDownWidget-active`);
  }

  /**
   * Gets the menu item for this item.
   *
   * @returns {HTMLElement}
   *   the menu item.
   */
  getMenuItem() {
    return document.querySelector(`${this.selector} .sivDropDownWidget-menu div[data-nodename="${this.constructor.nodeName()}"] .dropdown-item`);
  }

  /**
   * @inheritdoc
   */
  load(sivElement) {

    const element = this.getMenuItem();
    element.addEventListener("click", () => { this.select(); });

    if (this.constructor.nodeName() !== sivElement.getElement().nodeName())
      return;

    this.onLoad(sivElement);
  }

  /**
   * @inheritdoc
   */
  save(sivElement) {
    const item = this.getActiveItem();

    if (item.dataset.nodename !== this.constructor.nodeName())
      return;

    this.onSave(sivElement);
  }

  /**
   * @inheritdoc
   */
  getElement() {
    return document.querySelector(`${this.selector} .sivDropDownWidget-menu`);
  }
}


/**
 * Provides a widget for the radio groups
 */
class SieveRadioGroupWidget {

  /**
   * Creates a new instance
   * @param {string} nodeType
   *   the widgets node type
   * @param {string} selector
   *   an selector which identifies the parent dom element
   */
  constructor(nodeType, selector) {
    this.selector = selector;
    this.nodeType = nodeType;
  }

  /**
   * Initializes and renders the matchtype widget.
   *
   * @param {SieveAbstractElement} sivElement
   *   the sieve element which should be rendered.
   *
   */
  init(sivElement) {
    const widgets = SieveDesigner.getWidgetsByClass(this.nodeType, this.selector);

    for (const widget of widgets)
      widget.init(sivElement);
  }

  /**
   * Persist the sieve settings into the given sieve element
   * @param {SieveAbstractElement} sivElement
   *   the parent sieve element
   *
   */
  save(sivElement) {

    const widgets = SieveDesigner.getWidgetsByClass(this.nodeType, this.selector);
    for (const widget of widgets)
      widget.save(sivElement);
  }
}


/**
 * An abstract radio group widget
 */
class SieveRadioGroupItemWidget extends SieveAbstractItemWidget {

  /**
   * The current radio item.
   *
   * @returns {HTMLElement}
   *   the current element
   */
  getRadioItem() {
    return document.querySelector(`${this.selector} [data-nodename="${this.constructor.nodeName()}"]`);
  }

  /**
   * Called upon loading the UI element.
   *
   * @param {SieveElement} sivElement
   *   the parent sieve element
   */
  // eslint-disable-next-line no-unused-vars
  onLoad(sivElement) {
    this.getRadioItem().querySelector(`input[name='${this.getName()}']`).checked = true;
  }

  /**
   * Called when the UI element should be persisted to a sieve script.
   *
   * @param {SieveElement} sivElement
   *   the parent sieve element
   *
   */
  onSave(sivElement) {
    sivElement.setElement(
      this.getRadioItem().querySelector(`input[name='${this.getName()}']`).value);
  }

  /**
   * @inheritdoc
   */
  load(sivElement) {

    if (this.constructor.nodeName() !== sivElement.getElement().nodeName())
      return;

    this.onLoad(sivElement);
  }

  /**
   * @inheritdoc
   */
  save(sivElement) {
    const item = this.getRadioItem();

    if (!item.querySelector(`input[name='${this.getName()}']:checked`))
      return;

    this.onSave(sivElement);
  }

  /**
   * @inheritdoc
   */
  getElement() {
    return document.querySelector(`${this.selector}`);
  }
}


/**
 * Provides support for deferred elements like :copy or :create
 */
class SieveOverlayWidget {

  /**
   * Creates a new instance
   * @param {string} nodeType
   *   the widgets node type
   * @param {string} selector
   *   an selector which identifies the parent dom element
   */
  constructor(nodeType, selector) {
    this.selector = selector;
    this.nodeType = nodeType;
  }

  /**
   * Initializes and renders the widget.
   *
   * @param {SieveAbstractElement} sivElement
   *   the sieve element which should be rendered.
   */
  async init(sivElement) {
    const widgets = SieveDesigner.getWidgetsByClass(this.nodeType, this.selector);

    for (const widget of widgets)
      await widget.init(sivElement);
  }

  /**
   * Persist the sieve settings into the given sieve element
   * @param {SieveAbstractElement} sivElement
   *   the parent sieve element
   *
   */
  save(sivElement) {
    const widgets = SieveDesigner.getWidgetsByClass(this.nodeType, this.selector);

    for (const widget of widgets)
      widget.save(sivElement);
  }
}

/**
 * Implements the create overlay for the fileinto action.
 */
class SieveOverlayItemWidget extends SieveAbstractItemWidget {

  /**
   * @inheritdoc
   */
  getElement() {
    return document.querySelector(`${this.selector}`);
  }
}

/**
 * Renders an UI for a SieveString item.
 */
class SieveStringWidget {

  /**
   * Creates a new instance.
   *
   * @param {string} selector
   *   the selector which identifies where the input dom element
   */
  constructor(selector) {
    this._selector = selector;
  }

  /**
   * Checks if the string widget has a reference to a drop down list.
   *
   * @returns {boolean}
   *   true in case the string widget as a drop down otherwise false.
   */
  hasDropDown() {
    return document.querySelector(this._selector)
      .hasAttribute("data-list-dropdown");
  }

  /**
   * Set the input item's current value.
   *
   * @param {string} value
   *   the value to set.
   */
  setValue(value) {
    document
      .querySelector(this._selector)
      .querySelector(".sieve-string-item")
      .value = value;
  }


  /**
   * Initializes the current element
   *
   * @param {string|SieveString} sivElement
   *   the string element which should be rendered.
   */
  async init(sivElement) {
    let value = "";

    if (typeof (sivElement) === "undefined" || sivElement === null)
      sivElement = "";

    if (typeof (sivElement) === "string")
      value = sivElement;
    else
      value = sivElement.value();

    await this.initTextField(value);

    if (this.hasDropDown())
      this.initDropDown();
  }

  /**
   * Initializes the strings text field.
   * @param {string} value
   *   the value to which the string should be initialized.
   */
  async initTextField(value) {
    const template = (await (new SieveTemplate())
      .load("./toolkit/templates/SieveStringWidget.html"))
      .querySelector(".string-item-template");

    document.querySelector(this._selector).appendChild(template);

    this.setValue(value);
  }

  /**
   * Initializes the drop down menu.
   */
  initDropDown() {
    const id = document.querySelector(this._selector).dataset.listDropdown;

    const template = document.querySelector(id);
    if (!template)
      return;

    const menu = template.firstElementChild.cloneNode(true);

    const button = document
      .querySelector(this._selector)
      .querySelector(".sieve-string-dropdown");

    button.classList.remove("d-none");
    button.insertAdjacentElement('beforebegin', menu);

    this.initClickHandler(menu);
    this.initUpdatables(menu);
  }

  /**
   * Initializes the Drop Down Click handlers.
   */
  initClickHandler() {

    const onClick = (menuItem) => {
      this.setValue(menuItem.dataset.value);
    };

    const menuItems = document
      .querySelectorAll(`${this._selector} .dropdown-item`);

    for (const menuItem of menuItems) {
      menuItem.addEventListener("click", () => { onClick(menuItem); });
    }
  }

  /**
   * Initializes updatable elements
   */
  initUpdatables() {

    const onChange = (updatable, menuItem) => {

      const value = updatable.value;
      const id = updatable.dataset.updateElement;

      if (id)
        menuItem.querySelector(`${id}`).textContent = value;

      menuItem.dataset.value = value;
      this.setValue(value);
    };


    const menuItems = document
      .querySelectorAll(`${this._selector} .dropdown-item`);

    for (const menuItem of menuItems) {

      const updatable = menuItem.querySelector(".sieve-string-dropdown-updatable");
      if (!updatable)
        continue;

      updatable.addEventListener("input",
        (event) => { onChange(event.target, menuItem); });
    }
  }

  /**
   * Saves the current element.
   *
   * @param {SieveString} sivElement
   *   the string element which was rendered and should be saved.
   */
  save(sivElement) {
    sivElement.value(
      document.querySelector(`${this._selector} .sieve-string-item`).value);
  }

}

/**
 * Provides a numeric widget which is aware of sieves unit field.
 */
class SieveNumericWidget {

  /**
   * Creates a new instance.
   *
   * @param {string} selector
   *   the selector which identifies place holder for the input elements
   */
  constructor(selector) {
    this._selector = selector;
  }

  /**
   * Call back which handles a change in the number's unit.
   *
   * @param {string} unit
   *   either a M,K,G or an empty string
   */
  onUnitChanged(unit) {
    const widget = document.querySelector(this._selector);

    const text = widget
      .querySelector(`.dropdown-item[data-value="${unit}"] .sieve-unit`)
      .textContent;

    const elm = widget
      .querySelector(`.sieve-numeric-unit`);

    elm.textContent = text;
    elm.dataset.value = unit;
  }

  /**
   * Initializes the current numeric element
   *
   * @param {string|SieveString} sivElement
   *   the string element which should be rendered.
   */
  async init(sivElement) {

    if (sivElement.nodeName() !== "number")
      throw new Error("Expected a number but got " + sivElement.nodeName());

    const value = sivElement.getValue();
    const unit = sivElement.getUnit();

    const template = await (new SieveTemplate()).load("./toolkit/templates/SieveNumericWidget.html");

    const elm = document.querySelector(this._selector);
    while (elm.firstChild)
      elm.removeChild(elm.firstChild);

    while (template.children.length)
      elm.appendChild(template.firstChild);

    document
      .querySelector(`${this._selector} .sieve-numeric-value`)
      .value = value;

    this.onUnitChanged(unit);

    const items = document
      .querySelectorAll(`${this._selector} .dropdown-item`);

    for (const item of items) {
      item.addEventListener("click", () => {
        this.onUnitChanged(item.dataset.value);
      });
    }

  }

  /**
   * Saves the current element.
   *
   * @param {SieveString} sivElement
   *   the string element which was rendered and should be saved.
   *
   */
  save(sivElement) {

    sivElement.setValue(
      document.querySelector(`${this._selector} .sieve-numeric-value`).value);
    sivElement.setUnit(
      document.querySelector(`${this._selector} .sieve-numeric-unit`).dataset.value);
  }

}

export {
  SieveDropDownWidget,
  SieveDropDownItemWidget,
  SieveRadioGroupWidget,
  SieveRadioGroupItemWidget,
  SieveStringListWidget,
  SieveOverlayWidget,
  SieveOverlayItemWidget,
  SieveStringWidget,
  SieveNumericWidget
};
