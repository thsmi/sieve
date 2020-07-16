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

import { SieveTestDialogBoxUI } from "./../../../toolkit/widgets/Boxes.js";

import { SieveStringWidget } from "./../../../toolkit/widgets/Widgets.js";

import { SieveMatchTypeWidget } from "./../../../extensions/RFC5228/widgets/SieveMatchTypesUI.js";
import { SieveComparatorWidget } from "./../../../extensions/RFC5228/widgets/SieveComparatorsUI.js";

import { SieveTemplate } from "./../../../toolkit/utils/SieveTemplate.js";

/**
 * Provides a ui for the spam test
 */
class SieveSpamtestUI extends SieveTestDialogBoxUI {

  /**
   * The spam tests' value.
   *
   * @returns {SieveString}
   *   The element's value.
   */
  value() {
    return this.getSieve().getElement("value");
  }

  /**
   * The spam tests match type.
   *
   * @returns {SieveAbstractElement}
   *   The element's matchtype.
   */
  matchtype() {
    return this.getSieve().getElement("match-type");
  }

  /**
   * The spamtest's comparator.
   *
   * @returns {SieveAbstractElement}
   *   The element's comparator.
   */
  comparator() {
    return this.getSieve().getElement("comparator");
  }

  /**
   * The default spam probability is a range from 0 to 10.
   * As this was not too intuitive, they extended the definition
   * and added a percentual range (0 to 100%).
   *
   * The range in percent it optional and so it may not be supported
   * by the sieve implementation
   *
   * @returns {boolean}
   *   true in case the value is in percent otherwise false.
   *   false can mean it is not supported or it is disabled.
   */
  isPercental() {
    if (!this.getSieve().hasElement("percent"))
      return false;

    if (!this.getSieve().enable("percent"))
      return false;

    return true;
  }

  /**
   * @inheritdoc
   */
  getTemplate() {
    return "./spamtest/templates/SieveSpamtestUI.html";
  }

  /**
   * @inheritdoc
   */
  onSave() {

    (new SieveMatchTypeWidget("#sivSpamtestMatchTypes"))
      .save(this.matchtype());
    (new SieveComparatorWidget("#sivSpamtestComparator"))
      .save(this.comparator());

    if (!this.getSieve().hasElement("percent")) {
      (new SieveStringWidget("#sivSpamtestValue")).save(this.value());
      return true;
    }

    if (document.querySelector("#sivSpamtestPercentRadio").checked) {
      this.getSieve().enable("percent", true);
      (new SieveStringWidget("#sivSpamtestPercentValue")).save(this.value());
      return true;
    }

    this.getSieve().enable("percent", false);
    (new SieveStringWidget("#sivSpamtestValue")).save(this.value());
    return true;
  }

  /**
   * @inheritdoc
   */
  onLoad() {

    (new SieveMatchTypeWidget("#sivSpamtestMatchTypes"))
      .init(this.matchtype());
    (new SieveComparatorWidget("#sivSpamtestComparator"))
      .init(this.comparator());

    // Check if this is a spamtest or spamtestplus ui.

    if (this.getSieve().hasElement("percent")) {
      (async () => {
        const elm = await ((new SieveTemplate())
          .load("./spamtest/templates/SieveSpamtestPlusValue.html"));

        document.querySelector("#sivSpamtestPlaceholder").appendChild(elm);

        this.onLoadPercentualValue();
      })();
      return;
    }

    (async () => {
      const elm = await ((new SieveTemplate())
        .load("./spamtest/templates/SieveSpamtestValue.html"));

      document.querySelector("#sivSpamtestPlaceholder").appendChild(elm);

      this.onLoadValue();
    })();
  }

  /**
   * Called when the spamtest value ui is loaded.
   * It is used to initialize the value field.
   */
  onLoadValue() {

    (new SieveStringWidget("#sivSpamtestValue"))
      .init(this.value());
  }

  /**
   * Called when the spamtest plus ui is loaded
   * It is used to populate the radiobutton as well as the value fields
   */
  onLoadPercentualValue() {
    let value = "";
    let percentualValue = "";

    if (this.getSieve().enable("percent")) {
      document.querySelector("#sivSpamtestPercentRadio").checked = true;
      percentualValue = this.value();
    }
    else {
      document.querySelector("#sivSpamtestRadio").checked = true;
      value = this.value();
    }

    (new SieveStringWidget("#sivSpamtestValue"))
      .init(value);
    (new SieveStringWidget("#sivSpamtestPercentValue"))
      .init(percentualValue);
  }

  /**
   * @inheritdoc
   */
  getSummary() {

    const FRAGMENT =
      `<div>
         <span data-i18n="spamtest.summary"></span>
         <span class="sivSpamtestMatchtype"></span>
         <em class="sivSpamtestValue"></em>
       </div>`;

    const elm = (new SieveTemplate()).convert(FRAGMENT);
    elm.querySelector(".sivSpamtestMatchtype").textContent
      = this.matchtype().getElement().toScript();
    elm.querySelector(".sivSpamtestValue").textContent
      = this.value().value() + (this.isPercental() ? "%" : "");
    return elm;
  }
}



/**
 * Provides a ui for the virus test
 */
class SieveVirustestUI extends SieveTestDialogBoxUI {

  /**
   * The virus test's value.
   *
   * @returns {SieveString}
   *   the element's value
   */
  value() {
    return this.getSieve().getElement("value");
  }

  /**
   * The virus test's match type.
   *
   * @returns {SieveAbstractElement}
   *   the element's matchtype
   */
  matchtype() {
    return this.getSieve().getElement("match-type");
  }

  /**
   * The virus test's comparator.
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
    return "./spamtest/templates/SieveVirustestUI.html";
  }

  /**
   * @inheritdoc
   */
  onSave() {

    (new SieveMatchTypeWidget("#sivVirustestMatchTypes"))
      .save(this.matchtype());
    (new SieveComparatorWidget("#sivVirustestComparator"))
      .save(this.comparator());

    (new SieveStringWidget("#sivVirustestValue"))
      .save(this.value());

    return true;
  }

  /**
   * @inheritdoc
   */
  onLoad() {

    (new SieveMatchTypeWidget("#sivVirustestMatchTypes"))
      .init(this.matchtype());
    (new SieveComparatorWidget("#sivVirustestComparator"))
      .init(this.comparator());

    (new SieveStringWidget("#sivVirustestValue"))
      .init(this.value());
  }

  /**
   * @inheritdoc
   */
  getSummary() {
    const FRAGMENT =
      `<div>
         <span data-i18n="virustest.summary"></span>
         <span class="sivVirustestMatchtype"></span>
         <em class="sivVirustestValue"></em>
       </div>`;

    const elm = (new SieveTemplate()).convert(FRAGMENT);
    elm.querySelector(".sivVirustestMatchtype").textContent
      = this.matchtype().getElement().toScript();
    elm.querySelector(".sivVirustestValue").textContent
      = this.value().value();
    return elm;
  }
}

SieveDesigner.register("test/virustest", SieveVirustestUI);
SieveDesigner.register("test/spamtest", SieveSpamtestUI);
