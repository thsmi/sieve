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

import "./../logic/SieveEnvironment.mjs";

import { SieveDesigner } from "./../../../toolkit/SieveDesigner.mjs";

import {
  SieveTestDialogBoxUI
} from "./../../../toolkit/widgets/Boxes.mjs";

import {
  SieveStringListWidget,
  SieveStringWidget
} from "./../../../toolkit/widgets/Widgets.mjs";

import { SieveMatchTypeWidget } from "./../../../extensions/RFC5228/widgets/SieveMatchTypesUI.mjs";
import { SieveComparatorWidget } from "./../../../extensions/RFC5228/widgets/SieveComparatorsUI.mjs";

import { SieveTemplate } from "./../../../toolkit/utils/SieveTemplate.mjs";
import { SieveI18n } from "../../../toolkit/utils/SieveI18n.mjs";

/**
 * Provides a ui for the virus test
 */
class SieveEnvironmentUI extends SieveTestDialogBoxUI {

  /**
   * The environment unique name to be queried.
   *
   * @returns {SieveString}
   *   the element's name
   */
  name() {
    return this.getSieve().getElement("name");
  }

  /**
   * The keys to be checked if they are contained in the name.
   *
   * @returns {SieveString}
   *   the element's keys
   */
  keys() {
    return this.getSieve().getElement("keys");
  }

  /**
   * The matchtype used during comparisons.
   *
   * @returns {SieveAbstractElement}
   *   the element's matchtype
   */
  matchtype() {
    return this.getSieve().getElement("match-type");
  }

  /**
   * The comparator used during the conversion.
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
    return "./extensions/environment/templates/SieveEnvironmentUI.html";
  }

  /**
   * @inheritdoc
   */
  onSave() {
    (new SieveStringListWidget("#sivEnvironmentKeyList"))
      .save(this.keys());

    (new SieveMatchTypeWidget("#sivEnvironmentMatchTypes"))
      .save(this.matchtype());
    (new SieveComparatorWidget("#sivEnvironmentComparator"))
      .save(this.comparator());

    (new SieveStringWidget("#sivEnvironmentName"))
      .save(this.name());

    return true;
  }

  /**
   * @inheritdoc
   */
  onLoad() {

    (new SieveStringListWidget("#sivEnvironmentKeyList"))
      .init(this.keys());

    (new SieveMatchTypeWidget("#sivEnvironmentMatchTypes"))
      .init(this.matchtype());
    (new SieveComparatorWidget("#sivEnvironmentComparator"))
      .init(this.comparator());

    (new SieveStringWidget("#sivEnvironmentName"))
      .init(this.name());
  }

  /**
   * @inheritdoc
   */
  getSummary() {
    const msg = SieveI18n.getInstance().getString("environment.summary")
      .replace("${name}", '<em class="sivEnvironmentName"></em>')
      .replace("${matchtype}", '<span class="sivEnvironmentMatchType"></span>')
      .replace("${keys}", '<em class="sivEnvironmentKeys"></em>');

    const elm = (new SieveTemplate()).convert(`<div>${msg}</div>`);
    elm.querySelector(".sivEnvironmentName").textContent = this.name().value();
    elm.querySelector(".sivEnvironmentMatchType").textContent = " " + this.matchtype().getElement().toScript();
    elm.querySelector(".sivEnvironmentKeys").textContent = " " + this.keys().values().join(", ");
    return elm;
  }
}

SieveDesigner.register("test/environment", SieveEnvironmentUI);
