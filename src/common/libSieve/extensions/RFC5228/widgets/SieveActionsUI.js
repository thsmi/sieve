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

import { SieveActionDialogBoxUI } from "./../../../toolkit/widgets/Boxes.js";
import { SieveOverlayWidget } from "./../../../toolkit/widgets/Widgets.js";

import { SieveTemplate } from "./../../../toolkit/utils/SieveTemplate.js";

/**
 * Provides a UI for the stop action
 */
class SieveStopUI extends SieveActionDialogBoxUI {

  /**
   * @inheritdoc
   */
  getTemplate() {
    return "./extensions/RFC5228/templates/SieveStopActionUI.html";
  }

  /**
   * @inheritdoc
   */
  getSummary() {
    const FRAGMENT =
      `<div><span data-i18n="stop.summary"></span></div>`;

    return (new SieveTemplate()).convert(FRAGMENT);
  }
}

/**
 * Provides a UI for the discard action
 */
class SieveDiscardUI extends SieveActionDialogBoxUI {

  /**
   * @inheritdoc
   */
  getTemplate() {
    return "./extensions/RFC5228/templates/SieveDiscardActionUI.html";
  }

  /**
   * @inheritdoc
   */
  getSummary() {
    const FRAGMENT =
      `<div><span data-i18n="discard.summary"></span></div>`;

    return (new SieveTemplate()).convert(FRAGMENT);
  }
}

/**
 * Provides a UI for the keep action
 */
class SieveKeepUI extends SieveActionDialogBoxUI {

  /**
   * @inheritdoc
   */
  getTemplate() {
    return "./extensions/RFC5228/templates/SieveKeepActionUI.html";
  }

  /**
   * @inheritdoc
   */
  getSummary() {
    const FRAGMENT =
      `<div><span data-i18n="keep.summary"></span></div>`;

    return (new SieveTemplate()).convert(FRAGMENT);
  }
}


/**
 * Provides an UI for the redirect action
 */
class SieveRedirectUI extends SieveActionDialogBoxUI {

  /**
   *  Gets and/or sets the redirect address
   *
   *  @param  {string} [address]
   *    optional the new address which should be set.
   *
   *  @returns {string} the current address
   */
  address(address) {
    return this.getSieve().getElement("address").value(address);
  }

  /**
   * @inheritdoc
   */
  getTemplate() {
    return "./extensions/RFC5228/templates/SieveRedirectActionUI.html";
  }

  /**
   * @inheritdoc
   */
  onSave() {

    const address = document.querySelector("#sivRedirectAddress");

    if (!address.checkValidity())
      return false;

    (new SieveOverlayWidget("action/redirect/", "#sivRedirectOverlay"))
      .save(this.getSieve());

    this.address(address.value);
    return true;
  }

  /**
   * @inheritdoc
   */
  onLoad() {
    document.querySelector("#sivRedirectAddress").value = this.address();

    (new SieveOverlayWidget("action/redirect/", "#sivRedirectOverlay"))
      .init(this.getSieve());
  }

  /**
   * @inheritdoc
   */
  getSummary() {
    const FRAGMENT =
      `<div>
          <span data-i18n="redirect.summary"></span>
          <em class="sivRedirectAddress"></em>
         </div>`;

    const elm = (new SieveTemplate()).convert(FRAGMENT);
    elm.querySelector(".sivRedirectAddress").textContent = this.address();
    return elm;
  }
}

/**
 * A UI for the fileinto action
 */
class SieveFileIntoUI extends SieveActionDialogBoxUI {

  /**
   *  Gets and/or Sets the FileInto's paths
   *
   *  @param  {string} [value]
   *    optional the new path which should be set.
   *
   *  @returns {string} the current file into path
   */
  path(value) {
    return this.getSieve().getElement("path").value(value);
  }

  /**
   * @inheritdoc
   */
  getTemplate() {
    return "./extensions/RFC5228/templates/SieveFileIntoActionUI.html";
  }

  /**
   * @inheritdoc
   */
  onSave() {

    const path = document.querySelector("#sivFileIntoPath");

    if (!path.checkValidity())
      return false;

    (new SieveOverlayWidget("action/fileinto/", "#sivFileIntoOverlay"))
      .save(this.getSieve());

    this.path(path.value);
    return true;
  }

  /**
   * @inheritdoc
   */
  onLoad() {
    document.querySelector("#sivFileIntoPath").value = this.path();

    (new SieveOverlayWidget("action/fileinto/", "#sivFileIntoOverlay"))
      .init(this.getSieve());
  }

  /**
   * @inheritdoc
   */
  getSummary() {

    const FRAGMENT =
      `<div>
          <div data-i18n="fileinto.summary"></div>
          <div><em class="sivFileintoPath"></em></div>
         </div>`;

    const elm = (new SieveTemplate()).convert(FRAGMENT);
    elm.querySelector(".sivFileintoPath").textContent = this.path();
    return elm;
  }
}

SieveDesigner.register("action/discard", SieveDiscardUI);
SieveDesigner.register("action/keep", SieveKeepUI);
SieveDesigner.register("action/stop", SieveStopUI);

SieveDesigner.register("action/fileinto", SieveFileIntoUI);
SieveDesigner.register("action/redirect", SieveRedirectUI);
