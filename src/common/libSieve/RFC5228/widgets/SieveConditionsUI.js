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
  /* global SieveBlockUI */
  /* global SieveSourceBoxUI */
  /* global SieveMoveDragHandler */
  /* global SieveDropBoxUI */
  /* global SieveConditionDropHandler */

  const IS_FIRST_ITEM = 0;

  /**
   * Provides a UI for the if statement
   */
  class SieveIfUI extends SieveBlockUI {

    /**
     * @inheritdoc
     */
    createHtml(parent) {
      return $("<div/>")
        .attr("id", "sivElm" + this.id())
        .addClass("sivConditional")
        .append(
          $("<div/>").append(this.getSieve().test().html())
            .addClass("sivConditionalChild"))
        .append(
          super.createHtml(parent));
    }
  }


  /**
   * Provides an UI for the Else statement
   */
  class SieveElseUI extends SieveBlockUI {

    /**
     * @inheritdoc
     */
    createHtml(parent) {
      return $("<div/>")
        .attr("id", "sivElm" + this.id())
        .addClass("sivConditional")
        .append(super.createHtml(parent));
    }
  }

  /**
   * Provides an UI for Sieve conditions
   */
  class SieveConditionUI extends SieveSourceBoxUI {

    /**
     * @inheritdoc
     */
    constructor(elm) {
      super(elm);
      this.drag(new SieveMoveDragHandler());
    }

    /**
     * @inheritdoc
     */
    showSource() {
      super.showSource();

      $("#" + this.uniqueId + "-code").append($("<div/>")
        .addClass("material-icons")
        .addClass("sivSummaryControls")
        .append($("<span/>").text("code").click(
          (e) => { this.toggleView(); e.preventDefault(); e.stopPropagation(); return true; }))
        .append($("<span/>").text("edit").css({ "visibility": "hidden" })));
    }
    /**
     * @inheritdoc
     */
    createHtml(parent) {

      parent.addClass("sivCondition");
      parent.attr("id", "sivElm" + this.id());

      const elm = $("<div/>")
        .attr("id", this.uniqueId + "-summary");

      const children = this.getSieve().children();

      for (let i = 0; i < children.length; i++) {
        elm
          .append((new SieveDropBoxUI(this))
            .drop(new SieveConditionDropHandler(), children[i])
            .html()
            .addClass("sivConditionSpacer"));

        if (i === IS_FIRST_ITEM) {
          elm.append($("<div/>")
            .addClass("sivConditionText")
            .append($("<div/>")
              .css({"flex":"1 1 auto"})
              .text("IF"))
            .append($("<div/>")
              .addClass("material-icons")
              .addClass("sivSummaryControls")
              .append($("<span/>").text("code").click(
                (e) => { this.toggleView(); e.preventDefault(); e.stopPropagation(); return true; }))
              .append($("<span/>").text("edit").css({ "visibility": "hidden" }))));

        } else if (children[i].test)
          elm.append($("<div/>").text("ELSE IF").addClass("sivConditionText"));
        else
          elm.append($("<div/>").text("ELSE").addClass("sivConditionText"));

        elm.append(
          $("<div/>").append(children[i].html())
            .addClass("sivConditionChild"));
      }

      elm
        .append((new SieveDropBoxUI(this))
          .drop(new SieveConditionDropHandler())
          .html()
          .addClass("sivConditionSpacer"));

      parent.append(elm);

      parent.append($("<div/>")
        .append(elm)
        .addClass("sivSummaryContent")
        .attr("id", this.uniqueId + "-summary"));

      parent.append($("<div/>")
        .addClass("sivConditionCode")
        .attr("id", this.uniqueId + "-code")
        .hide());

      return parent;
    }
  }

  if (!SieveDesigner)
    throw new Error("Could not register Conditional Widgets");

  SieveDesigner.register("condition/if", SieveIfUI);
  SieveDesigner.register("condition/else", SieveElseUI);
  SieveDesigner.register("condition", SieveConditionUI);

})(window);
