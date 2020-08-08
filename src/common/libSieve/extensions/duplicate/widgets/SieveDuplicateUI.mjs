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
  SieveTestDialogBoxUI
} from "./../../../toolkit/widgets/Boxes.mjs";

import {
  SieveOverlayWidget,
  SieveOverlayItemWidget
} from "./../../../toolkit/widgets/Widgets.mjs";

import { SieveTemplate } from "./../../../toolkit/utils/SieveTemplate.js";

/**
 * An abstract unique UI implementation.
 */
class SieveAbstractUniqueUI extends SieveOverlayItemWidget {

  /**
   * @inheritdoc
   */
  static nodeType() {
    return "test/duplicate/unique/";
  }
}

/**
 * Provides a UI for the unique id tag.
 */
class SieveUniqueDefaultUI extends SieveAbstractUniqueUI {

  /**
   * @inheritdoc
   */
  static nodeName() {
    return "test/duplicate/unique/default";
  }

  /**
   * @inheritdoc
   */
  getTemplate() {
    return "./extensions/duplicate/templates/SieveUniqueDefault.html";
  }

  /**
   * @inheritdoc
   */
  load(sivElement) {

    if (sivElement.getElement("unique").hasElement())
      return;

    document.querySelector("#cbxUniqueDefault").checked = true;
  }

  /**
   * @inheritdoc
   */
  save(sivElement) {
    if (!document.querySelector("#cbxUniqueDefault").checked)
      return;

    sivElement.getElement("unique").setElement();
  }
}

/**
 * Provides a UI for the unique id tag.
 */
class SieveUniqueIdUI extends SieveAbstractUniqueUI {

  /**
   * @inheritdoc
   */
  static nodeName() {
    return "test/duplicate/unique/id";
  }

  /**
   * @inheritdoc
   */
  getTemplate() {
    return "./extensions/duplicate/templates/SieveUniqueId.html";
  }

  /**
   * @inheritdoc
   */
  load(sivElement) {

    document.querySelector("#txtUniqueId").addEventListener("focus", () => {
      document.querySelector("#cbxUniqueId").checked = true;
    });
    document.querySelector("#txtUniqueId").value = "";

    const elm = sivElement.getElement("unique");

    if (!elm.isNode(this.constructor.nodeName()))
      return;

    document.querySelector("#cbxUniqueId").checked = true;
    document.querySelector("#txtUniqueId").value = elm.getElement("uniqueid").value();
  }

  /**
   * @inheritdoc
   */
  save(sivElement) {

    if (!document.querySelector("#cbxUniqueId").checked)
      return;

    const elm = sivElement.getElement("unique");

    if (!elm.isNode(this.constructor.nodeName())) {
      elm.setElement(':uniqueid ""');
    }

    elm.getElement("uniqueid").value(document.querySelector("#txtUniqueId").value);
  }
}

/**
 * Provides a UI for the unique header tag.
 */
class SieveUniqueHeaderUI extends SieveAbstractUniqueUI {

  /**
   * @inheritdoc
   */
  static nodeName() {
    return "test/duplicate/unique/header";
  }

  /**
   * @inheritdoc
   */
  getTemplate() {
    return "./extensions/duplicate/templates/SieveUniqueHeader.html";
  }

  /**
   * @inheritdoc
   */
  load(sivElement) {

    document.querySelector("#txtUniqueHeader").addEventListener("focus", () => {
      document.querySelector("#cbxUniqueHeader").checked = true;
    });
    document.querySelector("#txtUniqueHeader").value = "";

    const elm = sivElement.getElement("unique");

    if (!elm.isNode(this.constructor.nodeName()))
      return;

    document.querySelector("#cbxUniqueHeader").checked = true;
    document.querySelector("#txtUniqueHeader").value = elm.getElement("header").value();
  }

  /**
   * @inheritdoc
   */
  save(sivElement) {

    if (!document.querySelector("#cbxUniqueHeader").checked)
      return;

    const elm = sivElement.getElement("unique");

    if (!elm.isNode(this.constructor.nodeName())) {
      elm.setElement(':header ""');
    }

    elm.getElement("header")
      .value(document.querySelector("#txtUniqueHeader").value);
  }
}


/**
 * Implements a control for editing a duplicate test
 */
class SieveDuplicateUI extends SieveTestDialogBoxUI {

  /**
   * Gets the optional unique id. It is used to track duplicates.
   *
   * @returns {SieveAbstractElement}
   *   the element's unique field
   */
  unique() {
    return this.getSieve().getElement("unique");
  }

  /**
   * Checks and changes a tag's enabled state.
   *
   * @param {string} id
   *   the tag's id
   * @param {boolean} [status]
   *   optional parameter to change the tags state
   *
   * @returns {boolean}
   *   true in case the element is enabled otherwise false
   */
  enable(id, status) {
    return this.getSieve().enable(id, status);
  }

  /**
   * Checks if the given tag exists.
   * It is used to detect if tags a set.
   *
   * @param {string} id
   *   the tag's  id
   *
   * @returns {boolean}
   *   true in case the tag existed during parsing otherwise false.
   */
  isEnabled(id) {
    return this.getSieve().enable(id);
  }

  /**
   * Returns a reference to the handle tag.
   * It is guaranteed to exist. But it may be disabled
   *
   * @returns {SieveAbstractElement}
   *   the handle tag.
   */
  handle() {
    return this.getSieve().getElement("handle").getElement("handle");
  }

  /**
   * Returns a reference to the seconds tag.
   * It is guaranteed to exist. But it may be disabled
   *
   * @returns {SieveAbstractElement}
   *   the seconds tag
   */
  seconds() {
    return this.getSieve().getElement("seconds").getElement("timeout");
  }

  /**
   * @inheritdoc
   */
  onLoad() {
    (new SieveOverlayWidget("test/duplicate/unique/", "#sivUnique"))
      .init(this.getSieve());

    document
      .querySelector(`input[type="radio"][name="sieve-duplicate-handle"][value="${this.enable("handle")}"]`)
      .checked = true;
    document
      .querySelector(`input[type="radio"][name="sieve-duplicate-seconds"][value="${this.enable("seconds")}"]`)
      .checked = true;
    document
      .querySelector(`input[type="radio"][name="sieve-duplicate-last"][value="${this.enable("last")}"]`)
      .checked = true;

    if (this.isEnabled("handle"))
      document.querySelector("#sivDuplicateHandle").value = this.handle().value();

    if (this.isEnabled("seconds"))
      document.querySelector("#sivDuplicateSeconds").value = this.seconds().getValue();

    document.querySelector("#sivDuplicateHandle").addEventListener("focus", () => {
      document.querySelector("#sivDuplicateCustomHandle").checked = true;
    });

    document.querySelector("#sivDuplicateSeconds").addEventListener("focus", () => {
      document.querySelector("#sivDuplicateCustomExpiration").checked = true;
    });
  }

  /**
   * @inheritdoc
   */
  onSave() {

    (new SieveOverlayWidget("test/duplicate/unique/", "#sivUnique"))
      .save(this.getSieve());

    const state = {};

    state["handle"] = (document.querySelector("input[type='radio'][name='sieve-duplicate-handle']:checked").value === "true");
    state["seconds"] = (document.querySelector("input[type='radio'][name='sieve-duplicate-seconds']:checked").value === "true");
    state["last"] = (document.querySelector("input[type='radio'][name='sieve-duplicate-last']:checked").value === "true");

    if (state["handle"]) {
      const handle = document.querySelector("#sivDuplicateHandle");

      if (!handle.checkValidity())
        return false;

      this.handle().value(handle.value);
    }

    if (state["seconds"]) {
      const seconds = document.querySelector("#sivDuplicateSeconds");

      if (!seconds.checkValidity())
        return false;

      this.seconds().setValue(seconds.value);
    }

    this.enable("handle", state["handle"]);
    this.enable("seconds", state["seconds"]);
    this.enable("last", state["last"]);

    return true;
  }

  /**
   * @inheritdoc
   */
  getTemplate() {
    return "./extensions/duplicate/templates/SieveDuplicateTestUI.html";
  }

  /**
   * @inheritdoc
   */
  getSummary() {

    const FRAGMENT =
      `<div>
          <span data-i18n="duplicate.summary"></span>
         </div>`;

    return (new SieveTemplate()).convert(FRAGMENT);
  }
}

// ************************************************************************************

SieveDesigner.register2(SieveUniqueDefaultUI);
SieveDesigner.register2(SieveUniqueIdUI);
SieveDesigner.register2(SieveUniqueHeaderUI);

SieveDesigner.register("test/duplicate", SieveDuplicateUI);
