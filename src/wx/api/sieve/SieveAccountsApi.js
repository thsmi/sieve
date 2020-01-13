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

  /* global ExtensionCommon */
  /* global Components */

  const Cc = Components.classes;
  const Ci = Components.interfaces;

  /**
   * Get the incoming server for the given account id.
   *
   * @param {string} account
   *   the account id
   * @returns {Components.interfaces.nsIMsgAccountManager}
   *   a reference to the incoming server.
   */
  function getIncomingServer(account) {
    return Cc['@mozilla.org/messenger/account-manager;1']
      .getService(Ci.nsIMsgAccountManager)
      .getAccount(account)
      .incomingServer;
  }

  /**
   * Implements a webextension api for sieve session and connection management.
   */
  class SieveAccountsApi extends ExtensionCommon.ExtensionAPI {
    /**
     * @inheritdoc
     */
    getAPI() {

      return {
        sieve: {
          accounts: {

            async getPrettyName(id) {
              return await getIncomingServer(id).prettyName;
            },

            async getPassword(id) {
              const server = getIncomingServer(id);

              // in case the passwordPromptRequired attribute is true...
              // ... thunderbird will take care on retrieving a valid password...
              if (server.passwordPromptRequired === false)
                return await server.password;

              return await undefined;
            },

            async getUsername(id) {
              return await getIncomingServer(id).realUsername;
            },

            async getHostname(id) {
              return await getIncomingServer(id).realHostName;
            }
          }
        }
      };
    }
  }

  exports.SieveAccountsApi = SieveAccountsApi;

})(this);
