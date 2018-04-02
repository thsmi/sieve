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

  // TODO Add button to show selection source...


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
    }

    /**
     * Return the nesteds unique id. In case no sieve element is bound to
     * this element it return -1
     *
     * @return {int}
     *   An Integer as unique identifiert for the nested sieve element.
     */
    id() {
      if (this._elm.document)
        return this._elm.id();

      return -1;
    }

    /**
     * Returns the sieve Element bound to this box.
     * In case no element is bound, an exception will be thrown
     *
     * @return {SieveAbstractElement}
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
    };

    toScript() {
      if (this._elm.document)
        return this._elm.toScript();

      return "";
    }


    /**
     * The dorp element handler
     * @param {} handler
     * @param {} sibling
     * @return {}
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


  // FIXME: Rename this, it is definietly not editable
  /**
   * Implements an abstract box fir elements wihtout a ui
   */
  class SieveEditableBoxUI extends SieveAbstractBoxUI {

    /**
     * @inheritDoc
     */
    createHtml(parent) {
      if (typeof (parent) === "undefined")
        throw new Error("parent parameter is missing");

      if (this.getSummary)
        parent.append(this.getSummary()
          .addClass("sivSummaryContent"));

      return parent;
    }
  }

  /**
   * An abstract UI widget used for simple actions which do not need an UI
   */
  class SieveActionBoxUI extends SieveEditableBoxUI {

    /**
     * @inheritDoc
     */
    constructor(elm) {
      super(elm);
      this.drag(new SieveMoveDragHandler());
    }

    /**
     * @inheritDoc
     */
    createHtml(parent) {
      return super.createHtml(parent).addClass("sivAction");
    }
  }

  /**
   *
   */
  class SieveDropBoxUI extends SieveAbstractBoxUI {
    /**
     * @param {SieveAbstractBoxUI} parent
     *   The parent Sieve Element, to which dropped Elemenents will be added.
     *
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
     * @inheritDoc
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
     * @inheritDoc
     */
    constructor(docshell) {
      super(docshell);
      this.drop(new SieveTrashBoxDropHandler());
    }
  }


  /**
   * Provides a UI with a tabbed modal dialog.
   **/
  class SieveDialogBoxUI extends SieveAbstractBoxUI {

    /**
     * @inheritDoc
     */
    constructor(elm) {
      // Call parent constructor...
      super(elm);

      // create a unique id, which makes identifing the dom object easier.
      this.uniqueId = "" + Math.floor(Math.random() * 10000000).toString(16) + Date.now().toString(16);
    }

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
    }

    showEditor(e) {

      $('#sivDialog2').modal("show");
      $("#sivDialogSave").off("click").click(() => { this.save(); });
      // $('#sivDialogDiscard').click( function()  { that.onDiscard() } )

      $("#sivDialogTabs").empty();
      $('#sivDialogBody').empty();

      let that = this;
      let xhr = new XMLHttpRequest();
      xhr.onload = function () {

        let tabs = this.responseXML.querySelector("#template-tabs");

        if (tabs) {
          let div = document.createElement("div");
          if (div.unsafeSetInnerHTML)
            div.unsafeSetInnerHTML(tabs.innerHTML);
          else
            div.innerHTML = tabs.innerHTML;

          $("#sivDialogTabs").append(div.children);
        }


        let content = this.responseXML.querySelector("#template-content");

        if (content) {
          let div = document.createElement("div");
          if (div.unsafeSetInnerHTML)
            div.unsafeSetInnerHTML(content.innerHTML);
          else
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
     * @inheritDoc
     */
    createHtml(parent) {

      if (typeof (parent) === "undefined")
        throw new Error("parent parameter is missing");

      let that = this;

      parent.addClass("sivEditableElement");

      if (this.getSummary) {

        let summary = $("<div/>")
          .append(this.getSummary())
          .addClass("sivSummaryContent")
          .attr("id", this.uniqueId + "-summary")
          .click(function (e) { that.showEditor(); e.preventDefault(); return true; });

        parent.append(summary);
      }

      return parent;
    }

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
     * @inheritDoc
     */
    constructor(elm) {
      // Call parent constructor...
      super(elm);
      this.drag(new SieveMoveDragHandler());
    }

    /**
     * @inheritDoc
     */
    createHtml(parent) {
      return super.createHtml(parent)
        .addClass("sivAction");
    }
  }


  /**
   * Provides an UI for a simple operator without any settings.
   */
  class SieveOperatorBoxUI extends SieveEditableBoxUI {

    /**
     * @inheritDoc
     */
    constructor(elm) {

      super(elm);
      this.drag(new SieveMoveDragHandler("sieve/operator"));
      this.drop(new SieveTestDropHandler());
    }

    /**
     * @inheritDoc
     */
    createHtml(parent) {
      return super.createHtml(parent)
        .addClass("sivOperator");
    }
  }

  /**
   * Provides an UI for complex operator with a dialog box.
   */
  class SieveOperatorDialogBoxUI extends SieveDialogBoxUI {

    /**
   * @inheritDoc
   */
    constructor(elm) {
      super(elm);

      this.drag(new SieveMoveDragHandler("sieve/operator"));
      this.drop(new SieveTestDropHandler());
    }

    /**
     * @inheritDoc
     */
    createHtml(parent) {
      return super.createHtml(parent)
        .addClass("sivOperator");
    }
  }


  /**
   * Provides an UI for an abstract test dialog
   */
  class SieveTestDialogBoxUI extends SieveDialogBoxUI {

    /**
     * @inheritDoc
     */
    constructor(elm) {
      super(elm);

      this.drag(new SieveMoveDragHandler("sieve/test"));
      this.drop(new SieveTestDropHandler());
    }

    /**
     * @inheritDoc
     */
    createHtml(parent) {
      return super.createHtml(parent)
        .addClass("sivTest");
    }
  }


  exports.SieveAbstractBoxUI = SieveAbstractBoxUI;
  exports.SieveEditableBoxUI = SieveEditableBoxUI;
  exports.SieveOperatorBoxUI = SieveOperatorBoxUI;
  exports.SieveActionBoxUI = SieveActionBoxUI;
  exports.SieveDropBoxUI = SieveDropBoxUI;
  exports.SieveTrashBoxUI = SieveTrashBoxUI;

  exports.SieveActionDialogBoxUI = SieveActionDialogBoxUI;
  exports.SieveTestDialogBoxUI = SieveTestDialogBoxUI;
  exports.SieveOperatorDialogBoxUI = SieveOperatorDialogBoxUI;

})(window);
