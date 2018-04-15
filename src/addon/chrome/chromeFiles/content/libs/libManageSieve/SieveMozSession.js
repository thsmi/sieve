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

  const Cc = Components.classes;
  const Ci = Components.interfaces;

  const { SieveLogger } = require("./SieveMozLogger.js");

  const {
    SieveSetActiveRequest,
    SievePutScriptRequest,
    SieveGetScriptRequest,
    SieveNoopRequest,
    SieveCapabilitiesRequest,
    SieveSaslPlainRequest,
    SieveSaslCramMd5Request,
    SieveSaslScramSha1Request,
    SieveSaslScramSha256Request,
    SieveSaslExternalRequest,
    SieveSaslLoginRequest,
    SieveInitRequest,
    SieveCheckScriptRequest,
    SieveLogoutRequest,
    SieveStartTLSRequest,
    SieveDeleteScriptRequest,
    SieveRenameScriptRequest,
    SieveListScriptRequest
  } = require("./SieveRequest.js");

  const { Sieve } = require("./SieveMozClient.js");
  const { SieveAbstractSession } = require("./SieveAbstractSession.js");

  /**
   * @constructor
   * This class pools and caches concurrent connections (Channel) to an destinct
   * remote server (Session).
   * Furthermore it's a wrapper around the Sieve object. It implements
   * the login/logout process, a watchdog, an hartbeat an much more.
   *
   * A session can contain arbitary connections, but there will be only one
   * "physical" link to the server. All channels share the session's link.
   *
   * @param {SieveAccount} account
   *   a sieve account. this is needed to obtain login informations.
   * @param {object} [sid]
   *   a unique Identifier for this Session. Only needed to make debugging easier.
   **/
  function SieveSession(account, sid) {

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
    = function (aIID) {
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

  SieveSession.prototype.getExtensions
    = function () {
      return this.sieve.extensions;
    };

  SieveSession.prototype.getCompatibility
    = function () {
      return this.sieve.getCompatibility();
    };

  SieveSession.prototype.addRequest
    = function (request) {
      this.sieve.addRequest(request);
    };

  SieveSession.prototype.deleteScript
    = function (script, success, error) {
      // delete the script...
      let request = new SieveDeleteScriptRequest(script);
      request.addResponseListener(success);
      request.addErrorListener(error);

      this.sieve.addRequest(request);
    };

  SieveSession.prototype.setActiveScript
    = function (script, success, error) {

      let request = new SieveSetActiveRequest(script);
      request.addResponseListener(success);
      request.addErrorListener(error);

      this.sieve.addRequest(request);
    };

  SieveSession.prototype.checkScript
    = function (script, success, error) {

      const TEMP_FILE = "TMP_FILE_DELETE_ME";

      let lEvent =
        {
          onPutScriptResponse: (response) => {
            // the script is syntactically correct. This means the server accepted...
            // ... our temporary script. So we need to do some cleanup and remove...
            // ... the script again.

            // Call delete, without response handlers, we don't care if the ...
            // ... command succeeds or fails.
            this.sieve.addRequest(new SieveDeleteScriptRequest(TEMP_FILE));

            // Call CHECKSCRIPT's response handler to complete the hack...
            success.onCheckScriptResponse(response);
          }
        };

      // First we use PUTSCRIPT to store a temporary script on the server...
      // ... incase the command fails, it is most likely due to an syntax error...
      // ... if it sucseeds the script is syntactically correct!
      this.putScript(TEMP_FILE, script, lEvent, error);
    };

  SieveSession.prototype.checkScript2
    = function (script, success, error) {

      let request = new SieveCheckScriptRequest(script);
      request.addResponseListener(success);
      request.addErrorListener(error);

      this.sieve.addRequest(request);
    };

  SieveSession.prototype.renameScript2
    = function (oldName, newName, success, error) {

      let request = new SieveRenameScriptRequest(oldName, newName);
      request.addResponseListener(success);
      request.addErrorListener(error);

      this.sieve.addRequest(request);
    };

  SieveSession.prototype.renameScript
    = function (oldName, newName, isActive, success, error) {

      isActive = ((isActive && (isActive === "true")) ? true : false);

      let lEvent = {
        onGetScriptResponse: (response) => {
          this.putScript(
            "" + newName, "" + response.getScriptBody(),
            lEvent, error);
        },
        onPutScriptResponse: () => {

          if (isActive !== true) {
            lEvent.onSetActiveResponse(null);
            return;
          }

          let request = new SieveSetActiveRequest(newName);

          request.addResponseListener(lEvent);
          request.addErrorListener(error);

          this.sieve.addRequest(request);
        },
        onSetActiveResponse: () => {
          // we redirect this request to event not lEvent!
          // because event.onDeleteScript is doing exactly what we want!
          let request = new SieveDeleteScriptRequest(oldName);
          request.addResponseListener(lEvent);
          request.addErrorListener(error);

          this.sieve.addRequest(request);
        },

        onDeleteScriptResponse: (response) => {
          success.onRenameScriptResponse(response);
        }
      };

      this.getScript(oldName, lEvent, error);
    };

  SieveSession.prototype.listScript
    = function (success, error) {

      let request = new SieveListScriptRequest();
      request.addResponseListener(success);
      request.addErrorListener(error);

      this.sieve.addRequest(request);
    };

  SieveSession.prototype.putScript
    = function (script, body, success, error) {

      let request = new SievePutScriptRequest(script, body);
      request.addResponseListener(success);
      request.addErrorListener(error);

      this.sieve.addRequest(request);
    };

  SieveSession.prototype.getScript
    = function (script, success, error) {
      let request = new SieveGetScriptRequest(script);
      request.addResponseListener(success);
      request.addErrorListener(error);

      this.sieve.addRequest(request);
    };

  exports.SieveSession = SieveSession;

})(module.exports);
