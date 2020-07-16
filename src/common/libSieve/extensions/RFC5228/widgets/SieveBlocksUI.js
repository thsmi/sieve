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

import { SieveDesigner } from "./../../../toolkit/SieveDesigner.js";

import {
  SieveAbstractBoxUI,
  SieveDropBoxUI
} from "./../../../toolkit/widgets/Boxes.js";

import { SieveBlockDropHandler } from "./../../../toolkit/events/DropHandler.js";


const FIRST_ELEMENT = 1;

/**
 * The UI Element which renders the root node.
 */
class SieveRootNodeUI extends SieveAbstractBoxUI {

  /**
   * @inheritdoc
   */
  createHtml(parent) {
    parent.appendChild(
      this.getSieve().elms[FIRST_ELEMENT].html());

    return parent;
  }
}


/**
 * Provides an UI which realizes a block.
 * It is used tho host tests and actions.
 */
class SieveBlockUI extends SieveAbstractBoxUI {

  // TODO is this really needed to wrap the item?
  /**
   * Wraps the given child item in to a block.
   * @private
   *
   * @param {HTMLElement} item
   *   the item to be wrapped
   * @returns {HTMLElement}
   *   the ui element
   */
  createBlockChild(item) {
    const child = document.createElement('div');
    child.appendChild(item);
    child.classList.add("sivBlockChild");

    return child;
  }

  /**
   * @inheritdoc
   */
  createHtml(parent) {
    const elm = document.createElement("div");
    elm.classList.add("sivBlock");

    for (const sivElm of this.getSieve().elms) {
      const item = sivElm.html();

      if (!item)
        continue;

      elm.appendChild((new SieveDropBoxUI(this, "sivBlockSpacer"))
        .drop(new SieveBlockDropHandler(), sivElm)
        .html());
      elm.appendChild(this.createBlockChild(item));
    }

    elm.appendChild((new SieveDropBoxUI(this, "sivBlockSpacer"))
      .drop(new SieveBlockDropHandler())
      .html());

    parent.appendChild(elm);
    return parent;
  }
}

SieveDesigner.register("block/body", SieveBlockUI);
SieveDesigner.register("block/rootnode", SieveRootNodeUI);

export { SieveBlockUI };
