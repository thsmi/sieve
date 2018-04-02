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
  /* global SieveBlockUI */
  /* global SieveAbstractBoxUI */
  /* global SieveMoveDragHandler */
  /* global SieveDropBoxUI */
  /* global SieveConditionDropHandler */

  const IS_FIRST_ITEM = 0;

  /**
   * Provides a UI for the if statement
   */
  class SieveIfUI extends SieveBlockUI {

    /**
     * @inheritDoc
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
     * @inheritDoc
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
  class SieveConditionUI extends SieveAbstractBoxUI {

    /**
     * @inheritDoc
     */
    constructor(elm) {
      super(elm);
      this.drag(new SieveMoveDragHandler());
    }

    /**
     * @inheritDoc
     */
    createHtml(parent) {
      let elm = $("<div/>")
        .attr("id", "sivElm" + this.id())
        .addClass("sivCondition");

      let children = this.getSieve().children();

      for (let i = 0; i < children.length; i++) {
        elm
          .append((new SieveDropBoxUI(this))
            .drop(new SieveConditionDropHandler(), children[i])
            .html()
            .addClass("sivConditionSpacer"));

        if (i === IS_FIRST_ITEM)
          elm.append($("<div/>").text("IF").addClass("sivConditionText"));
        else if (children[i].test)
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

      return elm;
    }
  }

  if (!SieveDesigner)
    throw new Error("Could not register Conditional Widgets");

  SieveDesigner.register("condition/if", SieveIfUI);
  SieveDesigner.register("condition/else", SieveElseUI);
  SieveDesigner.register("condition", SieveConditionUI);

})(window);
