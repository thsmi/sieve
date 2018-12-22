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

  const Cc = Components.classes;
  const Ci = Components.interfaces;

  /* global Components */

  const PROXY_TYPE_NONE = 0;
  const PROXY_TYPE_SYSTEM = 1;
  const PROXY_TYPE_SOCKS4 = 2;
  const PROXY_TYPE_SOCKS5 = 3;

  const CONFIG_PROXY_TYPE = "proxy.type";
  const CONFIG_SOCKS4 = "proxy.socks4";
  const CONFIG_SOCKS5 = "proxy.socks5";

  const DEFAULT_TIMEOUT = 4294967295;

  const MIN_PORT = 0;
  const MAX_PORT = 65535;

  const { SieveAbstractMechanism } = require("./settings/SieveAbstractMechanism.js");

  /**
   * An base class common for all proxy  mechanisms
   **/
  class SieveAbstractProxy {

    /**
     * Create a new instance.
     * @param {int} type
     *   the accounts unique identifier.
     * @param {SieveAccount} account
     *   a reference to the parent sieve account.
     */
    constructor(type, account) {
      this.type = type;
      this.account = account;
    }

    /**
     * Returns the proxy information.
     *
     * @returns {Object}
     *   the proxy information
     **/
    getProxyInfo() {
      throw new Error("Implement getProxyInfo");
    }

    /**
     * Each proxy type has an unique identifier.
     *
     * @returns {int}
     *   the identifier as int.
     */
    getType() {
      return this.type;
    }
  }

  /**
   * Mechanism for a direct connection without a proxy.
   **/
  class SieveNoProxy extends SieveAbstractProxy {

    /**
     * @inheritdoc
     **/
    getProxyInfo() {
      return [];
    }
  }

  /**
   * Mechanism for a connection which uses the operating system'S default configuration
   **/
  class SieveSystemProxy extends SieveAbstractProxy {

    /**
     * @inheritdoc
     **/
    getProxyInfo() {
      return null;
    }
  }

  /**
   * Mechanism for a socks v4 proxy connection
   **/
  class SieveSocks4Proxy extends SieveAbstractProxy {

    /**
     * @returns {string}
     *   returns the configuration key
     */
    getPrefKey() {
      return CONFIG_SOCKS4;
    }

    /**
     * @returns {string}
     *   the socks proxy hostname
     **/
    getHost() {
      return this.account.prefs.getString(this.getPrefKey() + ".host", "localhost");
    }

    /**
     * @param {string} host
     *   sets the proxy's hostname
     *
     */
    setHost(host) {
      this.account.prefs.setString(this.getPrefKey() + ".host", host);
    }

    /**
     * @returns {string}
     *   the proxy's port
     */
    getPort() {
      return this.account.prefs.getString(this.getPrefKey() + ".port", "1080");
    }

    /**
     * Specifies on which TCP/IP Port the socks Proxy is listening.
     * @param {string|int} port
     *   the port as integer
     *
     */
    setPort(port) {
      port = parseInt(port, 10);

      if (isNaN(port))
        throw new Error("Invalid port number");

      if ((port < MIN_PORT) || (port > MAX_PORT))
        throw new Error("Invalid port number");

      this.account.prefs.setString(this.getPrefKey() + ".port", "" + port);
    }

    /**
     * @inheritdoc
     **/
    getProxyInfo() {
      // generate proxy info
      let pps = Cc["@mozilla.org/network/protocol-proxy-service;1"]
        .getService(Ci.nsIProtocolProxyService);
      return [pps.newProxyInfo("socks4", this.getHost(), this.getPort(), 0, DEFAULT_TIMEOUT, null)];
    }
  }

  /**
   * Mechanism for a socks v5 proxy connection
   *
   * Socks v5 is mostly similar to socks v4 with a tiny difference.
   * With socks 5 your cab specify if the dns shall be resolved locally or on the remote device.
   **/
  class SieveSocks5Proxy extends SieveSocks4Proxy {

    /**
     * @inheritdoc
     **/
    getPrefKey() {
      return CONFIG_SOCKS5;
    }

    /**
     * @returns {boolean}
     *   true in case the remote dns shall be used otherwise false.
     */
    usesRemoteDNS() {
      return this.account.prefs.getBoolean(this.getPrefKey() + ".remote_dns", true);
    }

    /**
     * Enables or disables using a remote dns.
     *
     * @param {boolean} enabled
     *  if true the remote dns is used, if false the local dns is used.
     *
     */
    setRemoteDNS(enabled) {
      this.account.prefs.setBoolean(this.getPrefKey() + ".remote_dns", enabled);
    }

    /**
     * @inheritdoc
     **/
    getProxyInfo() {
      // generate proxy info
      let pps = Cc["@mozilla.org/network/protocol-proxy-service;1"]
        .getService(Ci.nsIProtocolProxyService);

      return [pps.newProxyInfo("socks", this.getHost(), this.getPort(), (this.usesRemoteDNS() ? (1 << 0) : 0), DEFAULT_TIMEOUT, null)];
    }
  }


  /**
   * A transparent wraper needed to deal with the different
   * host mechanism which are provided by electron and thunderbird.
   **/
  class SieveProxy extends SieveAbstractMechanism {

    /**
     * @inheritdoc
     **/
    getKey() {
      return CONFIG_PROXY_TYPE;
    }

    /**
     * @inheritdoc
     **/
    getDefault() {
      return PROXY_TYPE_SYSTEM;
    }

    /**
     * @inheritdoc
     */
    hasMechanism(type) {
      switch (type) {
        case PROXY_TYPE_NONE:
        case PROXY_TYPE_SOCKS4:
        case PROXY_TYPE_SOCKS5:
        case PROXY_TYPE_SYSTEM:
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
        case PROXY_TYPE_NONE:
          return new SieveNoProxy(PROXY_TYPE_NONE, this.account);

        case PROXY_TYPE_SOCKS4:
          return new SieveSocks4Proxy(PROXY_TYPE_SOCKS4, this.account);

        case PROXY_TYPE_SOCKS5:
          return new SieveSocks5Proxy(PROXY_TYPE_SOCKS5, this.account);

        case PROXY_TYPE_SYSTEM:
        // fall through
        default:
          return new SieveSystemProxy(PROXY_TYPE_SYSTEM, this.account);
      }
    }
  }

  exports.SieveProxy = SieveProxy;

})(module.exports);
