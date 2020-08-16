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

import "./../logic/SieveDate.mjs";

import { SieveDesigner } from "./../../../toolkit/SieveDesigner.mjs";

import {
  SieveTestDialogBoxUI
} from "./../../../toolkit/widgets/Boxes.mjs";

import {
  SieveStringListWidget,
  SieveStringWidget
} from "./../../../toolkit/widgets/Widgets.mjs";

import {
  SieveRadioGroupWidget,
  SieveRadioGroupItemWidget
} from "./../../../toolkit/widgets/Widgets.mjs";

import { SieveMatchTypeWidget } from "./../../../extensions/RFC5228/widgets/SieveMatchTypesUI.mjs";
import { SieveComparatorWidget } from "./../../../extensions/RFC5228/widgets/SieveComparatorsUI.mjs";

import { SieveTemplate } from "./../../../toolkit/utils/SieveTemplate.mjs";
import { SieveI18n } from "../../../toolkit/utils/SieveI18n.mjs";

/**
 * Provides a widget for the zone element
 */
class SieveZoneWidget extends SieveRadioGroupWidget {

  /**
   * @inheritdoc
   */
  constructor(selector) {
    super("zone/", selector);
  }
}

/**
 * An Abstract zone UI implementation.
 */
class SieveAbstractZoneUI extends SieveRadioGroupItemWidget {

  /**
   * @inheritdoc
   */
  static nodeType() {
    return "zone/";
  }

  /**
   * @inheritdoc
   */
  getName() {
    return "sieve-zone";
  }
}

/**
 * Provides a UI for the original zone.
 */
class SieveOriginalZoneUI extends SieveAbstractZoneUI {

  /**
   * @inheritdoc
   */
  static nodeName() {
    return "zone/originalzone";
  }

  /**
   * @inheritdoc
   */
  getTemplate() {
    return "./extensions/date/templates/SieveZoneOriginal.html";
  }
}

/**
 * Provides a UI for a custom zone .
 */
class SieveCustomZoneUI extends SieveAbstractZoneUI {

  /**
   * @inheritdoc
   */
  static nodeName() {
    return "zone/zone";
  }

  /**
   * @inheritdoc
   */
  getTemplate() {
    return "./extensions/date/templates/SieveZoneCustom.html";
  }

  /**
   * @inheritdoc
   */
  onLoad(sivElement) {
    super.onLoad(sivElement);

    // update the string list...
    document.querySelector("#sivDateZoneOffset").value
      = sivElement.getElement("time-zone").value();
  }

  /**
   * @inheritdoc
   */
  onSave(sivElement) {

    // We update the content type with a fake element.
    // This makes updating the strings easier.
    // we can skip this in case the current element is already a zone element.
    if (!sivElement.getElement().nodeName() !== this.constructor.nodeName()) {
      sivElement.setElement(
        "" + this.getRadioItem().querySelector("input[name='" + this.getName() + "']").value + ' ""');
    }

    sivElement.getElement("time-zone").value(
      document.querySelector("#sivDateZoneOffset").value);
  }
}


/**
 * Provides a ui for the set action
 */
class SieveDateTestUI extends SieveTestDialogBoxUI {

  /**
   * Gets the header.
   *
   * @returns {SieveString}
   *   the element's header
   */
  header() {
    return this.getSieve().getElement("header");
  }

  /**
   * Gets the date part
   *
   * @returns {SieveString}
   *   the element's datepart
   */
  datepart() {
    return this.getSieve().getElement("datepart");
  }

  /**
   * Gets the keywords
   *
   * @returns {SieveStringList}
   *   the element's keys
   */
  keys() {
    return this.getSieve().getElement("keys");
  }

  /**
   * Gets the match type.
   *
   * @returns {SieveAbstractElement}
   *   the element's matchtype
   */
  matchtype() {
    return this.getSieve().getElement("match-type");
  }

  /**
   * Gets the comparator type.
   *
   * @returns {SieveAbstractElement}
   *   the element's comparator
   */
  comparator() {
    return this.getSieve().getElement("comparator");
  }

  /**
   * Gets the time zone.
   *
   * @returns {SieveAbstractElement}
   *   the element's zone
   */
  zone() {
    return this.getSieve().getElement("zone");
  }

  /**
   * @inheritdoc
   */
  getTemplate() {
    return "./extensions/date/templates/SieveDateTestUI.html";
  }

  /**
   * @inheritdoc
   */
  onSave() {

    (new SieveStringListWidget("#sivDateKeyList"))
      .save(this.keys());

    (new SieveMatchTypeWidget("#sivDateMatchTypes"))
      .save(this.matchtype());
    (new SieveComparatorWidget("#sivDateComparator"))
      .save(this.comparator());
    (new SieveZoneWidget("#sivDateZone"))
      .save(this.zone());

    this.header().value(document.querySelector("#sivDateHeader").value);

    (new SieveStringWidget("#sivDateDatepart"))
      .save(this.datepart());
    return true;
  }

  /**
   * @inheritdoc
   */
  onLoad() {

    (new SieveStringListWidget("#sivDateKeyList"))
      .init(this.keys());

    (new SieveMatchTypeWidget("#sivDateMatchTypes"))
      .init(this.matchtype());
    (new SieveComparatorWidget("#sivDateComparator"))
      .init(this.comparator());

    document.querySelector("#sivDateHeader").value = this.header().value();

    (new SieveZoneWidget("#sivDateZone"))
      .init(this.zone());
    (new SieveStringWidget("#sivDateDatepart"))
      .init(this.datepart());
  }

  /**
   * @inheritdoc
   */
  getSummary() {

    const msg = SieveI18n.getInstance().getString("date.summary")
      .replace("${datepart}", '<em class="sivDateDatePart"></em>')
      .replace("${header}", '<em class="sivDateHeader"></em>')
      .replace("${matchtype}", '<em class="sivDateMatchType"></em>')
      .replace("${keys}", '<em class="sivDateKeys"></em>');

    const elm = (new SieveTemplate()).convert(`<div>${msg}</div>`);
    elm.querySelector(".sivDateDatePart").textContent
      = this.datepart().value();
    elm.querySelector(".sivDateHeader").textContent
      = this.header().value();
    elm.querySelector(".sivDateMatchType").textContent
      = this.matchtype().getElement().toScript();
    elm.querySelector(".sivDateKeys").textContent
      = this.keys().toScript();

    return elm;
  }
}


/**
 * Provides a ui for the sieve current date test
 */
class SieveCurrentDateTestUI extends SieveTestDialogBoxUI {

  /**
   * Gets the keywords.
   *
   * @returns {SieveStringList}
   *   the element's keys
   */
  keys() {
    return this.getSieve().getElement("keys");
  }

  /**
   * Gets the date part.
   *
   * @returns {SieveString}
   *   the element's datepart
   */
  datepart() {
    return this.getSieve().getElement("datepart");
  }

  /**
   * Gets the match type.
   *
   * @returns {SieveAbstractElement}
   *   the element's matchtype
   */
  matchtype() {
    return this.getSieve().getElement("match-type");
  }

  /**
   * Gets the comparator.
   *
   * @returns {SieveAbstractElement}
   *   the element's comparator
   */
  comparator() {
    return this.getSieve().getElement("comparator");
  }

  /**
   * Gets the timezone.
   *
   * @returns {SieveAbstractElement}
   *   the element's zone
   */
  zone() {
    return this.getSieve().getElement("zone");
  }

  /**
   * @inheritdoc
   */
  getTemplate() {
    return "./extensions/date/templates/SieveCurrentDateTestUI.html";
  }

  /**
   * @inheritdoc
   */
  onSave() {
    (new SieveStringListWidget("#sivDateKeyList"))
      .save(this.keys());

    (new SieveMatchTypeWidget("#sivDateMatchTypes"))
      .save(this.matchtype());
    (new SieveComparatorWidget("#sivDateComparator"))
      .save(this.comparator());
    (new SieveZoneWidget("#sivDateZone"))
      .save(this.zone());

    (new SieveStringWidget("#sivDateDatepart"))
      .save(this.datepart());

    return true;
  }

  /**
   * @inheritdoc
   */
  onLoad() {

    (new SieveStringListWidget("#sivDateKeyList"))
      .init(this.keys());

    (new SieveMatchTypeWidget("#sivDateMatchTypes"))
      .init(this.matchtype());
    (new SieveComparatorWidget("#sivDateComparator"))
      .init(this.comparator());

    (new SieveZoneWidget("#sivDateZone"))
      .init(this.zone());

    (new SieveStringWidget("#sivDateDatepart"))
      .init(this.datepart());
  }

  /**
   * @inheritdoc
   */
  getSummary() {
    const msg = SieveI18n.getInstance().getString("currentdate.summary")
      .replace("${datepart}", '<span class="sivCurrentDateDatePart"></span>')
      .replace("${matchtype}", '<span class="sivCurrentDateMatchType"></span>')
      .replace("${keys}", '<span class="sivCurrentDateKeys"></span>');

    const elm = (new SieveTemplate()).convert(`<div>${msg}</div>`);
    elm.querySelector(".sivCurrentDateDatePart").textContent
      = this.datepart().value();
    elm.querySelector(".sivCurrentDateMatchType").textContent
      = this.matchtype().getElement().toScript();
    elm.querySelector(".sivCurrentDateKeys").textContent
      = this.keys().toScript();

    return elm;
  }
}

SieveDesigner.register("test/date", SieveDateTestUI);
SieveDesigner.register("test/currentdate", SieveCurrentDateTestUI);

SieveDesigner.register2(SieveOriginalZoneUI);
SieveDesigner.register2(SieveCustomZoneUI);
