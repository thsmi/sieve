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
  /* global SieveDesigner */
  /* global SieveAbstractBoxUI */

  /* global SieveDropBoxUI */
  /* global SieveBlockDropHandler */

  /**
   * The UI Element which renders the root node.
   */
  class SieveRootNodeUI extends SieveAbstractBoxUI {

    /**
     * @inheritDoc
     */
    createHtml(parent) {
      return parent.append(this.getSieve().elms[1].html());
    }
  }


  function SieveBlockUI(elm) {
    SieveAbstractBoxUI.call(this, elm);
  }

  SieveBlockUI.prototype = Object.create(SieveAbstractBoxUI.prototype);
  SieveBlockUI.prototype.constructor = SieveBlockUI;

  SieveBlockUI.prototype.init
    = function () {
      let elm = $("<div/>")
        .addClass("sivBlock");

      let item = null;

      for (let i = 0; i < this.getSieve().elms.length; i++) {
        item = this.getSieve().elms[i].html();

        if (!item)
          continue;

        elm
          .append((new SieveDropBoxUI(this))
            .drop(new SieveBlockDropHandler(), this.getSieve().elms[i])
            .html()
            .addClass("sivBlockSpacer"))
          .append(
            $("<div/>").append(item)
              .addClass("sivBlockChild"));
      }

      elm.append((new SieveDropBoxUI(this))
        .drop(new SieveBlockDropHandler())
        .html()
        .addClass("sivBlockSpacer"));

      return elm;
    };

  SieveBlockUI.prototype.createHtml
    = function (parent) {
      return parent.append(this.init());
    };

  if (!SieveDesigner)
    throw new Error("Could not register Block Widgets");


  SieveDesigner.register("block/body", SieveBlockUI);
  SieveDesigner.register("block/rootnode", SieveRootNodeUI);

  exports.SieveBlockUI = SieveBlockUI;

})(window);
