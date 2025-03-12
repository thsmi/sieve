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

import { SieveDesigner } from "./../../../toolkit/SieveDesigner.mjs";

import {
  SieveAbstractBoxUI,
  SieveDropBoxUI
} from "./../../../toolkit/widgets/Boxes.mjs";

import { SieveBlockDropHandler } from "./../../../toolkit/events/DropHandler.mjs";

/**
 * The UI Element which renders the root node.
 */
class SieveRootNodeUI extends SieveAbstractBoxUI {

  /**
   * @inheritdoc
   */
  createHtml(parent, invalidate) {
    parent.append(
      this.getSieve().getElement("body").html(invalidate));

    return parent;
  }
}


/**
 * Provides an UI which realizes a block.
 * It is used tho host tests and actions.
 */
class SieveBlockUI extends SieveAbstractBoxUI {

  /**
   * @inheritdoc
   */
  createHtml(parent, invalidate) {
    const elm = parent;
    elm.classList.add("sivBlock");

    for (const sivElm of this.getSieve().elms) {
      const item = sivElm.html(invalidate);

      if (!item)
        continue;

      elm.append((new SieveDropBoxUI(this, "sivBlockSpacer"))
        .drop(new SieveBlockDropHandler(), sivElm)
        .html());
      elm.append(item);
    }

    elm.append((new SieveDropBoxUI(this, "sivBlockSpacer"))
      .drop(new SieveBlockDropHandler())
      .html());

    return parent;
  }
}

SieveDesigner.register("block/body", SieveBlockUI);
SieveDesigner.register("block/rootnode", SieveRootNodeUI);

export { SieveBlockUI };
