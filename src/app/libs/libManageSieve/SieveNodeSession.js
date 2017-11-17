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

/* global window */

// Enable Strict Mode
"use strict";

(function (exports) {

  /* global require */
  /* global SieveAccount */
  const { SieveResponseCodes } = require("./SieveResponseCodes.js");

  const { Sieve } = require("./SieveNodeClient.js");

  const { SieveAbstractSession } = require("./SieveAbstractSession.js");
  const { SieveLogger } = require("./SieveNodeLogger.js");


  Object.assign(window,
    require("./SieveResponse.js"));

  const {
    SieveGetScriptRequest,
    SievePutScriptRequest,
    SieveCheckScriptRequest,
    SieveSetActiveRequest,
    SieveCapabilitiesRequest,
    SieveDeleteScriptRequest,
    SieveNoopRequest,
    SieveRenameScriptRequest,
    SieveListScriptRequest,
    SieveStartTLSRequest,
    SieveLogoutRequest,
    SieveInitRequest,
    SieveSaslPlainRequest,
    SieveSaslLoginRequest,
    SieveSaslCramMd5Request,
    SieveSaslScramSha1Request,
    SieveSaslExternalRequest
  } = require("./SieveRequest.js");

  /*Object.assign(this,
      require("./SieveResponse.js"));*/

  class SieveClientException extends Error {
  }

  class SieveReferralException extends Error {
  }

  class SieveServerException extends Error {
  }

  class SieveTimeOutException extends Error {
  }

  /**
   * This class pools and caches concurrent connections (Channel) to an destinct
   * remote server (Session).
   * Furthermore it's a wrapper around the Sieve object. It implements
   * the login/logout process, a watchdog, an hartbeat an much more.
   *
   * A session can contain arbitary connections, but there will be only one
   * "physical" link to the server. All channels share the session's link.
   *
   * @param {SieveAccount} account
   *   an reference to a sieve account. this is needed to obtain login informations.
   * @param {String} [sid]
   *   a unique Identifier for this Session. Only needed to make debugging easier.
   * @constructor
   */
  function SieveSession(account, sid) {
    this.logger = new SieveLogger(sid);
    this.logger.level(account.getSettings().getDebugFlags());
    this.logger.prefix(sid);

    SieveAbstractSession.call(this, account);
  }

  SieveSession.prototype = Object.create(SieveAbstractSession.prototype);
  SieveSession.prototype.constructor = SieveSession;

  SieveSession.prototype.initClient = function () {
    this.sieve = new Sieve(this.logger);
  };

  SieveSession.prototype.getLogger = function () {
    return this.logger;
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

  SieveSession.prototype.createSaslExternalRequest = function () {
    return new SieveSaslExternalRequest();
  };

  SieveSession.prototype.exec = async function (request, callback, init) {

    return await new Promise((resolve, reject) => {

      callback.resolve = resolve;
      callback.reject = reject;

      if (!callback.onError)
        callback["onError"] = () => { callback.reject(new SieveServerException()); };

      if (!callback.onTimeout)
        callback["onTimeout"] = () => { callback.reject(new SieveTimeOutException()); };

      if (!callback.onByeResponse) {
        callback["onByeResponse"] = (response) => {
          // The server is going to disconnected our session nicely...
          let code = response.getResponseCode();

          // ... we most likely received a referal
          if (code.equalsCode("REFERRAL")) {
            callback.reject(new SieveReferralException(code.getHostname()));
            return;
          }

          // ... everything else is definitely an error.
          callback.reject(new SieveServerException());
        };
      }

      request.addErrorListener(callback);
      this.sieve.addRequest(request);

      if (init)
        init();

    }, (reject) => {
      throw reject;
    });
  };

  /**
   * Sends a noop or keep alive response.
   * It is a request without sideeffect and without any
   * payload. It is typically used to test if the server
   * is available and to prevent closing the connection to the server.
   *
   * Servers do not have to support noop.
   * The implementation will use a capability request as
   * fallback as described in the rfc.
   *
   * @return {void}
   */
  SieveSession.prototype.noop = async function () {

    // In case th server does not support noop we fallback
    // to a capability request as suggested in the rfc.
    if (!this.sieve.getCompatibility().noop) {
      await this.capabilities();
      return;
    }

    let callback = {
      onNoopResponse: function () {
        callback.resolve();
      }
    };

    let request = this.createNoopRequest();
    request.addNoopListener(callback);

    await this.exec(request, callback);
    return;
  };

  SieveSession.prototype.capabilities = async function () {

    let callback = {
      onCapabilitiesResponse: function (response) {
        callback.resolve(
          response.getDetails());
      }
    };

    let request = this.createCapabilitiesRequest();
    request.addCapabilitiesListener(callback);

    return await this.exec(request, callback);
  };

  SieveSession.prototype.deleteScript = async function (name) {

    let callback = {
      onDeleteScriptResponse: function () {
        callback.resolve();
      }
    };

    let request = this.createDeleteScriptRequest(name);
    request.addDeleteScriptListener(callback);

    return await this.exec(request, callback);
  };

  SieveSession.prototype.putScript = async function (name) {

    let callback = {
      onPutScriptResponse: function () {
        callback.resolve();
      }
    };

    let request = this.createPutScriptRequest(name, "#test\r\n");
    request.addPutScriptListener(callback);

    return await this.exec(request, callback);
  };

  SieveSession.prototype.listScripts = async function () {

    let callback = {
      onListScriptResponse: function (response) {
        callback.resolve(response.getScripts());
      }
    };

    let request = this.createListScriptRequest();
    request.addListScriptListener(callback);

    return await this.exec(request, callback);
  };

  SieveSession.prototype.getScript = async function (name) {

    let callback = {
      onGetScriptResponse: function (response) {
        callback.resolve(response.getScriptBody());
      }
    };

    let request = this.createGetScriptRequest(name);
    request.addGetScriptListener(callback);

    return await this.exec(request, callback);
  };

  SieveSession.prototype.setActiveScript = async function (script) {

    let callback = {
      onSetActiveResponse: function (response) {
        callback.resolve();
      }
    };

    let request = this.createSetActiveRequest(script);
    request.addSetActiveListener(callback);

    return await this.exec(request, callback);
  };

  SieveSession.prototype.checkScript2 = async function (script) {
    let callback = {
      onCheckScriptResponse: function (response) {
        callback.resolve();
      }
    };

    let request = this.createCheckScriptRequest(script);
    request.addCheckScriptListener(this);

    return await this.exec(request, callback);
  };

  SieveSession.prototype.checkScript = async function (script) {

    if (script.length === 0)
      return;

    // Use the CHECKSCRIPT command when possible, otherwise we need to ...
    // ... fallback to the PUTSCRIPT/DELETESCRIPT Hack...

    if (this.sieve.getCompatibility().checkscript) {
      return this.checkScript2(script);
    }

    // ... we have to use the PUTSCRIPT/DELETESCRIPT Hack.

    // First we use PUTSCRIPT to store a temporary script on the server...
    // ... incase the command fails, it is most likely due to an syntax error...
    // ... if it sucseeds the script is syntactically correct!
    await this.putScript("TMP_FILE_DELETE_ME", script);
    // then delete the temporary script.
    await this.deleteScript("TMP_FILE_DELETE_ME");
  };

  SieveSession.prototype.renameScript2 = async function (oldName, newName) {

    let callback = {
      onRenameScriptResponse: function (response) {
        callback.resolve();
      }
    };

    let request = this.createRenameScriptRequest(oldName, newName);
    request.addRenameScriptListener(callback);

    return await this.exec(request, callback);
  };


  SieveSession.prototype.renameScript = async function (oldName, newName) {

    if (this.sieve.getCompatibility().renameScript) {
      return this.renameScript2(oldName, newName);
    }

    // Get the scripts activation state and check if the script name clashes
    let scripts = await this.listScripts();
    let active = null;

    for (let item of scripts) {
      if (item.script === newName)
        throw new SieveClientException("Name already exists");

      if (item.script === oldName)
        active = item.active;
    }

    if (active === null)
      throw new SieveClientException("Unknown Script " + oldName);

    // Get the old script's content
    let script = await this.getScript(oldName);

    // Put the new script to the server
    await this.putScript(newName, script);

    // Activate the new script
    if (this.active === true)
      await this.activateScript(newName);

    // Delete the old script
    await this.deleteScript(oldName);
  };


  SieveSession.prototype.connect2 = async function (hostname, port) {

    let callback = {

      onInitResponse: (response) => {

        this.sieve.capabilities = {};
        this.sieve.capabilities.tls = response.getTLS();
        this.sieve.capabilities.extensions = response.getExtensions();
        this.sieve.capabilities.sasl = response.getSasl();

        this.sieve.setCompatibility(
          response.getCompatibility());

        callback.resolve(
          response.getDetails());
      }
    };

    let request = this.createInitRequest();
    request.addInitListener(callback);

    let init = () => {
      this.sieve.connect(
        hostname, port,
        this.account.getHost().isTLSEnabled(),
        this,
        this.account.getProxy().getProxyInfo());
    };

    return await this.exec(request, callback, init);
  };

  /**
   * Starts a new TLS connections.
   * It throws an exception in case the tls handshake failed for some reason.
   *
   * @returns {Object}
   *   the new capabilites after the successfull connection
   */
  SieveSession.prototype.startTLS = async function () {
    // establish a secure connection if TLS ist enabled and if the Server ...
    // ... is capable of handling TLS, otherwise simply skip it and ...
    // ... use an insecure connection

    if (!this.account.getHost().isTLSEnabled())
      return;

    if (!this.sieve.capabilities.tls && !this.account.getHost().isTLSForced())
      return;

    let callback = {

      onStartTLSResponse: () => {

        this.sieve.startTLS(() => {
          // we need some magic to avoid a nasty bug in some servers
          // first we explicitely request the capabilites
          let request = this.createCapabilitiesRequest();
          request.addCapabilitiesListener(callback);
          this.sieve.addRequest(request);

          // With a bugfree server we endup with two capability request, one
          // implicit after startTLS and one explicite from capbilites. So we have
          // to consume one of them silently...
          this.sieve.addRequest(this.createInitRequest(), true);
        });
      },

      onCapabilitiesResponse: (response) => {

        // Update the server's capabilities they may change after a successfull
        // starttls handshake.
        this.sieve.setCompatibility(response.getCompatibility());

        this.sieve.capabilities = {};
        this.sieve.capabilities.tls = response.getTLS();
        this.sieve.capabilities.extensions = response.getExtensions();
        this.sieve.capabilities.sasl = response.getSasl();

        callback.resolve(response.getDetails());
        return;
      }
    };

    let request = this.createStartTLSRequest();
    request.addStartTLSListener(callback);

    return await this.exec(request, callback);
  };

  SieveSession.prototype.getSaslMechanism = function () {

    let mechanism = [];
    if (this.account.getSettings().hasForcedAuthMechanism())
      mechanism = [this.account.getSettings().getForcedAuthMechanism()];
    else
      mechanism = [... this.sieve.capabilities.sasl];

    // ... translate the SASL Mechanism into an SieveSaslLogin Object ...

    while (mechanism.length > 0) {
      // remove and test the first element...
      switch (mechanism.shift().toUpperCase()) {
        case "PLAIN":
          return this.createSaslPlainRequest();

        case "CRAM-MD5":
          return this.createSaslCramMd5Request();

        case "SCRAM-SHA-1":
          return this.createSaslScramSha1Request();

        case "EXTERNAL":
          return this.createSaslExternalRequest();

        case "LOGIN":
          // we use SASL LOGIN only as last resort...
          // ... as suggested in the RFC.
          if (mechanism.length == 0)
            return this.createSaslLoginRequest();

          mechanism.push("LOGIN");
          break;
      }
    }

    throw new SieveClientException("No SASL Mechanism (error.sasl)");
  };

  SieveSession.prototype.authenticate = async function () {
    let account = this.account;

    // We do not have a username in case it is sasl external...


    // Without a username, we can skip the authentication
    if (account.getLogin().hasUsername() === false)
      return;

    let request = this.getSaslMechanism();

    request.setUsername(account.getLogin().getUsername());

    // SASL External has no passwort it relies completely on SSL...
    if (request.hasPassword()) {

      let password = account.getLogin().getPassword();

      if (password === null)
        throw new SieveClientException("error.authentication");

      request.setPassword(password);
    }

    // check if the authentication method supports proxy authorization...
    if (request.isAuthorizable()) {
      // ... if so retrieve the authorization identity
      let authorization = account.getAuthorization().getAuthorization();

      if (authorization === null)
        throw new SieveClientException("error.authentication");

      if (authorization !== "")
        request.setAuthorization(authorization);
    }

    let callback = {
      onSaslResponse: function (response) {
        callback.resolve();
      }
    };

    request.addSaslListener(callback);
    return await this.exec(request, callback);
  };


  SieveSession.prototype.connect0 = async function (hostname, port) {

    this.sieve = new Sieve(this.logger);
    this.sieve.addListener(this);

    // TODO Load Timeout interval from account settings...
    if (this.account.getSettings().isKeepAlive())
      this.sieve.setKeepAliveInterval(this.account.getSettings().getKeepAliveInterval());


    if (hostname == null)
      hostname = this.account.getHost().getHostname();

    if (port == null)
      port = this.account.getHost().getPort();

    try {
      await this.connect2(hostname, port);

      await this.startTLS();

      await this.authenticate();
    } catch (e) {

      //if (e instance of bye)
      // reconnect on other host.
      alert(e);
      return;
    }

    this.state = 2;
    this._invokeListeners("onChannelCreated", this.sieve);
  };

  exports.SieveSession = SieveSession;

})(exports || this);
