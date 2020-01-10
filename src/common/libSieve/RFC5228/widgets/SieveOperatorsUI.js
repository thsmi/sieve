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

(function () {

  "use strict";

  /* global $: false */
  /* global SieveDesigner */
  /* global SieveSimpleBoxUI */
  /* global SieveDialogBoxUI */

  /* global SieveMultaryDropHandler */
  /* global SieveDropBoxUI */

  /* global SieveMoveDragHandler */
  /* global SieveTestDropHandler */

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
      return $("<div/>")
        .text("does not match:")
        .append($("<ul/>").append($("<li/>").append(this.getSieve().test().html())));
    }

    /**
     * @inheritdoc
     */
    createHtml(parent) {
      return super.createHtml(parent)
        .addClass("sivOperator");
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
      return "./RFC5228/templates/SieveAllOfAnyOfOperator.html";
    }

    /**
     * @inheritdoc
     **/
    onSave() {

      const value = $("#sieve-widget-allofanyof")
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

      parent.addClass("sivOperator");

      const item = $("<div/>")
        .addClass("sivEditableElement")
        .append($("<div/>")
          .append(this.getSummary())
          .addClass("sivSummaryContent")
          .attr("id", this.uniqueId + "-summary"))
        .append($("<div/>")
          .addClass("sivSummaryControls")
          .addClass("material-icons")
          .append($("<span/>").text("edit"))
        );

      parent.append(item);
      item.click((e) => { this.showEditor(); e.preventDefault(); return true; });

      for (const test of this.getSieve().tests) {

        parent.append($("<div/>")
          .append((new SieveDropBoxUI(this))
            .drop(new SieveMultaryDropHandler(), test[TEST_ELEMENT])
            .html()
            .addClass("sivOperatorSpacer")));

        const ul = $("<ul/>");
        ul.append(
          $("<li/>").append(test[TEST_ELEMENT].html())
            .addClass("sivOperatorChild"));
        parent.append(ul);
      }

      parent.append((new SieveDropBoxUI(this))
        .drop(new SieveMultaryDropHandler())
        .html()
        .addClass("sivOperatorSpacer"));

      return parent;
    }

  }

  if (!SieveDesigner)
    throw new Error("Could not register operator Widgets");

  SieveDesigner.register("operator/not", SieveNotUI);
  SieveDesigner.register("operator/anyof", SieveAnyOfAllOfUI);

})(window);
