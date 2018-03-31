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
  /* global SieveTestBoxUI */
  /* global SieveTestDialogBoxUI */

  /* global SieveStringListWidget */
  /* global SieveMatchTypeWidget */
  /* global SieveAddressPartWidget */
  /* global SieveComparatorWidget */

  // testunary .append() -> testunary in anyof wrapen  SieveTestUI einführen...
  // testmultary.append -> an entsprechender stelle einfügen SieveTestListUI...

  // ****************************************************************************//

  /**
   * Implements an UI for the size test
   */
  class SieveSizeTestUI extends SieveTestDialogBoxUI {

    /**
     * @inheritDoc
     **/
    onValidate() {
      return true;
    }

    /**
     * @inheritDoc
     **/
    onSave() {
      let sieve = this.getSieve();

      sieve
        .isOver($("input[type='radio'][name='over']:checked").val() === "true")
        .getSize()
        .value($("#sivSizeTestValue").val())
        .unit($("#sivSizeTestUnit").val());

      return true;
    }

    /**
     * @inheritDoc
     **/
    getTemplate() {
      return "./RFC5228/templates/SieveSizeTestUI.html";
    }

    /**
     * @inheritDoc
     */
    onLoad() {

      $('input:radio[name="over"][value="' + this.getSieve().isOver() + '"]').prop('checked', true);

      $("#sivSizeTestValue").val("" + this.getSieve().getSize().value());
      $("#sivSizeTestUnit").val("" + this.getSieve().getSize().unit());
    }

    /**
     * @inheritDoc
     */
    getSummary() {
      return $("<div/>")
        .text("message is " + (this.getSieve().isOver() ? "larger" : "smaller")
          + " than " + this.getSieve().getSize().toScript());
    }
  }

  // ****************************************************************************//

  function SieveBooleanTestUI(elm) {
    SieveTestBoxUI.call(this, elm);
  }

  SieveBooleanTestUI.prototype = Object.create(SieveTestBoxUI.prototype);
  SieveBooleanTestUI.prototype.constructor = SieveBooleanTestUI;

  SieveBooleanTestUI.prototype.onValidate
    = function () {

      if ($("#BooleanTestValue" + this.id()).val() === "true")
        this.getSieve().value = true;
      else
        this.getSieve().value = false;

      return true;
    };

  SieveBooleanTestUI.prototype.initEditor
    = function () {
      return $("<div/>")
        .append($("<span/>")
          .text("is"))
        .append($("<select/>")
          .attr("id", "BooleanTestValue" + this.id())
          .append($("<option/>")
            .text("true").val("true"))
          .append($("<option/>")
            .text("false").val("false"))
          .val("" + this.getSieve().value));
    };

  SieveBooleanTestUI.prototype.initSummary
    = function () {
      return $("<div/>")
        .text("is " + (this.getSieve().value));
    };


  /**
   * A UI Widget for the sieve exists element
   *
   */
  class SieveExistsUI extends SieveTestDialogBoxUI {

    /**
     * @returns {SieveAbstractElement}
     *   the element's headers
     */
    headers() {
      return this.getSieve().getElement("headers");
    }

    /**
     * @inheritDoc
     */
    getTemplate() {
      return "./RFC5228/templates/SieveExistsTestUI.html";
    }

    /**
     * @inheritDoc
     */
    onLoad() {
      (new SieveStringListWidget("#sivExistsHeaderList"))
        .init(this.headers());
    }

    /**
     * @inheritDoc
     */
    onSave() {
      (new SieveStringListWidget("#sivExistsHeaderList")).save(this.headers());

      return true;
    }

    /**
     * @inheritDoc
     */
    getSummary() {
      return $("<div/>")
        .html("the following header(s) exist:"
          + "<em>" + $('<div/>').text(this.headers().toScript()).html() + "</em>");
    }
  }

  /**
   * A UI Widget for the sieve header element
   */
  class SieveHeaderUI extends SieveTestDialogBoxUI {

    /**
     * @returns {SieveAbstractElement}
     *   the element's keys
     */
    keys() {
      return this.getSieve().getElement("keys");
    }

    /**
     * @returns {SieveAbstractElement}
     *   the element's headers
     */
    headers() {
      return this.getSieve().getElement("headers");
    }

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
     * @inheritDoc
     */
    getTemplate() {
      return "./RFC5228/templates/SieveHeaderTestUI.html";
    }

    /**
     * @inheritDoc
     */
    onLoad() {

      (new SieveStringListWidget("#sivHeaderHeaderList"))
        .init(this.headers());

      (new SieveMatchTypeWidget("#sivHeaderMatchTypes"))
        .init(this.matchtype());

      (new SieveComparatorWidget("#sivHeaderComparator"))
        .init(this.comparator());

      (new SieveStringListWidget("#sivHeaderKeyList"))
        .init(this.keys());
    }

    /**
     * @inheritDoc
     */
    onSave() {
      (new SieveStringListWidget("#sivHeaderKeyList")).save(this.keys());
      (new SieveStringListWidget("#sivHeaderHeaderList")).save(this.headers());

      (new SieveComparatorWidget("#sivHeaderComparator"))
        .save(this.comparator());

      (new SieveMatchTypeWidget("#sivHeaderMatchTypes"))
        .save(this.matchtype());

      return true;
    }

    /**
     * @inheritDoc
     */
    getSummary() {
      return $("<div/>")
        .html(" header " + $('<em/>').text(this.headers().values()).html()
          + " " + this.matchtype().getValue() + " "
          + $('<em/>').text(this.keys().values()).html());
    }
  }

  /**
   * A UI Widget for the sieve address element
   */
  class SieveAddressUI extends SieveTestDialogBoxUI {

    /**
     * @returns {SieveAbstractElement}
     *   the element's address part
     */
    addresspart() {
      return this.getSieve().getElement("address-part");
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
     *   the element's match type
     */
    matchtype() {
      return this.getSieve().getElement("match-type");
    }

    /**
     * @returns {SieveAbstractElement}
     *   the element's headers
     */
    headers() {
      return this.getSieve().getElement("headers");
    }

    /**
     * @returns {SieveAbstractElement}
     *   the element's keys
     */
    keys() {
      return this.getSieve().getElement("keys");
    }

    /**
     * @inheritDoc
     */
    getTemplate() {
      return "./RFC5228/templates/SieveAddressTestUI.html";
    }

    /**
     * @inheritDoc
     */
    onLoad() {
      (new SieveStringListWidget("#sivAddressKeyList"))
        .init(this.keys());
      (new SieveStringListWidget("#sivAddressHeaderList"))
        .init(this.headers());

      (new SieveComparatorWidget("#sivAddressComparator"))
        .init(this.comparator());
      (new SieveMatchTypeWidget("#sivAddressMatchTypes"))
        .init(this.matchtype());
      (new SieveAddressPartWidget("#sivAddressAddressPart"))
        .init(this.addresspart());
    }

    /**
     * @inheritDoc
     */
    onSave() {

      (new SieveStringListWidget("#sivAddressKeyList"))
        .save(this.keys());
      (new SieveStringListWidget("#sivAddressHeaderList"))
        .save(this.headers());

      (new SieveComparatorWidget("#sivAddressComparator"))
        .save(this.comparator());
      (new SieveMatchTypeWidget("#sivAddressMatchTypes"))
        .save(this.matchtype());
      (new SieveAddressPartWidget("#sivAddressAddressPart"))
        .save(this.addresspart());

      return true;
    }

    /**
     * @inheritDoc
     */
    getSummary() {
      // case- insensitive is the default so skip it...
      return $("<div/>")
        .html(" address <em>" + $('<div/>').text(this.headers().toScript()).html() + "</em>"
          + " " + this.matchtype().getValue()
          + " " + ((this.addresspart().getValue() !== ":all") ? this.addresspart().getValue() : "")
          + " <em>" + $('<div/>').text(this.keys().toScript()).html() + "</em>");
    }
  }

  /**
   * A UI Widget for the sieve envelope element
   */
  class SieveEnvelopeUI extends SieveTestDialogBoxUI {

    /**
     * @returns {SieveAbstractElement}
     *   the element's address part
     */
    addresspart() {
      return this.getSieve().getElement("address-part");
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
     *   the element's match type
     */
    matchtype() {
      return this.getSieve().getElement("match-type");
    }

    /**
     * @returns {SieveAbstractElement}
     *   the element's envelopes
     */
    envelopes() {
      return this.getSieve().getElement("envelopes");
    }

    /**
     * @returns {SieveAbstractElement}
     *   the element's keys
     */
    keys() {
      return this.getSieve().getElement("keys");
    }

    /**
     * @inheritDoc
     */
    getTemplate() {
      return "./RFC5228/templates/SieveEnvelopeTestUI.html";
    }

    /**
     * @inheritDoc
     */
    onLoad() {
      (new SieveStringListWidget("#sivEnvelopeKeyList"))
        .init(this.keys());
      (new SieveStringListWidget("#sivEnvelopeList"))
        .init(this.envelopes());

      (new SieveComparatorWidget("#sivEnvelopeComparator"))
        .init(this.comparator());
      (new SieveAddressPartWidget("#sivEnvelopeAddressPart"))
        .init(this.addresspart());
      (new SieveMatchTypeWidget("#sivEnvelopeMatchTypes"))
        .init(this.matchtype());
    }

    /**
     * @inheritDoc
     */
    onSave() {

      (new SieveStringListWidget("#sivEnvelopeKeyList")).save(this.keys());
      (new SieveStringListWidget("#sivEnvelopeList")).save(this.envelopes());

      (new SieveComparatorWidget("#sivEnvelopeComparator"))
        .save(this.comparator());
      (new SieveMatchTypeWidget("#sivEnvelopeMatchTypes"))
        .save(this.matchtype());
      (new SieveAddressPartWidget("#sivEnvelopeAddressPart"))
        .save(this.addresspart());

      return true;
    }
    /**
     * @inheritDoc
     */
    getSummary() {
      return $("<div/>")
        .html(" envelope " + $('<em/>').text(this.envelopes().toScript()).html()
          + " " + this.matchtype().getValue()
          + " " + ((this.addresspart().getValue() !== ":all") ? this.addresspart().getValue() : "")
          + " " + $('<em/>').text(this.keys().toScript()).html() + "");
    }
  }


  if (!SieveDesigner)
    throw new Error("Could not register Action Widgets");


  SieveDesigner.register("test/address", SieveAddressUI);
  SieveDesigner.register("test/boolean", SieveBooleanTestUI);
  SieveDesigner.register("test/envelope", SieveEnvelopeUI);
  SieveDesigner.register("test/exists", SieveExistsUI);
  SieveDesigner.register("test/header", SieveHeaderUI);
  SieveDesigner.register("test/size", SieveSizeTestUI);

})(window);
