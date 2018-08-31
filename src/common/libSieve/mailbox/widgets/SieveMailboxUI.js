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
  /* global SieveStringListWidget */
  /* global SieveDesigner */
  /* global SieveMatchTypeWidget */
  /* global SieveComparatorWidget */

  /**
   * Provides a UI for the Mailbox exists test
   */
  class SieveMailboxExistsTestUI extends SieveTestDialogBoxUI {

    /**
     * @returns {SieveAbstractElement}
     *   the element's mailbox field
     */
    mailboxes() {
      return this.getSieve().getElement("mailboxes");
    }

    /**
     * @inheritDoc
     */
    getTemplate() {
      return "./mailbox/templates/SieveMailboxExistsTest.html";
    }

    /**
     * @inheritDoc
     */
    onLoad() {

      (new SieveStringListWidget("#sivMailboxNamesList"))
        .init(this.mailboxes());
    }

    /**
     * @inheritDoc
     */
    onSave() {
      (new SieveStringListWidget("#sivMailboxNamesList"))
        .save(this.mailboxes());

      return true;
    }

    /**
     * @inheritDoc
     */
    getSummary() {
      // case- insensitive is the default so skip it...
      return $("<div/>")
        .html(" Mailbox(es) "
          + $('<em/>').text(this.mailboxes().values()).html() + " exist");
    }
  }


  /**
   * Provides a UI for the SieveMetaDataExistsUI
   */
  class SieveMetaDataExistsTestUI extends SieveTestDialogBoxUI {

    /**
     * Gets and sets the mailbox name
     *
     * @param {String} [value]
     *   the mailbox name, if omitted the name is unchanges.
     *
     * @return {String}
     *   the mailbox name.
     */
    mailbox(value) {
      return this.getSieve().getElement("mailbox").value(value);
    }

    /**
     * @returns {SieveAbstractElement}
     *   the element's annotations field
     */
    annotations() {
      return this.getSieve().getElement("annotations");
    }

    /**
     * @inheritDoc
     */
    onLoad() {

      $("#sivMailboxName").val(this.mailbox());

      (new SieveStringListWidget("#sivMailboxAnnotationsList"))
        .init(this.annotations());
    }

    /**
     * @inheritDoc
     */
    onSave() {

      this.mailbox($("#sivMailboxName").val());
      (new SieveStringListWidget("#sivMailboxAnnotationsList"))
        .save(this.annotations());


      return true;
    }

    /**
     * @inheritDoc
     */
    getTemplate() {
      return "./mailbox/templates/SieveMetaDataExistsTest.html";
    }

    /**
     * @inheritDoc
     */
    getSummary() {

      // case- insensitive is the default so skip it...
      return $("<div/>")
        .html(" Mailbox " + $('<em/>').text(this.mailbox()).html()
          + " has all annotations "
          + $('<em/>').text(this.annotations().values()).html());
    }
  }

  /**
   * Provides a UI for the ServerMetaData Test
   */
  class SieveMetaDataTestUI extends SieveTestDialogBoxUI {

    /**
     * Gets and sets the mailbox name
     *
     * @param {String} [value]
     *   the mailbox name, if omitted the name is unchanges.
     *
     * @return {String}
     *   the mailbox name.
     */
    mailbox(value) {
      return this.getSieve().getElement("mailbox").value(value);
    }

    annotation(value) {
      return this.getSieve().getElement("annotation").value(value);
    }

    /**
     * @returns {SieveAbstractElement}
     *   the element's key fields
     */
    keys() {
      return this.getSieve().getElement("keys");
    }

    /**
     * @returns {SieveAbstractElement}
     *   the element's matchtype field
     */
    matchtype() {
      return this.getSieve().getElement("match-type");
    }

    /**
     * @returns {SieveAbstractElement}
     *   the element's comparator field
     */
    comparator() {
      return this.getSieve().getElement("comparator");
    }

    /**
     * @inheritDoc
     */
    onLoad() {

      $("#sivMailboxName").val(this.mailbox());
      $("#sivAnnotationName").val(this.annotation());

      (new SieveStringListWidget("#sivMailboxKeys"))
        .init(this.keys());

      (new SieveMatchTypeWidget("#sivMailboxMatchTypes"))
        .init(this.matchtype());
      (new SieveComparatorWidget("#sivMailboxComparator"))
        .init(this.comparator());
    }

    /**
     * @inheritDoc
     */
    onSave() {

      this.mailbox($("#sivMailboxName").val());

      this.annotation($("#sivAnnotationName").val());

      (new SieveStringListWidget("#sivMailboxKeys"))
        .save(this.keys());

      (new SieveMatchTypeWidget("#sivMailboxMatchTypes"))
        .save(this.matchtype());
      (new SieveComparatorWidget("#sivMailboxComparator"))
        .save(this.comparator());

      return true;
    }

    /**
     * @inheritDoc
     */
    getTemplate() {
      return "./mailbox/templates/SieveMetaDataTest.html";
    }

    /**
     * @inheritDoc
     */
    getSummary() {
      // case- insensitive is the default so skip it...
      return $("<div/>")
        .html("Annotation " + this.annotation()
          + " in folder " + this.mailbox()
          + " has a value which " + this.matchtype().getValue()
          + " any of " + this.keys().values());
    }
  }

  /**
   * Provides a UI for the ServerMetaDataExists Test
   */
  class SieveServerMetaDataExistsTestUI extends SieveTestDialogBoxUI {

    /**
     * @returns {SieveAbstractElement}
     *   the element's annotations
     */
    annotations() {
      return this.getSieve().getElement("annotations");
    }

    /**
     * @inheritDoc
     */
    onLoad() {

      (new SieveStringListWidget("#sivMailboxAnnotationsList"))
        .init(this.annotations());
    }

    /**
     * @inheritDoc
     */
    onSave() {
      (new SieveStringListWidget("#sivMailboxAnnotationsList"))
        .save(this.annotations());
      return true;
    }

    /**
     * @inheritDoc
     */
    getTemplate() {
      return "./mailbox/templates/SieveServerMetaDataExistsTest.html";
    }

    /**
     * @inheritDoc
     */
    getSummary() {
      // case- insensitive is the default so skip it...
      return $("<div/>")
        .html(" The server supports all annotations "
          + $('<em/>').text(this.annotations().values()).html());
    }
  }

  /**
   * Provides an UI for the ServerMetaData test
   */
  class SieveServerMetaDataTestUI extends SieveTestDialogBoxUI {

    annotation(value) {
      return this.getSieve().getElement("annotation").value(value);
    }

    /**
     * @returns {SieveAbstractElement}
     *   the element's key fields
     */
    keys() {
      return this.getSieve().getElement("keys");
    }

    /**
     * @returns {SieveAbstractElement}
     *   the element's matchtype fields
     */
    matchtype() {
      return this.getSieve().getElement("match-type");
    }

    /**
     * @returns {SieveAbstractElement}
     *   the element's comparator fields
     */
    comparator() {
      return this.getSieve().getElement("comparator");
    }

    /**
     * @inheritDoc
     */
    onLoad() {

      $("#sivAnnotationName").val(this.annotation());

      (new SieveStringListWidget("#sivMailboxKeys"))
        .init(this.keys());

      (new SieveMatchTypeWidget("#sivMailboxMatchTypes"))
        .init(this.matchtype());
      (new SieveComparatorWidget("#sivMailboxComparator"))
        .init(this.comparator());
    }

    /**
     * @inheritDoc
     */
    onSave() {

      this.annotation($("#sivAnnotationName").val());

      (new SieveStringListWidget("#sivMailboxKeys"))
        .save(this.keys());

      (new SieveMatchTypeWidget("#sivMailboxMatchTypes"))
        .save(this.matchtype());
      (new SieveComparatorWidget("#sivMailboxComparator"))
        .save(this.comparator());

      return true;
    }

    /**
     * @inheritDoc
     */
    getTemplate() {
      return "./mailbox/templates/SieveServerMetaDataTest.html";
    }

    /**
     * @inheritDoc
     */
    getSummary() {
      // case- insensitive is the default so skip it...
      return $("<div/>")
        .html("Server annotation " + this.annotation()
          + " has a value which " + this.matchtype().getValue()
          + " any of " + this.keys().values());
    }
  }


  if (!SieveDesigner)
    throw new Error("Could not register Mailbox Extension");

  SieveDesigner.register("test/mailboxexists", SieveMailboxExistsTestUI);
  SieveDesigner.register("test/metadataexists", SieveMetaDataExistsTestUI);
  SieveDesigner.register("test/metadata", SieveMetaDataTestUI);
  SieveDesigner.register("test/servermetadataexists", SieveServerMetaDataExistsTestUI);
  SieveDesigner.register("test/servermetadata", SieveServerMetaDataTestUI);

})(window);
