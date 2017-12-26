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

"use strict";

(function (exports) {

  /* global $: false */
  /* global SieveTestDialogBoxUI */
  /* global SieveTabWidget */
  /* global SieveStringListWidget */
  /* global SieveDesigner */
  /* global SieveMatchTypeUI */
  /* global SieveComparatorUI */

  function SieveMailboxExistsTestUI(elm) {
    SieveTestDialogBoxUI.call(this, elm);
  }

  SieveMailboxExistsTestUI.prototype = Object.create(SieveTestDialogBoxUI.prototype);
  SieveMailboxExistsTestUI.prototype.constructor = SieveMailboxExistsTestUI;


  SieveMailboxExistsTestUI.prototype.onLoad
    = function () {

      (new SieveTabWidget()).init();

      (new SieveStringListWidget("#sivMailboxNamesList"))
        .init()
        .values(this.getSieve().mailboxes());
    };

  SieveMailboxExistsTestUI.prototype.onSave
    = function () {

      this.getSieve()
        .mailboxes()
        .clear()
        .append((new SieveStringListWidget("#sivMailboxNamesList")).values());

      return true;
    };

  SieveMailboxExistsTestUI.prototype.getTemplate
    = function () {
      return "./mailbox/widgets/SieveMailboxExistsTest.html";
    };

  SieveMailboxExistsTestUI.prototype.getSummary
    = function () {
      // case- insensitive is the default so skip it...
      return $("<div/>")
        .html(" Mailbox(es) "
        + $('<em/>').text(this.getSieve().mailboxes().toScript()).html() + " exist");
    };

  // ****************************************************************************

  function SieveMailboxMetaDataExistsTestUI(elm) {
    SieveTestDialogBoxUI.call(this, elm);
  }

  SieveMailboxMetaDataExistsTestUI.prototype = Object.create(SieveTestDialogBoxUI.prototype);
  SieveMailboxMetaDataExistsTestUI.prototype.constructor = SieveMailboxMetaDataExistsTestUI;


  SieveMailboxMetaDataExistsTestUI.prototype.onLoad
    = function () {

      (new SieveTabWidget()).init();

      $("#sivMailboxName").val(this.getSieve().mailbox());

      (new SieveStringListWidget("#sivMailboxAnnotationsList"))
        .init()
        .values(this.getSieve().annotations());
    };

  SieveMailboxMetaDataExistsTestUI.prototype.onSave
    = function () {

      this.getSieve()
        .mailbox($("#sivMailboxName").val());

      this.getSieve()
        .annotations()
        .clear()
        .append((new SieveStringListWidget("#sivMailboxAnnotationsList")).values());

      return true;
    };

  SieveMailboxMetaDataExistsTestUI.prototype.getTemplate
    = function () {
      return "./mailbox/widgets/SieveMetaDataExistsTest.html";
    };

  SieveMailboxMetaDataExistsTestUI.prototype.getSummary
    = function () {
      // case- insensitive is the default so skip it...
      return $("<div/>")
        .html(" Mailbox " + $('<em/>').text(this.getSieve().mailbox()).html()
        + " has all annotations "
        + $('<em/>').text(this.getSieve().annotations().toScript()).html());
    };

  // ****************************************************************************

  function SieveMailboxMetaDataTestUI(elm) {
    SieveTestDialogBoxUI.call(this, elm);
  }

  SieveMailboxMetaDataTestUI.prototype = Object.create(SieveTestDialogBoxUI.prototype);
  SieveMailboxMetaDataTestUI.prototype.constructor = SieveMailboxMetaDataTestUI;


  SieveMailboxMetaDataTestUI.prototype.onLoad
    = function () {

      (new SieveTabWidget()).init();

      $("#sivMailboxName").val(this.getSieve().mailbox());

      $("#sivAnnotationName").val(this.getSieve().annotation());

      (new SieveStringListWidget("#sivMailboxKeys"))
        .init()
        .values(this.getSieve().keys());

      let matchType = new SieveMatchTypeUI(this.getSieve().matchType());
      $("#sivMailboxMatchTypes")
        .append(matchType.html());

      let comparator = new SieveComparatorUI(this.getSieve().comparator());
      $("#sivMailboxComparator")
        .append(comparator.html());
    };

  SieveMailboxMetaDataTestUI.prototype.onSave
    = function () {

      this.getSieve()
        .mailbox($("#sivMailboxName").val());

      this.getSieve()
        .annotation($("#sivAnnotationName").val());

      this.getSieve()
        .keys()
        .clear()
        .append((new SieveStringListWidget("#sivMailboxKeys")).values());

      return true;
    };

  SieveMailboxMetaDataTestUI.prototype.getTemplate
    = function () {
      return "./mailbox/widgets/SieveMetaDataTest.html";
    };

  SieveMailboxMetaDataTestUI.prototype.getSummary
    = function () {
      // case- insensitive is the default so skip it...
      return $("<div/>")
        .html("Annotation " + this.getSieve().annotation()
        + " in folder " + this.getSieve().mailbox()
        + " has a value which " + this.getSieve().matchType().matchType()
        + " any of " + this.getSieve().keys().toScript());
    };

  // ************************************************************************************

  if (!SieveDesigner)
    throw new Error("Could not register Mailbox Extension");

  SieveDesigner.register("test/mailboxexists", SieveMailboxExistsTestUI);
  SieveDesigner.register("test/metadataexists", SieveMailboxMetaDataExistsTestUI);
  SieveDesigner.register("test/metadata", SieveMailboxMetaDataTestUI);

})(window);
