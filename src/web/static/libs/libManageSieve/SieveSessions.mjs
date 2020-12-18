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


import { SieveSession } from "./SieveSession.mjs";

/**
 * Manages Sieve session.
 *
 * Sessions are identified by a unique id.
 * As the account id unique, it is typically
 * used as session id.
 */
class SieveWebSocketSessions {

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

    authentication.username = await (await account.getAuthentication()).getUsername();

    if (hasPassword)
      authentication.password = await (await account.getAuthentication()).getPassword();

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
    return await (await account.getAuthorization()).getAuthorization();
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

    const host = await account.getHost();
    const security = await account.getSecurity();
    // const settings = await account.getSettings();

    const options = {
      secure: await security.isSecure(),
      sasl: await security.getMechanism(),
      keepAlive: await host.getKeepAlive(),
      // FIXME: Load dynamically.
      logLevel: 0xFF
    };

    const session = new SieveSession(id, options);

    session.on("authenticate", async (hasPassword) => { return await this.onAuthenticate(account, hasPassword); });
    session.on("authorize", async () => { return await this.onAuthorize(account); });

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

export { SieveWebSocketSessions as SieveSessions };
