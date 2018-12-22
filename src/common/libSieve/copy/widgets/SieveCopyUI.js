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
  /* global SieveOverlayItemWidget */

  if (!SieveDesigner)
    throw new Error("Could not register Copy Extension");

  const DOM_ELEMENT = 0;

  /**
   * Implements an abstract overlay widget which is used by
   * the copy overlay for the fileinto action as well as the
   * redirect action.
   */
  class SieveAbstractCopyWidget extends SieveOverlayItemWidget {

    /**
     * @inheritdoc
     **/
    getTemplate() {
      return "./copy/templates/SieveCopyTag.html";
    }

    /**
     * @inheritdoc
     */
    static isCapable(capabilities) {
      return capabilities.hasCapability("copy");
    }

    /**
     * @inheritdoc
     */
    load(sivElement) {
      if (sivElement.enable("copy"))
        $("#sivCopyCheckbox").attr("checked", "checked");
    }

    /**
     * @inheritdoc
     */
    save(sivElement) {
      if ($("#sivCopyCheckbox")[DOM_ELEMENT].checked)
        sivElement.enable("copy", true);
      else
        sivElement.enable("copy", false);
    }

    /**
     * @inheritdoc
     */
    getElement() {
      return $("" + this.selector);
    }
  }

  /**
   * Implements an overlay for the copy fileinto overlay.
   */
  class SieveCopyFileIntoWidget extends SieveAbstractCopyWidget {

    /**
     * @inheritdoc
     */
    static nodeType() {
      return "action/fileinto/";
    }
    /**
     * @inheritdoc
     */
    static nodeName() {
      return "action/fileinto/copy";
    }
  }


  /**
   * Implements an overlay for the copy redirect overlay
   */
  class SieveCopyRedirectWidget extends SieveAbstractCopyWidget {

    /**
     * @inheritdoc
     */
    static nodeType() {
      return "action/redirect/";
    }

    /**
     * @inheritdoc
     */
    static nodeName() {
      return "action/redirect/copy";
    }
  }

  SieveDesigner.register2(SieveCopyFileIntoWidget);
  SieveDesigner.register2(SieveCopyRedirectWidget);

})(window);
