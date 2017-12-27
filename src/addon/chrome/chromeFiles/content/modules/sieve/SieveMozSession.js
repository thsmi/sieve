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

/* global SieveAbstractSession */
/* global SieveAccountManager */
/* global SieveLogger */

/* global SieveSetActiveRequest */
/* global SievePutScriptRequest */
/* global SieveGetScriptRequest */
/* global SieveNoopRequest */
/* global SieveCapabilitiesRequest */
/* global SieveSaslPlainRequest */
/* global SieveSaslCramMd5Request */
/* global SieveSaslScramSha1Request */
/* global SieveSaslScramSha256Request */
/* global SieveSaslExternalRequest */
/* global SieveSaslLoginRequest */
/* global SieveInitRequest */
/* global SieveCheckScriptRequest*/
/* global SieveLogoutRequest */
/* global SieveStartTLSRequest */
/* global SieveDeleteScriptRequest */
/* global SieveRenameScriptRequest */
/* global SieveListScriptRequest */

/* global Sieve */

// Enable Strict Mode
"use strict";


// TODO Split logic into classes representing the atomar states
// disconnected -> [connecting] -> connected -> [disconnecting] -> disconnected
//                              -> disconnected
//
// disconnected.connect(onSucces, onError);
// disconnected.disconnect(onSuccess);
//

/* global Components */

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
const Cu = Components.utils;


// pre load modules .
Cu.import("chrome://sieve/content/modules/sieve/SieveMozLogger.js");

Cu.import("chrome://sieve/content/modules/sieve/SieveAccounts.js");
Cu.import("chrome://sieve/content/modules/sieve/SieveMozClient.js");

(function (exports) {

  // Expose as mozilla module...
  if (!exports.EXPORTED_SYMBOLS)
    exports.EXPORTED_SYMBOLS = [];

  let Cc = Components.classes;
  let Ci = Components.interfaces;

  let loader = Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader);

  loader.loadSubScript("chrome://sieve-common/content/libManageSieve/SieveAbstractSession.js", this, "UTF-8");

  /**
   * This class pools and caches concurrent connections (Channel) to an destinct
   * remote server (Session).
   * Furthermore it's a wrapper around the Sieve object. It implements
   * the login/logout process, a watchdog, an hartbeat an much more.
   *
   * A session can contain arbitary connections, but there will be only one
   * "physical" link to the server. All channels share the session's link.
   *
   * @param {String} accountId
   *   an reference to a sieve account. this is needed to obtain login informations.
   * @param {Object} [sid]
   *   a unique Identifier for this Session. Only needed to make debugging easier.
   *
   * @constructor
   **/
  function SieveSession(accountId, sid) {
    let account = SieveAccountManager.getAccountByName(accountId);

    this.logger = new SieveLogger(sid);
    this.logger.level(account.getSettings().getDebugFlags());
    this.logger.prefix(sid);

    SieveAbstractSession.call(this, account);
  }

  SieveSession.prototype = Object.create(SieveAbstractSession.prototype);
  SieveSession.prototype.constructor = SieveSession;

  SieveSession.prototype.getLogger = function () {
    return this.logger;
  };

  SieveSession.prototype.initClient = function () {
    this.sieve = new Sieve(this.getLogger());
  };

  SieveSession.prototype.createGetScriptRequest = function (script) {
    return new SieveGetScriptRequest(script);
  };

  SieveSession.prototype.createPutScriptRequest = function (script, body) {
    return new SievePutScriptRequest(script, body);
  };

  SieveSession.prototype.createCheckScriptRequest = function (body) {
    return new SieveCheckScriptRequest(body);
  };

  SieveSession.prototype.createSetActiveRequest = function (script) {
    return new SieveSetActiveRequest(script);
  };

  SieveSession.prototype.createCapabilitiesRequest = function () {
    return new SieveCapabilitiesRequest();
  };

  SieveSession.prototype.createDeleteScriptRequest = function (script) {
    return new SieveDeleteScriptRequest(script);
  };

  SieveSession.prototype.createNoopRequest = function () {
    return new SieveNoopRequest();
  };

  SieveSession.prototype.createRenameScriptRequest = function (oldScript, newScript) {
    return new SieveRenameScriptRequest(oldScript, newScript);
  };

  SieveSession.prototype.createListScriptRequest = function () {
    return new SieveListScriptRequest();
  };

  SieveSession.prototype.createStartTLSRequest = function () {
    return new SieveStartTLSRequest();
  };

  SieveSession.prototype.createLogoutRequest = function () {
    return new SieveLogoutRequest();
  };

  SieveSession.prototype.createInitRequest = function () {
    return new SieveInitRequest();
  };

  SieveSession.prototype.createSaslPlainRequest = function () {
    return new SieveSaslPlainRequest();
  };

  SieveSession.prototype.createSaslLoginRequest = function () {
    return new SieveSaslLoginRequest();
  };

  SieveSession.prototype.createSaslCramMd5Request = function () {
    return new SieveSaslCramMd5Request();
  };

  SieveSession.prototype.createSaslScramSha1Request = function () {
    return new SieveSaslScramSha1Request();
  };

  SieveSession.prototype.createSaslScramSha256Request = function () {
    return new SieveSaslScramSha256Request();
  };

  SieveSession.prototype.createSaslExternalRequest = function () {
    return new SieveSaslExternalRequest();
  };

  SieveSession.prototype.onTimeout
    = function (message) {
      let ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);

      if (ioService.offline) {
        this._invokeListeners("onOffline");
        return;
      }

      this._invokeListeners("onTimeout", message);
    };

  // Needed for Bad Cert Listener....
  SieveSession.prototype.QueryInterface
    = function badcert_queryinterface(aIID) {
      if (aIID.equals(Ci.nsISupports))
        return this;

      if (aIID.equals(Ci.nsIBadCertListener2))
        return this;

      if (aIID.equals(Ci.nsIInterfaceRequestor))
        return this;

      throw Components.results.NS_ERROR_NO_INTERFACE;
    };

  // Ci.nsIInterfaceRequestor
  SieveSession.prototype.getInterface
    = function (aIID) {
      return this.QueryInterface(aIID);
    };

  /**
   * Implements the nsIBadCertListener2 which is used to override the "bad cert" dialog.
   *
   * Thunderbird alway closes the connection after an certificate error. Which means
   * in case we endup here we need to reconnect after resolving the cert error.
   *
   * @param {Object} socketInfo
   *   the socket info object
   * @param {Object} sslStatus
   *   the ssl status
   * @param {String} targetSite
   *   the traget site which cause the ssl error
   * @return {Boolean}
   *   true in case we handled the notify otherwise false.
   */
  SieveSession.prototype.notifyCertProblem
    = function (socketInfo, sslStatus, targetSite) {
      this.getLogger().log("Sieve BadCertHandler: notifyCertProblem");

      // no listener registert, show the default UI
      if (!this._hasListeners("onBadCert"))
        return false;

      this._invokeListeners("onBadCert", targetSite, sslStatus);
      return true;
    };

  exports.SieveSession = SieveSession;
  exports.EXPORTED_SYMBOLS.push("SieveSession");

})(this);
