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
  /* global SieveActionBoxUI */
  /* global SieveDesigner */
  /* global SieveActionDialogBoxUI */
  /* global SieveTabWidget */

  // ******************************************************************************/

  function SieveStopUI(elm) {
    SieveActionBoxUI.call(this, elm);
  }

  SieveStopUI.prototype = Object.create(SieveActionBoxUI.prototype);
  SieveStopUI.prototype.constructor = SieveStopUI;

  SieveStopUI.prototype.initSummary
    = function () {
      return $("<div/>")
        .text("End Script (Stop processing)");
    };


  // ******************************************************************************/
  function SieveDiscardUI(elm) {
    SieveActionBoxUI.call(this, elm);
  }

  SieveDiscardUI.prototype = Object.create(SieveActionBoxUI.prototype);
  SieveDiscardUI.prototype.constructor = SieveDiscardUI;

  SieveDiscardUI.prototype.initSummary
    = function () {
      return $("<div/>")
        .text("Discard message silently");
    };

  // ******************************************************************************/
  function SieveKeepUI(elm) {
    SieveActionBoxUI.call(this, elm);
  }

  SieveKeepUI.prototype = Object.create(SieveActionBoxUI.prototype);
  SieveKeepUI.prototype.constructor = SieveKeepUI;

  SieveKeepUI.prototype.initSummary
    = function () {
      return $("<div/>")
        .text("Keep a copy in the main inbox");
    };

  // ******************************************************************************/

  function SieveRedirectUI(elm) {
    SieveActionDialogBoxUI.call(this, elm);
  }

  SieveRedirectUI.prototype = Object.create(SieveActionDialogBoxUI.prototype);
  SieveRedirectUI.prototype.constructor = SieveRedirectUI;

  /**
   *  Gets and/or sets the redirect address
   *
   *  @param  {string} [address]
   *    optional the new address which should be set.
   *
   *  @returns {string} the current address
   */
  SieveRedirectUI.prototype.address
    = function (address) {

      return this.getSieve().getElement("address").value(address);
    };

  SieveRedirectUI.prototype.getTemplate
    = function () {
      return "./RFC5228/templates/SieveRedirectActionUI.html #sivDialogRedirect";
    };

  SieveRedirectUI.prototype.onSave
    = function () {

      let address = $("#sivRedirectAddress");

      if (address[0].checkValidity() === false) {
        window.altert("Invalid redirect address");
        return false;
      }

      address = address.val();

      if (address.trim() === "") {
        window.alert("Invalid redirect address");
        return false;
      }

      this.address(address);
      return true;
    };

  SieveRedirectUI.prototype.onLoad
    = function () {
      (new SieveTabWidget()).init();
      $("#sivRedirectAddress").val(this.address());
    };

  SieveRedirectUI.prototype.getSummary
    = function () {
      return $("<div/>")
        .html("Redirect message to " +
          "<em>" + $('<div/>').text(this.address()).html() + "</em>");
    };


  // ******************************************************************************/

  function SieveFileIntoUI(elm) {
    SieveActionDialogBoxUI.call(this, elm);
  }

  SieveFileIntoUI.prototype = Object.create(SieveActionDialogBoxUI.prototype);
  SieveFileIntoUI.prototype.constructor = SieveFileIntoUI;

  /**
   *  Gets and/or Sets the FileInto's paths
   *
   *  @param  {string} [value]
   *    optional the new path which should be set.
   *
   *  @returns {string} the current file into path
   */
  SieveFileIntoUI.prototype.path
    = function (value) {

      return this.getSieve().getElement("path").value(value);
    };

  SieveFileIntoUI.prototype.getTemplate
    = function () {
      return "./RFC5228/templates/SieveFileIntoActionUI.html #sivDialogFileInto";
    };

  SieveFileIntoUI.prototype.onSave
    = function () {

      let path = $("#sivFileIntoPath").val();

      if (path.trim() === "") {
        window.alert("Invalid folder");
        return false;
      }

      this.path(path);
      return true;
    };

  SieveFileIntoUI.prototype.onLoad
    = function () {
      (new SieveTabWidget()).init();
      $("#sivFileIntoPath").val(this.path());
    };

  SieveFileIntoUI.prototype.getSummary
    = function () {
      return $("<div/>")
        .html("Save message into:" +
          "<div><em>" + $('<div/>').text(this.path()).html() + "</em></div>");
    };


  // ******************************************************************************/

  if (!SieveDesigner)
    throw new Error("Could not register Action Widgets");


  SieveDesigner.register("action/discard", SieveDiscardUI);
  SieveDesigner.register("action/keep", SieveKeepUI);
  SieveDesigner.register("action/stop", SieveStopUI);

  SieveDesigner.register("action/fileinto", SieveFileIntoUI);
  SieveDesigner.register("action/redirect", SieveRedirectUI);

})(window);
