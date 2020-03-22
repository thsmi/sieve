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

  const { SieveLogger } = require("./SieveLogger.js");

  const { Sieve } = require("./SieveClient.js");

  const {
    SieveSaslPlainRequest,
    SieveSaslLoginRequest,
    SieveSaslCramMd5Request,
    SieveSaslScramSha1Request,
    SieveSaslScramSha256Request,
    SieveSaslExternalRequest,

    SieveInitRequest,
    SieveListScriptsRequest,
    SieveRenameScriptRequest,
    SievePutScriptRequest,
    SieveDeleteScriptRequest,
    SieveGetScriptRequest,
    SieveSetActiveRequest,
    SieveCheckScriptRequest,
    SieveLogoutRequest,
    SieveNoopRequest,
    SieveCapabilitiesRequest,
    SieveStartTLSRequest
  } = require("./SieveRequest.js");

  const {
    SieveClientException,
    SieveServerException,
    SieveReferralException,
    SieveTimeOutException,
    SieveCertValidationException
  } = require("./SieveExceptions.js");

  const FIRST_ELEMENT = 0;


  /**
   * This class realizes a manage sieve connection to a remote server.
   * It provides the logic for login, logout, heartbeats, watchdogs and
   * much more.
   *
   * It is save to have concurrent call within a session. The sieve backend
   * uses a queue to process them. So you don't need to worry about using
   * stuff in parallel.
   *
   * It is highly async but uses the ES6 await syntax, which makes it behave
   * like a synchronous api.
   */
  class SieveAbstractSession {

    /**
     * Creates a new Session instance.
     *
     * @param {string} id
     *   the unique session id.
     * @param {object.<string, object>} options
     *   a dictionary with options as key/value pairs.
     */
    constructor(id, options) {
      this.id = id;
      this.options = options;
      this.listeners = {};
      this.sieve = null;
    }

    /**
     * Returns the logger bound to this session.
     * @abstract
     *
     * @returns {SieveLogger}
     *   a reference to the current logger
     */
    getLogger() {
      if (!this.logger)
        this.logger = new SieveLogger(this.id, this.getOption("logLevel"));

      return this.logger;
    }

    /**
     * Returns the sieve client bound to this session.
     *
     * @returns {SieveAbstractClient}
     *   a reference to the sieve client.
     */
    getSieve() {
      return this.sieve;
    }

    /**
     * Creates a new sieve client for this session.
     */
    createSieve() {
      if (this.sieve !== undefined && this.sieve !== null)
        throw new SieveClientException("Sieve Connection Active");

      this.sieve = new Sieve(this.getLogger());
    }

    /**
     * The server may close our connection after being idle for too long.
     * This can be prevented by sending regular keep alive packets.
     *
     * If supported the noop command is used otherwise a capability
     * request is used.
     */
    async onIdle() {
      this.getLogger().logSession("Sending keep alive packet...");
      await this.noop();
    }

    /**
     * Binds the capabilities to the sieve object.
     *
     * @param {object} capabilities
     *   a struct containing the capabilities.
     */
    setCapabilities(capabilities) {

      this.getSieve().setCompatibility(capabilities.getCompatibility());

      // FIXME we should use a getter and setter...
      this.getSieve().capabilities = {
        tls: capabilities.getTLS(),
        extensions: capabilities.getExtensions(),
        sasl: capabilities.getSasl(),
        implementation: capabilities.getImplementation(),
        version: capabilities.getVersion()
      };
    }

    /**
     * Checks if the current session is connected to the server
     *
     * @returns {boolean}
     *   true in case the session is connected otherwise false.
     */
    isConnected() {
      if (!this.getSieve())
        return false;

      return this.getSieve().isAlive();
    }

    /**
     * Normally the server returns more than one SASL Mechanism.
     * The list is sorted by the server. It starts with the most
     * preferred mechanism and ends with the least preferred one.
     *
     * This means in case the user has forced a preferred mechanism.
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
     * Note: LOGIN is deprecated, it is only used as very last resort.
     *
     * @param {string} [mechanism]
     *   the sasl mechanism which shall be used.
     *   If omitted or set to "default" the most preferred which is supported
     *   by client ans server is chosen.
     *
     * @returns {SieveAbstractSaslRequest}
     *  the sasl request which implements the most preferred compatible mechanism.
     */
    getSaslMechanism(mechanism) {

      if (mechanism === undefined || mechanism === null)
        mechanism = "default";

      if (mechanism === "default")
        mechanism = [... this.getSieve().capabilities.sasl];
      else
        mechanism = [mechanism];

      // ... translate the SASL Mechanism into an SieveSaslLogin Object ...
      while (mechanism.length > 0) {
        // remove and test the first element...
        switch (mechanism.shift().toUpperCase()) {
          case "PLAIN":
            return new SieveSaslPlainRequest();

          case "CRAM-MD5":
            return new SieveSaslCramMd5Request();

          case "SCRAM-SHA-1":
            return new SieveSaslScramSha1Request();

          case "SCRAM-SHA-256":
            return new SieveSaslScramSha256Request();

          case "EXTERNAL":
            return new SieveSaslExternalRequest();

          case "LOGIN":
            // as suggested in the RFC, we use SASL LOGIN
            // only as last resort...

            // this means in case it is the only mechanism
            // we have no options
            if (!mechanism.length)
              return new SieveSaslLoginRequest();

            // otherwise be move it to the end of the
            // mechanism list.
            mechanism.push("LOGIN");
            break;
        }
      }

      throw new SieveClientException("No compatible SASL Mechanism (error.sasl)");
    }

    /**
     * Gets an configuration parameter from the session's options.
     *
     * @param {string} name
     *   the option name.
     * @param {Function} [fallback]
     *   the optional fallback value, if not undefined is returned.
     *
     * @returns {object}
     *   the option's value.
     */
    getOption(name, fallback) {
      if (this.options[name] === null || this.options[name] === undefined)
        return fallback;

      return this.options[name];
    }

    /**
     * Registers the callback listener for the given name.
     * There can be at most one listener per name.
     *
     * To disable a listener just set the callback handler to null
     * or undefined
     *
     * @param {string} name
     *   the callback event name.
     * @param {Function} [callback]
     *   the callback function, if omitted the handler will be removed.
     */
    on(name, callback) {

      if (name === "authenticate") {
        this.listeners.onAuthenticate = callback;
        return;
      }

      if (name === "authorize") {
        this.listeners.onAuthorize = callback;
        return;
      }

      if (name === "proxy") {
        this.listeners.onProxyLookup = callback;
        return;
      }

      if (name === "certerror") {
        this.listeners.onCertError = callback;
        return;
      }

      throw new SieveClientException(`Unknown callback handler ${name}`);
    }

    /**
     * The authentication starts for secure connections after
     * the tls handshake and for unencrypted connection directly
     * after the initial server response.
     *
     * Please note after a successful tls handshake the server
     * may update the SASL Mechanism. The server may force the user
     * to use TLS by providing initially an empty list of SASL
     * Mechanisms. After a successful tls handshake it then upgrades
     * the SASL Mechanisms.
     */
    async authenticate() {

      const mechanism = this.getOption("sasl", "default");

      if (mechanism === "none")
        return;

      const request = this.getSaslMechanism(mechanism);

      if (!this.listeners.onAuthenticate)
        throw new SieveClientException("No Authentication handler registered");

      const authentication = await this.listeners.onAuthenticate(request.hasPassword());

      // SASL External has no password it relies completely on SSL...
      if (request.hasPassword()) {
        const password = authentication.password;

        if (typeof (password) === "undefined" || password === null)
          throw new SieveClientException("error.authentication");

        request.setPassword(password);
      }

      request.setUsername(authentication.username);

      // check if the authentication method supports proxy authorization...
      if (request.isAuthorizable()) {

        if (!this.listeners.onAuthorize)
          throw new SieveClientException("No Authorization handler registered");

        // ... if so retrieve the authorization identity
        const authorization = await this.listeners.onAuthorize();

        if (typeof (authorization) === "undefined" || authorization === null)
          throw new SieveClientException("error.authorization");

        if (authorization !== "")
          request.setAuthorization(authorization);
      }

      await this.sendRequest(request, false);
    }

    /**
     * Starts a new TLS connections.
     * It throws an exception in case the tls handshake failed for some reason.
     *
     * Old Cyrus servers do not advertise their capabilities
     * after the tls handshake. So we need some magic here.
     * In addition the implicit request we send an explicit
     * capability request.
     *
     * A bug free server will return with two capability responses
     * while a buggy implementation returns only one.
     *
     * @param {object} [options]
     *   key value pairs with implementation specific options
     */
    async startTLS(options) {

      if (!this.getSieve().isSecure())
        return;

      if (!this.getSieve().capabilities.tls)
        throw new SieveClientException("Server does not support a secure connection.");

      try {
        await this.sendRequest(new SieveStartTLSRequest(), false);

        await this.getSieve().startTLS(options);

        // A bug free server we end up with two capability request, one
        // implicit after startTLS and one explicit from capabilities.
        // So we have to consume one of them silently...
        const capabilities = await this.sendRequest([
          new SieveCapabilitiesRequest(),
          new SieveInitRequest()], false);

        this.setCapabilities(capabilities);

      } catch (ex) {
        // Upon a cert validation we emit a notification...
        if (ex instanceof SieveCertValidationException)
          if (this.listeners.onCertError)
            this.listeners.onCertError(ex.getSecurityInfo());

        // ... and then rethrow.
        throw ex;
      }
    }

    /**
     * Converts a callback driven request into async/await code.
     *
     * @param {SieveAbstractRequest|Array<SieveAbstractRequest>} request
     *   a request or list of request to be executed. They will be queued
     *   at the same time and only the first request is used to resolve
     *   the promise.
     *
     * @param {Function} [init]
     *   an optional init function which will be called directly after
     *   the first request was queued
     *
     * @returns {SieveAbstractResponse}
     *   the response for the first request or an exception in case of an error.
     */
    async promisify(request, init) {

      if (!Array.isArray(request))
        request = [request];

      return await new Promise((resolve, reject) => {

        request[FIRST_ELEMENT].addResponseListener((response) => {
          resolve(response);
        });

        request[FIRST_ELEMENT].addErrorListener((response) => {
          reject(new SieveServerException(response));
        });

        request[FIRST_ELEMENT].addByeListener((response) => {

          if (response.getResponseCode().equalsCode("REFERRAL")) {
            reject(new SieveReferralException(response));
            return;
          }

          reject(new SieveServerException(response));
        });

        request[FIRST_ELEMENT].addTimeoutListener((error) => {

          if (error) {
            reject(error);
            return;
          }

          reject(new SieveTimeOutException("Request was canceled or took too long"));
        });


        this.getSieve().addRequest(request[FIRST_ELEMENT]);

        if (init)
          init();

        while (request.length > 1) {
          request.shift();
          this.getSieve().addRequest(request[FIRST_ELEMENT], true);
        }
      });
    }

    /**
     * Converts a callback driven request into async/await code.
     *
     * @param {SieveAbstractRequest|Array<SieveAbstractRequest>} request
     *   a request or list of request to be executed. They will be queued
     *   at the same time and only the first request is used to resolve
     *   the promise.
     *
     * @param {boolean} [follow]
     *   If true or omitted the request should follow server side referrals.
     *   In case the server responded with a bye and a referral url. The request
     *   will be queued into the new connections request queue.
     *
     * @param {Function} [init]
     *   an optional init function which will be called directly after
     *   the first request was queued
     *
     * @returns {SieveAbstractResponse}
     *   the response for the first request or an exception in case of an error.
     */
    async sendRequest(request, follow, init) {

      if (follow === undefined || follow === null)
        follow = true;

      try {
        return await this.promisify(request, init);
      }
      catch (ex) {

        if (!(ex instanceof SieveReferralException)) {
          this.getLogger().logSession(`Sending Request failed ${ex}`);
          throw ex;
        }

        if (!follow) {
          this.getLogger().logSession(`Sending Request failed ${ex}`);
          throw ex;
        }

        await this.disconnect(true);

        this.getLogger().logSession(`Referred to Server: ${ex.getHostname()}`);
        await this.connect(ex.getHostname(), ex.getPort());

        return await this.promisify(request, init);
      }
    }


    /**
     * An internal method creating a server connection.
     *
     * @param {string} hostname
     *   the sieve server's hostname
     * @param {string} port
     *   the sieve server's port
     * @returns {SieveSession}
     *   a self reference
     */
    async connect(hostname, port) {

      if (typeof (hostname) === "undefined" || hostname === null)
        throw new SieveClientException("No Hostname specified");

      if (typeof (port) === "undefined" || port === null)
        throw new SieveClientException("No Port specified");

      this.createSieve();

      this.getSieve().setIdleWait(this.getOption("keepAlive"));

      // TODO do we really need this? Or do we need this only for keep alive?
      this.getSieve().addListener(this);

      let proxy = null;
      if (this.listeners.onProxyLookup)
        proxy = await this.listeners.onProxyLookup(hostname, port);

      const init = () => {
        this.getSieve().connect(
          hostname, port,
          this.getOption("secure", true),
          this,
          proxy);
      };

      this.setCapabilities(
        await this.sendRequest(new SieveInitRequest(), false, init));

      await this.startTLS();

      await this.authenticate();

      return this;
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

      if (this.getSieve() === null)
        return this;

      // We try to exit with a graceful Logout request...
      if (!force && this.getSieve().isAlive()) {
        try {
          await this.logout();
        } catch (ex) {
          this.getLogger().logSession(`Graceful logout failed ${ex}`);
        }
      }

      // ... in case it failed for we do it the hard way
      if (this.getSieve()) {
        await this.getSieve().disconnect();
        this.sieve = null;
      }

      return this;
    }

    /**
     * Lists all scripts available on the server.
     * @returns {string}
     *   the current scripts.
     */
    async listScripts() {
      return (await this.sendRequest(new SieveListScriptsRequest())).getScripts();
    }

    /**
     * Renames a script.
     *
     * It prefers the new rename command. In case it is not supported it will
     * use a get, put and delete sequence to emulate the rename command.
     *
     * So the result will be the very same, but there is one slight difference.
     * Instead of throwing an error it will overwrite existing script with the
     * same name silently.
     *
     * @param {string} oldName
     *   the old name
     * @param {string} newName
     *   the new name
     */
    async renameScript(oldName, newName) {

      if (this.getSieve().getCompatibility().renamescript) {
        await this.sendRequest(new SieveRenameScriptRequest(oldName, newName));
        return;
      }

      // Get the scripts activation state and check if the script name clashes
      const scripts = await this.listScripts();
      let active = null;

      for (const item of scripts) {
        if (item.script === newName)
          throw new SieveClientException("Name already exists");

        if (item.script === oldName)
          active = item.active;
      }

      if (active === null)
        throw new SieveClientException(`Unknown Script ${oldName}`);

      // Get the script'S content and save is as a new file
      await this.putScript(newName,
        await this.getScript(oldName));

      // Activate the new script
      if (this.active === true)
        await this.activateScript(newName);

      // Finally delete the old script
      await this.deleteScript(oldName);
    }

    /**
     * Saves the given script. In case the script exists
     * it will be silently overwritten.
     *
     * @param {string} name
     *   the script's name
     * @param {string} script
     *   the script which should be saved.
     *
     */
    async putScript(name, script) {
      await this.sendRequest(new SievePutScriptRequest(name, script));
    }

    /**
     * Deletes the given script name.
     *
     * @param {string} name
     *   the script which should be deleted.
     *
     */
    async deleteScript(name) {
      await this.sendRequest(new SieveDeleteScriptRequest(name));
    }

    /**
     * Gets the script with the given name.
     * In case the script does not exists the server will throw an error.
     *
     * @param {string} name
     *   the scripts unique name
     * @returns {Promise<string>}
     *   the scripts content as string
     */
    async getScript(name) {
      return (await this.sendRequest(new SieveGetScriptRequest(name))).getScriptBody();
    }

    /**
     * Activates the specified script and deactivated the current script.
     * Sieve supports at most one active script.
     *
     * To deactivate all scripts just omit the script parameter
     *
     * @param {string} [script]
     *   the script which should be activated.
     *   If omitted all script will be deactivated.
     *
     */
    async activateScript(script) {
      await this.sendRequest(new SieveSetActiveRequest(script));
    }

    /**
     * Checks the script for syntax errors.
     *
     * It uses the checkscript command if present otherwise
     * it emulates the checkscript by pushing a temporary script
     * to the server.
     *
     * Throws an exception in case the script is not valid.
     *
     * @param {string} script
     *   the script which should be checked.
     *
     */
    async checkScript(script) {

      // We do not need to check an empty script...
      if (!script.length)
        return;

      // Use the CHECKSCRIPT command when possible, otherwise we need to ...
      // ... fallback to the PUTSCRIPT/DELETESCRIPT Hack...
      if (this.getSieve().getCompatibility().checkscript) {
        await this.sendRequest(new SieveCheckScriptRequest(script));
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
    }

    /**
     * Sends a noop or keep alive response.
     * It is a request without side effect and without any
     * payload. It is typically used to test if the server
     * is available and to prevent closing the connection to the server.
     *
     * Servers do not have to support noop.
     * The implementation will use a capability request as
     * fallback as described in the rfc.
     *
     */
    async noop() {

      // In case th server does not support noop we fallback
      // to a capability request as suggested in the rfc.
      if (!this.getSieve().getCompatibility().noop) {
        await this.capabilities();
      }

      await this.sendRequest(new SieveNoopRequest());
    }

    /**
     * Sends a capability request.
     * In case of an error an exception will be thrown.
     *
     * @returns {object}
     *   an object with the capabilities.
     */
    async capabilities() {
      return (await this.sendRequest(new SieveCapabilitiesRequest())).getDetails();
    }

    /**
     * Used to gracefully disconnect from the server.
     * It sends a logout request, then the server should
     * hangup the connection.
     */
    async logout() {
      await this.sendRequest(new SieveLogoutRequest(), false);
    }

  }

  exports.SieveAbstractSession = SieveAbstractSession;

})(module.exports || this);
