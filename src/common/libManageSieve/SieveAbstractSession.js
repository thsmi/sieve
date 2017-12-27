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

// Enable Strict Mode
"use strict";

(function (exports) {


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
   * @constructor
   */
  function SieveAbstractSession(account) {
    this.idx = 0;

    // Load Account by ID
    this.account = account;

    // 0 = Offline 1 = Connecting 2 = connected 3= disconnecting
    this.state = 0;
  }

  SieveAbstractSession.prototype =
    {

      initClient: function () {
        throw new Error("Implement SieveAbstractSession::initClient");
      },

      getLogger: function () {
        throw new Error("Implement SieveAbstractSession::getLogger()");
      },


      createGetScriptRequest: function (script) {
        throw new Error(`Implement SieveAbstractSession::createGetScript(${script})`);
      },

      createPutScriptRequest: function (script, body) {
        throw new Error(`Implement SieveAbstractSession::createPutScriptRequest(${script}, ${body})`);
      },

      createCheckScriptRequest: function (body) {
        throw new Error(`Implement SieveAbstractSession::createCheckScriptRequest(${body})`);
      },

      createSetActiveRequest: function (script) {
        throw new Error(`Implement SieveAbstractSession::createSetActiveRequest(${script})`);
      },

      createCapabilitiesRequest: function () {
        throw new Error("Implement SieveAbstractSession::createCapabilitiesRequest()");
      },

      createDeleteScriptRequest: function (script) {
        throw new Error(`Implement SieveAbstractSession::createDeleteScriptRequest(${script})`);
      },

      createNoopRequest: function () {
        throw new Error("Implement SieveAbstractSession::createNoopRequest()");
      },

      createRenameScriptRequest: function (oldScript, newScript) {
        throw new Error(`Implement SieveAbstractSession::createRenameScriptRequest(${oldScript}, ${newScript})`);
      },

      createListScriptRequest: function () {
        throw new Error("Implement SieveAbstractSession::createListScriptRequest()");
      },

      createStartTLSRequest: function () {
        throw new Error("Implement SieveAbstractSession::createStartTLSRequest()");
      },

      createLogoutRequest: function () {
        throw new Error("Implement SieveAbstractSession::createLogoutRequest()");
      },

      /**
       * Initializes a new Init request for this session.
       *
       * @returns {SieveInitRequest}
       *   the request object.
       */
      createInitRequest: function () {
        throw new Error("Implement SieveAbstractSession::createInitRequest()");
      },

      createSaslPlainRequest: function () {
        throw new Error("Implement SieveAbstractSession::createSaslPlainRequest()");
      },

      createSaslLoginRequest: function () {
        throw new Error("Implement SieveAbstractSession::createSaslLoginRequest()");
      },

      createSaslCramMd5Request: function () {
        throw new Error("Implement SieveAbstractSession::createSaslCramMd5Request()");
      },

      createSaslScramSha1Request: function () {
        throw new Error("Implement SieveAbstractSession::createSaslScramSha1Request()");
      },

      createSaslScramSha256Request: function () {
        throw new Error("Implement SieveAbstractSession::createSaslScramSha256Request()");
      },

      createSaslExternalRequest: function () {
        throw new Error("Implement SieveAbstractSession::createSaslExternalRequest()");
      },

      onIdle: function () {
        this.getLogger().log("Sending keep alive packet...", (1 << 2));

        // as we send a keep alive request, we don't care
        // about the response...
        let request = null;

        if (this.sieve.getCompatibility().noop)
          request = this.createNoopRequest();
        else
          request = this.createCapabilitiesRequest();

        this.sieve.addRequest(request);
      },

      onInitResponse: function (response) {
        // establish a secure connection if TLS ist enabled and if the Server ...
        // ... is capable of handling TLS, otherwise simply skip it and ...
        // ... use an insecure connection

        if (!this.account.getHost().isTLSEnabled()) {
          this.onAuthenticate(response);
          return;
        }

        if (!response.getTLS() && !this.account.getHost().isTLSForced()) {
          this.onAuthenticate(response);
          return;
        }

        let request = this.createStartTLSRequest();
        request.addStartTLSListener(this);
        request.addErrorListener(this);

        this.sieve.addRequest(request);
      },

      onAuthenticate: function (response) {
        // update capabilites
        this.sieve.setCompatibility(response.getCompatibility());

        this._invokeListeners("onChannelStatus", 3, "progress.authenticating");

        let account = this.account;

        // Without a username, we can skip the authentication
        if (account.getLogin().hasUsername() === false) {
          this.onLoginResponse(null);
          return;
        }


        // Notify the listener to display capabilities. We simply pass the response...
        // ... to the listener. So the listener can pick whatever he needs.
        this.sieve.extensions = response.getExtensions();
        this._invokeListeners("onChannelStatus", 7, response);

        // We have to figure out which ist the best SASL Mechanism for the login ...
        // ... therefore we check first whether a mechanism is forced by the user ...
        // ... if no one is specified, we follow the rfc advice and use the first
        // .... mechanism listed in the capability response we support.

        let mechanism = [];
        if (account.getSettings().hasForcedAuthMechanism())
          mechanism = [account.getSettings().getForcedAuthMechanism()];
        else
          mechanism = response.getSasl();

        // ... translate the SASL Mechanism into an SieveSaslLogin Object ...
        let request = null;
        while ((mechanism.length > 0) && (request === null)) {
          // remove and test the first element...
          switch (mechanism.shift().toUpperCase()) {
            case "PLAIN":
              request = this.createSaslPlainRequest();
              break;

            case "CRAM-MD5":
              request = this.createSaslCramMd5Request();
              break;

            case "SCRAM-SHA-1":
              request = this.createSaslScramSha1Request();
              break;

            case "SCRAM-SHA-256":
              request = this.createSaslScramSha256Request();
              break;

            case "EXTERNAL":
              request = this.createSaslExternalRequest();
              break;

            case "LOGIN":
              // we use SASL LOGIN only as last resort...
              // ... as suggested in the RFC.
              if (mechanism.length > 0) {
                mechanism.push("LOGIN");
                break;
              }
              request = this.createSaslLoginRequest();
              break;
          }
        }

        if (!request) {
          this.disconnect(false, 2, "error.sasl");
          return;
        }

        request.addErrorListener(this);

        request.setUsername(account.getLogin().getUsername());

        // SASL External has no passwort it relies completely on SSL...
        if (request.hasPassword()) {

          let password = account.getLogin().getPassword();

          if (typeof(password) === "undefined" || password === null) {
            this.disconnect(false, 2, "error.authentication");
            return;
          }

          request.setPassword(password);
        }

        request.addSaslListener(this);


        // check if the authentication method supports proxy authorization...
        if (request.isAuthorizable()) {
          // ... if so retrieve the authorization identity
          let authorization = account.getAuthorization().getAuthorization();
          if (typeof(authorization) === "undefined" || authorization === null) {
            this.disconnect(false, 2, "error.authentication");
            return;
          }

          if (authorization !== "")
            request.setAuthorization(authorization);
        }

        this.sieve.addRequest(request);
      },

      onStartTLSCompleted: function (response) {
        let that = this;

        let lEvent =
          {
            onCapabilitiesResponse: function (response) {
              that.onAuthenticate(response);
            }
          };

        // explicitely request capabilites
        let request = this.createCapabilitiesRequest();
        request.addCapabilitiesListener(lEvent);

        this.sieve.addRequest(request);

        // With a bugfree server we endup with two capability request, one
        // implicit after startTLS and one explicite from capbilites. So we have
        // to consume one of them silently...
        this.sieve.addRequest(this.createInitRequest(), true);
      },

      onStartTLSResponse: function (response) {
        this.sieve.startTLS(() => {
          this.onStartTLSCompleted(response);
        });
      },

      onSaslResponse: function (response) {
        this.onLoginResponse(response);
      },

      onLoginResponse: function (response) {
        // We are connected...
        this.state = 2;
        this._invokeListeners("onChannelCreated", this.sieve);
      },

      addListener: function (listener) {
        if (!this.listeners)
          this.listeners = [];

        this.listeners.push(listener);

      },

      removeListener: function (listener) {
        if (!this.listeners)
          return;

        for (let i = 0; i < this.listeners.length; i++)
          if (this.listeners[i] === listener)
            this.listeners.splice(i, 1);

      },

      _hasListeners: function (callback) {
        if (!this.listeners)
          return false;

        for (let i = 0; i < this.listeners.length; i++)
          if (this.listeners[i][callback])
            return true;

        return false;
      },

      _invokeListeners: function (callback, arg1, arg2) {
        if (!this.listeners)
          return false;

        // the a callback function might manipulate our listeners...
        // ... so we need to cache them before calling...
        let iterator = [];
        for (let i = 0; i < this.listeners.length; i++)
          if (this.listeners[i][callback])
            iterator.push(this.listeners[i]);

        if (!iterator.length) {
          if (this.getLogger().isLoggable((1 << 4)))
            this.getLogger().log("No Listener for " + callback + "\n" + this.listeners.toString());

          return;
        }

        this.getLogger().log("Invoking Listeners for " + callback + "\n", (1 << 4));

        while (iterator.length) {
          var listener = iterator.pop();
          listener[callback].call(listener, arg1, arg2);
        }

      },

      /** @private */
      onLogoutResponse: function (response) {
        this.disconnect(true);
      },

      /**
       * Called by the sieve object in case we received an BYE response.
       * @param {SieveAbstractResponse} response
       * @returns {void}
       */
      onByeResponse: function (response) {
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


          this.getLogger().log("Referred to Server: " + code.getHostname(), (1 << 4));
          this.getLogger().log("Migrating Channel: [" + this.channels + "]", (1 << 4));

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
      },

      /** @private */
      onError: function (response) {
        this.getLogger().log("OnError: " + response.getMessage());
        this.disconnect(false, 4, response.getMessage());
      },

      /** @private */
      onTimeout: function (message) {
        this._invokeListeners("onTimeout", message);
      },

      /**
       * This listener is called when the conenction is lost or terminated by the server
       * and the session is no more usable. It ensures that everything is disconnected
       * correctly.
       *
       * @returns {void}
       **/
      onDisconnect: function () {
        this.getLogger().log("On Server Disconnect:  [" + this.channels + "]", (1 << 4));

        this._invokeListeners("onDisconnect");
        this.disconnect(true);
      },

      /**
       * Connects to a remote Sieve server.
       *
       * It warps the complex login process. For example it automatically requests
       * for a password, picks an authentication mechanism and starts a secure
       * connection.
       *
       * You get notification on the login status through the listener.
       *
       * @param {String} hostname - optional
       *   overrides the default hostname supplied by the account. This is needed
       *   for referrals and similar stuff.
       * @param {int} port - optional
       *   overrides the default port supplied by the account.
       * @returns {void}
       */
      connect: function (hostname, port) {
        // set state to connecting...
        this.state = 1;

        this.initClient();

        // Step 1: Setup configure settings
        this.sieve.addListener(this);

        // TODO Load Timeout interval from account settings...
        if (this.account.getSettings().isKeepAlive())
          this.sieve.setIdleWait(this.account.getSettings().getKeepAliveInterval());

        // Step 2: Initialize Message Queue...
        let request = this.createInitRequest();
        request.addErrorListener(this);
        request.addInitListener(this);
        this.sieve.addRequest(request);

        // Step 3: Connect...
        if (typeof(hostname) === "undefined" || hostname === null)
          hostname = this.account.getHost().getHostname();

        if (typeof(port) === "undefined" || port === null)
          port = this.account.getHost().getPort();

        this.sieve.connect(
          hostname, port,
          this.account.getHost().isTLSEnabled(),
          this,
          this.account.getProxy().getProxyInfo());
      },

      disconnect: function (force, id, message) {
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
          let request = this.createLogoutRequest();
          request.addLogoutListener(this);
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
      },

      isConnecting: function () {
        return (this.state === 1);
      },

      isConnected: function () {
        return (this.state === 2);
      },

      isDisconnecting: function () {
        return (this.state === 3);
      },

      isDisconnected: function () {
        return (this.state === 0);
      },

      /**
       * Requests a channel for to this session. After use you have to revoke it via
       * "removeChannel", this will close the channel. Otherwise the connection
       * to the remote server might stay open.
       *
       * @return {string} An unique Identifier
       */
      addChannel: function () {

        if (!this.channels)
          this.channels = [];

        let cid = "cid=" + (this.idx++);

        this.channels.push(cid);

        this.getLogger().log("Channel Added: " + cid + " [" + this.channels + "]", (1 << 4));

        return cid;
      },

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
       * @return {Boolean}
       *   return true if the channel could be closed and false if not. A "false"
       *   means the identifier is invalid.
       */
      removeChannel: function (cid) {
        if (!this.channels)
          return false;

        let i = this.channels.indexOf(cid);
        if (i === -1)
          return false;

        this.channels.splice(i, 1);

        this.getLogger().log("Channel Closed: " + cid + " [" + this.channels + "]", (1 << 4));

        return true;
      },

      /**
       * Checks if the session has open/registered channels.
       * @return {Boolean}
       *   returns true incase the session has open channels. Otherwise false.
       */
      hasChannels: function () {
        if ((this.channels) && (this.channels.length > 0))
          return true;

        return false;
      },

      /**
       * Checks if a channel is registed with this session
       * @param {String} cid
       *   the channels unique identifier
       * @return {Boolean}
       *   returns false in case the channel identifier is not registered with
       *   this session's object.
       */
      hasChannel: function (cid) {
        return (this.channels.indexOf(cid) === -1) ? false : true;
      }

    };

  exports.SieveAbstractSession = SieveAbstractSession;

  // Expose as mozilla module...
  /* global Components */
  if (typeof (Components) !== "undefined" && Components.utils && Components.utils.import) {
    if (!exports.EXPORTED_SYMBOLS)
      exports.EXPORTED_SYMBOLS = [];

    exports.EXPORTED_SYMBOLS.push("SieveAbstractSession");
  }
})(this);
