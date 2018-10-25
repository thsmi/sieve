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
     * @param {String} selector
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
      return (new Set(this.values()).size !== this.values().length);
    }

    /**
     * Checks if the list contains only empty elements.
     *
     * @returns {boolean}
     *   true in case the list contains a only empty element.
     */
    isEmpty() {

      for (let item of this.values()) {
        if (item.trim() !== "")
          continue;

        return false;
      }

      return true;
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
     * @param {String} value
     *   the default value to set
     * @returns {void}
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
        let elm = $($(this._selector).attr("data-list-dropdown")).children().first().clone();

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
     *
     * @returns {void}
     */
    onItemSelected(item, menuItem) {
      item.find("input[type=text], input[type=email]")
        .val(menuItem.text())
        .focus();
    }

    /**
     * Adds a textbox with the give value to the UI
     *
     * @param {String} [value]
     *   the value which should be added. If omitted an empty string is added.
     * @returns {void}
     */
    addItem(value) {

      if (typeof (value) === "undefined" || value === null)
        value = "";

      let item = $("<div/>");

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
     * @param {String[] | SieveStringList} [values]
     *   the initial values
     * @returns {SieveStringListWidget}
     *   a self reference
     */
    init(values) {

      $(this._selector).empty();

      let items = $("<div/>")
        .addClass("sieve-stringlist-items");

      let controls = $("<div/>")
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
     * @returns {void}
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
      let id = this._selector;

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
      let result = [];

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
     * @param {String} nodeType
     *   the widgets node type
     * @param {String} selector
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
     * @returns {void}
     */
    initWidgets(sivElement) {
      let widgets = SieveDesigner.getWidgetsByClass(this.nodeType, this.selector);

      for (let widget of widgets)
        widget.init(sivElement);
    }

    /**
     * Initializes and renders the dropdown widget.
     *
     * @param {SieveAbstractElement} sivElement
     *   the sieve element which should be rendered.
     * @returns {void}
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
     * @returns {void}
     */
    save(sivElement) {

      let widgets = SieveDesigner.getWidgetsByClass(this.nodeType, this.selector);
      for (let widget of widgets)
        widget.save(sivElement);
    }
  }

  /**
   * An abstract item for radiobuttons and dropdowns.
   */
  class SieveAbstractItemWidget {
    /**
     * Creates a new instance.
     * @param {String} selector
     *   a selector which identifies the parent element.
     */
    constructor(selector) {
      this.selector = selector;
    }

    /**
     * @returns {String}
     *   the element's node type as string
     */
    static nodeType() {
      throw new Error("Implement a nodeType()");
    }

    /**
     * @returns {String}
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
     * @returns {String}
     *   the name as string
     */
    getName() {
      throw new Error("Implement getName()");
    }


    /**
     * Returns the URL to the html template.
     * @returns {String}
     *   the url which points to the template
     * @abstract
     */
    getTemplate() {
      throw new Error("Implement getTemplate()");
    }

    /**
     * @inheritDoc
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
     * @returns {void}
     */
    init(sivElement) {
      let that = this;

      // We need here some to make mozilla happy.
      // it is no more possible to load fragments from chrome urls

      let xhr = new XMLHttpRequest();
      xhr.onload = function () {

        let item = this.responseXML.querySelector("#test42");

        let div = document.createElement("div");
        div.innerHTML = item.innerHTML;

        div.setAttribute("data-nodename", that.constructor.nodeName());

        that.getElement().append(div);

        that.load(sivElement);
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
     * @returns {void}
     */
    load(sivElement) {
      throw new Error("Implement load " + sivElement);
    }

    /**
     * Called when the UI Element is saved.
     *
     * @param {SieveElement} sivElement
     *   the parent sieve element
     * @returns {void}
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
     * @returns {void}
     */
    onLoad(sivElement) {
      this.select();
    }

    /**
     * Called wehn the UI element should be persisted to a sieve script.
     *
     * @param {SieveElement} sivElement
     *   the parent sieve element
     * @returns {void}
     */
    onSave(sivElement) {
      sivElement.setValue(
        this.getActiveItem().attr("data-value"));
    }

    /**
     * Selects the this item and sets is as active item
     * @returns {void}
     */
    select() {
      let menuElement = this.getMenuItem();
      let activeElement = this.getActiveItem();

      activeElement
        .html(menuElement.html())
        .attr("data-nodename", this.constructor.nodeName())
        .attr("data-value", menuElement.attr("data-value"));
    }

    /**
     * Gets the currently active item. It does not nessearily be this item.
     * @returns {void}
     */
    getActiveItem() {
      return $("" + this.selector + " .sivDropDownWidget-active");
    }

    /**
     * Gets the menu item for this item.
     * @returns {void}
     */
    getMenuItem() {
      return $('' + this.selector + ' .sivDropDownWidget-menu div[data-nodename="' + this.constructor.nodeName() + '"] .dropdown-item');
    }

    /**
     * @inheritDoc
     */
    load(sivElement) {

      let element = this.getMenuItem();
      element.click(() => { this.select(); });

      if (this.constructor.nodeName() !== sivElement.nodeName())
        return;

      this.onLoad(sivElement, element);
    }

    /**
     * @inheritDoc
     */
    save(sivElement) {
      let item = this.getActiveItem();

      if (item.attr("data-nodename") !== this.constructor.nodeName())
        return;

      this.onSave(sivElement);
    }

    /**
     * @inheritDoc
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
     * @param {String} nodeType
     *   the widgets node type
     * @param {String} selector
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
     * @returns {void}
     */
    init(sivElement) {
      let widgets = SieveDesigner.getWidgetsByClass(this.nodeType, this.selector);

      for (let widget of widgets)
        widget.init(sivElement);
    }

    /**
     * Persist the sieve settings into the given sieve element
     * @param {SieveAbstractElement} sivElement
     *   the parent sieve element
     * @returns {void}
     */
    save(sivElement) {

      let widgets = SieveDesigner.getWidgetsByClass(this.nodeType, this.selector);
      for (let widget of widgets)
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
     * @returns {void}
     */
    onLoad(sivElement) {
      this.getRadioItem().find("input[name='" + this.getName() + "']").attr("checked", "checked");
    }

    /**
     * Called when the UI element should be persisted to a sieve script.
     *
     * @param {SieveElement} sivElement
     *   the parent sieve element
     * @returns {void}
     */
    onSave(sivElement) {
      sivElement.setValue(
        this.getRadioItem().find("input[name='" + this.getName() + "']").val());
    }

    /**
     * @inheritDoc
     */
    load(sivElement) {

      if (this.constructor.nodeName() !== sivElement.nodeName())
        return;

      this.onLoad(sivElement);
    }

    /**
     * @inheritDoc
     */
    save(sivElement) {
      let item = this.getRadioItem();

      if (item.find("input[name='" + this.getName() + "']:checked").length !== 1)
        return;

      this.onSave(sivElement);
    }

    /**
     * @inheritDoc
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
     * @param {String} nodeType
     *   the widgets node type
     * @param {String} selector
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
     * @returns {void}
     */
    init(sivElement) {
      let widgets = SieveDesigner.getWidgetsByClass(this.nodeType, this.selector);

      for (let widget of widgets)
        widget.init(sivElement);
    }

    /**
     * Persist the sieve settings into the given sieve element
     * @param {SieveAbstractElement} sivElement
     *   the parent sieve element
     * @returns {void}
     */
    save(sivElement) {
      let widgets = SieveDesigner.getWidgetsByClass(this.nodeType, this.selector);

      for (let widget of widgets)
        widget.save(sivElement);
    }
  }

  /**
   * Implements the create overlay for the fileinto action.
   */
  class SieveOverlayItemWidget extends SieveAbstractItemWidget {

    /**
     * @inheritDoc
     */
    getElement() {
      return $("" + this.selector);
    }
  }

  /**
   *
   */
  class SieveStringWidget {

    /**
     * @param {String} selector
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
      return $(this._selector)[DOM_ELEMENT].hasAttribute("data-list-dropdown");
    }

    /**
     * Set the input item's current value.
     *
     * @param {String} value
     *   the value to set.
     *
     * @returns {undefined}
     */
    setValue(value) {
      $(this._selector)
        .find(".sieve-string-item")
        .val(value);
    }

    /**
     * Called as soon as the element is loaded.
     * @param {String} value
     *   the string value to set
     *
     * @returns {undefined}
     */
    onInitialized(value) {
      let that = this;

      this.setValue(value);

      if (!this._hasDropDown())
        return;

      let elm = $($(this._selector).attr("data-list-dropdown")).children().first().clone();

      $(this._selector)
        .find(".sieve-string-dropdown")
        .removeClass("d-none")
        .before(elm);

      $(this._selector)
        .find(".dropdown-item")
        .click(function () {
          that.setValue($(this).attr("data-value"));
        });
    }

    /**
     * Initializes the current element
     *
     * @param {SieveString} sivElement
     *   the string element which should be rendered.
     * @returns {undefined}
     */
    init(sivElement) {
      $(this._selector).load("./toolkit/templates/SieveStringWidget.html", () => {
        this.onInitialized(sivElement.value());
      });

    }

    /**
     * Saves the current element.
     *
     * @param {SieveString} sivElement
     *   the string element which was rendered and should be saved.
     * @returns {undefined}
     */
    save(sivElement) {

      sivElement.value(
        $(this._selector).find(".sieve-string-item").val());
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

})(window);
