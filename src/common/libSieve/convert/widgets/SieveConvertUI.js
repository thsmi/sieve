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

/* global window */

(function () {

  "use strict";

  /* global $: false */
  /* global SieveTestDialogBoxUI */
  /* global SieveActionDialogBoxUI */
  /* global SieveStringListWidget */
  /* global SieveStringWidget */
  /* global SieveDesigner */

  /**
   * Provides a ui for the convert test
   */
  class SieveConvertTestUI extends SieveTestDialogBoxUI {

    /**
     * @returns {SieveString}
     *   the element's from media type
     */
    from() {
      return this.getSieve().getElement("from");
    }

    /**
     * @returns {SieveString}
     *   the element's to media type
     */
    to() {
      return this.getSieve().getElement("to");
    }

    /**
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
      return "./convert/templates/SieveConvertUI.html";
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
      return $("<div/>")
        .append($("<span/>").text("Convert "))
        .append($("<em/>").text(this.from().value()))
        .append($("<span/>").text(" to "))
        .append($("<em/>").text(this.to().value()));
    }
  }


  /**
   * Provides a ui for the convert action
   */
  class SieveConvertActionUI extends SieveActionDialogBoxUI {

    /**
     * @returns {SieveString}
     *   the element's from media type
     */
    from() {
      return this.getSieve().getElement("from");
    }

    /**
     * @returns {SieveString}
     *   the element's to media type
     */
    to() {
      return this.getSieve().getElement("to");
    }

    /**
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
      return "./convert/templates/SieveConvertUI.html";
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
      return $("<div/>")
        .append($("<span/>").text("Convert "))
        .append($("<em/>").text(this.from().value()))
        .append($("<span/>").text(" to "))
        .append($("<em/>").text(this.to().value()));
    }
  }


  if (!SieveDesigner)
    throw new Error("Could not register Convert Extension");

  SieveDesigner.register("test/convert", SieveConvertTestUI);
  SieveDesigner.register("action/convert", SieveConvertActionUI);

})(window);
