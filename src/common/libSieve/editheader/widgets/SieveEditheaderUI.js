/*
 * The contents of this file are licenced. You may obtain a copy of
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
  /* global SieveActionDialogBoxUI */
  /* global SieveStringListWidget */
  /* global SieveMatchTypeWidget */
  /* global SieveComparatorWidget */

  /**
   * Provides a UI for th add header action
   */
  class SieveAddHeaderUI extends SieveActionDialogBoxUI {

    /**
     * @returns {SieveAbstractString}
     *   the element's header field name
     */
    name() {
      return this.getSieve().getElement("name");
    }

    /**
     * @returns {SieveAbstractString}
     *   the element's header value field
     */
    value() {
      return this.getSieve().getElement("value");
    }

    enable(id, status) {
      return this.getSieve().enable(id, status);
    }

    /**
     * @inheritdoc
     */
    getTemplate() {
      return "./editheader/templates/SieveAddHeaderActionUI.html";
    }

    /**
     * @inheritdoc
     */
    onSave() {

      let name = $("#sivNewHeaderName").val();

      if (name.trim() === "") {
        window.alert("Header name is empty");
        return false;
      }

      let value = $("#sivNewHeaderValue").val();

      if (value.trim() === "") {
        window.alert("Header value is empty");
        return false;
      }

      this.name().value(name);
      this.value().value(value);

      let last = ($("input[type='radio'][name='last']:checked").val() === "true");

      this.enable("last", last);
      return true;
    }

    /**
     * @inheritdoc
     */
    onLoad() {

      $("#sivNewHeaderName").val(this.name().value());
      $("#sivNewHeaderValue").val(this.value().value());

      $('input:radio[name="last"][value="' + this.enable("last") + '"]').prop('checked', true);
    }

    /**
     * @inheritdoc
     */
    getSummary() {
      return $("<div/>")
        .html("Add a header "
          + $('<em/>').text(this.name().value()).html()
          + " with a value "
          + $('<em/>').text(this.value().value()).html());
    }
  }


  /**
   * Provides an UI for thee Delete Header action
   */
  class SieveDeleteHeaderUI extends SieveActionDialogBoxUI {

    /**
     * @returns {SieveAbstractElement}
     *   the element's match type
     */
    matchtype() {
      return this.getSieve().getElement("match-type");
    }

    /**
     * @returns {SieveAbstractElement}
     *   the element's comparator type
     */
    comparator() {
      return this.getSieve().getElement("comparator");
    }

    /**
     * @returns {SieveAbstractString}
     *   the element's header field name
     */
    name() {
      return this.getSieve().getElement("name");
    }

    /**
     * The optional value patterns
     * @returns {SieveStringList}
     *   a string list containing the patterns.
     */
    values() {
      return this.getSieve().getElement("values");
    }

    /**
     * @inheritdoc
     */
    getTemplate() {
      return "./editheader/templates/SieveDeleteHeaderActionUI.html";
    }

    /**
     * Saves the current header index.
     *
     */
    saveHeaderIndex() {
      let indexType = $('input:radio[name="header-index"]:checked').val();

      switch (indexType) {
        case "first":
          this.getSieve().enable("index", true);
          this.getSieve().getElement("index").enable("last", false);


          this.getSieve().getElement("index").getElement("name")
            .setValue($("#sivDeleteHeaderFirstIndex").val());

          break;

        case "last":
          this.getSieve().enable("index", true);
          this.getSieve().getElement("index").enable("last", true);

          this.getSieve().getElement("index").getElement("name")
            .setValue($("#sivDeleteHeaderLastIndex").val());
          break;

        default:
          this.getSieve().enable("index", false);
          this.getSieve().getElement("index").enable("last", false);
          break;
      }
    }

    /**
     * Saves the current header values
     *
     */
    saveHeaderValues() {
      let value = $("input:radio[name='header-value']:checked").val();

      switch (value) {
        case "some":
          this.getSieve().enable("values", true);
          break;

        case "any":
        default:
          this.getSieve().enable("values", false);
          break;
      }
    }

    /**
     * @inheritdoc
     */
    onSave() {

      (new SieveMatchTypeWidget("#sivDeleteHeaderMatchTypes"))
        .save(this.matchtype());
      (new SieveComparatorWidget("#sivDeleteHeaderComparator"))
        .save(this.comparator());

      (new SieveStringListWidget("#sivValuePatternsList"))
        .save(this.values());

      this.getSieve().getElement("name")
        .value($("#sivDeleteHeaderName").val());

      this.saveHeaderIndex();
      this.saveHeaderValues();


      return true;
    }

    /**
     * Initializes the header index elements
     */
    loadHeaderIndex() {

      $('input:radio[name="header-index"][value="all"]').change(() => {
        $("#sivDeleteHeaderFirstIndex").prop("disabled", true);
        $("#sivDeleteHeaderLastIndex").prop("disabled", true);
      });

      $('input:radio[name="header-index"][value="first"]').change(() => {
        $("#sivDeleteHeaderFirstIndex").prop("disabled", false);
        $("#sivDeleteHeaderLastIndex").prop("disabled", true);
      });

      $('input:radio[name="header-index"][value="last"]').change(() => {
        $("#sivDeleteHeaderFirstIndex").prop("disabled", true);
        $("#sivDeleteHeaderLastIndex").prop("disabled", false);
      });

      let indexType = "all";
      let indexValue = this.getSieve().getElement("index").getElement("name").getValue();

      if (!this.getSieve().enable("index")) {
        indexType = "all";
      }
      else if (!this.getSieve().getElement("index").enable("last")) {
        indexType = "first";
        $("#sivDeleteHeaderFirstIndex").val(indexValue);
      }
      else {
        indexType = "last";
        $("#sivDeleteHeaderLastIndex").val(indexValue);
      }

      $('input:radio[name="header-index"][value="' + indexType + '"]')
        .prop('checked', true)
        .change();

    }

    /**
     * Initializes the ui for the header values
     */
    loadHeaderValues() {
      $('input:radio[name="header-value"][value="any"]').change(() => {
        $('#sivSomeValues').hide();
      });

      $('input:radio[name="header-value"][value="some"]').change(() => {
        $('#sivSomeValues').show();
      });


      let headerType = "any";
      if (!this.getSieve().enable("values")) {
        headerType = "any";
      } else {
        headerType = "some";
      }

      $('input:radio[name="header-value"][value="' + headerType + '"]')
        .prop('checked', true)
        .change();
    }

    /**
     * @inheritdoc
     */
    onLoad() {

      (new SieveMatchTypeWidget("#sivDeleteHeaderMatchTypes"))
        .init(this.matchtype());
      (new SieveComparatorWidget("#sivDeleteHeaderComparator"))
        .init(this.comparator());

      (new SieveStringListWidget("#sivValuePatternsList"))
        .init(this.values());


      $("#sivDeleteHeaderName")
        .val(this.getSieve().getElement("name").value());


      this.loadHeaderValues();
      this.loadHeaderIndex();
    }

    /**
     * @inheritdoc
     */
    getSummary() {
      return $("<div/>")
        .html("Remove a header "
          // + $( '<em/>' ).text( this.name() ).html()
          + " with a value "
          // + $( '<em/>' ).text( this.value() ).html()
        );
    }
  }


  if (!SieveDesigner)
    throw new Error("Could not register add header Widgets");

  SieveDesigner.register("action/addheader", SieveAddHeaderUI);
  SieveDesigner.register("action/deleteheader", SieveDeleteHeaderUI);
})(window);
