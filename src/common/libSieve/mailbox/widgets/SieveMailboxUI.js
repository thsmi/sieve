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

  /* global SieveTestDialogBoxUI */
  /* global SieveStringListWidget */
  /* global SieveDesigner */
  /* global SieveMatchTypeWidget */
  /* global SieveComparatorWidget */
  /* global SieveOverlayItemWidget */
  /* global SieveTemplate */

  /**
   * Provides a UI for the Mailbox exists test
   */
  class SieveMailboxExistsTestUI extends SieveTestDialogBoxUI {

    /**
     * The mail box names which should be tested for existence.
     *
     * @returns {SieveAbstractElement}
     *   the element's mailbox field
     */
    mailboxes() {
      return this.getSieve().getElement("mailboxes");
    }

    /**
     * @inheritdoc
     */
    getTemplate() {
      return "./mailbox/templates/SieveMailboxExistsTest.html";
    }

    /**
     * @inheritdoc
     */
    onLoad() {

      (new SieveStringListWidget("#sivMailboxNamesList"))
        .init(this.mailboxes());
    }

    /**
     * @inheritdoc
     */
    onSave() {
      (new SieveStringListWidget("#sivMailboxNamesList"))
        .save(this.mailboxes());

      return true;
    }

    /**
     * @inheritdoc
     */
    getSummary() {
      const FRAGMENT =
        `<div>
           <span data-i18n="mailboxexists.summary1"></span>
           <em class="sivMailboxExistsMailboxes"></em>
           <span data-i18n="mailboxexists.summary2"></span>
         </div>`;

      const elm = (new SieveTemplate()).convert(FRAGMENT);
      elm.querySelector(".sivMailboxExistsMailboxes").textContent
        = this.mailboxes().values();

      return elm;
    }
  }


  /**
   * Provides a UI for the SieveMetaDataExistsUI
   */
  class SieveMetaDataExistsTestUI extends SieveTestDialogBoxUI {

    /**
     * Gets and sets the mailbox name
     *
     * @param {string} [value]
     *   the mailbox name, if omitted the name is unchanged.
     *
     * @returns {string}
     *   the mailbox name.
     */
    mailbox(value) {
      return this.getSieve().getElement("mailbox").value(value);
    }

    /**
     * The annotations which should be checked for extistence.
     *
     * @returns {SieveAbstractElement}
     *   the element's annotations field
     */
    annotations() {
      return this.getSieve().getElement("annotations");
    }

    /**
     * @inheritdoc
     */
    onLoad() {

      document.querySelector("#sivMailboxName").value = this.mailbox();

      (new SieveStringListWidget("#sivMailboxAnnotationsList"))
        .init(this.annotations());
    }

    /**
     * @inheritdoc
     */
    onSave() {

      this.mailbox(document.querySelector("#sivMailboxName").value);
      (new SieveStringListWidget("#sivMailboxAnnotationsList"))
        .save(this.annotations());


      return true;
    }

    /**
     * @inheritdoc
     */
    getTemplate() {
      return "./mailbox/templates/SieveMetaDataExistsTest.html";
    }

    /**
     * @inheritdoc
     */
    getSummary() {

      const FRAGMENT =
        `<div>
           <span data-i18n="metadataexists.summary1"></span>
           <em class="sivMetaDataExistsMailbox"></em>
           <span data-i18n="metadataexists.summary2"></span>
           <em class="sivMetaDataExistsAnnotations"></em>
         </div>`;

      const elm = (new SieveTemplate()).convert(FRAGMENT);
      elm.querySelector(".sivMetaDataExistsMailbox").textContent
        = this.mailbox();
      elm.querySelector(".sivMetaDataExistsAnnotations").textContent
        = this.annotations().values();

      return elm;
    }
  }

  /**
   * Provides a UI for the ServerMetaData Test
   */
  class SieveMetaDataTestUI extends SieveTestDialogBoxUI {

    /**
     * Gets and sets the mailbox name
     *
     * @param {string} [value]
     *   the mailbox name, if omitted the name is unchanged.
     *
     * @returns {string}
     *   the mailbox name.
     */
    mailbox(value) {
      return this.getSieve().getElement("mailbox").value(value);
    }

    /**
     * Gets and/or sets the annotation name
     *
     * @param {string} [value]
     *   if set updates the annotation name.
     *
     * @returns {string}
     *   the currently set annotation name.
     */
    annotation(value) {
      return this.getSieve().getElement("annotation").value(value);
    }

    /**
     * Gets the keys
     *
     * @returns {SieveAbstractElement}
     *   the element's key fields
     */
    keys() {
      return this.getSieve().getElement("keys");
    }

    /**
     * Gets the match type.
     *
     * @returns {SieveAbstractElement}
     *   the element's matchtype field
     */
    matchtype() {
      return this.getSieve().getElement("match-type");
    }

    /**
     * Gets the comparator type.
     *
     * @returns {SieveAbstractElement}
     *   the element's comparator field
     */
    comparator() {
      return this.getSieve().getElement("comparator");
    }

    /**
     * @inheritdoc
     */
    onLoad() {

      document.querySelector("#sivMailboxName").value = this.mailbox();
      document.querySelector("#sivAnnotationName").value = this.annotation();

      (new SieveStringListWidget("#sivMailboxKeys"))
        .init(this.keys());

      (new SieveMatchTypeWidget("#sivMailboxMatchTypes"))
        .init(this.matchtype());
      (new SieveComparatorWidget("#sivMailboxComparator"))
        .init(this.comparator());
    }

    /**
     * @inheritdoc
     */
    onSave() {

      this.mailbox(document.querySelector("#sivMailboxName").value);

      this.annotation(document.querySelector("#sivAnnotationName").value);

      (new SieveStringListWidget("#sivMailboxKeys"))
        .save(this.keys());

      (new SieveMatchTypeWidget("#sivMailboxMatchTypes"))
        .save(this.matchtype());
      (new SieveComparatorWidget("#sivMailboxComparator"))
        .save(this.comparator());

      return true;
    }

    /**
     * @inheritdoc
     */
    getTemplate() {
      return "./mailbox/templates/SieveMetaDataTest.html";
    }

    /**
     * @inheritdoc
     */
    getSummary() {

      const FRAGMENT =
        `<div>
             <span data-i18n="metadata.summary1"></span>
             <em class="sivMetaDataAnnotation"></em>
             <span data-i18n="metadata.summary2"></span>
             <em class="sivMetaDataMailbox"></em>
             <span data-i18n="metadata.summary3"></span>
             <em class="sivMetaDataMatchType"></em>
             <span data-i18n="metadata.summary4"></span>
             <em class="sivMetaDataKeys"></em>
           </div>`;

      const elm = (new SieveTemplate()).convert(FRAGMENT);
      elm.querySelector(".sivMetaDataAnnotation").textContent
        = this.annotation();
      elm.querySelector(".sivMetaDataMailbox").textContent
        = this.mailbox();
      elm.querySelector(".sivMetaDataMatchType").textContent
        = this.matchtype().getElement().toScript();
      elm.querySelector(".sivMetaDataKeys").textContent
        = this.keys().values();

      return elm;
    }
  }

  /**
   * Provides a UI for the ServerMetaDataExists Test
   */
  class SieveServerMetaDataExistsTestUI extends SieveTestDialogBoxUI {

    /**
     * Gets the annotations which are checked for existence.
     *
     * @returns {SieveAbstractElement}
     *   the element's annotations
     */
    annotations() {
      return this.getSieve().getElement("annotations");
    }

    /**
     * @inheritdoc
     */
    onLoad() {

      (new SieveStringListWidget("#sivMailboxAnnotationsList"))
        .init(this.annotations());
    }

    /**
     * @inheritdoc
     */
    onSave() {
      (new SieveStringListWidget("#sivMailboxAnnotationsList"))
        .save(this.annotations());
      return true;
    }

    /**
     * @inheritdoc
     */
    getTemplate() {
      return "./mailbox/templates/SieveServerMetaDataExistsTest.html";
    }

    /**
     * @inheritdoc
     */
    getSummary() {
      const FRAGMENT =
        `<div>
           <span data-i18n="servermetadataexists.summary"></span>
           <em class="sivServerMetaDataExistsAnnotations"></em>
         </div>`;

      const elm = (new SieveTemplate()).convert(FRAGMENT);
      elm.querySelector(".sivServerMetaDataExistsAnnotations").textContent
        = this.annotations().values();

      return elm;
    }
  }

  /**
   * Provides an UI for the ServerMetaData test
   */
  class SieveServerMetaDataTestUI extends SieveTestDialogBoxUI {

    /**
     * Gets and/or sets the annotation name
     *
     * @param {string} [value]
     *   if set updates the annotation name.
     *
     * @returns {string}
     *   the currently set annotation name.
     */
    annotation(value) {
      return this.getSieve().getElement("annotation").value(value);
    }

    /**
     * The keys which are compared.
     *
     * @returns {SieveAbstractElement}
     *   the element's key fields
     */
    keys() {
      return this.getSieve().getElement("keys");
    }

    /**
     * Gets the match type.
     *
     * @returns {SieveAbstractElement}
     *   the element's matchtype field
     */
    matchtype() {
      return this.getSieve().getElement("match-type");
    }

    /**
     * Gets the comparator type.
     *
     * @returns {SieveAbstractElement}
     *   the element's comparator field
     */
    comparator() {
      return this.getSieve().getElement("comparator");
    }

    /**
     * @inheritdoc
     */
    onLoad() {

      document.querySelector("#sivAnnotationName").value = this.annotation();

      (new SieveStringListWidget("#sivMailboxKeys"))
        .init(this.keys());

      (new SieveMatchTypeWidget("#sivMailboxMatchTypes"))
        .init(this.matchtype());
      (new SieveComparatorWidget("#sivMailboxComparator"))
        .init(this.comparator());
    }

    /**
     * @inheritdoc
     */
    onSave() {

      this.annotation(document.querySelector("#sivAnnotationName").value);

      (new SieveStringListWidget("#sivMailboxKeys"))
        .save(this.keys());

      (new SieveMatchTypeWidget("#sivMailboxMatchTypes"))
        .save(this.matchtype());
      (new SieveComparatorWidget("#sivMailboxComparator"))
        .save(this.comparator());

      return true;
    }

    /**
     * @inheritdoc
     */
    getTemplate() {
      return "./mailbox/templates/SieveServerMetaDataTest.html";
    }

    /**
     * @inheritdoc
     */
    getSummary() {
      const FRAGMENT =
        `<div>
             <span data-i18n="servermetadata.summary1"></span>
             <em class="sivServerMetaDataAnnotation"></em>
             <span data-i18n="servermetadata.summary2"></span>
             <em class="sivServerMetaDataMatchType"></em>
             <span data-i18n="servermetadata.summary3"></span>
             <em class="sivServerMetaDataKeys"></em>
           </div>`;

      const elm = (new SieveTemplate()).convert(FRAGMENT);
      elm.querySelector(".sivServerMetaDataAnnotation").textContent
        = this.annotation();
      elm.querySelector(".sivServerMetaDataMatchType").textContent
        = this.matchtype().getElement().toScript();
      elm.querySelector(".sivServerMetaDataKeys").textContent
        = this.keys().values();

      return elm;
    }
  }

  /**
   * Implements the create overlay for the fileinto action.
   */
  class SieveMailboxCreateWidget extends SieveOverlayItemWidget {

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
      return "action/fileinto/create";
    }

    /**
     * @inheritdoc
     */
    static isCapable(capabilities) {
      return capabilities.hasCapability("mailbox");
    }

    /**
     * @inheritdoc
     **/
    getTemplate() {
      return "./mailbox/templates/SieveCreateTag.html";
    }

    /**
     * @inheritdoc
     */
    load(sivElement) {
      if (sivElement.enable("create"))
        document.querySelector("#sivMailboxCreateCheckbox").checked = true;
    }

    /**
     * @inheritdoc
     */
    save(sivElement) {
      if (document.querySelector("#sivMailboxCreateCheckbox").checked)
        sivElement.enable("create", true);
      else
        sivElement.enable("create", false);
    }

  }

  if (!SieveDesigner)
    throw new Error("Could not register Mailbox Extension");

  SieveDesigner.register("test/mailboxexists", SieveMailboxExistsTestUI);
  SieveDesigner.register("test/metadataexists", SieveMetaDataExistsTestUI);
  SieveDesigner.register("test/metadata", SieveMetaDataTestUI);
  SieveDesigner.register("test/servermetadataexists", SieveServerMetaDataExistsTestUI);
  SieveDesigner.register("test/servermetadata", SieveServerMetaDataTestUI);

  SieveDesigner.register2(SieveMailboxCreateWidget);

})(window);
