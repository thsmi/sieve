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
  SieveTestDialogBoxUI,
} from "./../../../toolkit/widgets/Boxes.js";

import {
  SieveStringListWidget,
} from "./../../../toolkit/widgets/Widgets.js";

import { SieveMatchTypeWidget } from "./../../../extensions/RFC5228/widgets/SieveMatchTypesUI.js";
import { SieveComparatorWidget } from "./../../../extensions/RFC5228/widgets/SieveComparatorsUI.js";

import {
  SieveRadioGroupWidget,
  SieveRadioGroupItemWidget
} from "./../../../toolkit/widgets/Widgets.js";

import { SieveTemplate } from "./../../../toolkit/utils/SieveTemplate.js";

/**
 * Provides a widget for the body transform element
 */
class SieveBodyTransformWidget extends SieveRadioGroupWidget {

  /**
   * @inheritdoc
   */
  constructor(selector) {
    super("body-transform/", selector);
  }
}

/**
 * An Abstract Body Transform UI implementation.
 */
class SieveAbstractBodyTransformUI extends SieveRadioGroupItemWidget {

  /**
   * @inheritdoc
   */
  static nodeType() {
    return "body-transform/";
  }

  /**
   * @inheritdoc
   */
  getName() {
    return "sieve-bodytransform";
  }
}

/**
 * Provides a UI for the raw body transform.
 */
class SieveRawBodyTransformUI extends SieveAbstractBodyTransformUI {

  /**
   * @inheritdoc
   */
  static nodeName() {
    return "body-transform/raw";
  }

  /**
   * @inheritdoc
   */
  getTemplate() {
    return "./body/templates/SieveBodyTransformRaw.html";
  }
}

/**
 * Provides a UI for the text body transform.
 */
class SieveTextBodyTransformUI extends SieveAbstractBodyTransformUI {

  /**
   * @inheritdoc
   */
  static nodeName() {
    return "body-transform/text";
  }

  /**
   * @inheritdoc
   */
  getTemplate() {
    return "./body/templates/SieveBodyTransformText.html";
  }
}

/**
 * Provides a UI for the content body transform.
 */
class SieveContentBodyTransformUI extends SieveAbstractBodyTransformUI {

  /**
   * @inheritdoc
   */
  static nodeName() {
    return "body-transform/content";
  }

  /**
   * @inheritdoc
   */
  getTemplate() {
    return "./body/templates/SieveBodyTransformContent.html";
  }

  /**
   * @inheritdoc
   */
  load(sivElement) {
    (new SieveStringListWidget("#sivBodyTransformContentType"))
      .init([""]);

    super.load(sivElement);
  }


  /**
   * @inheritdoc
   */
  onLoad(sivElement) {

    super.onLoad(sivElement);

    // update the string list...
    (new SieveStringListWidget("#sivBodyTransformContentType"))
      .init(sivElement.getElement("contentType"));
  }


  /**
   * @inheritdoc
   */
  onSave(sivElement) {

    // We update the content type with a fake element.
    // This makes updating the strings easier.
    // we can skip this in case the current element is already a content body transform element.
    if (sivElement.getElement().nodeName() !== this.constructor.nodeName()) {
      sivElement.setElement(
        "" + this.getRadioItem().querySelector(`input[name='${this.getName()}']`).value + ' ""');
    }

    (new SieveStringListWidget("#sivBodyTransformContentType"))
      .save(sivElement.getElement("contentType"));
  }

}


/**
 * Implements controls to edit a sieve body test
 *
 * "body" [COMPARATOR] [MATCH-TYPE] [BODY-TRANSFORM]  <key-list: string-list>
 *
 */
class SieveBodyUI extends SieveTestDialogBoxUI {

  /**
   * Gets the match type.
   *
   * @returns {SieveAbstractElement}
   *   the element's matchtype field
   */
  matchtype() {
    return this.getSieve().getElement("match-type");
  }

  /**
   * Gets the comparator type.
   *
   * @returns {SieveAbstractElement}
   *   the element's comparator field
   */
  comparator() {
    return this.getSieve().getElement("comparator");
  }

  /**
   * Gets the body transform type.
   *
   * @returns {SieveAbstractElement}
   *   the element's body transform field
   */
  bodyTransform() {
    return this.getSieve().getElement("body-transform");
  }

  /**
   * Gets the keys.
   *
   * @returns {SieveAbstractElement}
   *   the element's keys field
   */
  keys() {
    return this.getSieve().getElement("keys");
  }

  /**
   * @inheritdoc
   */
  onLoad() {

    (new SieveMatchTypeWidget("#sivBodyMatchTypes"))
      .init(this.matchtype());
    (new SieveComparatorWidget("#sivBodyComparator"))
      .init(this.comparator());
    (new SieveBodyTransformWidget("#sivBodyTransform"))
      .init(this.bodyTransform());

    (new SieveStringListWidget("#sivBodyKeyList"))
      .init(this.keys());
  }

  /**
   * @inheritdoc
   */
  onSave() {

    (new SieveMatchTypeWidget("#sivBodyMatchTypes"))
      .save(this.matchtype());
    (new SieveComparatorWidget("#sivBodyComparator"))
      .save(this.comparator());
    (new SieveBodyTransformWidget("#sivBodyTransform"))
      .save(this.bodyTransform());


    (new SieveStringListWidget("#sivBodyKeyList"))
      .save(this.keys());

    return true;
  }

  /**
   * @inheritdoc
   */
  getTemplate() {
    return "./body/templates/SieveBodyTestUI.html";
  }

  /**
   * @inheritdoc
   */
  getSummary() {
    const FRAGMENT =
      `<div>
           <span data-i18n="body.summary"></span>
           <span class="sivBodyMatchType"></span>
           <em class="sivBodyValue"></em>
         </div>`;

    const elm = (new SieveTemplate()).convert(FRAGMENT);
    elm.querySelector(".sivBodyMatchType").textContent
      = this.matchtype().getElement().toScript();
    elm.querySelector(".sivBodyValue").textContent
      = this.keys().values();

    return elm;
  }
}


// ************************************************************************************

SieveDesigner.register2(SieveRawBodyTransformUI);
SieveDesigner.register2(SieveTextBodyTransformUI);
SieveDesigner.register2(SieveContentBodyTransformUI);

SieveDesigner.register("test/body", SieveBodyUI);
