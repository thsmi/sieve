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
  /* global SieveStringWidget */
  /* global SieveStringListWidget */
  /* global SieveTestDialogBoxUI */
  /* global SieveMatchTypeWidget */
  /* global SieveDesigner */
  /* global SieveComparatorWidget */
  /* global SieveRadioGroupWidget*/
  /* global SieveRadioGroupItemWidget */

  /**
   * Provides a widget for the zone element
   */
  class SieveZoneWidget extends SieveRadioGroupWidget {

    /**
     * @inheritdoc
     */
    constructor(selector) {
      super("zone/", selector);
    }
  }

  /**
   * An Abstract zone UI implementation.
   */
  class SieveAbstractZoneUI extends SieveRadioGroupItemWidget {

    /**
     * @inheritdoc
     */
    static nodeType() {
      return "zone/";
    }

    /**
     * @inheritdoc
     */
    getName() {
      return "sieve-zone";
    }
  }

  /**
   * Provides a UI for the original zone.
   */
  class SieveOriginalZoneUI extends SieveAbstractZoneUI {

    /**
     * @inheritdoc
     */
    static nodeName() {
      return "zone/originalzone";
    }

    /**
     * @inheritdoc
     */
    getTemplate() {
      return "./date/templates/SieveZoneOriginal.html";
    }
  }

  /**
   * Provides a UI for a custom zone .
   */
  class SieveCustomZoneUI extends SieveAbstractZoneUI {

    /**
     * @inheritdoc
     */
    static nodeName() {
      return "zone/zone";
    }

    /**
     * @inheritdoc
     */
    getTemplate() {
      return "./date/templates/SieveZoneCustom.html";
    }

    /**
     * @inheritdoc
     */
    onLoad(sivElement) {
      super.onLoad(sivElement);

      // update the string list...
      $("#sivDateZoneOffset").val(
        sivElement.getElement("time-zone").value());
    }

    /**
     * @inheritdoc
     */
    onSave(sivElement) {

      // We update the content type with a fake element.
      // This makes updating the strings easier.
      // we can skip this in case the current element is already a zone element.
      if (!sivElement.getElement().nodeName() !== this.constructor.nodeName()) {
        sivElement.setElement(
          "" + this.getRadioItem().find("input[name='" + this.getName() + "']").val() + ' ""');
      }

      sivElement.getElement("time-zone").value($("#sivDateZoneOffset").val());
    }
  }


  /**
   * Provides a ui for the set action
   */
  class SieveDateTestUI extends SieveTestDialogBoxUI {

    /**
     * @returns {SieveString}
     *   the element's header
     */
    header() {
      return this.getSieve().getElement("header");
    }

    /**
     * @returns {SieveString}
     *   the element's datepart
     */
    datepart() {
      return this.getSieve().getElement("datepart");
    }

    /**
     * @returns {SieveStringList}
     *   the element's keys
     */
    keys() {
      return this.getSieve().getElement("keys");
    }

    /**
     * Gets the match type.
     *
     * @returns {SieveAbstractElement}
     *   the element's matchtype
     */
    matchtype() {
      return this.getSieve().getElement("match-type");
    }

    /**
     * Gets the comparator type.
     *
     * @returns {SieveAbstractElement}
     *   the element's comparator
     */
    comparator() {
      return this.getSieve().getElement("comparator");
    }

    /**
     * @returns {SieveAbstractElement}
     *   the element's zone
     */
    zone() {
      return this.getSieve().getElement("zone");
    }

    /**
     * @inheritdoc
     */
    getTemplate() {
      return "./date/templates/SieveDateTestUI.html";
    }

    /**
     * @inheritdoc
     */
    onSave() {

      (new SieveStringListWidget("#sivDateKeyList"))
        .save(this.keys());

      (new SieveMatchTypeWidget("#sivDateMatchTypes"))
        .save(this.matchtype());
      (new SieveComparatorWidget("#sivDateComparator"))
        .save(this.comparator());
      (new SieveZoneWidget("#sivDateZone"))
        .save(this.zone());

      this.header().value($("#sivDateHeader").val());

      (new SieveStringWidget("#sivDateDatepart"))
        .save(this.datepart());
      return true;
    }

    /**
     * @inheritdoc
     */
    onLoad() {

      (new SieveStringListWidget("#sivDateKeyList"))
        .init(this.keys());

      (new SieveMatchTypeWidget("#sivDateMatchTypes"))
        .init(this.matchtype());
      (new SieveComparatorWidget("#sivDateComparator"))
        .init(this.comparator());
      (new SieveZoneWidget("#sivDateZone"))
        .init(this.zone());

      $("#sivDateHeader").val(this.header().value());
      (new SieveStringWidget("#sivDateDatepart"))
        .init(this.datepart());
    }

    /**
     * @inheritdoc
     */
    getSummary() {
      return $("<div/>")
        .html("" + this.datepart().value() + " in header " + this.header().value() + " " +
          this.matchtype().getElement().toScript() + " any of " + $('<div/>').text(this.keys().toScript()).html());
    }
  }


  /**
   * Provides a ui for the sieve current date test
   */
  class SieveCurrentDateTestUI extends SieveTestDialogBoxUI {

    /**
     * @returns {SieveStringList}
     *   the element's keys
     */
    keys() {
      return this.getSieve().getElement("keys");
    }

    /**
     * @returns {SieveString}
     *   the element's datepart
     */
    datepart() {
      return this.getSieve().getElement("datepart");
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
     * @returns {SieveAbstractElement}
     *   the element's zone
     */
    zone() {
      return this.getSieve().getElement("zone");
    }

    /**
     * @inheritdoc
     */
    getTemplate() {
      return "./date/templates/SieveCurrentDateTestUI.html";
    }

    /**
     * @inheritdoc
     */
    onSave() {
      (new SieveStringListWidget("#sivDateKeyList"))
        .save(this.keys());

      (new SieveMatchTypeWidget("#sivDateMatchTypes"))
        .save(this.matchtype());
      (new SieveComparatorWidget("#sivDateComparator"))
        .save(this.comparator());
      (new SieveZoneWidget("#sivDateZone"))
        .save(this.zone());

      (new SieveStringWidget("#sivDateDatepart"))
        .save(this.datepart());

      return true;
    }

    /**
     * @inheritdoc
     */
    onLoad() {

      (new SieveStringListWidget("#sivDateKeyList"))
        .init(this.keys());

      (new SieveMatchTypeWidget("#sivDateMatchTypes"))
        .init(this.matchtype());
      (new SieveComparatorWidget("#sivDateComparator"))
        .init(this.comparator());

      (new SieveZoneWidget("#sivDateZone"))
        .init(this.zone());

      (new SieveStringWidget("#sivDateDatepart"))
        .init(this.datepart());
    }

    /**
     * @inheritdoc
     */
    getSummary() {
      return $("<div/>")
        .html("The current " + this.datepart().value() + " " +
          this.matchtype().getElement().toScript() + " any of " + $('<div/>').text(this.keys().toScript()).html());
    }
  }

  if (!SieveDesigner)
    throw new Error("Could not register Date Extension");

  SieveDesigner.register("test/date", SieveDateTestUI);
  SieveDesigner.register("test/currentdate", SieveCurrentDateTestUI);

  SieveDesigner.register2(SieveOriginalZoneUI);
  SieveDesigner.register2(SieveCustomZoneUI);


})(window);
