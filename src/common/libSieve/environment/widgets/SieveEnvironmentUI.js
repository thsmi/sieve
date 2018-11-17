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
  /* global SieveMatchTypeWidget */
  /* global SieveComparatorWidget */
  /* global SieveStringListWidget */
  /* global SieveStringWidget */
  /* global SieveDesigner */

  /**
   * Provides a ui for the virus test
   */
  class SieveEnvironmentUI extends SieveTestDialogBoxUI {

    /**
     * @returns {SieveString}
     *   the element's name
     */
    name() {
      return this.getSieve().getElement("name");
    }

    /**
     * @returns {SieveString}
     *   the element's keys
     */
    keys() {
      return this.getSieve().getElement("keys");
    }

    /**
     * @returns {SieveAbstractElement}
     *   the element's matchtype
     */
    matchtype() {
      return this.getSieve().getElement("match-type");
    }

    /**
     * @returns {SieveAbstractElement}
     *   the element's comparator
     */
    comparator() {
      return this.getSieve().getElement("comparator");
    }

    /**
     * @inheritDoc
     */
    getTemplate() {
      return "./environment/templates/SieveEnvironmentUI.html";
    }

    /**
     * @inheritDoc
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
     * @inheritDoc
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
     * @inheritDoc
     */
    getSummary() {
      return $("<div/>")
        .append($("<span/>").text("Environment info named "))
        .append($("<em/>").text(this.name().value()))
        .append($("<span/>").text(" " + this.matchtype().getValue()))
        .append($("<em/>").text(" " + this.keys().values().join(", ")));
    }
  }


  if (!SieveDesigner)
    throw new Error("Could not register Spamtest Extension");

  SieveDesigner.register("test/environment", SieveEnvironmentUI);

})(window);
