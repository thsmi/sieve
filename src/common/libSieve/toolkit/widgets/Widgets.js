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

  const DOM_ELEMENT = 0;

  /* global $: false */
  /* global SieveDesigner */

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
     *   true in case all strings are unique otherwise flase
     */
    isUnique() {
      // We add the values to a set, this guarantees uniquenes
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
      return $(this._selector)[DOM_ELEMENT].hasAttribute("data-list-dropdown");
    }

    /**
     * Called when a new item was added.
     *
     * @param {DomElement} item
     *   the item's dom element
     * @param {string} value
     *   the default value to set
     *
     */
    onItemAdded(item, value) {

      item.find("input[type=text], input[type=email]").val(value).focus();

      // Connect the delete button
      item.find(".sieve-stringlist-delete").click(() => {
        if (this._min >= this.items().length)
          return;

        item.remove();
      });

      // connect the drop down menu...
      if (this._hasDropDown()) {
        const elm = $($(this._selector).attr("data-list-dropdown")).children().first().clone();

        item.find(".sieve-stringlist-dropdown").removeClass("d-none");
        item.find(".sieve-stringlist-dropdown").before(elm);

        elm.find("button").on("click", (event) => {
          this.onItemSelected(item, $(event.currentTarget));
        });
      }
    }

    /**
     * Called when a dropdown item is selected
     *
     * @param {JQuery} item
     *   the string list widget.
     * @param {JQuery} menuItem
     *   the menu item which was clicked
     */
    onItemSelected(item, menuItem) {

      if (menuItem.attr("data-value")) {

        item.find("input[type=text], input[type=email]")
          .val(menuItem.attr("data-value"))
          .focus();

        return;
      }

      item.find("input[type=text], input[type=email]")
        .val(menuItem.text())
        .focus();
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
    addItem(value) {

      if (typeof (value) === "undefined" || value === null)
        value = "";

      const item = $("<div/>");

      $(this._selector)
        .find(".sieve-stringlist-items")
        .append(item);

      $(item).load("./toolkit/templates/SieveStringListWidget.html #template .string-list-item-template", () => {
        this.onItemAdded(item, value);
      });

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

      $(this._selector).empty();

      const items = $("<div/>")
        .addClass("sieve-stringlist-items");

      const controls = $("<div/>")
        .addClass("sieve-stringlist-control");

      $(this._selector)
        .append(items)
        .append(controls);

      $(controls).load("./toolkit/templates/SieveStringListWidget.html #template .sieve-stringlist-add", () => {
        controls.click(() => { this.addItem(); });
      });

      this._min = parseInt($(this._selector).attr("data-list-min"), 10);

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
   * e.g. the addres part uses it
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
     * Initializes the widget's dropdown items.
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
     */
    init(sivElement, onInitialized) {
      const that = this;

      // We need here some to make mozilla happy.
      // it is no more possible to load fragments from chrome urls

      const xhr = new XMLHttpRequest();
      xhr.onload = function () {

        const item = this.responseXML.querySelector("#test42");

        const div = document.createElement("div");
        div.innerHTML = item.innerHTML;

        div.setAttribute("data-nodename", that.constructor.nodeName());

        that.getElement().append(div);

        that.load(sivElement);

        if (typeof(onInitialized) !== "undefined" && onInitialized !== null)
          onInitialized(that.getElement());
      };
      xhr.open("GET", this.getTemplate());
      xhr.responseType = "document";
      xhr.setRequestHeader('cache-control', 'no-cache, must-revalidate, post-check=0, pre-check=0');
      xhr.setRequestHeader('cache-control', 'max-age=0');
      xhr.setRequestHeader('expires', '0');
      xhr.setRequestHeader('expires', 'Tue, 01 Jan 1980 1:00:00 GMT');
      xhr.setRequestHeader('pragma', 'no-cache');
      xhr.send();
    }

    /**
     * Called when the UI Element is loaded.
     *
     * @param {SieveAbstractElement} sivElement
     *   the parent sieve element
     *
     */
    load(sivElement) {
      throw new Error("Implement load " + sivElement);
    }

    /**
     * Called when the UI Element is saved.
     *
     * @param {SieveElement} sivElement
     *   the parent sieve element
     *
     */
    save(sivElement) {
      throw new Error("Implement load " + sivElement);
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
     *
     */
    onLoad(sivElement) {
      this.select();
    }

    /**
     * Called wehn the UI element should be persisted to a sieve script.
     *
     * @param {SieveElement} sivElement
     *   the parent sieve element
     *
     */
    onSave(sivElement) {
      sivElement.setElement(
        this.getActiveItem().attr("data-value"));
    }

    /**
     * Selects the this item and sets is as active item
     *
     */
    select() {
      const menuElement = this.getMenuItem();
      const activeElement = this.getActiveItem();

      activeElement
        .html(menuElement.html())
        .attr("data-nodename", this.constructor.nodeName())
        .attr("data-value", menuElement.attr("data-value"));
    }

    /**
     * Gets the currently active item. It does not nessearily be this item.
     *
     */
    getActiveItem() {
      return $("" + this.selector + " .sivDropDownWidget-active");
    }

    /**
     * Gets the menu item for this item.
     *
     */
    getMenuItem() {
      return $('' + this.selector + ' .sivDropDownWidget-menu div[data-nodename="' + this.constructor.nodeName() + '"] .dropdown-item');
    }

    /**
     * @inheritdoc
     */
    load(sivElement) {

      const element = this.getMenuItem();
      element.click(() => { this.select(); });

      if (this.constructor.nodeName() !== sivElement.getElement().nodeName())
        return;

      this.onLoad(sivElement, element);
    }

    /**
     * @inheritdoc
     */
    save(sivElement) {
      const item = this.getActiveItem();

      if (item.attr("data-nodename") !== this.constructor.nodeName())
        return;

      this.onSave(sivElement);
    }

    /**
     * @inheritdoc
     */
    getElement() {
      return $("" + this.selector + " .sivDropDownWidget-menu");
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
     * @returns {JQuery}
     *   the current element
     */
    getRadioItem() {
      return $("" + this.selector + " [data-nodename='" + this.constructor.nodeName() + "']");
    }

    /**
     * Called upon loading the UI element.
     *
     * @param {SieveElement} sivElement
     *   the parent sieve element
     *
     */
    onLoad(sivElement) {
      this.getRadioItem().find("input[name='" + this.getName() + "']").attr("checked", "checked");
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
        this.getRadioItem().find("input[name='" + this.getName() + "']").val());
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

      if (item.find("input[name='" + this.getName() + "']:checked").length !== 1)
        return;

      this.onSave(sivElement);
    }

    /**
     * @inheritdoc
     */
    getElement() {
      return $("" + this.selector);
    }
  }


  /**
   * Provides support for defered elements like :copy or :create
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
    init(sivElement, onInitialized) {
      const widgets = SieveDesigner.getWidgetsByClass(this.nodeType, this.selector);

      for (const widget of widgets)
        widget.init(sivElement, onInitialized);
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
      return $("" + this.selector);
    }
  }

  /**
   * Renders an UI for a SieveString item.
   */
  class SieveStringWidget {

    /**
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
      return $(this._selector)[DOM_ELEMENT]
        .hasAttribute("data-list-dropdown");
    }

    /**
     * Set the input item's current value.
     *
     * @param {string} value
     *   the value to set.
     */
    setValue(value) {
      $(this._selector)
        .find(".sieve-string-item")
        .val(value);
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

          if (event.target.hasAttribute("data-update-element"))
            $(menuitem).find(event.target.getAttribute("data-update-element")).text(somevalue);

          menuitem.setAttribute("data-value", somevalue);
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

      if (typeof(sivElement) === "undefined" || sivElement === null)
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
     *
     */
    save(sivElement) {

      sivElement.value(
        $(this._selector).find(".sieve-string-item").val());
    }

  }

  /**
   * Provides a numeric widget which is aware of sieves unit field.
   */
  class SieveNumericWidget {

    /**
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
     *
     *
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
     *
     *
     */
    onInitialized(value, unit) {

      $(this._selector).find(".sieve-numeric-value").val(value);
      this.onUnitChanged(unit);

      const items = $(this._selector)
        .find(".dropdown-item");

      const that = this;
      items.click(function () {
        that.onUnitChanged($(this).attr("data-value"));
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
        $(this._selector).find(".sieve-numeric-value").val());
      sivElement.setUnit(
        $(this._selector).find(".sieve-numeric-unit").attr("data-value"));
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
