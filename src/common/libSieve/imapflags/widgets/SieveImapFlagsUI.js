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

  /* global SieveDesigner */

  /* global SieveStringListWidget */

  /* global SieveActionDialogBoxUI */
  /* global SieveTestDialogBoxUI */

  /* global SieveComparatorWidget */
  /* global SieveMatchTypeWidget */

  /* global SieveOverlayItemWidget */

  /* global SieveTemplate */

  /**
   * Provides an abstract UI for the flags actions.
   */
  class SieveAbstractFlagUI extends SieveActionDialogBoxUI {

    /**
     * Gets the currently set flags.
     *
     * @returns {SieveAbstractElement}
     *   the element's flags
     */
    flags() {
      return this.getSieve().getElement("flags");
    }

    /**
     * @inheritdoc
     */
    onSave() {

      (new SieveStringListWidget("#sivFlagKeywordList"))
        .save(this.flags());
      return true;
    }

    /**
     * @inheritdoc
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
     * @inheritdoc
     */
    getTemplate() {
      return "./imapflags/templates/SieveSetFlagActionUI.html";
    }

    /**
     * @inheritdoc
     */
    getSummary() {
      const FRAGMENT =
        `<div>
          <span data-i18n="setflag.summary"></span>
          <em class="sivSetflagFlags"></em>
         </div>`;

      const elm = (new SieveTemplate()).convert(FRAGMENT);
      elm.querySelector(".sivSetflagFlags").textContent = this.flags().values().join(", ");
      return elm;
    }
  }

  /**
   * Provides an UI for the add flag action
   */
  class SieveAddFlagUI extends SieveAbstractFlagUI {

    /**
     * @inheritdoc
     */
    getTemplate() {
      return "./imapflags/templates/SieveAddFlagActionUI.html";
    }

    /**
     * @inheritdoc
     */
    getSummary() {
      const FRAGMENT =
        `<div>
           <span data-i18n="addflag.summary"></span>
           <em class="sivAddflagFlags"></em>
         </div>`;

      const elm = (new SieveTemplate()).convert(FRAGMENT);
      elm.querySelector(".sivAddflagFlags").textContent = this.flags().values().join(", ");
      return elm;
    }
  }


  /**
   * Provides an UI for the remove flag action
   */
  class SieveRemoveFlagUI extends SieveAbstractFlagUI {

    /**
     * @inheritdoc
     */
    getTemplate() {
      return "./imapflags/templates/SieveRemoveFlagActionUI.html";
    }

    /**
     * @inheritdoc
     */
    getSummary() {
      const FRAGMENT =
        `<div>
           <span data-i18n="removeflag.summary"></span>
           <em class="sivRemoveflagFlags"></em>
         </div>`;

      const elm = (new SieveTemplate()).convert(FRAGMENT);
      elm.querySelector(".sivRemoveflagFlags").textContent = this.flags().values().join(", ");
      return elm;
    }
  }


  /**
   * Provides a UI for the has flag test
   **/
  class SieveHasFlagUI extends SieveTestDialogBoxUI {

    /**
     * Gets the current match type
     *
     * @returns {SieveAbstractElement}
     *   the element's match type
     */
    matchtype() {
      return this.getSieve().getElement("match-type");
    }

    /**
     * Gets te current operator
     *
     * @returns {SieveAbstractElement}
     *   the element's comparator
     */
    comparator() {
      return this.getSieve().getElement("comparator");
    }

    /**
     * The currently set imap flags
     *
     * @returns {SieveAbstractElement}
     *   the element's flags
     */
    flags() {
      return this.getSieve().getElement("flags");
    }

    /**
     * @inheritdoc
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
     * @inheritdoc
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
     * @inheritdoc
     */
    getTemplate() {
      return "./imapflags/templates/SieveHasFlagTestUI.html";
    }

    /**
     * @inheritdoc
     */
    getSummary() {
      const FRAGMENT =
        `<div>
         <span data-i18n="hasflag.summary"></span>
         <em class="sivHasflagFlags"></em>
       </div>`;

      const elm = (new SieveTemplate()).convert(FRAGMENT);
      elm.querySelector(".sivHasflagFlags").textContent = this.flags().values().join(", ");
      return elm;
    }
  }

  /**
   * Implements the create overlay for the fileinto action.
   */
  class SieveFlagsTagWidget extends SieveOverlayItemWidget {

    /**
     * @inheritdoc
     */
    static nodeType() {
      return "action/fileinto/";
    }
    /**
     * @inheritdoc
     */
    static nodeName() {
      return "action/fileinto/flags";
    }

    /**
     * @inheritdoc
     */
    static isCapable(capabilities) {
      return capabilities.hasCapability("imap4flags");
    }

    /**
     * @inheritdoc
     **/
    getTemplate() {
      return "./imapflags/templates/SieveFlagsTag.html";
    }

    /**
     * @inheritdoc
     */
    load(sivElement) {

      if (sivElement.enable("flags"))
        document.querySelector("#sivFlagsCheckbox").checked = true;

      (new SieveStringListWidget("#sivFlagKeyList"))
        .init(sivElement.getElement("flags").getElement("flags"));
    }

    /**
     * @inheritdoc
     */
    save(sivElement) {
      if (document.querySelector("#sivFlagsCheckbox").checked) {
        sivElement.enable("flags", true);
        (new SieveStringListWidget("#sivFlagKeyList"))
          .save(sivElement.getElement("flags").getElement("flags"));
      } else
        sivElement.enable("flags", false);
    }

  }

  if (!SieveDesigner)
    throw new Error("Could not register IMAP Flags Widgets");

  SieveDesigner.register("action/setflag", SieveSetFlagUI);
  SieveDesigner.register("action/addflag", SieveAddFlagUI);
  SieveDesigner.register("action/removeflag", SieveRemoveFlagUI);

  SieveDesigner.register("test/hasflag", SieveHasFlagUI);

  SieveDesigner.register2(SieveFlagsTagWidget);

})(window);
