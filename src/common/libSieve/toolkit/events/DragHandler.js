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
  /* global SieveDataTransfer */

  /**
   *
   */
  class SieveDragHandler {

    /**
     *
     * @param {*} flavour
     */
    constructor(flavour) {
      if (typeof (flavour) !== "undefined")
        this._flavour = flavour;
      else
        this._flavour = "sieve/action";
    }

    /**
     *
     * @param {*} flavour
     */
    flavour(flavour) {
      if (typeof (flavour) === 'undefined')
        return this._flavour;

      this._flavour = flavour;

      return this;
    }

    /**
     *
     * @param {*} event
     * @returns {boolean}
     */
    onDragStart(event) {

      if (!this.onDrag)
        return false;

      this.onDrag(event.originalEvent);

      event = event.originalEvent;

      event.dataTransfer.setDragImage(this.owner().html(),
        event.pageX - $(this.owner().html()).offset().left,
        event.pageY - $(this.owner().html()).offset().top);

      // event.preventDefault();
      event.stopPropagation();

      return true;
    }

    /**
     *
     */
    document() {
      if (!this._owner)
        throw new Error("Owner for this Drop Handler");

      return this._owner.document();
    }

    /**
     *
     * @param {SieveAbstractElement} owner
     */
    bind(owner) {
      this._owner = owner;
    }

    /**
     * @returns {SieveAbstractElement}
     */
    owner() {
      return this._owner;
    }

    /**
     *
     * @param {HTMLElement} html
     */
    attach(html) {
      html.dataset.sieveFlavour = this.flavour();
      html.draggable = true;

      $(html).bind("dragstart", (e) => { this.onDragStart(e); return true; });
      html.addEventListener("dragend", () => { return false; });
    }

    /**
     *
     * @param {*} event
     */
    onDrag(event) {
      const dt = new SieveDataTransfer(event.dataTransfer);

      dt.clear();

      dt.setData("application/sieve", this.getScript());
      dt.setData(this.flavour(), this.getMetaInfo());
    }

    /**
     * The Sieve script which should be transferred.
     * @abstract
     *
     * @returns {string} the sieve script as plain text
     */
    getScript() {
      throw new Error("Implement me");
    }

    /**
     * The meta information for this sieve script.
     * @abstract
     *
     * @returns {string} the meta information about the drag element
     */
    getMetaInfo() {
      throw new Error("Implement me");
    }
  }


  /**
   *
   */
  class SieveMoveDragHandler extends SieveDragHandler {

    /**
     * @inheritdoc
     */
    getScript() {
      return "" + this.owner().getSieve().toScript();
    }

    /**
     * @inheritdoc
     */
    getMetaInfo() {
      return JSON.stringify({ id: this.owner().id(), action: "move" });
    }
  }

  /**
   *
   */
  class SieveCreateDragHandler extends SieveDragHandler {

    /**
     * @inheritdoc
     */
    getScript() {
      return "" + this.owner().toScript();
    }

    /**
     * @inheritdoc
     */
    getMetaInfo() {
      return JSON.stringify({ type: this.owner()._elmType, action: "create" });
    }
  }

  exports.SieveDragHandler = SieveDragHandler;
  exports.SieveMoveDragHandler = SieveMoveDragHandler;
  exports.SieveCreateDragHandler = SieveCreateDragHandler;

})(window);

