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
  SieveStringListWidget,
  SieveNumericWidget
} from "./../../../toolkit/widgets/Widgets.mjs";

import { SieveMatchTypeWidget } from "./../../RFC5228/widgets/SieveMatchTypesUI.mjs";
import { SieveAddressPartWidget } from "./../../RFC5228/widgets/SieveAddressPartUI.mjs";
import { SieveComparatorWidget } from "./../../RFC5228/widgets/SieveComparatorsUI.mjs";

import { SieveTemplate } from "./../../../toolkit/utils/SieveTemplate.mjs";
import { SieveI18n } from "../../../toolkit/utils/SieveI18n.mjs";

// testunary .append() -> testunary in anyof wrapen  SieveTestUI einführen...
// testmultary.append -> an entsprechender stelle einfügen SieveTestListUI...


/**
 * Implements an UI for the size test
 */
class SieveSizeTestUI extends SieveTestDialogBoxUI {

  /**
   * @inheritdoc
   **/
  getTemplate() {
    return "./extensions/RFC5228/templates/SieveSizeTestUI.html";
  }

  /**
   * @inheritdoc
   */
  onLoad() {
    (new SieveNumericWidget("#sivSizeInput"))
      .init(this.getSieve().getElement("limit"));

    const elm = this.getSieve().getElement("operator").getCurrentElement();
    document.querySelector(`input[type='radio'][name="over"][value="${elm.nodeName()}"]`).checked = true;
  }

  /**
   * @inheritdoc
   **/
  onSave() {

    (new SieveNumericWidget("#sivSizeInput"))
      .save(this.getSieve().getElement("limit"));

    const name = document.querySelector("input[type='radio'][name='over']:checked").value;

    if (name === "test/size/operator/over")
      this.getSieve().getElement("operator").setCurrentElement(":over");
    else if (name === "test/size/operator/under")
      this.getSieve().getElement("operator").setCurrentElement(":under");
    else
      throw new Error("Unknown operator, has to be either :over or :under");

    return true;
  }


  /**
   * @inheritdoc
   */
  getSummary() {
    const msg = SieveI18n.getInstance().getString("size.summary")
      .replace("${size}", '<em class="sivSizeLimit"></em>')
      .replace("${relation}",
        '<em data-i18n="size.larger" class="sivSizeLarger d-none"></em><em data-i18n="size.smaller" class="sivSizeSmaller d-none"></em>');

    const elm = (new SieveTemplate()).convert(`<div>${msg}</div>`);

    const name = this.getSieve().getElement("operator").getCurrentElement().nodeName();
    if (name === "test/size/operator/over")
      elm.querySelector(".sivSizeLarger").classList.remove("d-none");
    else if (name === "test/size/operator/under")
      elm.querySelector(".sivSizeSmaller").classList.remove("d-none");
    else
      throw new Error("Invalid size operator");

    elm.querySelector(".sivSizeLimit").textContent
      = this.getSieve().getElement("limit").toScript();

    return elm;
  }
}

/**
 * Provides an UI for the Sieve Boolean tests, which have no
 * practical use as a true always succeed and a false always fails.
 */
class SieveBooleanTestUI extends SieveTestDialogBoxUI {

  /**
   * @inheritdoc
   **/
  getTemplate() {
    return "./extensions/RFC5228/templates/SieveBooleanTest.html";
  }

  /**
   * @inheritdoc
   **/
  onSave() {

    const value = document.querySelector("#sieve-widget-test")
      .querySelector("input[name='booleanValue']:checked").value;

    if (value === "test/boolean/true")
      this.getSieve().setCurrentElement("true");
    else if (value === "test/boolean/false")
      this.getSieve().setCurrentElement("false");
    else
      throw new Error("Invalid boolean value");

    return true;
  }

  /**
   * @inheritdoc
   */
  onLoad() {
    document
      .querySelector("#sieve-widget-test")
      .querySelector("input[name='booleanValue']")
      .value = this.getSieve().getCurrentElement().nodeName();
  }

  /**
   * @inheritdoc
   */
  getSummary() {

    const FRAGMENT =
      `<div>
          <span data-i18n="boolean.summary.true" class="sivBooleanTrue d-none"></span>
          <span data-i18n="boolean.summary.false" class="sivBooleanFalse d-none"></span>
         </div>`;

    const elm = (new SieveTemplate()).convert(FRAGMENT);

    const name = this.getSieve().getCurrentElement().nodeName();
    if (name === "test/boolean/true") {
      elm.querySelector(".sivBooleanTrue").classList.remove("d-none");
      return elm;
    }

    if (name === "test/boolean/false") {
      elm.querySelector(".sivBooleanFalse").classList.remove("d-none");
      return elm;
    }

    throw new Error("Invalid State boolean is neither true nor false");
  }
}


/**
 * A UI Widget for the sieve exists element
 */
class SieveExistsUI extends SieveTestDialogBoxUI {

  /**
   * The headers which should be checked for existence.
   *
   * @returns {SieveAbstractElement}
   *   the element's headers
   */
  headers() {
    return this.getSieve().getElement("headers");
  }

  /**
   * @inheritdoc
   */
  getTemplate() {
    return "./extensions/RFC5228/templates/SieveExistsTestUI.html";
  }

  /**
   * @inheritdoc
   */
  onLoad() {
    (new SieveStringListWidget("#sivExistsHeaderList"))
      .init(this.headers());
  }

  /**
   * @inheritdoc
   */
  onSave() {
    (new SieveStringListWidget("#sivExistsHeaderList")).save(this.headers());

    return true;
  }

  /**
   * @inheritdoc
   */
  getSummary() {

    const msg = SieveI18n.getInstance().getString("exists.summary")
      .replace("${headers}", '<em class="sivExistsHeaders"></em>');

    const elm = (new SieveTemplate()).convert(`<div>${msg}</div>`);
    elm.querySelector(".sivExistsHeaders").textContent
      = this.headers().values();

    return elm;
  }
}

/**
 * A UI Widget for the sieve header element
 */
class SieveHeaderUI extends SieveTestDialogBoxUI {

  /**
   * The headers values.
   *
   * @returns {SieveAbstractElement}
   *   the element's keys
   */
  keys() {
    return this.getSieve().getElement("keys");
  }

  /**
   * The header which value should be checked against the keys.
   *
   * @returns {SieveAbstractElement}
   *   the element's headers
   */
  headers() {
    return this.getSieve().getElement("headers");
  }

  /**
   * The matchtype describe how to match the headers to the keys.
   *
   * @returns {SieveAbstractElement}
   *   the element's match type
   */
  matchtype() {
    return this.getSieve().getElement("match-type");
  }

  /**
   * The comparator which is used to compare the headers against the keys.
   *
   * @returns {SieveAbstractElement}
   *   the element's comparator
   */
  comparator() {
    return this.getSieve().getElement("comparator");
  }

  /**
   * @inheritdoc
   */
  getTemplate() {
    return "./extensions/RFC5228/templates/SieveHeaderTestUI.html";
  }

  /**
   * @inheritdoc
   */
  onLoad() {
    (new SieveStringListWidget("#sivHeaderKeyList"))
      .init(this.keys());
    (new SieveStringListWidget("#sivHeaderHeaderList"))
      .init(this.headers());

    (new SieveMatchTypeWidget("#sivHeaderMatchTypes"))
      .init(this.matchtype());
    (new SieveComparatorWidget("#sivHeaderComparator"))
      .init(this.comparator());
  }

  /**
   * @inheritdoc
   */
  onSave() {
    (new SieveStringListWidget("#sivHeaderKeyList"))
      .save(this.keys());
    (new SieveStringListWidget("#sivHeaderHeaderList"))
      .save(this.headers());

    (new SieveComparatorWidget("#sivHeaderComparator"))
      .save(this.comparator());
    (new SieveMatchTypeWidget("#sivHeaderMatchTypes"))
      .save(this.matchtype());

    return true;
  }

  /**
   * @inheritdoc
   */
  getSummary() {
    const msg = SieveI18n.getInstance().getString("header.summary")
      .replace("${headers}", '<em class="sivHeaderValues"></em>')
      .replace("${matchtype}", '<span class="sivHeaderMatchType"></span>')
      .replace("${keys}", '<em class="sivHeaderKeys"></em>');

    const elm = (new SieveTemplate()).convert(`<div>${msg}</div>`);
    elm.querySelector(".sivHeaderValues").textContent
      = this.headers().values();
    elm.querySelector(".sivHeaderMatchType").textContent
      = this.matchtype().getElement().toScript();
    elm.querySelector(".sivHeaderKeys").textContent
      = this.keys().values();

    return elm;
  }
}

/**
 * A UI Widget for the sieve address element
 */
class SieveAddressUI extends SieveTestDialogBoxUI {

  /**
   * The address part defined which part of the mail address should
   *  be compared. It can be the local part, the domain part or both.
   *
   * @returns {SieveAbstractElement}
   *   the element's address part
   */
  addresspart() {
    return this.getSieve().getElement("address-part");
  }

  /**
   * The comparison type. Defines how individual characters are compared.
   *
   * @returns {SieveAbstractElement}
   *   the element's comparator
   */
  comparator() {
    return this.getSieve().getElement("comparator");
  }

  /**
   * Match types define how to match the headers and the keys.
   *
   * @returns {SieveAbstractElement}
   *   the element's match type
   */
  matchtype() {
    return this.getSieve().getElement("match-type");
  }

  /**
   * The headers to compare against the keys.
   *
   * @returns {SieveAbstractElement}
   *   the element's headers
   */
  headers() {
    return this.getSieve().getElement("headers");
  }

  /**
   * The expected header values/keys.
   *
   * @returns {SieveAbstractElement}
   *   the element's keys
   */
  keys() {
    return this.getSieve().getElement("keys");
  }

  /**
   * @inheritdoc
   */
  getTemplate() {
    return "./extensions/RFC5228/templates/SieveAddressTestUI.html";
  }

  /**
   * @inheritdoc
   */
  onLoad() {
    (new SieveStringListWidget("#sivAddressKeyList"))
      .init(this.keys());
    (new SieveStringListWidget("#sivAddressHeaderList"))
      .init(this.headers());

    (new SieveComparatorWidget("#sivAddressComparator"))
      .init(this.comparator());
    (new SieveMatchTypeWidget("#sivAddressMatchTypes"))
      .init(this.matchtype());
    (new SieveAddressPartWidget("#sivAddressAddressPart"))
      .init(this.addresspart());
  }

  /**
   * @inheritdoc
   */
  onSave() {

    (new SieveStringListWidget("#sivAddressKeyList"))
      .save(this.keys());
    (new SieveStringListWidget("#sivAddressHeaderList"))
      .save(this.headers());

    (new SieveComparatorWidget("#sivAddressComparator"))
      .save(this.comparator());
    (new SieveMatchTypeWidget("#sivAddressMatchTypes"))
      .save(this.matchtype());
    (new SieveAddressPartWidget("#sivAddressAddressPart"))
      .save(this.addresspart());

    return true;
  }

  /**
   * @inheritdoc
   */
  getSummary() {
    const msg = SieveI18n.getInstance().getString("address.summary")
      .replace("${headers}", '<em class="sivAddressHeaders"></em>')
      .replace("${matchtype}", '<span class="sivAddressMatchType"></span>')
      .replace("${addresspart}", '<span class="sivAddressAddressPart d-none"></span>')
      .replace("${keys}", '<em class="sivAddressKeys"></em>');

    const elm = (new SieveTemplate()).convert(`<div>${msg}</div>`);

    elm.querySelector(".sivAddressHeaders").textContent
      = this.headers().values();
    elm.querySelector(".sivAddressMatchType").textContent
      = this.matchtype().getElement().toScript();

    const addresspart = this.addresspart().getElement().toScript();
    if (addresspart !== ":all") {
      elm.querySelector(".sivAddressAddressPart").textContent
        = this.addresspart().getElement().toScript();
      elm.classList.remove("d-none");
    }

    elm.querySelector(".sivAddressKeys").textContent
      = this.keys().values();

    return elm;
  }
}

/**
 * A UI Widget for the sieve envelope element
 */
class SieveEnvelopeUI extends SieveTestDialogBoxUI {

  /**
   * Specifies which part of the mail address in the envelope should be compared.
   *
   * @returns {SieveAbstractElement}
   *   the element's address part
   */
  addresspart() {
    return this.getSieve().getElement("address-part");
  }

  /**
   * Specifies how individual characters are compared.
   *
   * @returns {SieveAbstractElement}
   *   the element's comparator
   */
  comparator() {
    return this.getSieve().getElement("comparator");
  }

  /**
   * Specified how the envelope is compared against the keys.
   *
   * @returns {SieveAbstractElement}
   *   the element's match type
   */
  matchtype() {
    return this.getSieve().getElement("match-type");
  }

  /**
   * The envelope values which should be evaluated.
   *
   * @returns {SieveAbstractElement}
   *   the element's envelopes
   */
  envelopes() {
    return this.getSieve().getElement("envelopes");
  }

  /**
   * The expected keys /envelope values.
   *
   * @returns {SieveAbstractElement}
   *   the element's keys
   */
  keys() {
    return this.getSieve().getElement("keys");
  }

  /**
   * @inheritdoc
   */
  getTemplate() {
    return "./extensions/RFC5228/templates/SieveEnvelopeTestUI.html";
  }

  /**
   * @inheritdoc
   */
  onLoad() {
    (new SieveStringListWidget("#sivEnvelopeKeyList"))
      .init(this.keys());
    (new SieveStringListWidget("#sivEnvelopeList"))
      .init(this.envelopes());

    (new SieveComparatorWidget("#sivEnvelopeComparator"))
      .init(this.comparator());
    (new SieveAddressPartWidget("#sivEnvelopeAddressPart"))
      .init(this.addresspart());
    (new SieveMatchTypeWidget("#sivEnvelopeMatchTypes"))
      .init(this.matchtype());
  }

  /**
   * @inheritdoc
   */
  onSave() {

    (new SieveStringListWidget("#sivEnvelopeKeyList")).save(this.keys());
    (new SieveStringListWidget("#sivEnvelopeList")).save(this.envelopes());

    (new SieveComparatorWidget("#sivEnvelopeComparator"))
      .save(this.comparator());
    (new SieveMatchTypeWidget("#sivEnvelopeMatchTypes"))
      .save(this.matchtype());
    (new SieveAddressPartWidget("#sivEnvelopeAddressPart"))
      .save(this.addresspart());

    return true;
  }

  /**
   * @inheritdoc
   */
  getSummary() {
    const msg = SieveI18n.getInstance().getString("envelope.summary")
      .replace("${envelopes}", '<em class="sivEnvelopeEnvelopes"></em>')
      .replace("${matchtype}", '<span class="sivEnvelopeMatchType"></span>')
      .replace("${addresspart}", '<span class="sivEnvelopesAddressPart d-none"></span>')
      .replace("${keys}", '<em class="sivEnvelopeKeys"></em>');

    const elm = (new SieveTemplate()).convert(`<div>${msg}</div>`);
    elm.querySelector(".sivEnvelopeEnvelopes").textContent
      = this.envelopes().values();
    elm.querySelector(".sivEnvelopeMatchType").textContent
      = this.matchtype().getElement().toScript();

    const addresspart = this.addresspart().getElement().toScript();
    if (addresspart !== ":all") {
      elm.querySelector(".sivEnvelopesAddressPart").textContent
        = this.addresspart().getElement().toScript();
      elm.classList.remove("d-none");
    }

    elm.querySelector(".sivEnvelopeKeys").textContent
      = this.keys().values();

    return elm;
  }
}


SieveDesigner.register("test/address", SieveAddressUI);
SieveDesigner.register("test/boolean", SieveBooleanTestUI);
SieveDesigner.register("test/envelope", SieveEnvelopeUI);
SieveDesigner.register("test/exists", SieveExistsUI);
SieveDesigner.register("test/header", SieveHeaderUI);
SieveDesigner.register("test/size", SieveSizeTestUI);
