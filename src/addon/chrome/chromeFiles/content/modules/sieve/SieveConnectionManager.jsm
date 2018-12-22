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

  // const Cc = Components.classes;
  // const Ci = Components.interfaces;
  // const Cr = Components.results;
  // const Cu = Components.utils;

  Components.utils.import("chrome://sieve/content/modules/sieve/SieveRequire.jsm");
  const { SieveAccountManager } = require("./settings/SieveMozAccounts.js");

  const { SieveSession } = require("./SieveMozSession.js");


  /**
   *  JavaScript Objects are usually create within the scope of a window. This
   *  means it can't be shared between multiple windows. "The cleanest and most
   *  powerful way to share data" is according to MDC a XPCOM component.
   *  <p>
   *  This component is a simple wrapper to create a window independent sieve
   *  object. The Sieve objects basically live within this XPCOM component.
   *  <p>
   *  Connections are pooled, as most sieve servers do not allow concurrent
   *  connections. Every sieve account can have exactly one active session. A
   *  session consits of indefinte channels. As channel are associated to a
   *  single consumer/window, a session can be shared between multiple consumers
   *  or windows.
   **/

  function SieveConnectionManager() {
    this.sessions = [];

    /* var observerService = Components.classes["@mozilla.org/observer-service;1"]
                        .getService(Components.interfaces.nsIObserverService);
    observerService.addObserver(this,"network:offline-about-to-go-offline",false);
    observerService.addObserver(this,"network:offline-status-changed",false);
    // TODO close/suspend all session if going offline and reopen if going online...
    // network:offline-about-to-go-offline
    // TODO Lock interface when going offline
    // network:offline-status-changed
    // data = 'online'|'offline'

    observe : function(aSubject, aTopic, aData)
    {
      if (aTopic != "network:offline-about-to-go-offline")
      {
        for (var i=0; i<sessions.length; i++)
          this.sessions[i].goOffline();
      }
      if (aTopic != "quit-application-requested")
        return;


      if (onClose() == false)
        aSubject.QueryInterface(Ci.nsISupportsPRBool).data = true;
      else
        close();
    }*/
  }

  SieveConnectionManager.prototype =
    {
      /**
       * Creates and opens a new Manage Sieve Session
       * @param {string} accountId
       *   the accounts unique id
       * @returns {int}
       *   a handle to the open session
       */
      createSession: function (accountId) {
        // The session id should be something unique. As Mozilla garantees, that...
        // ...the account key is unique. So let's use it.
        let sid = accountId;


        if (!this.sessions[sid]) {
          let account = SieveAccountManager.getAccountByName(accountId);

          this.sessions[sid] = new SieveSession(account, sid);
          this.sessions[sid].listeners = [];
        }

        return sid;
      },

      /**
       * Creates a new channel for a given session. A channel needs to be closed
       * afer creating it, otherwise the channel might get blocked
       *
       * @param {string} sid
       *   the unique session id
       * @returns {}
       */
      createChannel: function (sid) {
        if (!this.sessions[sid])
          throw new Error("createChannel: Invalid Session (" + sid + ")");

        return this.sessions[sid].addChannel();
      },

      openChannel: function (sid, cid) {
        if (!this.sessions[sid])
          throw new Error("Invalid Session Identifier");

        if (!this.sessions[sid].hasChannel(cid))
          throw new Error("Invalid Channel");

        // skip if we are currently connecting...
        // ... as onChannelCreated will be fired...
        if (this.sessions[sid].isConnecting())
          return;

        // ... if we are connected notify the callee...
        // ... we reused an existing channel.
        if (this.sessions[sid].isConnected()) {
          this.sessions[sid]._invokeListeners("onChannelReady", cid);
          return;
        }

        // ... in case we are gracefully disconnecting, we...
        // ... need to speed it up and force the disconnect
        if (this.sessions[sid].isDisconnecting())
          this.sessions[sid].disconnect(true);

        // ... we ensured we are disconnected so its safe to call connect
        this.sessions[sid].connect();
      },

      addSessionListener: function (sid, listener) {
        if (!this.sessions[sid])
          throw new Error("addSessionListener: Invalid Session (" + sid + ")");

        this.sessions[sid].addListener(listener);
      },

      removeSessionListener: function (sid, listener) {
        if (!this.sessions[sid])
          return;

        this.sessions[sid].removeListener(listener);
      },

      /**
       * Closes and frees a Manage Sieve Session
       * @param {int} id
       *   handle identifing the session that should be terminated
       */
      /* closeSession : function (id)
      {
        // free resources if needed...
        if (this.sessions[id] == null)
          return;

        this.sessions[id].sieve.disconnect();

        // Inform all channels, that the Session is gone.

        for (var i=0; i<this.sessions[id].channels.length; i++)
          if (this.session[id].channels[i] && this.session[id].channels[i].onChannelClosed)
            this.session[id].channels[i].onChannelClosed();

        this.sessions[id] = null;
      },*/



      closeChannel: function (sid, cid) {
        if (!this.sessions[sid])
          return;

        if (this.sessions[sid].removeChannel(cid))
          this.sessions[sid]._invokeListeners("onChannelClosed", cid);

        // In case the seesion has no active channels...
        if (this.sessions[sid].hasChannels())
          return;

        this.sessions[sid].listeners = null;
        // ... it's ok to close the session
        this.sessions[sid].disconnect();

        delete this.sessions[sid];

        /*
        // the session is gone. We can release all modules which depend on it
        // this safes memory and enusres only needed modules are loaded...
        if (this.sessions.length == 0)
        {
          Components.utils.unload("chrome://sieve/content/modules/sieve/Session.js");
          Components.utils.unload("chrome://sieve/content/modules/sieve/SieveMozClient.js");
          Components.utils.unload("chrome://sieve/content/modules/sieve/SieveRequest.js");
          Components.utils.unload("chrome://sieve/content/modules/sieve/SieveResponse.js");
          Components.utils.unload("chrome://sieve/content/modules/sieve/SieveResponseCode.js");
          Components.utils.unload("chrome://sieve/content/modules/sieve/SieveResponseParser.js");
        }*/
      },

      /**
       * Retuns the Sieve Object associated to this session.
       * @param {string} sid
       *   The identifier identifing the session instance
       * @param {string} cid
       *   An Identifier the channel
       * @returns {SieveMozSession}
       *   a reference to the session object
       */
      getChannel: function (sid, cid) {
        if (!this.sessions[sid])
          throw new Error("getChannel: Invalid Session (" + sid + ")");

        if (!this.sessions[sid].hasChannel(cid))
          throw new Error("getChannel: Invalid Channel (" + cid + ")");

        if (!(this.sessions[sid].sieve) || !(this.sessions[sid].sieve.isAlive()))
          throw new Error("getChannel: Session closed (" + sid + " / " + cid + ")");

        return this.sessions[sid];
      }
    };

  let SieveConnections = new SieveConnectionManager();

  // Expose as mozilla module...
  if (!exports.EXPORTED_SYMBOLS)
    exports.EXPORTED_SYMBOLS = [];

  exports.SieveConnections = SieveConnections;
  exports.EXPORTED_SYMBOLS.push("SieveConnections");

})(this);
