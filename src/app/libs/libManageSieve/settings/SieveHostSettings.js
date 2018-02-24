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

  const HOST_TYPE_CUSTOM = 1;

  const CONFIG_HOST_TYPE = "activeHost";

  const { SieveAbstractMechanism } = require("./SieveAbstractMechanism.js");
  const { SieveCustomHost } = require("./SieveAbstractHost.js");

  class SieveCustomHost2 extends SieveCustomHost {

    getDisplayName() {
      return this.account.prefs.getString("host.displayName", "Unnamed Account");
    }

    setDisplayName(value) {
      this.account.prefs.setString("host.displayName", value);
      return this;
    }

    getFingerprint() {
      return this.account.prefs.getString("host.fingerprint", "");
    }

    setFingerprint(value) {
      this.account.prefs.setString("host.fingerprint", value);
      return this;
    }
  }

  /**
   * A transparent wraper needed to deal with the different
   * host mechanism which are provided by electron and thunderbird.
   **/
  class SieveHost extends SieveAbstractMechanism {

    /**
     * @inheritDoc
     **/
    getKey() {
      return CONFIG_HOST_TYPE;
    }

    /**
     * @inheritDoc
     **/
    getDefault() {
      return HOST_TYPE_CUSTOM;
    }

    /**
     * @inheritDoc
     */
    hasMechanism(type) {
      switch (type) {
        case HOST_TYPE_CUSTOM:
          return true;

        default:
          return false;
      }
    }

    /**
     * @inheritdoc
     */
    getMechanismById(type) {

      switch (type) {
        default:
          return new SieveCustomHost2(HOST_TYPE_CUSTOM, this.account);
      }
    }

  }

  exports.SieveHost = SieveHost;

})(module.exports);
