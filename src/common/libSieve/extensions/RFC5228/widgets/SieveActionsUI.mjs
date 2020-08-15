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

import { SieveActionDialogBoxUI } from "./../../../toolkit/widgets/Boxes.mjs";
import { SieveOverlayWidget } from "./../../../toolkit/widgets/Widgets.mjs";

import { SieveTemplate } from "./../../../toolkit/utils/SieveTemplate.js";
import { SieveI18n } from "../../../toolkit/utils/SieveI18n.js";

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
    const msg = SieveI18n.getInstance().getString("stop.summary");
    const elm = (new SieveTemplate()).convert(`<div>${msg}</div>`);
    return elm;
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
    const msg = SieveI18n.getInstance().getString("discard.summary");
    const elm = (new SieveTemplate()).convert(`<div>${msg}</div>`);
    return elm;
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
    const msg = SieveI18n.getInstance().getString("keep.summary");
    const elm = (new SieveTemplate()).convert(`<div>${msg}</div>`);
    return elm;
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
    const msg = SieveI18n.getInstance().getString("redirect.summary")
      .replace("${address}", '<em class="sivRedirectAddress"></em>');

    const elm = (new SieveTemplate()).convert(`<div>${msg}</div>`);
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
    const msg = SieveI18n.getInstance().getString("fileinto.summary")
      .replace("${path}", '<div><em class="sivFileintoPath"></em></div>');

    const elm = (new SieveTemplate()).convert(`<div>${msg}</div>`);
    elm.querySelector(".sivFileintoPath").textContent = this.path();

    return elm;
  }
}

SieveDesigner.register("action/discard", SieveDiscardUI);
SieveDesigner.register("action/keep", SieveKeepUI);
SieveDesigner.register("action/stop", SieveStopUI);

SieveDesigner.register("action/fileinto", SieveFileIntoUI);
SieveDesigner.register("action/redirect", SieveRedirectUI);
