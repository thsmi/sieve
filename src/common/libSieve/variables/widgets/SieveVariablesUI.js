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
  /* global SieveStringListWidget */
  /* global SieveActionDialogBoxUI */
  /* global SieveTestDialogBoxUI */
  /* global SieveMatchTypeWidget */
  /* global SieveDesigner */
  /* global SieveComparatorWidget */

  /* global SieveOverlayWidget */
  /* global SieveOverlayItemWidget */

  const MAX_QUOTE_LEN = 240;
  const DOM_ELEMENT = 0;

  /**
   * Provides a ui for the set action
   */
  class SieveSetActionUI extends SieveActionDialogBoxUI {

    /**
     * @returns {SieveString}
     *   the element's name
     */
    name() {
      return this.getSieve().getElement("name");
    }

    /**
     * @returns {SieveString}
     *   the element's value
     */
    value() {
      return this.getSieve().getElement("value");
    }

    /**
     * @inheritdoc
     */
    getTemplate() {
      return "./variables/templates/SieveSetActionUI.html";
    }

    /**
     * @inheritdoc
     */
    onSave() {
      const item = $("#sivVariableName");

      if (! item.get(DOM_ELEMENT).checkValidity()) {
        return false;
      }

      this.name().value(item.val());
      this.value().value($("#sivVariableValue").val());

      (new SieveOverlayWidget("modifier/", "#sivModifier"))
        .save(this.getSieve());

      let status;
      let value = null;

      value = null;
      status = $("input[type='checkbox'][name='30']").is(":checked");
      if (status)
        value = $("input:radio[name='30']:checked").val();

      this.getSieve().getElement("modifier/30").setElement(value);
      this.getSieve().enable("modifier/30", status);

      value = null;
      status = $("input[type='checkbox'][name='40']").is(":checked");
      if (status)
        value = $("input:radio[name='40']:checked").val();

      this.getSieve().getElement("modifier/40").setElement(value);
      this.getSieve().enable("modifier/40", status);

      return true;
    }

    /**
     * @inheritdoc
     */
    onLoad() {

      // Sort by the modifier name
      function sort(widget) {
        const items = widget.find(".sieve-modifier");
        items.sort((a, b) => {
          const lhs = $(a).find("input:checkbox[name^='modifier/']").attr("name");
          const rhs = $(b).find("input:checkbox[name^='modifier/']").attr("name");
          return lhs < rhs;
        });

        widget.append(items);
      }

      (new SieveOverlayWidget("modifier/", "#sivModifier"))
        .init(this.getSieve(), sort);

      let state = null;

      state = this.getSieve().enable("modifier/30");
      $('input:checkbox[name="30"]')
        .change(function () { $('input:radio[name="30"]').prop('disabled', !($(this).prop('checked'))); })
        .prop('checked', state)
        .change();

      if (state)
        $('input:radio[name="30"][value="' + this.getSieve().getElement("modifier/30").toScript() + '"]').prop('checked', true);

      state = this.getSieve().enable("modifier/40");
      $('input:checkbox[name="40"]')
        .change(function () { $('input:radio[name="40"]').prop('disabled', !($(this).prop('checked'))); })
        .prop('checked', state)
        .change();

      if (state)
        $('input:radio[name="40"][value="' + this.getSieve().getElement("modifier/40").toScript() + '"]').prop('checked', true);

      $("#sivVariableName").val(this.name().value());
      $("#sivVariableValue").val(this.value().value());
    }

    /**
     * @inheritdoc
     */
    getSummary() {
      return $("<div/>")
        .append($("<div/>")
          .html("Set variable <em>" + this.name().value() + "</em> to value"))
        .append($("<div/>")
          .append($('<em/>')
            .text(this.value().quote(MAX_QUOTE_LEN))));

    }
  }

  /**
   * Implements an abstract overlay widget which is used by
   * the copy overlay for the fileinto action as well as the
   * redirect action.
   */
  class SieveModifierLengthWidget extends SieveOverlayItemWidget {

    /**
     * @inheritdoc
     */
    static nodeType() {
      return "modifier/";
    }

    /**
     * @inheritdoc
     */
    static nodeName() {
      return "modifier/10";
    }

    /**
     * @inheritdoc
     **/
    getTemplate() {
      return "./variables/templates/SieveLengthUI.html";
    }

    /**
     * @inheritdoc
     */
    static isCapable(capabilities) {
      return capabilities.hasCapability("variables");
    }

    /**
     * @inheritdoc
     */
    load(sivElement) {
      if (sivElement.enable("modifier/10"))
        $("#cbxModifier10").attr("checked", "checked");
    }

    /**
     * @inheritdoc
     */
    save(sivElement) {

      let value = null;
      const status = $("#cbxModifier10").is(":checked");
      if (status)
        value = $("#cbxModifier10").val();

      sivElement.getElement("modifier/10").setElement(value);
      sivElement.enable("modifier/10", status);
    }

    /**
     * @inheritdoc
     */
    getElement() {
      return $("" + this.selector);
    }
  }

  /**
   * Implements an abstract overlay widget which is used by
   * the copy overlay for the fileinto action as well as the
   * redirect action.
   */
  class SieveModifierQuotewildcardWidget extends SieveOverlayItemWidget {

    /**
     * @inheritdoc
     */
    static nodeType() {
      return "modifier/";
    }

    /**
     * @inheritdoc
     */
    static nodeName() {
      return "modifier/20";
    }

    /**
     * @inheritdoc
     **/
    getTemplate() {
      return "./variables/templates/SieveQuotewildcardUI.html";
    }

    /**
     * @inheritdoc
     */
    static isCapable(capabilities) {
      return capabilities.hasCapability("variables");
    }

    /**
     * @inheritdoc
     */
    load(sivElement) {
      if (sivElement.enable("modifier/20"))
        $("#cbxModifier20").attr("checked", "checked");
    }

    /**
     * @inheritdoc
     */
    save(sivElement) {

      let value = null;
      const status = $("#cbxModifier20").is(":checked");
      if (status)
        value = $("#cbxModifier20").val();

      sivElement.getElement("modifier/20").setElement(value);
      sivElement.enable("modifier/20", status);
    }

    /**
     * @inheritdoc
     */
    getElement() {
      return $("" + this.selector);
    }
  }


  /**
   * Provides a ui for the sieve string test
   */
  class SieveStringTestUI extends SieveTestDialogBoxUI {

    /**
     * @returns {SieveStringList}
     *   the element's keys
     */
    keys() {
      return this.getSieve().getElement("keys");
    }

    /**
     * @returns {SieveStringList}
     *   the element's sources
     */
    sources() {
      return this.getSieve().getElement("sources");
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
      return "./variables/templates/SieveStringTestUI.html";
    }

    /**
     * @inheritdoc
     */
    onSave() {

      (new SieveStringListWidget("#sivVariablesSourceList"))
        .save(this.sources());
      (new SieveStringListWidget("#sivVariablesKeyList"))
        .save(this.keys());

      (new SieveMatchTypeWidget("#sivVariablesMatchTypes"))
        .save(this.matchtype());
      (new SieveComparatorWidget("#sivVariablesComparator"))
        .save(this.comparator());

      return true;
    }

    /**
     * @inheritdoc
     */
    onLoad() {

      (new SieveStringListWidget("#sivVariablesSourceList"))
        .init(this.sources());
      (new SieveStringListWidget("#sivVariablesKeyList"))
        .init(this.keys());

      (new SieveMatchTypeWidget("#sivVariablesMatchTypes"))
        .init(this.matchtype());
      (new SieveComparatorWidget("#sivVariablesComparator"))
        .init(this.comparator());
    }

    /**
     * @inheritdoc
     */
    getSummary() {
      return $("<div/>")
        .html(" string " + $('<em/>').text(this.sources().values()).html()
          + " " + this.matchtype().getElement().toScript()
          + " " + $('<em/>').text(this.keys().values()).html());

    }
  }

  if (!SieveDesigner)
    throw new Error("Could not register Body Extension");

  SieveDesigner.register2(SieveModifierLengthWidget);
  SieveDesigner.register2(SieveModifierQuotewildcardWidget);

  SieveDesigner.register("action/set", SieveSetActionUI);
  SieveDesigner.register("test/string", SieveStringTestUI);

})(window);
