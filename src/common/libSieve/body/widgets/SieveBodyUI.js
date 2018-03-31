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
  /* global SieveStringListWidget */
  /* global SieveRadioGroupWidget */
  /* global SieveAbstractRadioGroupWidget */
  /* global SieveDesigner */

  /**
   * Provides a widget for the body transform element
   */
  class SieveBodyTransformWidget extends SieveRadioGroupWidget {

    /**
     * @inheritDoc
     */
    constructor(selector) {
      super("body-transform/", selector);
    }
  }

  /**
   * An Abstract Body Transform UI implementation.
   */
  class SieveAbstractBodyTransformUI extends SieveAbstractRadioGroupWidget {

    /**
     * @inheritDoc
     */
    static nodeType() {
      return "body-transform/";
    }

    /**
     * @inheritDoc
     */
    getName() {
      return "sieve-bodytransform";
    }
  }

  /**
   * Provides a UI for the raw body transform.
   */
  class SieveRawBodyTransformUI extends SieveAbstractBodyTransformUI {

    /**
     * @inheritDoc
     */
    static nodeName() {
      return "body-transform/raw";
    }

    /**
     * @inheritDoc
     */
    getTemplate() {
      return "./body/templates/SieveBodyTransformRaw.html";
    }
  }

  /**
   * Provides a UI for the text body transform.
   */
  class SieveTextBodyTransformUI extends SieveAbstractBodyTransformUI {

    /**
     * @inheritDoc
     */
    static nodeName() {
      return "body-transform/text";
    }

    /**
     * @inheritDoc
     */
    getTemplate() {
      return "./body/templates/SieveBodyTransformText.html";
    }
  }

  /**
   * Provides a UI for the content body transform.
   */
  class SieveContentBodyTransformUI extends SieveAbstractBodyTransformUI {

    /**
     * @inheritDoc
     */
    static nodeName() {
      return "body-transform/content";
    }

    /**
     * @inheritDoc
     */
    getTemplate() {
      return "./body/templates/SieveBodyTransformContent.html";
    }

    /**
     * @inheritDoc
     */
    load(sivElement) {
      (new SieveStringListWidget("#sivBodyTransformContenType"))
        .init([""]);

      super.load(sivElement);
    }


    /**
     * @inheritDoc
     */
    onLoad(sivElement, item) {

      super.onLoad(sivElement, item);

      // update the string list...
      (new SieveStringListWidget("#sivBodyTransformContenType"))
        .init(sivElement._element.current.getElement("contentType"));
    }


    /**
     * @inheritDoc
     */
    onSave(sivElement, item) {

      // We update the content type with a fake element.
      // This makes updating the strings easier.
      // we can skip this in case the current element is already a content body transform element.

      if (!sivElement._element.current || sivElement._element.current.nodeName() !== this.constructor.nodeName()) {
        sivElement.setValue(
          "" + item.find("input[name='" + this.getName() + "']").val() + ' ""');
      }

      (new SieveStringListWidget("#sivBodyTransformContenType"))
        .save(sivElement._element.current.getElement("contentType"));
    }

  }


  /**
   * Implements controls to edit a sieve body test
   *
   * "body" [COMPARATOR] [MATCH-TYPE] [BODY-TRANSFORM]  <key-list: string-list>
   *
   * @constructor
   * @param {Object} elm - The sieve element which should be rendered.
   */
  class SieveBodyUI extends SieveTestDialogBoxUI {

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
     * @returns {SieveAbstractElement}
     *   the element's bodytransform field
     */
    bodyTransform() {
      return this.getSieve().getElement("body-transform");
    }

    /**
     * @returns {SieveAbstractElement}
     *   the element's keys field
     */
    keys() {
      return this.getSieve().getElement("keys");
    }

    /**
     * @inheritDoc
     */
    onLoad() {

      (new SieveMatchTypeWidget("#sivBodyMatchTypes"))
        .init(this.matchtype());
      (new SieveComparatorWidget("#sivBodyComparator"))
        .init(this.comparator());
      (new SieveBodyTransformWidget("#sivBodyTransform"))
        .init(this.bodyTransform());

      (new SieveStringListWidget("#sivBodyKeyList"))
        .init(this.keys());
    }

    /**
     * @inheritDoc
     */
    onSave() {

      (new SieveMatchTypeWidget("#sivBodyMatchTypes"))
        .save(this.matchtype());
      (new SieveComparatorWidget("#sivBodyComparator"))
        .save(this.comparator());
      (new SieveBodyTransformWidget("#sivBodyTransform"))
        .save(this.bodyTransform());


      (new SieveStringListWidget("#sivBodyKeyList"))
        .save(this.keys());

      return true;
    }

    /**
     * @inheritDoc
     */
    getTemplate() {
      return "./body/templates/SieveBodyTestUI.html";
    }

    /**
     * @inheritDoc
     */
    getSummary() {

      // case- insensitive is the default so skip it...
      return $("<div/>")
        .html(" message body <em> "
          + this.matchtype().getValue() + " "
          + $('<div/>').text(this.keys().values()).html() + "</em>");
    }
  }


  // ************************************************************************************

  if (!SieveDesigner)
    throw new Error("Could not register Body Extension");

  SieveDesigner.register2(SieveRawBodyTransformUI);
  SieveDesigner.register2(SieveTextBodyTransformUI);
  SieveDesigner.register2(SieveContentBodyTransformUI);

  SieveDesigner.register("test/body", SieveBodyUI);

})(window);
