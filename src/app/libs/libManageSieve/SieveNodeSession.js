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

  const { Sieve } = require("./SieveNodeClient.js");

  const { SieveLogger } = require("./SieveNodeLogger.js");

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
    SieveSaslScramSha256Request,
    SieveSaslExternalRequest
  } = require("./SieveRequest.js");

  /* Object.assign(this,
      require("./SieveRequest.js"));*/

  class SieveClientException extends Error {
  }

  class SieveReferralException extends Error {
  }

  /**
   * A base class for server side exception.
   */
  class SieveServerException extends Error {

    /**
     * Creates a serverside exception
     *
     * @param {SieveSimpleResponse} response
     *   the servers response which inidcated the error.
     */
    constructor(response) {
      super(response.getMessage());
      this.response = response;
    }

    /**
     * Indicates that this exception was caused by the server.
     * @returns {boolean}
     *   always true, as server exceptions are always caused by the server
     */
    isServerSide() {
      return true;
    }

    /**
     * Returns the server's response it typically contains the cause
     * why the request failed.
     *
     * @returns {SieveSimpleResponse}
     *   the server response objet
     */
    getResponse() {
      return this.response;
    }
  }

  class SieveTimeOutException extends Error {
  }

  /**
   * This class realizes a manage sieve connection to a remote server.
   * It provides the logic for login, logout, hartbeats, watchdogs and
   * much more.
   *
   * It is save to have concurrent call within a session. The sieve backend
   * uses a queue to process them. So you don't need to worry about using
   * stuff in parallel.
   *
   * It is higly async but uses the ES6 await syntax, which makes it behave
   * like a synchonous api.
   */
  class SieveSession {

    /**
     * Creates a new Session instance.
     * @param {SieveAccount} account
     *   an reference to a sieve account. this is needed to obtain login informations.
     * @param {String} [sid]
     *   a unique Identifier for this Session. Only needed to make debugging easier.
     */
    constructor(account, sid) {
      this.logger = new SieveLogger();
      this.logger.level(account.getSettings().getDebugFlags());
      this.logger.prefix(sid);

      this.account = account;
    }

    initClient() {
      this.sieve = new Sieve(this.logger);
    }

    getLogger() {
      return this.logger;
    }

    createGetScriptRequest(script) {
      return new SieveGetScriptRequest(script);
    }

    createPutScriptRequest(script, body) {
      return new SievePutScriptRequest(script, body);
    }

    createCheckScriptRequest(body) {
      return new SieveCheckScriptRequest(body);
    }

    createSetActiveRequest(script) {
      return new SieveSetActiveRequest(script);
    }

    createCapabilitiesRequest() {
      return new SieveCapabilitiesRequest();
    }

    createDeleteScriptRequest(script) {
      return new SieveDeleteScriptRequest(script);
    }

    createNoopRequest() {
      return new SieveNoopRequest();
    }

    createRenameScriptRequest(oldScript, newScript) {
      return new SieveRenameScriptRequest(oldScript, newScript);
    }

    createListScriptRequest() {
      return new SieveListScriptRequest();
    }

    createStartTLSRequest() {
      return new SieveStartTLSRequest();
    }

    createLogoutRequest() {
      return new SieveLogoutRequest();
    }

    createInitRequest() {
      return new SieveInitRequest();
    }

    createSaslPlainRequest() {
      return new SieveSaslPlainRequest();
    }

    createSaslLoginRequest() {
      return new SieveSaslLoginRequest();
    }

    createSaslCramMd5Request() {
      return new SieveSaslCramMd5Request();
    }

    createSaslScramSha1Request() {
      return new SieveSaslScramSha1Request();
    }

    createSaslScramSha256Request() {
      return new SieveSaslScramSha256Request();
    }

    createSaslExternalRequest() {
      return new SieveSaslExternalRequest();
    }

    async exec(request, callback, init) {

      return await new Promise((resolve, reject) => {

        callback.resolve = resolve;
        callback.reject = reject;

        if (!callback.onError)
          callback["onError"] = (response) => { callback.reject(new SieveServerException(response)); };

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
            callback.reject(new SieveServerException(response));
          };
        }

        request.addByeListener(callback);
        request.addErrorListener(callback);
        this.sieve.addRequest(request);

        if (init)
          init();

      }, (reject) => {
        throw reject;
      });
    }

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
     *   a promise
     */
    async noop() {

      // In case th server does not support noop we fallback
      // to a capability request as suggested in the rfc.
      if (!this.sieve.getCompatibility().noop) {
        return await this.capabilities();
      }

      let callback = {
        onNoopResponse: function () {
          callback.resolve();
        }
      };

      let request = this.createNoopRequest();
      request.addNoopListener(callback);

      return await this.exec(request, callback);
    }

    /**
     * Sends a capability request.
     * In case of an error an exception will be thrown.
     *
     * @returns {object}
     *   an object with the capabilies.
     */
    async capabilities() {

      let callback = {
        onCapabilitiesResponse: function (response) {
          callback.resolve(
            response.getDetails());
        }
      };

      let request = this.createCapabilitiesRequest();
      request.addCapabilitiesListener(callback);

      return await this.exec(request, callback);
    }

    /**
     * Deletes the given script name.
     * @param {String} name
     *   the script which should be deleted.
     * @returns {void}
     */
    async deleteScript(name) {

      let callback = {
        onDeleteScriptResponse: function () {
          callback.resolve();
        }
      };

      let request = this.createDeleteScriptRequest(name);
      request.addDeleteScriptListener(callback);

      return await this.exec(request, callback);
    }

    /**
     * Saves the given script. In case the script exists
     * it will be silently overwritten.
     *
     * @param {String} name
     *   the script's name
     * @param {String} script
     *   the script which should be saved.
     * @returns {void}
     */
    async putScript(name, script) {

      let callback = {
        onPutScriptResponse: function () {
          callback.resolve();
        }
      };

      let request = this.createPutScriptRequest(name, script);
      request.addPutScriptListener(callback);

      return await this.exec(request, callback);
    }

    async listScripts() {

      let callback = {
        onListScriptResponse: function (response) {
          callback.resolve(response.getScripts());
        }
      };

      let request = this.createListScriptRequest();
      request.addListScriptListener(callback);

      return await this.exec(request, callback);
    }

    /**
     * Gets the script with the given name.
     * In case the script does not exists the server will throw an error.
     *
     * @param {String} name
     *   the scripts unique name
     * @returns {String}
     *   the scripts content.
     */
    async getScript(name) {

      let callback = {
        onGetScriptResponse: function (response) {
          callback.resolve(response.getScriptBody());
        }
      };

      let request = this.createGetScriptRequest(name);
      request.addGetScriptListener(callback);

      return await this.exec(request, callback);
    }

    /**
     * Activates the specified script and deactivated the current script.
     * Sieve supports at most one active script.
     *
     * To deactivate all scripts just omit the script parameter
     *
     * @param {String} [script]
     *   the script which should be activated.
     *   If omitted all script will be deactivated.
     * @returns {void}
     */
    async setActiveScript(script) {

      let callback = {
        onSetActiveResponse: function (response) {
          callback.resolve();
        }
      };

      let request = this.createSetActiveRequest(script);
      request.addSetActiveListener(callback);

      return await this.exec(request, callback);
    }

    /**
     * Used to gracefully disconnect from the server.
     * It sends a logout request, then the server should
     * hangup the connection.
     *
     * @returns {void}
     */
    async logout() {
      let callback = {
        onLogoutResponse: function () {
          callback.resolve();
        }
      };

      let request = this.createLogoutRequest();
      request.addLogoutListener(callback);

      return await this.exec(request, callback);
    }

    /**
     * Checks the script for syntax errors.
     *
     * It uses the checkscript command. In case
     * the command is not supported it fails.
     *
     * Throws an exception in case the script is not valid.
     *
     * @param {String} script
     *   the script which should be checked.
     * @returns {void}
     */
    async checkScript2(script) {

      if (!script.length)
        return;

      let callback = {
        onCheckScriptResponse: function (response) {
          callback.resolve();
        }
      };

      let request = this.createCheckScriptRequest(script);
      request.addCheckScriptListener(callback);

      await this.exec(request, callback);

      return;
    }

    /**
     * Checks the script for syntax errors.
     *
     * It uses the checkscript command if present otherwise
     * it emulates the checkscript by pushing a temporary script
     * to the server.
     *
     * In you need a pure checkscript implementation use checkscript2
     *
     * Throws an exception in case the script is not valid.
     *
     * @param {String} script
     *   the script which should be checked.
     * @returns {void}
     */
    async checkScript(script) {

      // We do not need to check an empty script...
      if (script.length === 0)
        return;

      // Use the CHECKSCRIPT command when possible, otherwise we need to ...
      // ... fallback to the PUTSCRIPT/DELETESCRIPT Hack...

      if (this.sieve.getCompatibility().checkscript) {
        await this.checkScript2(script);
        return;
      }

      // ... we have to use the PUTSCRIPT/DELETESCRIPT Hack.

      // First we use PUTSCRIPT to store a temporary script on the server...
      // ... incase the command fails, it is most likely due to an syntax error...
      // ... if it succeeds the script is syntactically correct!

      await this.putScript("TMP_FILE_DELETE_ME", script);

      // then delete the temporary script. We need to do this only when
      // put script succeeded and when it was stored.
      await this.deleteScript("TMP_FILE_DELETE_ME");

      return;
    }

    /**
     * Renames a script.
     *
     * It use the new "rename" command. In case the command is not supported it failes.
     *
     * It is an error if the new script name already existings.
     *
     * @param {String} oldName
     *   the old script name
     * @param {String} newName
     *  the new script name
     *
     * @returns {void}
     */
    async renameScript2(oldName, newName) {

      let callback = {
        onRenameScriptResponse: function () {
          callback.resolve();
        }
      };

      let request = this.createRenameScriptRequest(oldName, newName);
      request.addRenameScriptListener(callback);

      return await this.exec(request, callback);
    }


    /**
     * Renames a script.
     *
     * It prefers the new rename command. In case it is not suppored it will
     * use a get, put and delete sequence to emulate the rename command.
     *
     * So the result will be the very same, but there is one slight difference.
     * Instead of throwing an error it will overwrite existing script with the
     * same name silently.
     *
     * @param {String} oldName
     *   the old name
     * @param {String} newName
     *   the new name
     * @returns {void}
     */
    async renameScript(oldName, newName) {

      if (this.sieve.getCompatibility().renameScript) {
        return await this.renameScript2(oldName, newName);
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
      return await this.deleteScript(oldName);
    }

    async connect2(hostname, port) {

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
          this.account.getHost().isSecure(),
          this,
          this.account.getProxy().getProxyInfo());
      };

      return await this.exec(request, callback, init);
    }

    /**
     * Starts a new TLS connections.
     * It throws an exception in case the tls handshake failed for some reason.
     *
     * @returns {Object}
     *   the new capabilites after the successfull connection
     */
    async startTLS() {
      // establish a secure connection if TLS ist enabled and if the Server ...
      // ... is capable of handling TLS, otherwise simply skip it and ...
      // ... use an insecure connection

      if (!this.account.getHost().isSecure())
        return;

      if (!this.sieve.capabilities.tls)
        throw new SieveClientException("Server does not support a secure connection.");

      let callback = {

        onStartTLSResponse: async () => {

          await this.sieve.startTLS(this.account.getHost().getFingerprint());

          // we need some magic to avoid a nasty bug in some servers
          // first we explicitely request the capabilites
          let request = this.createCapabilitiesRequest();
          request.addCapabilitiesListener(callback);
          this.sieve.addRequest(request);

          // With a bugfree server we endup with two capability request, one
          // implicit after startTLS and one explicite from capbilites. So we have
          // to consume one of them silently...
          this.sieve.addRequest(this.createInitRequest(), true);
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

      await this.exec(request, callback);
      return;
    }

    /**
     * Normally the server returns more than one SASL Mechanism.
     * The list is sorted by the server. It starts with the most
     * prefered mechanism and ends with the least prefered one.
     *
     * This menas in case the user has forced a prefered mechanism.
     * We try to use this first. In case is is not supported by the server
     * or the user has no preference we start iterating though the advertised
     * mechanism until we find a matching one.
     *
     * The is one exception to this rule. As suggested in the RFC,
     * the SASL Login is only used as very last resort.
     *
     * Note: In case we do not support any of the server's advertised
     * mechanism an exception is thrown.
     *
     * @returns {SieveAbstractSaslRequest}
     *  the sasl request which implements the most prefered compatible mechanism.
     */
    getSaslMechanism() {

      let mechanism = this.account.getLogin().getSaslMechanism();

      if (mechanism === "none")
        throw new SieveClientException("SASL Authentication disabled");

      if (mechanism === "default")
        mechanism = [... this.sieve.capabilities.sasl];
      else
        mechanism = [mechanism];

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

          case "SCRAM-SHA-256":
            return this.createSaslScramSha256Request();

          case "EXTERNAL":
            return this.createSaslExternalRequest();

          case "LOGIN":
            // we use SASL LOGIN only as last resort...
            // ... as suggested in the RFC.
            if (mechanism.length === 0)
              return this.createSaslLoginRequest();

            mechanism.push("LOGIN");
            break;
        }
      }

      throw new SieveClientException("No compatible SASL Mechanism (error.sasl)");
    }

    /**
     * Authenticates the current session.
     * @returns {void}
     */
    async authenticate() {
      let account = this.account;

      if (account.getLogin().getSaslMechanism() === "none")
        return;

      let request = this.getSaslMechanism();

      let username = account.getLogin().getUsername();
      request.setUsername(username);

      // SASL External has no passwort it relies completely on SSL...
      if (request.hasPassword()) {

        let password = await account.getLogin().getPassword();

        if (typeof (password) === "undefined" || password === null)
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
        onSaslResponse: function () {
          callback.resolve();
        }
      };

      request.addSaslListener(callback);
      await this.exec(request, callback);

      return;
    }

    /**
     * The on idle handler...
     * @returns {void}
     */
    onIdle() {
      (async () => { await this.noop(); })();
    }


    /**
     * Connects the session to the given port.
     *
     * By default the host and port configured in the settings are used
     * By you may override host and port, e.g. to realize a referal.
     *
     * @param {String} [hostname]
     *   the hostname, in case omitted the hostname from the account's settings is used
     * @param {String} [port]
     *   the port, in case omitted the port from the account's settings is used
     * @returns {SieveSession}
     *   a self reference
     */
    async connect(hostname, port) {

      this.sieve = new Sieve(this.logger);

      // FIXME we need to add the onIdle and onTimeout methods
      // FIXME in case we set the listner here the byeListener does not work anymore
      this.sieve.addListener(this);

      // TODO Load Timeout interval from account settings...
      if (this.account.getSettings().isKeepAlive())
        this.sieve.setIdleWait(this.account.getSettings().getKeepAliveInterval());


      if (typeof (hostname) === "undefined")
        hostname = this.account.getHost().getHostname();

      if (typeof (port) === "undefined")
        port = this.account.getHost().getPort();

      try {
        await this.connect2(hostname, port);

        await this.startTLS();

        await this.authenticate();
      } catch (e) {

        // connecting failed for some reason, which means we
        // need to handle the error.

        // TODO Detect a referal...

        alert(e);
      }

      return this;
    }

    /**
     * Checks if the current session is connected to the server
     *
     * @returns {boolean}
     *   true in case the session is connected otherwise false.
     */
    isConnected() {
      return this.sieve.isAlive();
    }

    /**
     * Disconnects the current sieve session.
     *
     * The disconnect is by default graceful, which means the client send a
     * logout command and waits for the server to terminate the connection.
     *
     * @param {boolean} [force]
     *   if set to true the disconnect will be forced and not graceful.
     *   This means the connection will be just disconnected.
     * @returns {SieveSession}
     *   a self reference.
     */
    async disconnect(force) {

      if (this.sieve === null)
        return this;

      if (!force && this.sieve.isAlive()) {
        await this.logout();
      }

      await this.sieve.disconnect();
      this.sieve = null;

      return this;
    }
  }

  exports.SieveSession = SieveSession;

})(exports || this);
