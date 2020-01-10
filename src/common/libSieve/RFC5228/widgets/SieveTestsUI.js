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
  /* global SieveTestDialogBoxUI */

  /* global SieveStringListWidget */
  /* global SieveMatchTypeWidget */
  /* global SieveAddressPartWidget */
  /* global SieveComparatorWidget */
  /* global SieveNumericWidget */

  // testunary .append() -> testunary in anyof wrapen  SieveTestUI einführen...
  // testmultary.append -> an entsprechender stelle einfügen SieveTestListUI...


  /**
   * Implements an UI for the size test
   */
  class SieveSizeTestUI extends SieveTestDialogBoxUI {

    /**
     * @inheritdoc
     **/
    getTemplate() {
      return "./RFC5228/templates/SieveSizeTestUI.html";
    }

    /**
     * @inheritdoc
     */
    onLoad() {
      (new SieveNumericWidget("#sivSizeInput"))
        .init(this.getSieve().getElement("limit"));

      const elm = this.getSieve().getElement("operator").getCurrentElement();
      $('input:radio[name="over"][value="' + elm.nodeName() + '"]').prop('checked', true);
    }

    /**
     * @inheritdoc
     **/
    onSave() {

      (new SieveNumericWidget("#sivSizeInput"))
        .save(this.getSieve().getElement("limit"));

      const name = $("input[type='radio'][name='over']:checked").val();

      if (name === "test/size/operator/over")
        this.getSieve().getElement("operator").setCurrentElement(":over");
      else if (name === "test/size/operator/under")
        this.getSieve().getElement("operator").setCurrentElement(":under");
      else
        throw new Error("Unknown operator, has to be either :over or :under");

      return true;
    }


    /**
     * @inheritdoc
     */
    getSummary() {
      const name = this.getSieve().getElement("operator").getCurrentElement().nodeName();

      let operator = "smaller";
      if (name === "test/size/operator/over")
        operator = "larger";

      return $("<div/>")
        .text("message is " + operator
          + " than " + this.getSieve().getElement("limit").toScript() + " bytes");
    }
  }

  /**
   * Provides an UI for the Sieve Boolean tests, which have no
   * practival use as a true always succeed and a false always fails.
   */
  class SieveBooleanTestUI extends SieveTestDialogBoxUI {

    /**
     * @inheritdoc
     **/
    getTemplate() {
      return "./RFC5228/templates/SieveBooleanTest.html";
    }

    /**
     * @inheritdoc
     **/
    onSave() {

      const value = $("#sieve-widget-test")
        .find("input[name='booleanValue']:checked").val();

      if (value === "test/boolean/true")
        this.getSieve().setCurrentElement("true");
      else if (value === "test/boolean/false")
        this.getSieve().setCurrentElement("false");
      else
        throw new Error("Invalid boolean value");

      return true;
    }

    /**
     * @inheritdoc
     */
    onLoad() {
      $("#sieve-widget-test")
        .find("input[name='booleanValue']")
        .val([this.getSieve().getCurrentElement().nodeName()]);
    }

    /**
     * @inheritdoc
     */
    getSummary() {

      const name = this.getSieve().getCurrentElement().nodeName();

      if (name === "test/boolean/true")
        return $("<div/>").text("is true");

      if (name === "test/boolean/false")
        return $("<div/>").text("is false");

      throw new Error("Invalid State boolean is neither true nor false");
    }
  }


  /**
   * A UI Widget for the sieve exists element
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
     * @inheritdoc
     */
    getTemplate() {
      return "./RFC5228/templates/SieveExistsTestUI.html";
    }

    /**
     * @inheritdoc
     */
    onLoad() {
      (new SieveStringListWidget("#sivExistsHeaderList"))
        .init(this.headers());
    }

    /**
     * @inheritdoc
     */
    onSave() {
      (new SieveStringListWidget("#sivExistsHeaderList")).save(this.headers());

      return true;
    }

    /**
     * @inheritdoc
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
     * @inheritdoc
     */
    getTemplate() {
      return "./RFC5228/templates/SieveHeaderTestUI.html";
    }

    /**
     * @inheritdoc
     */
    onLoad() {
      (new SieveStringListWidget("#sivHeaderKeyList"))
        .init(this.keys());
      (new SieveStringListWidget("#sivHeaderHeaderList"))
        .init(this.headers());

      (new SieveMatchTypeWidget("#sivHeaderMatchTypes"))
        .init(this.matchtype());
      (new SieveComparatorWidget("#sivHeaderComparator"))
        .init(this.comparator());
    }

    /**
     * @inheritdoc
     */
    onSave() {
      (new SieveStringListWidget("#sivHeaderKeyList"))
        .save(this.keys());
      (new SieveStringListWidget("#sivHeaderHeaderList"))
        .save(this.headers());

      (new SieveComparatorWidget("#sivHeaderComparator"))
        .save(this.comparator());
      (new SieveMatchTypeWidget("#sivHeaderMatchTypes"))
        .save(this.matchtype());

      return true;
    }

    /**
     * @inheritdoc
     */
    getSummary() {
      return $("<div/>")
        .html(" header " + $('<em/>').text(this.headers().values()).html()
          + " " + this.matchtype().getElement().toScript() + " "
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
     * @inheritdoc
     */
    getTemplate() {
      return "./RFC5228/templates/SieveAddressTestUI.html";
    }

    /**
     * @inheritdoc
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
     * @inheritdoc
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
     * @inheritdoc
     */
    getSummary() {
      // case- insensitive is the default so skip it...
      return $("<div/>")
        .html(" address <em>" + $('<div/>').text(this.headers().toScript()).html() + "</em>"
          + " " + this.matchtype().getElement().toScript()
          + " " + ((this.addresspart().getElement().toScript() !== ":all") ? this.addresspart().getElement().toScript() : "")
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
     * @inheritdoc
     */
    getTemplate() {
      return "./RFC5228/templates/SieveEnvelopeTestUI.html";
    }

    /**
     * @inheritdoc
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
     * @inheritdoc
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
     * @inheritdoc
     */
    getSummary() {
      return $("<div/>")
        .html(" envelope " + $('<em/>').text(this.envelopes().toScript()).html()
          + " " + this.matchtype().getElement().toScript()
          + " " + ((this.addresspart().getElement().toScript() !== ":all") ? this.addresspart().toScript() : "")
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
