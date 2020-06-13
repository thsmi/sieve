/*
 * The content of this file is licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via
 * email from the author.
 *
 * Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */


(function (exports) {

  "use strict";

  const { SieveAbstractTimer } = require("./SieveAbstractTimer.js");

  /**
   * WebSocket live typically inside a window like javascript context.
   *
   * This provides access to the the typical setTimeout and clearTimeout
   * methods.
   */
  class SieveWebSocketTimer extends SieveAbstractTimer {

    /**
     * @inheritdoc
     */
    start(callback, ms) {
      this.cancel();

      if (ms === 0)
        return;

      this.timer = window.setTimeout(callback, ms);
    }

    /**
     * @inheritdoc
     */
    cancel() {
      if (!this.timer)
        return;

      window.clearTimeout(this.timer);
      this.timer = null;
    }
  }

  exports.SieveTimer = SieveWebSocketTimer;

})(this);
