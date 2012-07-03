/* 
 * 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 *
 */

// Enable Strict Mode
"use strict";  

//TODO merge and or rename into SieveChannel


function SieveAbstractClient()
{
  this._sid = null;
  this._cid = null;
}

// TODO muss der error listener wirklich jedes mal gesetzet werden...
// eigentlich müssete der default doch beim Objekt rauskommen...

//-- Sieve Related Events
SieveAbstractClient.prototype.onListScriptResponse
    = function(response)
{
  throw "implement onListScriptResponse";
}

SieveAbstractClient.prototype.onSetActiveResponse
    = function(response)
{
  throw "implement onSetActiveResponse";
}

SieveAbstractClient.prototype.onDeleteScriptResponse
    = function(response)
{
  throw "implement onDeleteScriptResponse";
}

SieveAbstractClient.prototype.onGetScriptResponse
    = function(response)
{
  throw "implement onGetScriptResponse";
}

SieveAbstractClient.prototype.onCheckScriptResponse
    = function(response)
{
  throw "implement  onCheckScriptResponse";    
}

SieveAbstractClient.prototype.onOffline
    = function()
{
  this.disconnect(6);
}
  
SieveAbstractClient.prototype.onTimeout
    = function()
{
  // TODO implement a loggin facility
  //gLogger.logStringMessage("SieveAbstractClient.js\nOnTimeout");   
  this.disconnect(1,"warning.timeout");
}
  
SieveAbstractClient.prototype.onError
    = function(response)
{
  // TODO implement a loggin facility  
  //gLogger.logStringMessage("SivFilerExplorer.OnError: "+response.getMessage());
  this.disconnect(4,response.getMessage());
}
  
SieveAbstractClient.prototype.onDisconnect
    = function()
{
  this.disconnect(9);
}
      
SieveAbstractClient.prototype.onChannelClosed
    = function()
{
  throw "implement onChannelClosed";
}
  
SieveAbstractClient.prototype.onChannelCreated
    = function(sieve)
{
  this.onChannelReady(this._cid);
}
  
SieveAbstractClient.prototype.onChannelReady
    = function(cid)
{
  // We observe only our channel...
  if (cid != this._cid)
    return;
      
  throw "implement onChannelReady";    
}
  
SieveAbstractClient.prototype.onChannelStatus
    = function(id,text)
{ 
  this.onStatusChange(id,text);
}

SieveAbstractClient.prototype.onStatusChange
    = function (state, message)
{
  throw "implement onStatusChange"
}
  
SieveAbstractClient.prototype.onBadCert
    = function(targetSite)
{
  this.disconnect(5,targetSite);
}
  
SieveAbstractClient.prototype.observe
    = function(aSubject, aTopic, aData)
  {
    if (aTopic != "network:offline-status-changed")
      return;
    
    if (aData == "offline")
      this.onOffline();
    
    if (aData == "online")
      this.connect();    
  }
  
/******************************************************************************/

  // TODO it should accept an strings instead of an  account object
SieveAbstractClient.prototype.connect
    = function (account)
{
  var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
  
  if (ioService.offline)
    return this.onStatusChange(6); 
  
  this.onStatusChange(3,"progress.connecting");
  
  // Ensure that Sieve Object is null...
  var sivManager = Cc["@sieve.mozdev.org/transport-service;1"]
            .getService().wrappedJSObject;
 
  this._sid = sivManager.createSession(account.getKey());
  sivManager.addSessionListener(this._sid,this);
  
  this._cid = sivManager.createChannel(this._sid);
  
  sivManager.openChannel(this._sid,this._cid);  
  
  Cc["@mozilla.org/observer-service;1"]
      .getService (Ci.nsIObserverService)
      .addObserver(this,"network:offline-status-changed", false);    
}

SieveAbstractClient.prototype.disconnect
    = function (state,message)
{ 
  if (state)
    this.onStatusChange(state,message);  
  
  if ((!this._sid) || (!this._cid))
    return;
    
  var sivManager = Cc["@sieve.mozdev.org/transport-service;1"]
                       .getService().wrappedJSObject;
  sivManager.removeSessionListener(this._sid, this);
  sivManager.closeChannel(this._sid,this._cid);    
  
  try
  {
    Cc["@mozilla.org/observer-service;1"]
      .getService (Ci.nsIObserverService)
      .removeObserver(this,"network:offline-status-changed");
  } 
  catch (ex)  {  }  
}


SieveAbstractClient.prototype.deleteScript
    = function (script)
{
  // delete the script...
  var request = new SieveDeleteScriptRequest(script);
  request.addDeleteScriptListener(this);
  request.addErrorListener(this);
  
  this.sendRequest(request);  
}

SieveAbstractClient.prototype.setActiveScript
    = function (script)
{
  var request = new SieveSetActiveRequest(script);      
  request.addSetActiveListener(this);
  request.addErrorListener(this);

  this.sendRequest(request);
}

SieveAbstractClient.prototype.checkScript
    = function (script)
{
  var that = this;
  
  var lEvent =
  {
    onPutScriptResponse: function(response)
    {
      // the script is syntactically correct. This means the server accepted...
      // ... our temporary script. So we need to do some cleanup and remove...
      // ... the script again.   

      // Call delete, without response handlers, we don't care if the ...
      // ... command succeeds or fails.
      that.sendRequest(new SieveDeleteScriptRequest("TMP_FILE_DELETE_ME"));
      
      // Call CHECKSCRIPT's response handler to complete the hack...  
      that.onCheckScriptResponse(response);
    },   

    onError: function(response)
    {
      that.onCheckScriptResponse(response);
    }
  }
  

  
  if (script.length == 0)
    return;
  
  // Use the CHECKSCRIPT command when possible, otherwise we need to ...
  // ... fallback to the PUTSCRIPT/DELETESCRIPT Hack...
    
  var request = null;
  
  var canCheck = Cc["@sieve.mozdev.org/transport-service;1"]
                   .getService().wrappedJSObject  
                   .getChannel(this._sid,this._cid).getCompatibility()
                   .checkscript;

  if (canCheck)
  {
    // ... we use can the CHECKSCRIPT command
    request = new SieveCheckScriptRequest(script);
    request.addCheckScriptListener(this);
  }
  else
  {
    // ... we have to use the PUTSCRIPT/DELETESCRIPT Hack...
    
    // First we use PUTSCRIPT to store a temporary script on the server...
    // ... incase the command fails, it is most likely due to an syntax error...
    // ... if it sucseeds the script is syntactically correct!
    request = new SievePutScriptRequest("TMP_FILE_DELETE_ME",script);
    request.addPutScriptListener(lEvent);
  }
  
  request.addErrorListener(lEvent);
  
  this.sendRequest(request);   
}

SieveAbstractClient.prototype._renameScript2
    = function (oldName, newName)
{
  var that = this;
  
  var lEvent = 
  {    
    onRenameScriptResponse: function(response)
    {
      that.listScript();
    },
    onTimeout: function()
    {
      that.onTimeout();
    },
    onError: function(response)
    {
      //TODO Display notification instead of an popup box.
      alert(response.getMessage());
    }
  }
  
  var request = new SieveRenameScriptRequest(oldName, newName);
  request.addRenameScriptListener(lEvent)
  request.addErrorListener(lEvent);
    
  this.sendRequest(request);
}

SieveAbstractClient.prototype._renameScript
    = function (oldName, newName, isActive)
{  
  var that = this;
  
  var lEvent = 
  {
    oldScriptName  : null,    
    newScriptName  : null,
    isActive       : null,
    
    onGetScriptResponse: function(response)
    {
      var request = new SievePutScriptRequest(
                      new String(lEvent.newScriptName),
                      new String(response.getScriptBody()));

      request.addPutScriptListener(lEvent)
      request.addErrorListener(lEvent)
      
      that.sendRequest(request);
    },    
    onPutScriptResponse: function(response)
    {
      
      if (lEvent.isActive == true)
      {
        var request = new SieveSetActiveRequest(lEvent.newScriptName)
      
        request.addSetActiveListener(lEvent);
        request.addErrorListener(that);
    
        that.sendRequest(request);
      }
      else
        lEvent.onSetActiveResponse(null);
    },
    onSetActiveResponse: function(response)
    {
      // we redirect this request to event not lEvent!
      // because event.onDeleteScript is doing exactly what we want!
      var request = new SieveDeleteScriptRequest(lEvent.oldScriptName);
      request.addDeleteScriptListener(that);
      request.addErrorListener(that);
      
      that.sendRequest(request);
    },
    onTimeout: function()
    {
      that.onTimeout();
    },
    onError: function(response)
    {
      //TODO Display notification instead of an popup box.
      alert("Renaming\r\n"+response.getMessage());
    }    
  }
         
  lEvent.oldScriptName  = oldName;
  lEvent.newScriptName  = newName;
    
  lEvent.isActive =  ((isActive && (isActive=="true"))?true:false);
      
  // first get the script and redirect the event to a local event...
  // ... in order to put it up under its new name an then finally delete it
  var request = new SieveGetScriptRequest(lEvent.oldScriptName);

  request.addGetScriptListener(lEvent);
  request.addErrorListener(this);

  this.sendRequest(request);
  
}


SieveAbstractClient.prototype.renameScript
    = function (oldScriptName,newScriptName)
{
  
  var canRename = Cc["@sieve.mozdev.org/transport-service;1"]
                    .getService().wrappedJSObject
                    .getChannel(this._sid,this._cid)
                    .getCompatibility().renamescript;                    
        
  if (canRename)
  {
    this._renameScript2(oldScriptName, newScriptName);
    return;
  }  
      
  this._renameScript(oldScriptName, newScriptName);   
}

SieveAbstractClient.prototype.listScript
    = function ()
{
  var request = new SieveListScriptRequest();
  request.addListScriptListener(this);
  request.addErrorListener(this);
  
  this.sendRequest(request);
}

SieveAbstractClient.prototype.getScript
    = function (script)
{
  var request = new SieveGetScriptRequest(script);
  request.addGetScriptListener(this);
  request.addErrorListener(this);
  
  this.sendRequest(request)
}

SieveAbstractClient.prototype.putScript
    = function (script,content)
{

  var request = new SievePutScriptRequest(script,content);
  request.addPutScriptListener(this);
  request.addErrorListener(this);
  
  this.sendRequest(request);
}

SieveAbstractClient.prototype.sendRequest
    = function (request)
{
  // we do not send requests while in offline mode...
  var ioService = Cc["@mozilla.org/network/io-service;1"]
                      .getService(Ci.nsIIOService);  
    
  if (ioService.offline)
  {
    this.disconnect(6);
    return;
  }
  
  // ... we are not so let's try. If the channel was closed...
  // ... getChannel will throw an exception.
  try
  {
    Cc["@sieve.mozdev.org/transport-service;1"]
        .getService().wrappedJSObject
        .getChannel(this._sid,this._cid)
        .addRequest(request);  
  }
  catch (e)
  {
    // most likely getChannel caused this exception, but anyway we should ...
    // ... display error message. If we do not catch the exception a timeout ...
    // ... would accure, so let's display the timeout message directly.    
    this.disconnect(1,"warning.timeout");    
  }
}
