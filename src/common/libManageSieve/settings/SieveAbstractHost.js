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

  const CONFIG_HOST_PORT_TYPE = "port.type";
  const CONFIG_HOST_PORT = "port";


  /** */
  class SieveAbstractHost {

    /**
     * Create a new instance.
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
     * @returns {string}
     *   the hostname for this account.
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
     * @returns {int}
     *   the port as integer for this account.s
     */
    getPort(type) {

      if (typeof (type) === "undefined" || type === null)
        type = this.account.prefs.getInteger(CONFIG_HOST_PORT_TYPE, 0);

      if (type === 2)
        return this.account.prefs.getInteger(CONFIG_HOST_PORT, PORT_SIEVE_RFC);

      if (type === 1)
        return PORT_SIEVE_OLD;

      return PORT_SIEVE_RFC;
    }

    /**
     *
     * @param {string} port
     */
    setPort(port) {
      let type = 2;

      if (port === PORT_SIEVE_RFC)
        type = 0;
      else if (port === PORT_SIEVE_OLD)
        type = 1;

      this.account.prefs.setInteger(CONFIG_HOST_PORT_TYPE, type);

      if (type !== 2)
        return;

      port = parseInt(port, 10);

      if (isNaN(port))
        port = PORT_SIEVE_RFC;

      this.account.prefs.setInteger(CONFIG_HOST_PORT, port);
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
  }

  /**
   * This Class manages a custom host setting for a Sieve Account. Sieve Accounts
   * are identified by URIs.
   */
  class SieveCustomHost extends SieveAbstractHost {

    /**
     * @inheritDoc
     **/
    getHostname() {
      return this.account.prefs.getString("hostname", "");
    }

    /**
     * Sets the custom hostname which shall be used.
     *
     * @param {String} hostname
     *   the hostname or ip as string.
     * @return {void}
     */
    setHostname(hostname) {
      this.account.prefs.setString("hostname", hostname);
    }
  }

  exports.SieveCustomHost = SieveCustomHost;
  exports.SieveAbstractHost = SieveAbstractHost;

})(module.exports);
