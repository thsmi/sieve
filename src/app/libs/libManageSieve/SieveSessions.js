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

  const { SieveSession } = require("./SieveSession.js");

  /**
   * Manages Sieve session.
   *
   * Sessions are identified by a unique id.
   * As the account id unique, it is typically
   * used as session id.
   */
  class SieveSessions {

    /**
     * creates a new instance
     */
    constructor() {
      this.sessions = new Map();
    }

    /**
     * Check if the id it a known session.
     *
     * @param {string} id
     *   the session id
     * @returns {boolean}
     *   true in case the id is a known session otherwise false.
     */
    has(id) {
      return this.sessions.has(id);
    }

    /**
     * Returns the session with the given id.
     * In case the id is unknown an exception is thrown.
     *
     * @param {string} id
     *   the session id
     * @returns {SieveSession}
     *   the session or an exception.
     */
    get(id) {
      if (!this.has(id))
        throw new Error(`Unknown session id ${id}`);

      return this.sessions.get(id);
    }

    /**
     * Called when an authentication is needed
     *
     * @param {SieveAccount} account
     *   the account which should be authenticated.
     * @param {boolean} hasPassword
     *   true if the password is needed otherwise false.
     * @returns {object}
     *   an object the the username and optionally the password.
     */
    async onAuthenticate(account, hasPassword) {

      const authentication = {};

      authentication.username = account.getAuthentication().getUsername();

      if (hasPassword)
        authentication.password = await account.getAuthentication().getPassword();

      return authentication;
    }

    /**
     * Called when an authorization is needed.
     *
     * @param {SieveAccount} account
     *   the account which should be authorized.
     * @returns {string}
     *   the user name to be authorized as or an empty string.
     */
    async onAuthorize(account) {
      return await account.getAuthorization().getAuthorization();
    }

    /**
     * Called when a proxy lookup is needed.
     *
     * @param {SieveAccount} account
     *   the current account.
     * @returns {object}
     *   the proxy information.
     */
    async onProxyLookup(account) {
      return await account.getProxy().getProxyInfo();
    }


    /**
     * Creates a new session for the given id.
     * In case the session id is in use. It will
     * terminate the connection, and recreate a
     * new session.
     *
     * @param {string} id
     *   the unique session id
     * @param {SieveAccount} account
     *   the account with the session's configuration
     */
    async create(id, account) {

      await this.destroy(id);

      const options = {
        secure : account.getSecurity().isSecure(),
        sasl : account.getSecurity().getMechanism(),
        keepAlive : (account.getSettings().isKeepAlive()) ? account.getSettings().getKeepAliveInterval() : 0,
        logLevel : account.getSettings().getDebugFlags(),
        certFingerprints : account.getHost().getFingerprint(),
        certIgnoreError : account.getHost().getIgnoreCertErrors()
      };

      const session = new SieveSession(id, options);

      session.on("authenticate", async (hasPassword) => { return await this.onAuthenticate(account, hasPassword); });
      session.on("authorize", async () => { return await this.onAuthorize(account); });
      session.on("proxy", async (host, port) => { return await this.onProxyLookup(account, host, port); });

      this.sessions.set(id, session);
    }

    /**
     * Destroy the session for the given id.
     * If active it will disconnect from the server.
     *
     * @param {string} id
     *   the unique session id
     */
    async destroy(id) {
      if (this.has(id))
        await this.get(id).disconnect();

      this.sessions.delete(id);
    }

  }

  if (module.exports)
    module.exports.SieveSessions = SieveSessions;
  else
    exports.SieveSessions = SieveSessions;

})(this);
