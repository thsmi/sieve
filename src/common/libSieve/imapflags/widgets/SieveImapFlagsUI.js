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
  /* global SieveActionDialogBoxUI */

  /* global SieveStringListWidget */

  /* global SieveActionDialogBoxUI */
  /* global SieveTestDialogBoxUI */

  /* global SieveComparatorWidget */
  /* global SieveMatchTypeWidget */

  /**
   * Provides an abstract UI for the flags actions.
   */
  class SieveAbstractFlagUI extends SieveActionDialogBoxUI {

    /**
     * @returns {SieveAbstractElement}
     *   the element's flags
     */
    flags() {
      return this.getSieve().getElement("flags");
    }

    /**
     * @inheritDoc
     */
    onSave() {

      (new SieveStringListWidget("#sivFlagKeywordList"))
        .save(this.flags());
      return true;
    }

    /**
     * @inheritDoc
     */
    onLoad() {

      (new SieveStringListWidget("#sivFlagKeywordList"))
        .init(this.flags());
    }
  }

  /**
   * Provides an UI for the set flag action
   */
  class SieveSetFlagUI extends SieveAbstractFlagUI {

    /**
     * @inheritDoc
     */
    getTemplate() {
      return "./imapflags/templates/SieveSetFlagActionUI.html";
    }

    /**
     * @inheritDoc
     */
    getSummary() {
      return $("<div/>")
        .html("Set IMAP flag(s) "
          + $('<em/>').text(" " + this.flags().values().join(", ")).prop('outerHTML'));
    }
  }

  /**
   * Provides an UI for the add flag action
   */
  class SieveAddFlagUI extends SieveAbstractFlagUI {

    /**
     * @inheritDoc
     */
    getTemplate() {
      return "./imapflags/templates/SieveAddFlagActionUI.html";
    }

    /**
     * @inheritDoc
     */
    getSummary() {
      return $("<div/>")
        .html("Add IMAP flag(s) "
          + $('<em/>').text(" " + this.flags().values().join(", ")).prop('outerHTML'));
    }
  }


  /**
   * Provides an UI for the remove flag action
   */
  class SieveRemoveFlagUI extends SieveAbstractFlagUI {

    /**
     * @inheritDoc
     */
    getTemplate() {
      return "./imapflags/templates/SieveRemoveFlagActionUI.html";
    }

    /**
     * @inheritDoc
     */
    getSummary() {
      return $("<div/>")
        .html("Remove IMAP flag(s) "
          + $('<em/>').text(" " + this.flags().values().join(", ")).prop('outerHTML'));
    }
  }


  /**
   * Provides a UI for the has flag test
   **/
  class SieveHasFlagUI extends SieveTestDialogBoxUI {

    /**
     * @returns {SieveAbstractElement}
     *   the element's match type
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
     * @returns {SieveAbstractElement}
     *   the element's flags
     */
    flags() {
      return this.getSieve().getElement("flags");
    }

    /**
     * @inheritDoc
     */
    onLoad() {

      (new SieveMatchTypeWidget("#sivHasFlagMatchTypes"))
        .init(this.matchtype());

      (new SieveComparatorWidget("#sivHasFlagComparator"))
        .init(this.comparator());

      (new SieveStringListWidget("#sivHasFlagKeyList"))
        .init(this.flags());

    }

    /**
     * @inheritDoc
     */
    onSave() {

      (new SieveMatchTypeWidget("#sivHasFlagMatchTypes"))
        .save(this.matchtype());

      (new SieveComparatorWidget("#sivHasFlagComparator"))
        .save(this.comparator());

      (new SieveStringListWidget("#sivHasFlagKeyList"))
        .save(this.flags());
      return true;
    }

    /**
     * @inheritDoc
     */
    getTemplate() {
      return "./imapflags/templates/SieveHasFlagTestUI.html";
    }

    /**
     * @inheritDoc
     */
    getSummary() {

      // case- insensitive is the default so skip it...
      return $("<div/>")
        .html("An IMAP flags(s) <em> "
          + this.matchtype().getValue() + " "
          + $('<div/>').text(this.flags().values()).html() + "</em>");
    }
  }

  if (!SieveDesigner)
    throw new Error("Could not register IMAP Flags Widgets");

  SieveDesigner.register("action/setflag", SieveSetFlagUI);
  SieveDesigner.register("action/addflag", SieveAddFlagUI);
  SieveDesigner.register("action/removeflag", SieveRemoveFlagUI);

  SieveDesigner.register("test/hasflag", SieveHasFlagUI);

})(window);
