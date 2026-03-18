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

              // passwordPromptRequired is false when Thunderbird already has a
              // stored password for this account. In that case server.password
              // returns the stored value directly. If the user has not yet been
              // prompted (or the password was removed), we return undefined and
              // let the caller deal with a missing password.
              if (server.passwordPromptRequired === false)
                return await server.password;

              return await undefined;
            },

            async getUsername(id) {
              // TB 128+: realUsername was removed; use username instead.
              return await getIncomingServer(id).username;
            },

            async getHostname(id) {
              // TB 128+: realHostName was removed; use hostName instead.
              return getIncomingServer(id).hostName;
            }
          }
        }
      };
    }
  }

  exports.SieveAccountsApi = SieveAccountsApi;

})(this);
