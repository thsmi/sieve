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
  /* global SieveMoveDragHandler */
  /* global SieveTestDropHandler */
  /* global SieveDropHandler */
  /* global SieveTrashBoxDropHandler */

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
        throw new Error("Neiter a Sieve Element nor a Sieve Document");

      this._elm = elm;
      this._handler = {};

      // create a unique id, which makes identifing the dom object easier.
      this.uniqueId = "" + Math.floor(Math.random() * RANDOM_SEED_SIZE).toString(HEX_STRING) + Date.now().toString(HEX_STRING);
    }

    /**
     * Return the nesteds unique id. In case no sieve element is bound to
     * this element it return -1
     *
     * @returns {int}
     *   An Integer as unique identifiert for the nested sieve element.
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

    document() {
      if (this._elm.document)
        return this._elm.document();

      return this._elm;
    }

    createHtml(parent) {
      throw new Error("Implement html()");
    }

    html(invalidate) {
      if (this._domElm && !invalidate)
        return this._domElm;

      this._domElm = this.createHtml($("<div/>"));

      if (this.id() !== -1)
        this._domElm.attr("id", "sivElm" + this.id());

      // update all our event handlers
      for (let topic in this._handler)
        if (this._handler[topic].attach)
          this._handler[topic].attach(this._domElm);

      return this._domElm;
    }

    reflow() {
      if (this.id() < 0)
        throw new Error("Invalid id");

      let item = $("#sivElm" + this.id());

      if ((!item.length) || (item.length > 1))
        throw new Error("" + item.length + " Elements found for #sivElm" + this.id());

      this._domElm = null;

      item.replaceWith(this.html());
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
     * @param {} handler
     * @param {} sibling
     * @returns {}
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
   *
   */
  class SieveDropBoxUI extends SieveAbstractBoxUI {
    /**
     * @param {SieveAbstractBoxUI} parent
     *   The parent Sieve Element, to which dropped Elemenents will be added.
     */
    constructor(parent) {
      if (!parent)
        throw new Error("Parent expected");

      if (parent.document)
        super(parent.document());
      else if (parent.root)
        super(parent);
      else
        throw new Error("Either a docshell or an elements expected");

      if (parent.document)
        this._parent = parent;

      this.drop(new SieveDropHandler());
    }

    /**
     * @inheritdoc
     */
    createHtml(parent) {
      return parent.append($("<div/>").addClass("sivDropBox"));
    }

    /**
     * @returns {SieveAbstractBoxUI}
     *   the parent ui element.
     */
    parent() {
      return this._parent;
    }
  }


  /**
   * The trashbox is used to delete elements via drag and drop
   */
  class SieveTrashBoxUI extends SieveDropBoxUI {

    /**
     * @inheritdoc
     */
    constructor(docshell) {
      super(docshell);
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
      if ($("#" + this.uniqueId + "-summary").is(':visible'))
        this.showSource();
      else
        this.showSummary();
    }

    /**
     * Shows the summary and hides the code view.
     * It does not reload the summary view.
     */
    showSummary() {
      $("#" + this.uniqueId + "-summary").show();
      $("#" + this.uniqueId + "-code").hide();
    }

    /**
     * Shows the code view and hides the summary view.
     * It will automatically replace the code with the most recently changed.
     */
    showSource() {
      $("#" + this.uniqueId + "-code")
        .empty()
        .append($("<code/>").text(this.getSieve().toScript()));

      $("#" + this.uniqueId + "-summary").hide();
      $("#" + this.uniqueId + "-code").show();
    }
  }


  /**
   * Implements an abstract box for elements wihtout any ui elements
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

      parent.append($("<div/>")
        .append(this.getSummary())
        .addClass("sivSummaryContent")
        .attr("id", this.uniqueId + "-summary"));

      return parent;
    }
  }

  /**
   * An UI widget used for simple actions which do not need an
   * dialog based UI.
   *
   * @deprecated Elements implementing this need to migrate to a
   * dialog based box to show at least the help
   */
  class SieveActionBoxUI extends SieveSourceBoxUI {

    /**
     * @inheritdoc
     */
    constructor(elm) {
      super(elm);
      this.drag(new SieveMoveDragHandler());
    }

    /**
     * @inheritdoc
     */
    createHtml(parent) {
      if (typeof (parent) === "undefined")
        throw new Error("parent parameter is missing");

      parent.addClass("sivAction");
      parent.addClass("sivEditableElement");

      parent.append($("<div/>")
        .append(this.getSummary())
        .addClass("sivSummaryContent")
        .attr("id", this.uniqueId + "-summary"));

      parent.append($("<div/>")
        .append($("<code/>"))
        .addClass("sivSummaryCode")
        .attr("id", this.uniqueId + "-code")
        .hide());

      parent.append(
        $("<div/>")
          .addClass("sivSummaryControls")
          .addClass("material-icons")
          .append($("<span/>").text("code").click(
            (e) => { this.toggleView(); e.preventDefault(); e.stopPropagation(); return true;}))
          .append($("<span/>").text("edit").css({"visibility":"hidden"})));

      return parent;
    }
  }


  /**
   * Provides a UI with a tabbed modal dialog.
   **/
  class SieveDialogBoxUI extends SieveSourceBoxUI {

    save() {

      // Check if on save was canceled...
      if (!this.onSave())
        return;

      $('#sivDialogBody').empty();

      // Remove the event handlers...
      $('#sivDialog2').modal("hide");
      // $('#sivDialogDiscard').off('click');

      // update the summary
      $("#" + this.uniqueId + "-summary")
        .empty()
        .append(this.getSummary());

      $("#" + this.uniqueId + "-code")
        .empty()
        .append($("<code/>").text(this.getSieve().toScript()));

    }

    showEditor() {

      $('#sivDialog2').modal("show");
      $("#sivDialogSave").off("click").click(() => { this.save(); });

      $("#sivDialogTabs").empty();
      $('#sivDialogBody').empty();

      let that = this;
      let xhr = new XMLHttpRequest();
      xhr.onload = function () {

        let tabs = this.responseXML.querySelector("#template-tabs");

        if (tabs) {
          let div = document.createElement("div");
          div.innerHTML = tabs.innerHTML;

          $("#sivDialogTabs").append(div.children);
        }


        let content = this.responseXML.querySelector("#template-content");

        if (content) {
          let div = document.createElement("div");
          div.innerHTML = content.innerHTML;

          $("#sivDialogBody").append(div.children);
        }

        that.onLoad();
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
     * @inheritdoc
     */
    createHtml(parent) {

      if (typeof (parent) === "undefined")
        throw new Error("parent parameter is missing");

      parent.addClass("sivEditableElement");

      parent.append($("<div/>")
        .append(this.getSummary())
        .addClass("sivSummaryContent")
        .attr("id", this.uniqueId + "-summary"));

      parent.append($("<div/>")
        .append($("<code/>"))
        .addClass("sivSummaryCode")
        .attr("id", this.uniqueId + "-code")
        .hide());

      parent.append(
        $("<div/>")
          .addClass("sivSummaryControls")
          .addClass("material-icons")
          .append($("<span/>").text("code").click((e) => { this.toggleView(); e.preventDefault(); e.stopPropagation(); return true;}))
          .append($("<span/>").text("edit"))
      );

      parent.click((e) => { this.showEditor(); e.preventDefault(); return true; });

      return parent;
    }

    /**
     * @returns {string}
     *   an url which points to an html fragment and contains the template.
     */
    getTemplate() {
      throw new Error("Implement getTemplate()");
    }

    getSummary() {
      throw new Error("Implement getSummary()");
    }

    onSave() {
      return true;
    }

    onLoad() {
      throw new Error("Implement onLoad()");
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
      return super.createHtml(parent)
        .addClass("sivAction");
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
      return super.createHtml(parent)
        .addClass("sivTest");
    }
  }


  exports.SieveAbstractBoxUI = SieveAbstractBoxUI;
  exports.SieveSimpleBoxUI = SieveSimpleBoxUI;
  exports.SieveSourceBoxUI = SieveSourceBoxUI;

  exports.SieveActionBoxUI = SieveActionBoxUI;
  exports.SieveDropBoxUI = SieveDropBoxUI;
  exports.SieveTrashBoxUI = SieveTrashBoxUI;

  exports.SieveDialogBoxUI = SieveDialogBoxUI;
  exports.SieveActionDialogBoxUI = SieveActionDialogBoxUI;
  exports.SieveTestDialogBoxUI = SieveTestDialogBoxUI;

})(window);
