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

  const PORT_SIEVE_RFC = 4190;
  const PORT_SIEVE_OLD = 2000;

  const TYPE_RFC = 0;
  const TYPE_OLD = 1;
  const TYPE_CUSTOM = 2;

  const CONFIG_HOST_PORT_TYPE = "port.type";
  const CONFIG_HOST_PORT = "port";

  const CONFIG_KEEP_ALIVE_INTERVAL = "keepalive";

  // eslint-disable-next-line no-magic-numbers
  const ONE_MINUTE = 60 * 1000;
  // eslint-disable-next-line no-magic-numbers
  const FIVE_MINUTES = 5 * ONE_MINUTE;


  /**
   * An abstract implementation for the host settings.
   * They define the hostname as well as the port.
   **/
  class SieveAbstractHost {

    /**
     * Creates a new instance.
     *
     * @param {int} type
     *   the accounts unique identifier.
     * @param {SieveAccount} account
     *   a reference to the parent sieve account.
     */
    constructor(type, account) {
      this.account = account;
      this.type = type;
    }

    /**
     * Gets the hostname for this account
     * @abstract
     * @returns {string}
     *   the hostname as string.
     */
    getHostname() {
      throw new Error("Implement getHostname");
    }

    /**
     * Returns the port for this configuration.
     *
     * @param {int} [type]
     *   Use zero to get the standard port 4190.
     *   One returns the old port 2000.
     *   And two the currently configured port.
     *   if omitted the port for the current type is returned
     *
     * @returns {int}
     *   the port as integer for this account.
     */
    async getPort(type) {

      if (typeof (type) === "undefined" || type === null)
        type = await this.account.getConfig().getInteger(CONFIG_HOST_PORT_TYPE, TYPE_RFC);

      if (type === TYPE_CUSTOM)
        return await this.account.getConfig().getInteger(CONFIG_HOST_PORT, PORT_SIEVE_RFC);

      if (type === TYPE_OLD)
        return PORT_SIEVE_OLD;

      return PORT_SIEVE_RFC;
    }

    /**
     * Configures the TCP Port which sieve should use.
     *
     *  @param {string} port
     *   the port number as string.
     *
     *  @returns {SieveAbstractHost}
     *   a self reference
     */
    async setPort(port) {
      let type = TYPE_CUSTOM;

      if (port === PORT_SIEVE_RFC)
        type = TYPE_RFC;
      else if (port === PORT_SIEVE_OLD)
        type = TYPE_OLD;

      await this.account.getConfig().setInteger(CONFIG_HOST_PORT_TYPE, type);

      if (type !== TYPE_CUSTOM)
        return this;

      port = parseInt(port, 10);

      if (isNaN(port))
        port = PORT_SIEVE_RFC;

      await this.account.getConfig().setInteger(CONFIG_HOST_PORT, port);
      return this;
    }

    /**
     * Each host type has an unique identifier.
     *
     * @returns {int}
     *   the identifier as int.
     */
    getType() {
      return this.type;
    }

    /**
     * Configures the maximum idle time after a message is send.
     * In case the time span elapsed an keep alive message will be
     * send to the server.
     *
     * @param {int} value
     *   the maximal time in seconds. zero disables keep alive messages
     *
     * @returns {SieveAbstractHost}
     *   a self reference
     */
    async setKeepAlive(value) {
      await this.account.getConfig().setInteger(CONFIG_KEEP_ALIVE_INTERVAL, value);
      return this;
    }

    /**
     * Gets the maximum idle time after a message is send
     * @returns {int}
     *  the maximum idle time in seconds.
     *  zero indicates keep alive messages are disabled
     **/
    async getKeepAlive() {
      return await this.account.getConfig().getInteger(CONFIG_KEEP_ALIVE_INTERVAL, FIVE_MINUTES);
    }
  }

  /**
   * This Class manages a custom host setting for a Sieve Account. Sieve Accounts
   * are identified by URIs.
   */
  class SieveCustomHost extends SieveAbstractHost {

    /**
     * @inheritdoc
     **/
    async getHostname() {
      return await this.account.getConfig().getString("hostname", "");
    }

    /**
     * Sets the custom hostname which shall be used.
     *
     * @param {string} hostname
     *   the hostname or ip as string.
     *
     * @returns {SieveCustomHost}
     *   a self reference
     */
    async setHostname(hostname) {
      await this.account.getConfig().setString("hostname", hostname);
      return this;
    }
  }

  if (typeof (module) !== "undefined" && module && module.exports) {
    module.exports.SieveCustomHost = SieveCustomHost;
    module.exports.SieveAbstractHost = SieveAbstractHost;
  } else {
    exports.SieveCustomHost = SieveCustomHost;
    exports.SieveAbstractHost = SieveAbstractHost;
  }

})(this);
