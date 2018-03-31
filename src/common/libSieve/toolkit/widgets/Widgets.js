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

/* global window */

(function (exports) {

  "use strict";
  /* global $: false */


  /**
   *
   */
  class SieveStringListWidget {

    /**
     *
     * @param {*} selector
     */
    constructor(selector) {
      this._selector = selector;
      this._min = 0;
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

      // TODO Connect the dropdown buttons

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

    template() {
      return $($(this._selector).attr("data-list-template")).children().first();
    }

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
   * @constructor
   * @deprecated
   */
  function SieveTabWidget() {
    this._tabs = "div.dialog-tab";
    this._content = ".dialog-tab-content";
  }

  SieveTabWidget.prototype.init
    = function (tabs, content) {

      $(this._tabs + ' > div').click((ev) => {
        this.onTabChange(ev.target);
      });
    };

  SieveTabWidget.prototype.onTabChange
    = function (elm) {

      $(this._tabs + ' > div').removeClass('tab-active');
      $(this._content + ' > div').removeClass('tab-active');

      $(elm).addClass('tab-active');

      let id = $(elm).attr('data-tab-content');
      $("#" + id).addClass('tab-active');
    };


  /**
   * Provides a widget for the radio groups
   */
  class SieveRadioGroupWidget {

    /**
     * Creates a new instance
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

      $("<template />")
        .load(this.getTemplate(), function (response, status, xhr) {
          if (status === "error")
            alert("" + xhr.status + " " + xhr.statusText);

          let item = $($(this.content.children).find("#test42").html());

          $("" + that.id).append(item);

          item.attr("data-nodename", that.constructor.nodeName());
          that.load(sivElement);
        });
    }

  }




  exports.SieveTabWidget = SieveTabWidget;

  exports.SieveRadioGroupWidget = SieveRadioGroupWidget;
  exports.SieveAbstractRadioGroupWidget = SieveAbstractRadioGroupWidget;

  exports.SieveStringListWidget = SieveStringListWidget;

})(window);
