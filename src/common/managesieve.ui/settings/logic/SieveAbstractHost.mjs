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

const PORT_SIEVE_RFC = 4190;
const CONFIG_HOST_PORT = "port";

/**
 * An abstract implementation for the host settings.
 * They define the hostname as well as the port.
 **/
class SieveAbstractHost {

  /**
   * Gets the hostname for this account
   * @abstract
   *
   * @returns {string}
   *   the hostname as string.
   */
  async getHostname() {
    throw new Error("Implement getHostname");
  }

  /**
   * Returns the port for this configuration.
   * @abstract
   *
   * @returns {int}
   *   the port as integer for this account.
   */
  async getPort() {
    throw new Error("Implement getPort()");
  }

  /**
   * Gets the maximum idle time after a message is send
   * @abstract
   *
   * @returns {int}
   *  the maximum idle time in seconds.
   *  zero indicates keep alive messages are disabled
   **/
  async getKeepAlive() {
    throw new Error("Implement getKeepAlive()");
  }

}

/**
 * This Class manages a custom host setting for a Sieve Account. Sieve Accounts
 * are identified by URIs.
 */
class SieveCustomHost extends SieveAbstractHost {

  /**
   * Creates a new instance.
   *
   * @param {SieveAccount} account
   *   a reference to the parent sieve account.
   */
  constructor(account) {
    super();
    this.account = account;
  }


  /**
   * @inheritdoc
   */
  async getPort() {
    return await (this.account.getConfig().getInteger(CONFIG_HOST_PORT, PORT_SIEVE_RFC));
  }

  /**
   * Configures the TCP Port which sieve should use.
   *
   *  @param {string} port
   *   the port number as string. In case it is no number or an invalid
   *   number it will silently fall back to the default port
   *
   *  @returns {SieveAbstractHost}
   *   a self reference
   */
  async setPort(port) {
    port = parseInt(port, 10);

    if (isNaN(port))
      port = PORT_SIEVE_RFC;

    await this.account.getConfig().setInteger(CONFIG_HOST_PORT, port);
    return this;
  }
}


export {
  SieveCustomHost,
  SieveAbstractHost
};
