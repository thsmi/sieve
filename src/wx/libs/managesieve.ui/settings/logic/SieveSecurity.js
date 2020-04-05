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

  /**
   * Defines the security related settings for an account.
   * It is a minimal, mozilla specific implementation.
   */
  class SieveSecurity {

    /**
     * @inheritdoc
     */
    async isSecure() {
      return await true;
    }

    /**
     * @inheritdoc
     */
    async getMechanism() {
      return await "default";
    }
  }


  // Require modules need to use export.module
  if (typeof (module) !== "undefined" && module && module.exports)
    module.exports.SieveSecurity = SieveSecurity;
  else
    exports.SieveSecurity = SieveSecurity;

})(this);
