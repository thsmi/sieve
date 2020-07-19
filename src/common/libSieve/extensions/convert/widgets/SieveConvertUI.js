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
  SieveActionDialogBoxUI
} from "./../../../toolkit/widgets/Boxes.js";

import {
  SieveStringListWidget,
  SieveStringWidget
} from "./../../../toolkit/widgets/Widgets.js";

import { SieveTemplate } from "./../../../toolkit/utils/SieveTemplate.js";


/**
 * Provides a ui for the convert test
 */
class SieveConvertTestUI extends SieveTestDialogBoxUI {

  /**
   * The source media type which should be converted
   *
   * @returns {SieveString}
   *   the element's from media type
   */
  from() {
    return this.getSieve().getElement("from");
  }

  /**
   * The target media type to which the content should be converted.
   *
   * @returns {SieveString}
   *   the element's to media type
   */
  to() {
    return this.getSieve().getElement("to");
  }

  /**
   * A list with transcoding instructions. They are used to
   * control and configure the conversion.
   *
   * @returns {SieveStringList}
   *   a string list with transcoding instructions.
   */
  transcoding() {
    return this.getSieve().getElement("transcoding");
  }

  /**
   * @inheritdoc
   */
  getTemplate() {
    return "./extensions/convert/templates/SieveConvertUI.html";
  }

  /**
   * @inheritdoc
   */
  onSave() {
    (new SieveStringListWidget("#sivConvertTranscoding"))
      .save(this.transcoding());

    (new SieveStringWidget("#sivConvertTo"))
      .save(this.to());

    (new SieveStringWidget("#sivConvertFrom"))
      .save(this.from());
    return true;
  }

  /**
   * @inheritdoc
   */
  onLoad() {

    (new SieveStringListWidget("#sivConvertTranscoding"))
      .init(this.transcoding());

    (new SieveStringWidget("#sivConvertTo"))
      .init(this.to());
    (new SieveStringWidget("#sivConvertFrom"))
      .init(this.from());
  }

  /**
   * @inheritdoc
   */
  getSummary() {
    const FRAGMENT =
      `<div>
         <span data-i18n="convert.summary.from"></span>
         <em class="sivConvertTo"></em>
         <span data-i18n="convert.summary.to"></span>
         <em class="sivConvertFrom"></em>
       </div>`;

    const elm = (new SieveTemplate()).convert(FRAGMENT);
    elm.querySelector(".sivConvertFrom").textContent = this.from().value();
    elm.querySelector(".sivConvertTo").textContent = this.to().value();
    return elm;
  }
}


/**
 * Provides a ui for the convert action
 */
class SieveConvertActionUI extends SieveActionDialogBoxUI {

  /**
   * The source media type which should be converted
   *
   * @returns {SieveString}
   *   the element's from media type
   */
  from() {
    return this.getSieve().getElement("from");
  }

  /**
   * The target media type to which the content should be converted.
   *
   * @returns {SieveString}
   *   the element's to media type
   */
  to() {
    return this.getSieve().getElement("to");
  }

  /**
   * A list with transcoding instructions. They are used to
   * control and configure the conversion.
   *
   * @returns {SieveStringList}
   *   a string list with transcoding instructions.
   */
  transcoding() {
    return this.getSieve().getElement("transcoding");
  }

  /**
   * @inheritdoc
   */
  getTemplate() {
    return "./extensions/convert/templates/SieveConvertUI.html";
  }

  /**
   * @inheritdoc
   */
  onSave() {
    (new SieveStringListWidget("#sivConvertTranscoding"))
      .save(this.transcoding());

    (new SieveStringWidget("#sivConvertTo"))
      .save(this.to());

    (new SieveStringWidget("#sivConvertFrom"))
      .save(this.from());
    return true;
  }

  /**
   * @inheritdoc
   */
  onLoad() {

    (new SieveStringListWidget("#sivConvertTranscoding"))
      .init(this.transcoding());

    (new SieveStringWidget("#sivConvertTo"))
      .init(this.to());
    (new SieveStringWidget("#sivConvertFrom"))
      .init(this.from());
  }

  /**
   * @inheritdoc
   */
  getSummary() {
    const FRAGMENT =
      `<div>
         <span data-i18n="convert.summary.from"></span>
         <em class="sivConvertTo"></em>
         <span data-i18n="convert.summary.to"></span>
         <em class="sivConvertFrom"></em>
       </div>`;

    const elm = (new SieveTemplate()).convert(FRAGMENT);
    elm.querySelector(".sivConvertFrom").textContent = this.from().value();
    elm.querySelector(".sivConvertTo").textContent = this.to().value();
    return elm;
  }
}

SieveDesigner.register("test/convert", SieveConvertTestUI);
SieveDesigner.register("action/convert", SieveConvertActionUI);
