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
  SieveSimpleBoxUI,
  SieveDialogBoxUI,
  SieveDropBoxUI
} from "./../../../toolkit/widgets/Boxes.js";

import {
  SieveMultaryDropHandler,
  SieveTestDropHandler
} from "./../../../toolkit/events/DropHandler.js";

import {
  SieveMoveDragHandler
} from "./../../../toolkit/events/DragHandler.js";

import { SieveTemplate } from "./../../../toolkit/utils/SieveTemplate.js";

const TEST_ELEMENT = 1;

/**
 * Provides an ui for the not operator
 */
class SieveNotUI extends SieveSimpleBoxUI {

  /**
   * @inheritdoc
   */
  constructor(elm) {

    super(elm);
    this.drag(new SieveMoveDragHandler("sieve/operator"));
    this.drop(new SieveTestDropHandler());
  }

  /**
   * @inheritdoc
   */
  getSummary() {
    const FRAGMENT =
      `<div>
           <div data-i18n="not.summary"></div>
           <div class="sivNotTest"></div>
         </div>`;

    const elm = (new SieveTemplate()).convert(FRAGMENT);
    elm
      .querySelector(".sivNotTest")
      .appendChild(this.getSieve().test().html());

    return elm;
  }

  /**
   * @inheritdoc
   */
  createHtml(parent) {
    const elm = super.createHtml(parent);
    elm.classList.add("sivOperator");
    return elm;
  }
}


/**
 * Provides an ui for the anyof and allof operator
 */
class SieveAnyOfAllOfUI extends SieveDialogBoxUI {

  /**
   * @inheritdoc
   */
  constructor(elm) {
    super(elm);

    this.drag(new SieveMoveDragHandler("sieve/operator"));
    this.drop(new SieveTestDropHandler());
  }

  /**
   * @inheritdoc
   **/
  getTemplate() {
    return "./extensions/RFC5228/templates/SieveAllOfAnyOfOperator.html";
  }

  /**
   * @inheritdoc
   **/
  onSave() {

    const value = document
      .querySelector("#sieve-widget-allofanyof")
      .querySelector("input[name='allofanyof']:checked").value;

    if (value === "true")
      this.getSieve().isAllOf = true;
    else
      this.getSieve().isAllOf = false;

    return true;
  }

  /**
   * @inheritdoc
   */
  onLoad() {
    document
      .querySelector("#sieve-widget-allofanyof")
      .querySelector(`input[name='allofanyof'][value='${this.getSieve().isAllOf}']`)
      .checked = true;
  }

  /**
   * @inheritdoc
   */
  getSummary() {
    const FRAGMENT =
      `<div>
           <span class="sivOperatorAllOf d-none" data-i18n="operator.allof.summary"></span>
           <span class="sivOperatorAnyOf d-none" data-i18n="operator.anyof.summary"></span>
         </div>`;

    const elm = (new SieveTemplate()).convert(FRAGMENT);
    if (this.getSieve().isAllOf)
      elm.querySelector(".sivOperatorAllOf").classList.remove("d-none");
    else
      elm.querySelector(".sivOperatorAnyOf").classList.remove("d-none");

    return elm;
  }

  /**
   * @inheritdoc
   */
  createHtml(parent) {

    super.createHtml(parent);
    parent.classList.add("sivOperator");

    const testElms = document.createElement("div");

    for (const test of this.getSieve().tests) {
      const dropbox = (new SieveDropBoxUI(this, "sivOperatorSpacer"))
        .drop(new SieveMultaryDropHandler(), test[TEST_ELEMENT])
        .html();

      testElms.appendChild(dropbox);

      const ul = document.createElement("ul");
      ul.classList.add("mb-0");
      ul.classList.add("pl-3");

      const li = document.createElement("li");
      li.appendChild(test[TEST_ELEMENT].html());
      li.classList.add("sivOperatorChild");

      ul.appendChild(li);

      testElms.appendChild(ul);
    }

    testElms.appendChild(
      (new SieveDropBoxUI(this, "sivOperatorSpacer"))
        .drop(new SieveMultaryDropHandler())
        .html());

    testElms.id = `${this.uniqueId}-tests`;

    parent.append(testElms);

    return parent;
  }

  /**
   * @inheritdoc
   */
  showSummary() {
    super.showSummary();
    document.querySelector(`#${this.uniqueId}-tests`).classList.remove("d-none");
  }

  /**
   * @inheritdoc
   */
  showSource() {
    super.showSource();
    document.querySelector(`#${this.uniqueId}-tests`).classList.add("d-none");
  }

}

SieveDesigner.register("operator/not", SieveNotUI);
SieveDesigner.register("operator/anyof", SieveAnyOfAllOfUI);
