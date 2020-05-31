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

  /* global SieveTemplate */

  const MAX_QUOTE_LEN = 240;

  /**
   * Provides a ui for the set action
   */
  class SieveSetActionUI extends SieveActionDialogBoxUI {

    /**
     * The variable's name
     *
     * @returns {SieveString}
     *   the element's name
     */
    name() {
      return this.getSieve().getElement("name");
    }

    /**
     * The variable's value
     *
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
      const item = document.querySelector("#sivVariableName");

      if (!item.checkValidity())
        return false;

      this.name().value(item.value);
      this.value().value(document.querySelector("#sivVariableValue").value);

      (new SieveOverlayWidget("modifier/", "#sivModifier"))
        .save(this.getSieve());

      let status;
      let value = null;

      value = null;
      status = $("input[type='checkbox'][name='30']").is(":checked");
      if (status)
        value = $(`input[type="radio"][name='30']:checked`).val();

      this.getSieve().getElement("modifier/30").setElement(value);
      this.getSieve().enable("modifier/30", status);

      value = null;
      status = $("input[type='checkbox'][name='40']").is(":checked");
      if (status)
        value = $(`input[type="radio"][name='40']:checked`).val();

      this.getSieve().getElement("modifier/40").setElement(value);
      this.getSieve().enable("modifier/40", status);

      return true;
    }

    /**
     * @inheritdoc
     */
    async onLoad() {

      const widget = (new SieveOverlayWidget("modifier/", "#sivModifier"));
      await widget.init(this.getSieve());

      // Sort the selectors...
      let modifiers = document.querySelectorAll(`${widget.selector} .sieve-modifier`);
      modifiers = Array.from(modifiers).sort((lhs, rhs) => {
        rhs = rhs.querySelector("input[type='checkbox'][name^='modifier/']").name;
        lhs = lhs.querySelector("input[type='checkbox'][name^='modifier/']").name;

        return rhs.localeCompare(lhs);
      });

      for (const modifier of modifiers)
        document.querySelector(`${widget.selector}`).appendChild(modifier);

      let state = null;

      state = this.getSieve().enable("modifier/30");
      $('input[type="checkbox"][name="30"]')
        .change(function () { $('input[type="radio"][name="30"]').prop('disabled', !($(this).prop('checked'))); })
        .prop('checked', state)
        .change();

      if (state)
        $('input[type="radio"][name="30"][value="' + this.getSieve().getElement("modifier/30").toScript() + '"]').prop('checked', true);

      state = this.getSieve().enable("modifier/40");
      $('input[type="checkbox"][name="40"]')
        .change(function () { $('input[type="radio"][name="40"]').prop('disabled', !($(this).prop('checked'))); })
        .prop('checked', state)
        .change();

      if (state)
        $('input[type="radio"][name="40"][value="' + this.getSieve().getElement("modifier/40").toScript() + '"]').prop('checked', true);

      document.querySelector("#sivVariableName").value = this.name().value();
      document.querySelector("#sivVariableValue").value = this.value().value();
    }

    /**
     * @inheritdoc
     */
    getSummary() {
      const FRAGMENT =
        `<div>
         <span data-i18n="set.summary1"></span>
         <em class="sivSetVariable"></em>
         <span data-i18n="set.summary2"></span>
         <div><em class="sivSetValue"></em></div>
       </div>`;

      const elm = (new SieveTemplate()).convert(FRAGMENT);
      elm.querySelector(".sivSetVariable").textContent
        = this.name().value();
      elm.querySelector(".sivSetValue").textContent
        = this.value().quote(MAX_QUOTE_LEN);
      return elm;
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
        document.querySelector("#cbxModifier10").checked = true;
    }

    /**
     * @inheritdoc
     */
    save(sivElement) {

      let value = null;
      const status = document.querySelector("#cbxModifier10").checked;
      if (status)
        value = document.querySelector("#cbxModifier10").value;

      sivElement.getElement("modifier/10").setElement(value);
      sivElement.enable("modifier/10", status);
    }
  }

  /**
   * Implements an abstract overlay widget which is used by
   * the copy overlay for the fileinto action as well as the
   * redirect action.
   */
  class SieveModifierQuoteWildcardWidget extends SieveOverlayItemWidget {

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
        document.querySelector("#cbxModifier20").checked = true;
    }

    /**
     * @inheritdoc
     */
    save(sivElement) {

      let value = null;
      const status = document.querySelector("#cbxModifier20").checked;
      if (status)
        value = document.querySelector("#cbxModifier20").value;

      sivElement.getElement("modifier/20").setElement(value);
      sivElement.enable("modifier/20", status);
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
     * Gets a reference to the active match-type
     *
     * @returns {SieveAbstractElement}
     *   the element's matchtype
     */
    matchtype() {
      return this.getSieve().getElement("match-type");
    }

    /**
     * Gets a reference to the active comparator.
     *
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
      const FRAGMENT =
        `<div>
           <span data-i18n="string.summary"></span>
           <em class="sivStringSources"></em>
           <span class="sivStringMatchType"></span>
           <em class="sivStringValue"></em>
         </div>`;

      const elm = (new SieveTemplate()).convert(FRAGMENT);
      elm.querySelector(".sivStringSources").textContent
        = this.sources().values();
      elm.querySelector(".sivStringMatchType").textContent
        = this.matchtype().getElement().toScript();
      elm.querySelector(".sivStringValue").textContent
        = this.keys().values();

      return elm;
    }
  }

  if (!SieveDesigner)
    throw new Error("Could not register Body Extension");

  SieveDesigner.register2(SieveModifierLengthWidget);
  SieveDesigner.register2(SieveModifierQuoteWildcardWidget);

  SieveDesigner.register("action/set", SieveSetActionUI);
  SieveDesigner.register("test/string", SieveStringTestUI);

})(window);
