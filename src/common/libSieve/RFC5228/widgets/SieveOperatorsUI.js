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

  /* global SieveTemplate */

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
        .append($("<ul/>").append($("<li/>").append(this.getSieve().test().html()))).get(0);
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

      parent.classList.add("sivOperator");

      parent = $(parent);

      const item = $("<div/>")
        .addClass("sivEditableElement")
        .append($("<div/>")
          .append(this.getSummary())
          .addClass("sivSummaryContent")
          .attr("id", this.uniqueId + "-summary"))
        .append($("<div/>")
          .addClass("sivSummaryControls")
          .append($("<span/>").addClass("sivIconEdit"))
        );

      parent.append(item);
      item.click((e) => { this.showEditor(); e.preventDefault(); return true; });

      for (const test of this.getSieve().tests) {

        const dropbox = (new SieveDropBoxUI(this, "sivOperatorSpacer"))
          .drop(new SieveMultaryDropHandler(), test[TEST_ELEMENT])
          .html();

        parent.append($("<div/>")
          .append(dropbox));

        const ul = $("<ul/>");
        ul.append(
          $("<li/>").append(test[TEST_ELEMENT].html())
            .addClass("sivOperatorChild"));
        parent.append(ul);
      }

      parent = parent.get(0);

      parent.append((new SieveDropBoxUI(this, "sivOperatorSpacer"))
        .drop(new SieveMultaryDropHandler())
        .html());

      return parent;
    }

  }

  if (!SieveDesigner)
    throw new Error("Could not register operator Widgets");

  SieveDesigner.register("operator/not", SieveNotUI);
  SieveDesigner.register("operator/anyof", SieveAnyOfAllOfUI);

})(window);
