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

  /* global Components */
  const Cc = Components.classes;
  const Ci = Components.interfaces;

  const HOST_TYPE_IMAP = 0;
  const HOST_TYPE_CUSTOM = 1;

  const CONFIG_HOST_TYPE = "activeHost";

  const { SieveAbstractMechanism } = require("./settings/SieveAbstractMechanism.js");
  const { SieveAbstractHost, SieveCustomHost } = require("./settings/SieveAbstractHost.js");


  /**
   * This class loads the hostname from an IMAP account. The hostname is not
   * cached it. This ensures that always the most recent settings are used.
   */
  class SieveImapHost extends SieveAbstractHost {

    /**
     * @inheritdoc
     **/
    getHostname() {

      let imapKey = this.account.getKey();

      // use the IMAP Key to load the Account...
      return Cc['@mozilla.org/messenger/account-manager;1']
        .getService(Ci.nsIMsgAccountManager)
        .getIncomingServer(imapKey)
        .realHostName;
    }
  }



  /**
   * A transparent wraper needed to deal with the different
   * host mechanism which are provided by electron and thunderbird.
   **/
  class SieveHost extends SieveAbstractMechanism {

    /**
     * @inheritdoc
     **/
    getKey() {
      return CONFIG_HOST_TYPE;
    }

    /**
     * @inheritdoc
     **/
    getDefault() {
      return HOST_TYPE_IMAP;
    }

    /**
     * @inheritdoc
     */
    hasMechanism(type) {
      switch (type) {
        case HOST_TYPE_IMAP:
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
        case HOST_TYPE_CUSTOM:
          return new SieveCustomHost(HOST_TYPE_CUSTOM, this.account);

        case HOST_TYPE_IMAP:
        // fall through
        default:
          return new SieveImapHost(HOST_TYPE_IMAP, this.account);
      }
    }

  }

  exports.SieveHost = SieveHost;

})(module.exports);
