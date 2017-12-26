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

/* global Components */
/* global SieveListScriptRequest */
/* global SieveConnections */
/* global SieveDeleteScriptRequest */
/* global SievePutScriptRequest */
/* global SieveSetActiveRequest */
/* global SieveGetScriptRequest */
/* global SieveCheckScriptRequest */
/* global SieveRenameScriptRequest */

/* global Ci */
/* global Cc */

Components.utils.import("chrome://sieve/content/modules/sieve/SieveConnectionManager.js");
Components.utils.import("chrome://sieve/content/modules/sieve/SieveMozClient.js");


function SieveAbstractChannel() {
  this._sid = null;
  this._cid = null;
}

// TODO muss der error listener wirklich jedes mal gesetzet werden...
// eigentlich müssete der default doch beim Objekt rauskommen...

SieveAbstractChannel.prototype.onListScriptResponse
  = function (response) {
    throw new Error("Implement onListScriptResponse");
  };

SieveAbstractChannel.prototype.onSetActiveResponse
  = function (response) {
    throw new Error("Implement onSetActiveResponse");
  };

SieveAbstractChannel.prototype.onDeleteScriptResponse
  = function (response) {
    throw new Error("Implement onDeleteScriptResponse");
  };

SieveAbstractChannel.prototype.onGetScriptResponse
  = function (response) {
    throw new Error("Implement onGetScriptResponse");
  };

SieveAbstractChannel.prototype.onCheckScriptResponse
  = function (response) {
    throw new Error("Implement onCheckScriptResponse");
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
    var message = {};
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


/******************************************************************************/

// TODO it should accept an strings instead of an  account object
SieveAbstractChannel.prototype.connect
  = function (account) {
    let ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);

    if (ioService.offline)
      return this.onStatusChange(6);

    this.onStatusChange(3, "progress.connecting");

    // Ensure that Sieve Object is null...
    let sivManager = SieveConnections;

    this._sid = sivManager.createSession(account.getKey());
    sivManager.addSessionListener(this._sid, this);

    this._cid = sivManager.createChannel(this._sid);

    sivManager.openChannel(this._sid, this._cid);

    Cc["@mozilla.org/observer-service;1"]
      .getService(Ci.nsIObserverService)
      .addObserver(this, "network:offline-status-changed", false);
  };

SieveAbstractChannel.prototype.disconnect
  = function (state, message) {
    if (state)
      this.onStatusChange(state, message);

    if ((!this._sid) || (!this._cid))
      return;

    try {
      let sivManager = SieveConnections;
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
    catch (ex) { }
  };


SieveAbstractChannel.prototype.deleteScript
  = function (script) {
    // delete the script...
    let request = new SieveDeleteScriptRequest(script);
    request.addDeleteScriptListener(this);
    request.addErrorListener(this);

    this.sendRequest(request);
  };

SieveAbstractChannel.prototype.setActiveScript
  = function (script) {
    let request = new SieveSetActiveRequest(script);
    request.addSetActiveListener(this);
    request.addErrorListener(this);

    this.sendRequest(request);
  };

SieveAbstractChannel.prototype.checkScript
  = function (script) {
    let that = this;

    let lEvent =
      {
        onPutScriptResponse: function (response) {
          // the script is syntactically correct. This means the server accepted...
          // ... our temporary script. So we need to do some cleanup and remove...
          // ... the script again.

          // Call delete, without response handlers, we don't care if the ...
          // ... command succeeds or fails.
          that.sendRequest(new SieveDeleteScriptRequest("TMP_FILE_DELETE_ME"));

          // Call CHECKSCRIPT's response handler to complete the hack...
          that.onCheckScriptResponse(response);
        },

        onError: function (response) {
          that.onCheckScriptResponse(response);
        }
      };



    if (script.length === 0)
      return;

    // Use the CHECKSCRIPT command when possible, otherwise we need to ...
    // ... fallback to the PUTSCRIPT/DELETESCRIPT Hack...

    let request = null;


    let canCheck = SieveConnections.getChannel(this._sid, this._cid)
      .getCompatibility().checkscript;

    if (canCheck) {
      // ... we use can the CHECKSCRIPT command
      request = new SieveCheckScriptRequest(script);
      request.addCheckScriptListener(this);
    }
    else {
      // ... we have to use the PUTSCRIPT/DELETESCRIPT Hack...

      // First we use PUTSCRIPT to store a temporary script on the server...
      // ... incase the command fails, it is most likely due to an syntax error...
      // ... if it sucseeds the script is syntactically correct!
      request = new SievePutScriptRequest("TMP_FILE_DELETE_ME", script);
      request.addPutScriptListener(lEvent);
    }

    request.addErrorListener(lEvent);

    this.sendRequest(request);
  };

SieveAbstractChannel.prototype._renameScript2
  = function (oldName, newName) {
    let that = this;

    let lEvent =
      {
        onRenameScriptResponse: function (response) {
          that.listScript();
        },
        onTimeout: function () {
          that.onTimeout();
        },
        onError: function (response) {
          // TODO Display notification instead of an popup box.
          alert(response.getMessage());
        }
      };

    let request = new SieveRenameScriptRequest(oldName, newName);
    request.addRenameScriptListener(lEvent);
    request.addErrorListener(lEvent);

    this.sendRequest(request);
  };

SieveAbstractChannel.prototype._renameScript
  = function (oldName, newName, isActive) {
    let that = this;

    let lEvent =
      {
        oldScriptName: null,
        newScriptName: null,
        isActive: null,

        onGetScriptResponse: function (response) {
          let request = new SievePutScriptRequest(
            "" + lEvent.newScriptName,
            "" + response.getScriptBody());

          request.addPutScriptListener(lEvent);
          request.addErrorListener(lEvent);

          that.sendRequest(request);
        },
        onPutScriptResponse: function (response) {

          if (lEvent.isActive === true) {
            let request = new SieveSetActiveRequest(lEvent.newScriptName);

            request.addSetActiveListener(lEvent);
            request.addErrorListener(that);

            that.sendRequest(request);
          }
          else
            lEvent.onSetActiveResponse(null);
        },
        onSetActiveResponse: function (response) {
          // we redirect this request to event not lEvent!
          // because event.onDeleteScript is doing exactly what we want!
          let request = new SieveDeleteScriptRequest(lEvent.oldScriptName);
          request.addDeleteScriptListener(that);
          request.addErrorListener(that);

          that.sendRequest(request);
        },
        onTimeout: function () {
          that.onTimeout();
        },
        onError: function (response) {
          // TODO Display notification instead of an popup box.
          alert("Renaming\r\n" + response.getMessage());
        }
      };

    lEvent.oldScriptName = oldName;
    lEvent.newScriptName = newName;

    lEvent.isActive = ((isActive && (isActive === "true")) ? true : false);

    // first get the script and redirect the event to a local event...
    // ... in order to put it up under its new name an then finally delete it
    let request = new SieveGetScriptRequest(lEvent.oldScriptName);

    request.addGetScriptListener(lEvent);
    request.addErrorListener(this);

    this.sendRequest(request);

  };


SieveAbstractChannel.prototype.renameScript
  = function (oldScriptName, newScriptName) {

    let canRename = SieveConnections
      .getChannel(this._sid, this._cid)
      .getCompatibility().renamescript;

    if (canRename) {
      this._renameScript2(oldScriptName, newScriptName);
      return;
    }

    this._renameScript(oldScriptName, newScriptName);
  };

SieveAbstractChannel.prototype.listScript
  = function () {
    let request = new SieveListScriptRequest();
    request.addListScriptListener(this);
    request.addErrorListener(this);

    this.sendRequest(request);
  };

SieveAbstractChannel.prototype.getScript
  = function (script) {
    let request = new SieveGetScriptRequest(script);
    request.addGetScriptListener(this);
    request.addErrorListener(this);

    this.sendRequest(request);
  };

SieveAbstractChannel.prototype.putScript
  = function (script, content) {

    let request = new SievePutScriptRequest(script, content);
    request.addPutScriptListener(this);
    request.addErrorListener(this);

    this.sendRequest(request);
  };

SieveAbstractChannel.prototype.sendRequest
  = function (request) {
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
      SieveConnections
        .getChannel(this._sid, this._cid)
        .addRequest(request);
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
      SieveConnections
        .getChannel(this._sid, this._cid);
    }
    catch (ex) {
      return false;
    }

    return true;
  };
