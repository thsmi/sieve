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
  /* global SieveDesigner */
  /* global SieveTemplate */

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
      this._min = 1;
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
     * @returns {boolean}
     *   true in case the widget as a drop down otherwise false
     */
    _hasDropDown() {
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
      if (!this._hasDropDown())
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
        this._min = 1;

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
     * @returns {jQuery}
     *   the input elements.
     */
    items() {
      const id = this._selector;

      return $(id + " input[type='text']," + id + " input[type='email']");
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

        values.forEach(function (value) {
          this.addItem(value);
        }, this);

      }

      // Convert the items into a string array...
      const result = [];

      this.items().each(function () {
        result.push($(this).val());
      });

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
    init(sivElement) {

      $(this.selector)
        .load("./toolkit/templates/SieveDropDownWidget.html #template", () => {
          this.initWidgets(sivElement);
        });
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
     * @abstract
     * @returns {string}
     *   the element's node type as string
     */
    static nodeType() {
      throw new Error("Implement a nodeType()");
    }

    /**
     * @abstract
     * @returns {string}
     *   the elements node name as string
     */
    static nodeName() {
      throw new Error("Implement a nodeName()");
    }

    /**
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
     * @param {Function} onInitialized
     *   optional callback invoked when the element is fully initialized
     *
     * @returns {HTMLElement}
     *   a reference to the newly initialized html element.
     */
    async init(sivElement, onInitialized) {

      const template = await (new SieveTemplate()).load(this.getTemplate());

      const container = document.createElement("div");

      while (template.children.length)
        container.appendChild(template.firstChild);

      container.dataset.nodename = this.constructor.nodeName();

      this.getElement().appendChild(container);

      this.load(sivElement);

      // TODO remove me we are async no need for a callback...
      if (typeof (onInitialized) !== "undefined" && onInitialized !== null) {
        throw new Error("Deprecated");
        onInitialized(this.getElement());
      }

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
      const menuElement = $(this.getMenuItem());
      const activeElement = $(this.getActiveItem());

      // TODO clone element instead of html...
      activeElement
        .html(menuElement.html())
        .attr("data-nodename", this.constructor.nodeName())
        .attr("data-value", menuElement.attr("data-value"));
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

      this.onLoad(sivElement, $(element));
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
     * @param {Function} [onInitialized]
     *   optional callback, invoked when a widget is fully initialized
     */
    async init(sivElement, onInitialized) {
      const widgets = SieveDesigner.getWidgetsByClass(this.nodeType, this.selector);

      for (const widget of widgets) {
        const elm = await widget.init(sivElement);

        if (typeof (onInitialized) !== "undefined" && onInitialized !== null)
          onInitialized($(elm));
      }
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
     * @returns {boolean}
     *   true in case the widget as a drop down otherwise false
     */
    _hasDropDown() {
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
     * Called as soon as the element is loaded.
     * It initializes the dropdowns handlers if applicable.
     *
     * @param {string} value
     *   the initial value
     */
    onInitialized(value) {
      const that = this;

      this.setValue(value);

      if (!this._hasDropDown())
        return;

      const elm = $($(this._selector).attr("data-list-dropdown")).children().first().clone();

      $(this._selector)
        .find(".sieve-string-dropdown")
        .removeClass("d-none")
        .before(elm);

      const items = $(this._selector)
        .find(".dropdown-item");

      items
        .click(function () {
          that.setValue($(this).attr("data-value"));
        });

      $.each(items, (index, menuitem) => {

        const updatables = $(menuitem).find(".sieve-string-dropdown-updateable");

        if (!updatables.length)
          return;

        updatables.on("input change", (event) => {

          const somevalue = event.target.value;

          if (event.target.dataset.updateElement)
            menuitem
              .querySelector(event.target.dataset.updateElement)
              .textContent = somevalue;

          menuitem.dataset.value = somevalue;
        });

      });
    }

    /**
     * Initializes the current element
     *
     * @param {string|SieveString} sivElement
     *   the string element which should be rendered.
     *
     */
    init(sivElement) {
      let value = "";

      if (typeof (sivElement) === "undefined" || sivElement === null)
        sivElement = "";

      if (typeof (sivElement) === "string")
        value = sivElement;
      else
        value = sivElement.value();


      $(this._selector).load("./toolkit/templates/SieveStringWidget.html #template", () => {
        this.onInitialized(value);
      });

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
      $(this._selector).find(".sieve-numeric-unit")
        .text($(this._selector).find(`.dropdown-item[data-value="${unit}"] .sieve-unit`).text())
        .attr("data-value", unit);
    }

    /**
     * Called as soon as the element is loaded.
     * It initializes the dropdowns handlers.
     *
     * @param {int} value
     *   the initial numeric value to set
     * @param {string} unit
     *   the initial unit to set
     */
    onInitialized(value, unit) {

      document
        .querySelector(this._selector)
        .querySelector(".sieve-numeric-value")
        .value = value;

      this.onUnitChanged(unit);

      document
        .querySelector(this._selector)
        .querySelectorAll(".dropdown-item")
        .forEach((item) => {
          item.addEventListener("click", () => {
            this.onUnitChanged(item.value);
          });
        });
    }

    /**
     * Initializes the current numeric element
     *
     * @param {string|SieveString} sivElement
     *   the string element which should be rendered.
     *
     */
    init(sivElement) {

      if (sivElement.nodeName() !== "number")
        throw new Error("Expected a number but got " + sivElement.nodeName());

      const value = sivElement.getValue();
      const unit = sivElement.getUnit();

      $(this._selector).load("./toolkit/templates/SieveNumericWidget.html #template", () => {
        this.onInitialized(value, unit);
      });

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

  exports.SieveDropDownWidget = SieveDropDownWidget;
  exports.SieveDropDownItemWidget = SieveDropDownItemWidget;

  exports.SieveRadioGroupWidget = SieveRadioGroupWidget;
  exports.SieveRadioGroupItemWidget = SieveRadioGroupItemWidget;

  exports.SieveStringListWidget = SieveStringListWidget;

  exports.SieveOverlayWidget = SieveOverlayWidget;
  exports.SieveOverlayItemWidget = SieveOverlayItemWidget;

  exports.SieveStringWidget = SieveStringWidget;
  exports.SieveNumericWidget = SieveNumericWidget;

})(window);
