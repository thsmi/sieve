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
  const STATE_SERVER_ERROR = 4;


  const Cc = Components.classes;
  const Ci = Components.interfaces;

  const { Sieve } = require("./SieveClient.js");
  const { SieveAbstractSession } = require("./SieveAbstractSession.js");

  /**
   * This class pools and caches concurrent connections (Channel) to an destinct
   * remote server (Session).
   *
   * Furthermore it's a wrapper around the Sieve object. It implements
   * the login/logout process, a watchdog, an hartbeat an much more.
   *
   * A session can contain arbitary connections, but there will be only one
   * "physical" link to the server. All channels share the session's link.
   *
   **/
  class SieveSession extends SieveAbstractSession {

    /**
     * @inheritdoc
     */
    getSieve() {
      return this.sieve;
    }

    /**
     * @inheritdoc
     */
    createSieve() {
      this.sieve = new Sieve(this.getLogger());
    }

    /**
     * @inheritdoc
     */
    destroySieve() {
      this.sieve = null;
    }


    /** @private */
    async onError(response) {
      this.getLogger().log("OnError: " + response.getMessage());
      await this.disconnect(false, STATE_SERVER_ERROR, response.getMessage());
    }


    onTimeout(message) {
      const ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);

      if (ioService.offline) {
        this._invokeListeners("onOffline");
        return;
      }

      this._invokeListeners("onTimeout", message);
    }

    // Needed for Bad Cert Listener....
    QueryInterface(aIID) {
      if (aIID.equals(Ci.nsISupports))
        return this;

      if (aIID.equals(Ci.nsIBadCertListener2))
        return this;

      if (aIID.equals(Ci.nsIInterfaceRequestor))
        return this;

      throw Components.results.NS_ERROR_NO_INTERFACE;
    }

    // Ci.nsIInterfaceRequestor
    getInterface(aIID) {
      return this.QueryInterface(aIID);
    }

    /**
     * Implements the nsIBadCertListener2 which is used to override the "bad cert" dialog.
     *
     * Thunderbird alway closes the connection after an certificate error. Which means
     * in case we endup here we need to reconnect after resolving the cert error.
     *
     * @param {object} socketInfo
     *   the socket info object
     * @param {object} sslStatus
     *   the ssl status
     * @param {string} targetSite
     *   the traget site which cause the ssl error
     * @returns {boolean}
     *   true in case we handled the notify otherwise false.
     */
    notifyCertProblem(socketInfo, sslStatus, targetSite) {
      this.getLogger().log("Sieve BadCertHandler: notifyCertProblem");

      // no listener registert, show the default UI
      if (!this._hasListeners("onBadCert"))
        return false;

      this._invokeListeners("onBadCert", targetSite, sslStatus);
      return true;
    }

    getExtensions() {
      return this.sieve.extensions;
    }

    getCompatibility() {
      return this.getSieve().getCompatibility();
    }
  }

  exports.SieveSession = SieveSession;

})(module.exports);
