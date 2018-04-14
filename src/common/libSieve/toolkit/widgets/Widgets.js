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
      this._min = 0;
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
     * Adds a textbox with the give value to the UI
     *
     * @param {String} [value]
     *   the value which should be added. If omitted an empty string is added.
     * @returns {void}
     */
    addItem(value) {

      if (typeof (value) === "undefined" || value === null)
        value = "";

      let elm = this.template().clone();

      $(this._selector).append(elm);

      elm.find("input[type=text], input[type=email]").val(value).focus();

      // Connect the delete button
      elm.find(".sieve-stringlist-delete").click(() => {
        if (this._min >= this.items().length)
          return;

        elm.remove();
      });

      // TODO Connect the bootstrap dropdown buttons

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

      $($(this._selector).attr("data-list-new"))
        .off()
        .click(() => { this.addItem(); });

      this._min = parseInt($(this._selector).attr("data-list-min"), 10);

      if (isNaN(this._min))
        this._min = 0;

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
     * Returns the template element which is used for new string list item.
     * Before using the template you need to clone the element.
     *
     * @returns {jQuery}
     *   the template element
     */
    template() {
      return $($(this._selector).attr("data-list-template")).children().first();
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
      this.id = selector;
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
      // fix me we need to address this.id sivElement.id
      let widgets = SieveDesigner.getWidgetsByClass(this.nodeType, this.id);

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

      let widgets = SieveDesigner.getWidgetsByClass(this.nodeType, this.id);
      for (let widget of widgets)
        widget.save(sivElement);
    }
  }


  /**
   * An abstract radio group widget
   */
  class SieveAbstractRadioGroupWidget {

    /**
     * Creates a new instance.
     * @param {String} selector
     *   a selector which identifies the parent element.
     */
    constructor(selector) {
      this.id = selector;
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
     * @returns {JQuery}
     *   the current element
     */
    getElement() {
      return $("" + this.id + " [data-nodename='" + this.constructor.nodeName() + "']");
    }

    /**
     * Called upon loading the UI element.
     *
     * @param {SieveElement} sivElement
     *   the parent sieve element
     * @param {JQuery} item
     *   the ui elements which was loaded
     * @returns {void}
     */
    onLoad(sivElement, item) {
      item.find("input[name='" + this.getName() + "']").attr("checked", "checked");
    }

    /**
     * Called wehn the UI element should be persisted to a sieve script.
     *
     * @param {SieveElement} sivElement
     *   the parent sieve element
     * @param {JQuery} item
     *   the ui elements which renders this element
     * @returns {void}
     */
    onSave(sivElement, item) {
      sivElement.setValue(
        item.find("input[name='" + this.getName() + "']").val());
    }

    /**
     * Called when the UI Element is loaded.
     *
     * @param {SieveAbstractElement} sivElement
     *   the parent sieve element
     * @returns {void}
     */
    load(sivElement) {

      if (this.constructor.nodeName() !== sivElement.nodeName())
        return;

      this.onLoad(sivElement, this.getElement());
    }

    /**
     * Called when the UI Element is saved.
     *
     * @param {SieveElement} sivElement
     *   the parent sieve element
     * @returns {void}
     */
    save(sivElement) {
      let item = this.getElement();

      if (item.find("input[name='" + this.getName() + "']:checked").length !== 1)
        return;

      this.onSave(sivElement, this.getElement());
    }

    /**
     * Returns the URL to the html template.
     * @returns {String}
     *   the url which points to the template
     * @abstract
     */
    getTemplate() {
      throw new Error("Implement getTemplate");
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

        $("" + that.id)
          .append(div);

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

  }

  exports.SieveRadioGroupWidget = SieveRadioGroupWidget;
  exports.SieveAbstractRadioGroupWidget = SieveAbstractRadioGroupWidget;

  exports.SieveStringListWidget = SieveStringListWidget;

})(window);
