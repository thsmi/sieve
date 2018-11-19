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

  const STATE_WAITING = 3;
  const STATE_OFFLINE = 6;

  /* global Components */

  const Cc = Components.classes;
  const Ci = Components.interfaces;

  function SieveAbstractChannel() {
    this._sid = null;
    this._cid = null;
  }

  // TODO muss der error listener wirklich jedes mal gesetzet werden...
  // eigentlich müssete der default doch beim Objekt rauskommen...

  SieveAbstractChannel.prototype.onListScriptResponse
    = function (response) {
      throw new Error("Implement onListScriptResponse(" + response + ")");
    };

  SieveAbstractChannel.prototype.onSetActiveResponse
    = function (response) {
      throw new Error("Implement onSetActiveResponse(" + response + ")");
    };

  SieveAbstractChannel.prototype.onDeleteScriptResponse
    = function (response) {
      throw new Error("Implement onDeleteScriptResponse(" + response + ")");
    };

  SieveAbstractChannel.prototype.onGetScriptResponse
    = function (response) {
      throw new Error("Implement onGetScriptResponse(" + response + ")");
    };

  SieveAbstractChannel.prototype.onCheckScriptResponse
    = function (response) {
      throw new Error("Implement onCheckScriptResponse(" + response + ")");
    };

  SieveAbstractChannel.prototype.onOffline
    = function () {
      this.disconnect(6);
    };

  SieveAbstractChannel.prototype.onTimeout
    = function () {
      // TODO implement a loggin facility
      // gLogger.logStringMessage("SieveAbstractChannel.js\nOnTimeout");
      this.disconnect(1, "warning.timeout");
    };

  SieveAbstractChannel.prototype.onError
    = function (response) {
      // TODO implement a loggin facility
      // gLogger.logStringMessage("SivFilerExplorer.OnError: "+response.getMessage());
      this.disconnect(4, response.getMessage());
    };

  SieveAbstractChannel.prototype.onDisconnect
    = function () {
      let ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);

      if (ioService.offline)
        this.onOffline();

      this.disconnect(9);
    };

  SieveAbstractChannel.prototype.onChannelClosed
    = function () {
      throw new Error("implement onChannelClosed");
    };

  SieveAbstractChannel.prototype.onChannelCreated
    = function (sieve) {
      this.onChannelReady(this._cid);
    };

  SieveAbstractChannel.prototype.onChannelReady
    = function (cid) {
      // We observe only our channel...
      if (cid !== this._cid)
        return;

      throw new Error("implement onChannelReady");
    };

  SieveAbstractChannel.prototype.onChannelStatus
    = function (id, text) {
      this.onStatusChange(id, text);
    };

  SieveAbstractChannel.prototype.onStatusChange
    = function (state, message) {
      throw new Error("implement onStatusChange");
    };

  SieveAbstractChannel.prototype.onBadCert
    = function (targetSite, status) {
      let message = {};
      message.status = status;
      message.site = targetSite;

      this.disconnect(5, message);
    };

  SieveAbstractChannel.prototype.observe
    = function (aSubject, aTopic, aData) {
      if (aTopic !== "network:offline-status-changed")
        return;

      if (aData === "offline")
        this.onOffline();

      if (aData === "online")
        this.connect();
    };


  /* *****************************************************************************/

  // TODO it should accept an strings instead of an  account object
  SieveAbstractChannel.prototype.connect
    = function (account) {
      let ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);

      if (ioService.offline) {
        this.onStatusChange(STATE_OFFLINE);
        return;
      }

      this.onStatusChange(STATE_WAITING, "progress.connecting");

      // Ensure that Sieve Object is null...
      let sivManager = this.getConnection();

      this._sid = sivManager.createSession(account.getKey());
      sivManager.addSessionListener(this._sid, this);

      this._cid = sivManager.createChannel(this._sid);

      sivManager.openChannel(this._sid, this._cid);

      Cc["@mozilla.org/observer-service;1"]
        .getService(Ci.nsIObserverService)
        .addObserver(this, "network:offline-status-changed", false);
    };

  SieveAbstractChannel.prototype.getConnection
    = function () {
      throw new Error("Impement me");
    };

  SieveAbstractChannel.prototype.disconnect
    = function (state, message) {
      if (state)
        this.onStatusChange(state, message);

      if ((!this._sid) || (!this._cid))
        return;

      try {
        let sivManager = this.getConnection();
        sivManager.removeSessionListener(this._sid, this);
        sivManager.closeChannel(this._sid, this._cid);
      }
      catch (ex) {
        Components.utils.reportError(ex);
      }

      try {
        Cc["@mozilla.org/observer-service;1"]
          .getService(Ci.nsIObserverService)
          .removeObserver(this, "network:offline-status-changed");
      }
      catch (ex) {
        // do nothing
      }
    };

  SieveAbstractChannel.prototype.deleteScript
    = function (script) {
      this.trySendRequest((channel) => {
        channel.deleteScript(script, this, this);
      });
    };

  SieveAbstractChannel.prototype.setActiveScript
    = function (script) {
      this.trySendRequest((channel) => {
        channel.setActiveScript(script, this, this);
      });
    };

  SieveAbstractChannel.prototype.checkScript
    = function (script) {

      if (script.length === 0)
        return;

      // Use the CHECKSCRIPT command when possible, otherwise we need to ...
      // ... fallback to the PUTSCRIPT/DELETESCRIPT Hack...
      let lEvent = {
        onError: (response) => {
          this.onCheckScriptResponse(response);
        }
      };

      let canCheck = this.getConnection().getChannel(this._sid, this._cid)
        .getCompatibility().checkscript;

      if (canCheck) {
        this.trySendRequest((channel) => {
          channel.checkScript2(script, this, lEvent);
        });
        return;
      }

      // ... we have to use the PUTSCRIPT/DELETESCRIPT Hack...

      // First we use PUTSCRIPT to store a temporary script on the server...
      // ... incase the command fails, it is most likely due to an syntax error...
      // ... if it sucseeds the script is syntactically correct!
      this.trySendRequest((channel) => {
        channel.checkScript(script, this, lEvent);
      });
    };

  SieveAbstractChannel.prototype.renameScript
    = function (oldScriptName, newScriptName, isActive) {

      let lEvent = {
        onRenameScriptResponse: () => {
          this.listScript();
        },
        onTimeout: () => {
          this.onTimeout();
        },
        onError: (response) => {
          // TODO Display notification instead of an popup box.
          alert(response.getMessage());
        }
      };

      let canRename = this.getConnection()
        .getChannel(this._sid, this._cid)
        .getCompatibility().renamescript;

      if (canRename) {
        this.trySendRequest((channel) => {
          channel.renameScript2(oldScriptName, newScriptName, lEvent, lEvent);
        });
        return;
      }

      this.trySendRequest((channel) => {
        channel.renameScript(oldScriptName, newScriptName, isActive, lEvent, lEvent);
      });
    };

  SieveAbstractChannel.prototype.listScript
    = function () {
      this.trySendRequest((channel) => {
        channel.listScript(this, this);
      });
    };

  SieveAbstractChannel.prototype.getScript
    = function (script) {
      this.trySendRequest((channel) => {
        channel.getScript(script, this, this);
      });
    };

  SieveAbstractChannel.prototype.putScript
    = function (script, content) {

      this.trySendRequest((channel) => {
        channel.putScript(script, content, this, this);
      });
    };

  SieveAbstractChannel.prototype.trySendRequest
    = function (callback) {
      // we do not send requests while in offline mode...
      let ioService = Cc["@mozilla.org/network/io-service;1"]
        .getService(Ci.nsIIOService);

      if (ioService.offline) {
        this.disconnect(6);
        return;
      }

      // ... we are not so let's try. If the channel was closed...
      // ... getChannel will throw an exception.
      try {
        let channel = this.getConnection().getChannel(this._sid, this._cid);
        callback(channel);
      }
      catch (e) {
        // most likely getChannel caused this exception, but anyway we should ...
        // ... display error message. If we do not catch the exception a timeout ...
        // ... would accure, so let's display the timeout message directly.
        this.disconnect(1, "warning.timeout");
      }
    };

  SieveAbstractChannel.prototype.isActive
    = function () {
      try {
        this.getConnection()
          .getChannel(this._sid, this._cid);
      }
      catch (ex) {
        return false;
      }

      return true;
    };

  exports.SieveAbstractChannel = SieveAbstractChannel;

})(module.exports);
