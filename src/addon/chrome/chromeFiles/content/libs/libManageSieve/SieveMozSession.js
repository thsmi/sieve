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
  const STATE_CLIENT_ERROR = 2;
  const STATE_WAITING = 3;
  const STATE_SERVER_ERROR = 4;
  const STATE_CAPABILITIES = 7;

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
  class SieveSession {

    /**
     * Creates a new Session object.
     *
     * @param {SieveAccount} account
     *   a sieve account. this is needed to obtain login informations.
     * @param {string} [sid]
     *   a unique Identifier for this Session. Only needed to make debugging easier.
     */
    constructor(account, sid) {
      this.logger = new SieveLogger(sid);
      this.logger.level(account.getSettings().getDebugFlags());

      this.idx = 0;
      this.account = account;
      this.state = 0;
    }

    /**
     * @returns {SieveLogger}
     *   a reference to the current logger
     */
    getLogger() {
      return this.logger;
    }

    /**
     * The server may close our connection after beeing idle for too long.
     * This can be prevented by sending regular keep alive packets.
     *
     * If supported the noop command is used otherwise a capability
     * request is used.
     *
     *
     */
    onIdle() {
      this.getLogger().logState("Sending keep alive packet...");

      // as we send a keep alive request, we don't care
      // about the response...
      let request = null;

      if (this.sieve.getCompatibility().noop)
        request = new SieveNoopRequest();
      else
        request = new SieveCapabilitiesRequest();

      this.sieve.addRequest(request);
    }

    /**
     * After a successfull connection the server sends his
     * capabilities.
     *
     * Then in case TLS is started if the client an server supports it.
     * Otherwise it tries to authenticate over an non encrypted connection.
     *
     * @param {SieveCapabilitiesResponse} response
     *   the initial response which contains the capabilities
     *
     *
     */
    onInitResponse(response) {
      // establish a secure connection if TLS is enabled and if the Server ...
      // ... is capable of handling TLS, otherwise simply skip it and ...
      // ... use an insecure connection

      this.sieve.capabilities = {};
      this.sieve.capabilities.tls = response.getTLS();
      this.sieve.capabilities.extensions = response.getExtensions();
      this.sieve.capabilities.sasl = response.getSasl();

      this.sieve.setCompatibility(response.getCompatibility());

      if (!this.account.getSecurity().isSecure()) {
        this.onAuthenticate(response);
        return;
      }

      // FIX ME: We should throw an error here...
      if (!response.getTLS()) {
        this.disconnect(false, STATE_CLIENT_ERROR, "error.sasl");
        return;
      }

      let request = new SieveStartTLSRequest();
      request.addResponseListener(this);
      request.addErrorListener(this);

      this.sieve.addRequest(request);
    }

    /**
     * Figures out the best possible and compatible mechanism
     * for this server.
     *
     * Deprecated mechanisms like LOGIN are used as last resort
     *
     * @param {string} mechanism
     *   the mechanims unique name or the string "default"
     *
     * @returns {SieveAbstractSaslRequest}
     *   the SASL request which machtes the given mechanism or null
     *   in case no compatible mechanism could be found.
     */
    getSaslMechanism(mechanism) {

      if (mechanism === "default")
        mechanism = [... this.sieve.capabilities.sasl];
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
            // we use SASL LOGIN only as last resort...
            // ... as suggested in the RFC.
            if (mechanism.length === 0)
              return new SieveSaslLoginRequest();

            mechanism.push("LOGIN");
            break;
        }
      }

      return null;
    }

    /**
     * The authentication starts for secure connections after
     * the tls handshake and for unencrypted connection directly
     * after the initial server response.
     *
     * Please not after a successfull tls handshake the server
     * may update the SASL Mechanism. The server may fore the user
     * to use TLS by providing initially an empty list of SASL
     * Mechanisms. After a successfull tls handshake it then upgrades
     * the SASL Mechanisms.
     *
     * @param {SieveCapabilitiesResponse} response
     *   the servers's capabilities.
     *
     */
    onAuthenticate(response) {

      // update capabilites
      this.sieve.setCompatibility(response.getCompatibility());
      // update the sasl mechanism
      this.sieve.capabilities.sasl = response.getSasl();

      this._invokeListeners("onChannelStatus", STATE_WAITING, "progress.authenticating");

      let account = this.account;
      let mechanism = account.getSecurity().getMechanism();

      if (mechanism === "none") {
        this.onLoginResponse(null);
        return;
      }

      // Without a username, we can skip the authentication
      if (account.getAuthentication().hasUsername() === false) {
        this.onLoginResponse(null);
        return;
      }

      // Notify the listener to display capabilities. We simply pass the response...
      // ... to the listener. So the listener can pick whatever he needs.
      this.sieve.extensions = response.getExtensions();
      this._invokeListeners("onChannelStatus", STATE_CAPABILITIES, response);

      let request = this.getSaslMechanism(mechanism);

      if (!request) {
        this.disconnect(false, STATE_CLIENT_ERROR, "error.sasl");
        return;
      }

      request.addErrorListener(this);
      request.setUsername(account.getAuthentication().getUsername());

      // SASL External has no passwort it relies completely on SSL...
      if (request.hasPassword()) {

        let password = account.getAuthentication().getPassword();

        if (typeof (password) === "undefined" || password === null) {
          this.disconnect(false, STATE_CLIENT_ERROR, "error.authentication");
          return;
        }

        request.setPassword(password);
      }

      request.addResponseListener(this);


      // check if the authentication method supports proxy authorization...
      if (request.isAuthorizable()) {
        // ... if so retrieve the authorization identity
        let authorization = account.getAuthorization().getAuthorization();
        if (typeof (authorization) === "undefined" || authorization === null) {
          this.disconnect(false, STATE_CLIENT_ERROR, "error.authentication");
          return;
        }

        if (authorization !== "")
          request.setAuthorization(authorization);
      }

      this.sieve.addRequest(request);
    }

    /**
     * Old Cyrus servers do not advertise their capabilities
     * after the tls handshake.
     *
     * So we need some magic here. In addition the implicit
     * request we send an explicit capability request.
     *
     * A bug free server will return with two capability responsed
     * while a buggy implementation returns only one.
     */
    onStartTLSCompleted() {
      let that = this;

      let lEvent =
      {
        onCapabilitiesResponse: function (response) {
          that.onAuthenticate(response);
        }
      };

      // explicitely request capabilites
      let request = new SieveCapabilitiesRequest();
      request.addResponseListener(lEvent);

      this.sieve.addRequest(request);

      // With a bugfree server we endup with two capability request, one
      // implicit after startTLS and one explicite from capbilites. So we have
      // to consume one of them silently...
      this.sieve.addRequest(new SieveInitRequest(), true);
    }

    /**
     * Called as soon as the connection was upgraded.
     *
     * @param {SieveSimpleResponse} response
     *   the servers response to the tls upgrade request.
     */
    onStartTLSResponse(response) {
      this.sieve.startTLS(() => {
        this.onStartTLSCompleted();
      });
    }

    onSaslResponse(response) {
      this.onLoginResponse(response);
    }

    onLoginResponse(response) {
      // We are connected...
      this.state = 2;
      this._invokeListeners("onChannelCreated", this.sieve);
    }

    /**
     * Adds a new event listener to this session
     * @param {*} listener
     *   the event listener.
     */
    addListener(listener) {
      if (!this.listeners)
        this.listeners = [];

      this.listeners.push(listener);
    }

    /**
     * Removes the event listener for this object.
     *
     * @param {*} listener
     *   removes the given event listener
     *
     */
    removeListener(listener) {
      if (!this.listeners)
        return;

      for (let i = 0; i < this.listeners.length; i++)
        if (this.listeners[i] === listener)
          this.listeners.splice(i, 1);
    }

    /**
     * Checks if any one listens to the given subject.
     *
     * @param {string} subject
     *   the subject as string.
     *
     * @returns {boolean}
     *   true in case there are listeners otherwise false.
     */
    _hasListeners(subject) {
      if (!this.listeners)
        return false;

      for (let i = 0; i < this.listeners.length; i++)
        if (this.listeners[i][subject])
          return true;

      return false;
    }

    /**
     * Invokes all listernes for the given subject.
     *
     * @param {string} subject
     *   the subject as string.
     * @param {Object} arg1
     *   an arbitray argument
     * @param {Object} arg2
     *   an arbitray argument
     *
     *
     */
    _invokeListeners(subject, arg1, arg2) {
      if (!this.listeners)
        return;

      // the a callback function might manipulate our listeners...
      // ... so we need to cache them before calling...
      let iterator = [];
      for (let i = 0; i < this.listeners.length; i++)
        if (this.listeners[i][subject])
          iterator.push(this.listeners[i]);

      if (!iterator.length) {
        this.getLogger().logSession("No Listener for " + subject + "\n" + this.listeners.toString());
        return;
      }

      this.getLogger().logSession("Invoking Listeners for " + subject + "\n");

      while (iterator.length) {
        let listener = iterator.pop();
        // we call this with the listener as scope...
        // eslint-disable-next-line no-useless-call
        listener[subject].call(listener, arg1, arg2);
      }
    }

    /** @private */
    onLogoutResponse(response) {
      this.disconnect(true);
    }

    /**
     * Called by the sieve object in case we received an BYE response.
     * @param {SieveAbstractResponse} response
     *   the servers reponse, contains the reason why the connection was terminated.
     *
     */
    onByeResponse(response) {
      // The server is going to disconnected our session nicely...
      let code = response.getResponseCode();

      // ... we most likely received a referal
      if (code.equalsCode("REFERRAL")) {
        // The referal should be fully transparent to the session, so we cannot...
        // ... call this.disconnect(true) here as it flushes/closes all our channels...
        if (this.sieve)
          this.sieve.disconnect();

        // we are disconnected...
        this.sieve = null;
        this.state = 0;


        this.getLogger().logSession("Referred to Server: " + code.getHostname());
        this.getLogger().logSession("Migrating Channel: [" + this.channels + "]");

        this.connect(code.getHostname(), code.getPort());
        return;
      }

      // ... as the server must terminate the connection after sending a ...
      // ... bye response, we should also disconnect nicely which means in this...
      // ... case without a logout request.
      this.disconnect(true);

      // ... it's either a timeout or we tried the wrong password...
      // ... the best we can do is to report an error.
      this.onError(response);
    }

    /** @private */
    onError(response) {
      this.getLogger().log("OnError: " + response.getMessage());
      this.disconnect(false, STATE_SERVER_ERROR, response.getMessage());
    }

    /**
     * This listener is called when the conenction is lost or terminated by the server
     * and the session is no more usable. It ensures that everything is disconnected
     * correctly.
     *
     *
     **/
    onDisconnect() {
      this.getLogger().logSession("On Server Disconnect:  [" + this.channels + "]");

      this._invokeListeners("onDisconnect");
      this.disconnect(true);
    }

    /**
     * Connects to a remote Sieve server.
     *
     * It warps the complex login process. For example it automatically requests
     * for a password, picks an authentication mechanism and starts a secure
     * connection.
     *
     * You get notification on the login status through the listener.
     *
     * @param {string} hostname - optional
     *   overrides the default hostname supplied by the account. This is needed
     *   for referrals and similar stuff.
     * @param {int} port - optional
     *   overrides the default port supplied by the account.
     *
     */
    connect(hostname, port) {
      // set state to connecting...
      this.state = 1;

      this.sieve = new Sieve(this.getLogger());

      // Step 1: Setup configure settings
      this.sieve.addListener(this);

      // TODO: Load Timeout interval from account settings...
      if (this.account.getSettings().isKeepAlive())
        this.sieve.setIdleWait(this.account.getSettings().getKeepAliveInterval());

      // Step 2: Initialize Message Queue...
      let request = new SieveInitRequest();
      request.addErrorListener(this);
      request.addResponseListener(this);
      this.sieve.addRequest(request);

      // Step 3: Connect...
      if (typeof (hostname) === "undefined" || hostname === null)
        hostname = this.account.getHost().getHostname();

      if (typeof (port) === "undefined" || port === null)
        port = this.account.getHost().getPort();

      this.sieve.connect(
        hostname, port,
        this.account.getSecurity().isSecure(),
        this,
        this.account.getProxy().getProxyInfo());
    }

    disconnect(force, id, message) {
      // update state we are now disconnecting...
      this.state = 3;

      // at first we update the status, so that the user ...
      // ... knows what happened.
      if (id)
        this._invokeListeners("onChannelStatus", id, message);

      // Skip if the connection already closed...
      if (!this.sieve) {
        this.state = 0;
        return;
      }

      // ... we always try to exit with an Logout request...
      if (!force && this.sieve.isAlive()) {
        let request = new SieveLogoutRequest();
        request.addResponseListener(this);
        // request.addErrorListener(levent);
        this.sieve.addRequest(request);

        return;
      }

      // ... but this obviously is not always usefull
      this.sieve.disconnect();
      this.sieve = null;

      this.channels = null;

      // update state: we are disconnected
      this.state = 0;

      return;
    }

    isConnecting() {
      return (this.state === 1);
    }

    isConnected() {
      return (this.state === 2);
    }

    isDisconnecting() {
      return (this.state === 3);
    }

    isDisconnected() {
      return (this.state === 0);
    }

    /**
     * Requests a channel for to this session. After use you have to revoke it via
     * "removeChannel", this will close the channel. Otherwise the connection
     * to the remote server might stay open.
     *
     * @returns {string} An unique Identifier
     */
    addChannel() {

      if (!this.channels)
        this.channels = [];

      let cid = "cid=" + (this.idx++);

      this.channels.push(cid);

      this.getLogger().logSession("Channel Added: " + cid + " [" + this.channels + "]");

      return cid;
    }

    /**
     * Closes and Invalidates a channel. In case all channels of a session are
     * closed, the connection to the remote server will be terminated. That's why
     * there's no close session command. Thus always close your channels.
     *
     * This Method does not throw an Exception, even if you pass an invalid
     * session identifier! So it's save to call this method if you are unsure
     * if you already closed a channel.
     *
     * @param {string} cid
     *   The unique Identifier of the channel which should be closed and invalidated.
     * @returns {boolean}
     *   return true if the channel could be closed and false if not. A "false"
     *   means the identifier is invalid.
     */
    removeChannel(cid) {
      if (!this.channels)
        return false;

      let i = this.channels.indexOf(cid);
      if (i === -1)
        return false;

      this.channels.splice(i, 1);

      this.getLogger().logSession("Channel Closed: " + cid + " [" + this.channels + "]");

      return true;
    }

    /**
     * Checks if the session has open/registered channels.
     * @returns {boolean}
     *   returns true incase the session has open channels. Otherwise false.
     */
    hasChannels() {
      if ((this.channels) && (this.channels.length > 0))
        return true;

      return false;
    }

    /**
     * Checks if a channel is registed with this session
     * @param {string} cid
     *   the channels unique identifier
     * @returns {boolean}
     *   returns false in case the channel identifier is not registered with
     *   this session's object.
     */
    hasChannel(cid) {
      return (this.channels.indexOf(cid) === -1) ? false : true;
    }

    onTimeout(message) {
      let ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);

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
     * @param {Object} socketInfo
     *   the socket info object
     * @param {Object} sslStatus
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
      return this.sieve.getCompatibility();
    }

    addRequest(request) {
      this.sieve.addRequest(request);
    }

    deleteScript(script, success, error) {
      // delete the script...
      let request = new SieveDeleteScriptRequest(script);
      request.addResponseListener(success);
      request.addErrorListener(error);

      this.sieve.addRequest(request);
    }

    setActiveScript(script, success, error) {

      let request = new SieveSetActiveRequest(script);
      request.addResponseListener(success);
      request.addErrorListener(error);

      this.sieve.addRequest(request);
    }

    checkScript(script, success, error) {

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
    }

    checkScript2(script, success, error) {

      let request = new SieveCheckScriptRequest(script);
      request.addResponseListener(success);
      request.addErrorListener(error);

      this.sieve.addRequest(request);
    }

    renameScript2(oldName, newName, success, error) {

      let request = new SieveRenameScriptRequest(oldName, newName);
      request.addResponseListener(success);
      request.addErrorListener(error);

      this.sieve.addRequest(request);
    }

    renameScript(oldName, newName, isActive, success, error) {

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
    }

    listScript(success, error) {

      let request = new SieveListScriptRequest();
      request.addResponseListener(success);
      request.addErrorListener(error);

      this.sieve.addRequest(request);
    }

    putScript(script, body, success, error) {

      let request = new SievePutScriptRequest(script, body);
      request.addResponseListener(success);
      request.addErrorListener(error);

      this.sieve.addRequest(request);
    }

    getScript(script, success, error) {
      let request = new SieveGetScriptRequest(script);
      request.addResponseListener(success);
      request.addErrorListener(error);

      this.sieve.addRequest(request);
    }
  }

  exports.SieveSession = SieveSession;

})(module.exports);
