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

import { SieveLogger } from "./SieveLogger.mjs";
import { Sieve } from "./SieveClient.mjs";

import {
  SieveSaslPlainRequest,
  SieveSaslLoginRequest,
  SieveSaslScramSha1Request,
  SieveSaslScramSha256Request,
  SieveSaslScramSha512Request,
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
} from "./SieveRequest.mjs";

import {
  SieveClientException,
  SieveServerException,
  SieveReferralException,
  SieveTimeOutException
} from "./SieveExceptions.mjs";

import {
  SieveCompatibility
} from "./SieveCompatibility.mjs";

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
   * @param {Object<string, object>} options
   *   a dictionary with options as key/value pairs.
   */
  constructor(id, options) {
    this.id = id;
    this.options = options;
    this.listeners = {};
    this.sieve = null;

    this.connecting = false;

    this.compatibility = new SieveCompatibility();
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
    this.getLogger().logSession("Creating new sieve connection");

    if (typeof(this.sieve) !== "undefined" && this.sieve !== null)
      throw new SieveClientException("Sieve Connection Active");

    this.sieve = new Sieve(this.getLogger());
  }

  /**
   * The server announces capabilities after the initial connect as well as
   * after a successful upgrade to a secure connection.
   *
   * This capabilities are used to determine the a compatibility layer between
   * the server and the client.
   *
   * @returns {SieveCompatibility}
   *   the object storing the compatibility information.
   */
  getCompatibility() {
    return this.compatibility;
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
    try {
      await this.noop();
    } catch (ex) {
      await this.onError(ex);
    }
  }

  /**
   * The default error handler called upon any unhandled error or exception.
   * Called e.g. when the connection to the server was terminated unexpectedly.
   *
   * The default behaviour is to disconnect.
   *
   * @param {Error} error
   *   the error message which causes this exceptional state.
   */
  async onError(error) {
    this.getLogger().logSession(`SieveAbstractSession OnError: ${error.message}`);
    await this.disconnect(true, error);
  }

  /**
   * Called when the connection gets disconnected by the server.
   */
  async onDisconnected() {

    if (!this.listeners.onDisconnected)
      return;

    this.getLogger().logSession(`SieveAbstractSession: onDisconnected`);
    this.listeners.onDisconnected(this);
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

    let mechanisms = this.getCompatibility().getSaslMechanisms();

    if (mechanism !== "default") {
      if (!mechanisms.includes(mechanism))
        throw new SieveClientException("Forced SASL Mechanism is not supported by the server (error.sasl)");

      mechanisms = [mechanism];
    }

    // ... translate the SASL Mechanism into an SieveSaslLogin Object ...
    while (mechanisms.length > 0) {
      // remove and test the first element...
      switch (mechanisms.shift()) {
        case "PLAIN":
          return new SieveSaslPlainRequest();

        case "SCRAM-SHA-1":
          return new SieveSaslScramSha1Request();

        case "SCRAM-SHA-256":
          return new SieveSaslScramSha256Request();

        case "SCRAM-SHA-512":
          return new SieveSaslScramSha512Request();
        case "EXTERNAL":
          return new SieveSaslExternalRequest();

        case "LOGIN":
          // as suggested in the RFC, we use SASL LOGIN
          // only as last resort...

          // this means in case it is the only mechanism
          // we have no options
          if (!mechanisms.length)
            return new SieveSaslLoginRequest();

          // otherwise be move it to the end of the
          // mechanism list.
          mechanisms.push("LOGIN");
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
   *
   * @returns {SieveAbstractSession}
   *   a self reference
   */
  on(name, callback) {

    if (name === "authenticate") {
      this.listeners.onAuthenticate = callback;
      return this;
    }

    if (name === "authorize") {
      this.listeners.onAuthorize = callback;
      return this;
    }

    if (name === "disconnected") {
      this.listeners.onDisconnected = callback;
      return this;
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

    this.getLogger().logSession(`Authenticating session...`);

    const mechanism = this.getOption("sasl", "default");

    if (mechanism === "none") {
      this.getLogger().logSession(`... authentication is deactivated in config`);
      return;
    }

    this.getLogger().logSession(`... using SASL ${mechanism} ...`);
    const request = this.getSaslMechanism(mechanism);

    if (!this.listeners.onAuthenticate)
      throw new SieveClientException("No compatible authentication handler");

    const authentication = await this.listeners.onAuthenticate(request.hasPassword());

    // SASL External has no password it relies completely on SSL...
    if (request.hasPassword()) {
      this.getLogger().logSession(`... requesting password ...`);
      const password = authentication.password;

      if (typeof (password) === "undefined" || password === null)
        throw new SieveClientException("No password provided");

      request.setPassword(password);
    }

    request.setUsername(authentication.username);

    // check if the authentication method supports proxy authorization...
    if (request.isAuthorizable()) {
      this.getLogger().logSession(`... requesting authorization ...`);

      if (!this.listeners.onAuthorize)
        throw new SieveClientException("No Authorization handler registered");

      // ... if so retrieve the authorization identity
      const authorization = await this.listeners.onAuthorize();

      if (typeof (authorization) === "undefined" || authorization === null)
        throw new SieveClientException("error.authorization");

      if (authorization !== "")
        request.setAuthorization(authorization);
    }

    this.getLogger().logSession(`... authenticating ...`);
    await this.sendRequest(request);

    this.getLogger().logSession(`... authentication completed.`);
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

    this.getLogger().logSession(`Securing session...`);

    if (!this.getSieve()) {
      this.getLogger().logSession(`... no sieve object.`);
      throw new SieveClientException("No or invalid sieve object");
    }

    // Check if the socket can be upgraded.
    if (!this.getSieve().isSecurable()) {
      this.getLogger().logSession(`... secure upgrade deactivated in config.`);
      return;
    }

    // Check if the socket was already upgraded.
    if (this.getSieve().isSecured()) {
      this.getLogger().logSession(`... connection already updated.`);
      return;
    }

    if (!this.getCompatibility().canStartTLS())
      throw new SieveClientException("Server does not support a secure connection.");

    this.getLogger().logSession(`... requesting starttls ...`);
    await this.sendRequest(new SieveStartTLSRequest());


    await this.getSieve().startTLS(options);

    // After a successfully tls handshake the server will advertise
    // the capabilities, especially the SASL mechanism are likely to change.

    // Old Cyrus implementation fail to advertise the capabilities.
    // So that we actively request them as optional. This does not
    // hurt bug free implementations and makes cyrus happy.
    this.getLogger().logSession(`... requesting capabilities ...`);
    const capabilities = await this.sendRequest(new SieveCapabilitiesRequest());
    this.sendRequest(new SieveInitRequest().makeOptional());

    this.getCompatibility().update(capabilities);

    this.getLogger().logSession(`... secure upgrade completed.`);
  }

  /**
   * Converts a callback driven request into async/await code.
   *
   * @param {SieveAbstractRequest} request
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

    // eslint-disable-next-line no-async-promise-executor
    return await new Promise(async (resolve, reject) => {

      request.addResponseListener((response) => {
        resolve(response);
      });

      request.addErrorListener((response) => {
        reject(new SieveServerException(response));
      });

      request.addByeListener((response) => {

        if (response.getResponseCode().equalsCode("REFERRAL")) {
          reject(new SieveReferralException(response));
          return;
        }

        reject(new SieveServerException(response));
      });

      request.addTimeoutListener((error) => {

        if (error) {
          reject(error);
          return;
        }

        reject(new SieveTimeOutException("Request was canceled or took too long"));
      });


      await (this.getSieve().addRequest(request));

      if (init)
        await init();
    });
  }

  /**
   * Refers the connection to a different server.
   *
   * The server can send a referral request to the client at any time.
   * The client's job is to disconnects and reconnect to the referred
   * server's hostname and port.
   *
   * @param {SieveUrl} url
   *   the new server's connection url.
   *
   * @returns {SieveAbstractSession}
   *   the response for the first request or an exception in case of an error.
   */
  async refer(url) {
    this.getLogger().logSession(`SieveAbstractSession: Disconnecting old connection`);
    await this.disconnect(true);

    this.getLogger().logSession(
      `SieveAbstractSession: Connecting to referred Server: ${url.getHost()}:${url.getPort()}`);

    return await this.connect(url);
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
  async sendRequest(request, init) {

    try {
      return await this.promisify(request, init);
    }
    catch (ex) {

      if ((ex instanceof SieveReferralException) && (!this.isConnecting())) {
        this.getLogger().logSession(`Referral received`);
        this.getLogger().logSession(
          `Switching to ${ex.getUrl().getHost()}:${ex.getUrl().getPort()}`);
        try {
          this.connecting = true;
          await this.refer(ex.getUrl());
        } finally {
          this.connecting = false;
        }

        return await this.promisify(request, init);
      }

      this.getLogger().logSession(`Sending Request failed ${ex}`);
      throw ex;
    }
  }

  /**
   * By default a request will follow automatically a referral.
   * This means it will transparently disconnect from the old
   * and reconnect to the new host.
   *
   * In case the following is disabled an exception will be thrown
   * instead.
   *
   * You want to disable the implicit referral during stateful phases
   * like initial connection.
   *
   * Imagine the following scenario. The connection is secured via
   * startTLS and during authentication the referral is received.
   * Then the automatic referral would then disconnect from the old
   * host and connect to the new host. Then it would try to continue
   * with the authentication step on a non secure connection. The startTLS
   * step simply got lost.
   *
   * @returns {boolean}
   *   true in case  the connection handshake is currently being established.
   */
  isConnecting() {
    return this.connecting;
  }

  /**
   * An internal method creating a server connection.
   *
   * @param {string} url
   *   the sieve url with hostname and port.
   * @param {Object<string, object>} [options]
   *   the connection options as hash map.
   * @returns {SieveSession}
   *   a self reference
   */
  async connect(url, options) {

    this.createSieve();

    this.getSieve().setIdleWait(this.getOption("keepAlive"));

    // TODO do we really need this? Or do we need this only for keep alive?
    this.getSieve().addListener(this);

    // A referral during connection means we need to connect to the new
    // server and start the whole handshake process again.
    this.connecting = true;

    try {

      const init = () => {
        this.getSieve().connect(url, options);
      };


      this.getCompatibility().update(
        await this.sendRequest(new SieveInitRequest(), init));

      if (this.getSieve().isSecurable() && !this.getSieve().isSecured())
        await this.startTLS(options);

      await this.authenticate();
    } catch (ex) {

      if (!(ex instanceof SieveReferralException))
        throw ex;

      // In case we got a referral we renegotiate the whole authentication
      this.getLogger().logSession(`Referral received during authentication`);
      this.getLogger().logSession(
        `Switching to ${ex.getUrl().getHost()}:${ex.getUrl().getPort()}`);

      await this.refer(ex.getUrl());
    } finally {
      this.connecting = false;
    }

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
   * @param {Error} [reason]
   *   the optional reason why the session was disconnected.
   * @returns {SieveSession}
   *   a self reference.
   */
  async disconnect(force, reason) {

    if (this.getSieve() === null)
      return this;

    this.getLogger().logSession(`SieveAbstractSession: Disconnecting Session ${force}`);
    // We try to exit with a graceful Logout request...
    if (!force && this.isConnected()) {
      try {
        await this.logout();
      } catch (ex) {
        this.getLogger().logSession(`Graceful logout failed ${ex}`);
      }
    }

    // ... in case it failed for we do it the hard way
    if (this.getSieve()) {
      this.getLogger().logSession(`SieveAbstractSession: Forcing Disconnect`);

      const sieve = this.sieve;
      this.sieve = null;

      await sieve.disconnect(reason);
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

    if (this.getCompatibility().canRenameScript()) {
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
    if (this.getCompatibility().canCheckScript()) {
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
    if (!this.getCompatibility().canNoop()) {
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
    await this.sendRequest(new SieveLogoutRequest());
  }

}

export { SieveAbstractSession };
