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
   * Sessions are identified by a uniue id.
   * As the account id unique, it is typically
   * used as ssession id.
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
      if (await this.destroy(id));

      this.sessions.set(id, new SieveSession(account, "sid2"));
    }

    /**
     * Destroy the session for the given id.
     * If active it will disconnect from the server.
     *
     * @param {string} id
     *   the unque session id
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
