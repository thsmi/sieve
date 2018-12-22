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

  const FIRST_ELEMENT = 1;

  /**
   * The UI Element which renders the root node.
   */
  class SieveRootNodeUI extends SieveAbstractBoxUI {

    /**
     * @inheritdoc
     */
    createHtml(parent) {
      return parent.append(this.getSieve().elms[FIRST_ELEMENT].html());
    }
  }


  /**
   * Provides an UI which realizes a block.
   * It is used tho host tests and actions.
   */
  class SieveBlockUI extends SieveAbstractBoxUI {

    /**
     * Initializes the Block element.
     * @returns {jQuery}
     *   the newly create Element
     */
    init() {
      let elm = $("<div/>")
        .addClass("sivBlock");

      for (let sivElm of this.getSieve().elms) {
        let item = sivElm.html();

        if (!item)
          continue;

        elm
          .append((new SieveDropBoxUI(this))
            .drop(new SieveBlockDropHandler(), sivElm)
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
    }

    /**
     * @inheritdoc
     */
    createHtml(parent) {
      return parent.append(this.init());
    }
  }

  if (!SieveDesigner)
    throw new Error("Could not register Block Widgets");


  SieveDesigner.register("block/body", SieveBlockUI);
  SieveDesigner.register("block/rootnode", SieveRootNodeUI);

  exports.SieveBlockUI = SieveBlockUI;

})(window);
