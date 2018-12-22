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
  /* global SieveDesigner */
  /* global SieveOperatorBoxUI */
  /* global SieveOperatorDialogBoxUI */

  /* global SieveMultaryDropHandler */
  /* global SieveDropBoxUI */

  const TEST_ELEMENT = 1;

  /**
   * Provides an ui for the not operator
   */
  class SieveNotUI extends SieveOperatorBoxUI {

    /**
     * @inheritdoc
     */
    getSummary() {
      return $("<div/>")
        .text("does not match:")
        .append(this.getSieve().test().html());
    }
  }


  /**
   * Provides an ui for the anyof and allof operator
   */
  class SieveAnyOfAllOfUI extends SieveOperatorDialogBoxUI {

    /**
     * @inheritdoc
     **/
    getTemplate() {
      return "./RFC5228/templates/SieveAllOfAnyOfOperator.html";
    }

    /**
     * @inheritdoc
     **/
    onSave() {

      let value = $("#sieve-widget-allofanyof")
        .find("input[name='allofanyof']:checked").val();

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
      $("#sieve-widget-allofanyof")
        .find("input[name='allofanyof']")
        .val(["" + this.getSieve().isAllOf]);
    }

    /**
     * @inheritdoc
     */
    getSummary() {
      return $("<div/>")
        .text((this.getSieve().isAllOf) ? "All of the following:" : "Any of the following:");
    }

    /**
     * @inheritdoc
     */
    createHtml(parent) {

      let item = $("<div/>")
        .addClass("sivOperator");

      for (let test of this.getSieve().tests) {
        item
          .append((new SieveDropBoxUI(this))
            .drop(new SieveMultaryDropHandler(), test[TEST_ELEMENT])
            .html()
            .addClass("sivOperatorSpacer"))
          .append(
            $("<div/>").append(test[TEST_ELEMENT].html())
              .addClass("sivOperatorChild"));
      }

      item
        .append((new SieveDropBoxUI(this))
          .drop(new SieveMultaryDropHandler())
          .html()
          .addClass("sivOperatorSpacer"));

      return super.createHtml(parent)
        .append(item);

    }

  }


  if (!SieveDesigner)
    throw new Error("Could not register operator Widgets");

  SieveDesigner.register("operator/not", SieveNotUI);
  SieveDesigner.register("operator/anyof", SieveAnyOfAllOfUI);

})(window);
