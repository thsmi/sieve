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
  /* global SieveStringWidget */
  /* global SieveDesigner */

  const DOM_ELEMENT = 0;

  /**
   * Provides a ui for the spam test
   */
  class SieveSpamtestUI extends SieveTestDialogBoxUI {

    /**
     * @returns {SieveString}
     *   The element's datepart.
     */
    value() {
      return this.getSieve().getElement("value");
    }

    /**
     * @returns {SieveAbstractElement}
     *   The element's matchtype.
     */
    matchtype() {
      return this.getSieve().getElement("match-type");
    }

    /**
     * @returns {SieveAbstractElement}
     *   The element's comparator.
     */
    comparator() {
      return this.getSieve().getElement("comparator");
    }

    /**
     * The default spam probability is a range from 0 to 10.
     * As this was not too intuitive, they extended the definition
     * and added a percentual range (0 to 100%).
     *
     * The percentual range it optional and so it may not be supported
     * by the sieve implementation
     *
     * @returns {boolean}
     *   true in case the value is percentual otherwise false.
     *   false can mean it is not supported or it is disabled.
     */
    isPercental() {
      if (!this.getSieve().hasElement("percent"))
        return false;

      if (!this.getSieve().enable("percent"))
        return false;

      return true;
    }

    /**
     * @inheritdoc
     */
    getTemplate() {
      return "./spamtest/templates/SieveSpamtestUI.html";
    }

    /**
     * @inheritdoc
     */
    onSave() {

      (new SieveMatchTypeWidget("#sivSpamtestMatchTypes"))
        .save(this.matchtype());
      (new SieveComparatorWidget("#sivSpamtestComparator"))
        .save(this.comparator());

      if (this.getSieve().hasElement("percent")) {

        if ($("#sivSpamtestPercentRadio")[DOM_ELEMENT].checked) {
          this.getSieve().enable("percent", true);
          (new SieveStringWidget("#sivSpamtestPercentValue")).save(this.value());
        } else {
          this.getSieve().enable("percent", false);
          (new SieveStringWidget("#sivSpamtestValue")).save(this.value());
        }
      }
      else {
        (new SieveStringWidget("#sivSpamtestValue")).save(this.value());
      }

      return true;
    }

    /**
     * @inheritdoc
     */
    onLoad() {

      (new SieveMatchTypeWidget("#sivSpamtestMatchTypes"))
        .init(this.matchtype());
      (new SieveComparatorWidget("#sivSpamtestComparator"))
        .init(this.comparator());

      // Check if this is a spamtest or spamtestplus ui.

      if (this.getSieve().hasElement("percent")) {
        $("#sivSpamtestPlaceholder").load("./spamtest/templates/SieveSpamtestPlusValue.html", () => {
          this.onLoadPercentualValue();
        });
      }
      else {

        $("#sivSpamtestPlaceholder").load("./spamtest/templates/SieveSpamtestValue.html", () => {
          this.onLoadValue();
        });
      }
    }

    /**
     * Called when the spamtest value ui is loaded.
     * It is used to initialize the value field.
     */
    onLoadValue() {

      (new SieveStringWidget("#sivSpamtestValue"))
        .init(this.value());
    }

    /**
     * Called when the spamtest plus ui is loaded
     * It is used to populate the radiobutton as well as the value fields
     */
    onLoadPercentualValue() {
      let value = "";
      let percentualValue = "";

      if (this.getSieve().enable("percent")) {
        $("#sivSpamtestPercentRadio")[DOM_ELEMENT].checked = true;
        percentualValue = this.value();
      }
      else {
        $("#sivSpamtestRadio")[DOM_ELEMENT].checked = true;
        value = this.value();
      }

      (new SieveStringWidget("#sivSpamtestValue"))
        .init(value);
      (new SieveStringWidget("#sivSpamtestPercentValue"))
        .init(percentualValue);
    }

    /**
     * @inheritdoc
     */
    getSummary() {

      return $("<div/>")
        .append($("<span/>").text("Spam score "))
        .append($("<span/>").text(this.matchtype().getElement().toScript() + " "))
        .append($("<em/>").text(this.value().value() + (this.isPercental() ? "%" : "")));
    }
  }



  /**
   * Provides a ui for the virus test
   */
  class SieveVirustestUI extends SieveTestDialogBoxUI {

    /**
     * @returns {SieveString}
     *   the element's datepart
     */
    value() {
      return this.getSieve().getElement("value");
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
     * @inheritdoc
     */
    getTemplate() {
      return "./spamtest/templates/SieveVirustestUI.html";
    }

    /**
     * @inheritdoc
     */
    onSave() {

      (new SieveMatchTypeWidget("#sivVirustestMatchTypes"))
        .save(this.matchtype());
      (new SieveComparatorWidget("#sivVirustestComparator"))
        .save(this.comparator());

      (new SieveStringWidget("#sivVirustestValue"))
        .save(this.value());

      return true;
    }

    /**
     * @inheritdoc
     */
    onLoad() {

      (new SieveMatchTypeWidget("#sivVirustestMatchTypes"))
        .init(this.matchtype());
      (new SieveComparatorWidget("#sivVirustestComparator"))
        .init(this.comparator());

      (new SieveStringWidget("#sivVirustestValue"))
        .init(this.value());
    }

    /**
     * @inheritdoc
     */
    getSummary() {
      return $("<div/>")
        .html(" Viruscheck " + this.matchtype().getElement().toScript() + " " + this.value().value());
    }
  }


  if (!SieveDesigner)
    throw new Error("Could not register Spamtest Extension");

  SieveDesigner.register("test/virustest", SieveVirustestUI);
  SieveDesigner.register("test/spamtest", SieveSpamtestUI);


})(window);
