/*
 * The content of this file is licenced. You may obtain a copy of the license
 * at http://sieve.mozdev.org or request it via email from the author. 
 *
 * Do not remove or change this comment.
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 *      
 */

function errorhandler(msg, url, line)
  {
    alert(msg);
    Components.utils.reportError(msg);
  }
  
window.onerror = errorhandler;
  


 

// TODO move code into separate class and override this class here, in the...
// .. explorer and the editor. So that we do not need to maintain duplicate code
  
// TODO möglichkeit bauen einen FilterList Dialog an die GUI zu binden bzw. 
// davon zu befreien. Dadurch wird garantiert dass immer nur die aktuelle
// Session angezeigt wird.


function SieveFilterListDialog()
{
  this._sid = null;
  this._cid = null;
  this._script = "Thunderbird Mailfilters"
}

SieveFilterListDialog.prototype.onListScriptResponse
    = function(response)
{
  var scripts = response.getScripts();
  
  for (var i=0; i<scripts.length; i++)
  {
    if (!scripts[i].active)
      continue;
      
    this._script = scripts[i].script;
      
    this.getScript(this._script);
    return;
  }
  
  try {
   
  
  var capabilities = Cc["@sieve.mozdev.org/transport-service;1"]
        .getService().wrappedJSObject
        .getChannel(this._sid,this._cid).extensions;
        
  document.getElementById("sivContent")
    .contentWindow.setSieveScript("",capabilities);
    
  sivSetStatus(0);
  }
  catch (ex) {
    alert(ex);
  }
  
  
}

SieveFilterListDialog.prototype.onGetScriptResponse
    = function(response)
{
  try {
  var capabilities = Cc["@sieve.mozdev.org/transport-service;1"]
        .getService().wrappedJSObject
        .getChannel(this._sid,this._cid).extensions;
      
  document.getElementById("sivContent")
    .contentWindow.setSieveScript(response.getScriptBody(),capabilities);
  }
  catch (ex) {
    alert(ex);
  }
    
  sivSetStatus(0); 
}

SieveFilterListDialog.prototype.onTimeout
    = function()
{
  this.disconnect(1,"warning.timeout");
}
  
SieveFilterListDialog.prototype.onError
    = function(response)
{
  this.disconnect(4,response.getMessage());
}

SieveFilterListDialog.prototype.onDisconnect
    = function()
{
  this.disconnect(9);
}
      
SieveFilterListDialog.prototype.onChannelClosed
    = function()
{
  // a channel is usually closed when a child window is closed. 
  // it might be a good idea to check if the script was changed.
}
  
SieveFilterListDialog.prototype.onChannelCreated
    = function(sieve)
{
  this.onChannelReady(this._cid);
}
  
SieveFilterListDialog.prototype.onChannelReady
    = function(cid)
{
  // We observe only our channel...
  if (cid != this._cid)
    return;
      
  this.listScript();
  
  // Step 1: List script
  
  // get active if any
}
  
SieveFilterListDialog.prototype.onChannelStatus
    = function(id,text)
{      
  sivSetStatus(id,text);
}
  
SieveFilterListDialog.prototype.onBadCert
    = function(targetSite)
{
  this.disconnect(5,targetSite);
}

SieveFilterListDialog.prototype.connect
    = function (account)
{
  var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
  
  if (ioService.offline)
    return sivSetStatus(6); 
  
  sivSetStatus(3,"progress.connecting");
  
  // Ensure that Sieve Object is null...
  var sivManager = Cc["@sieve.mozdev.org/transport-service;1"]
            .getService().wrappedJSObject;
 
  this._sid = sivManager.createSession(account.getKey());
  sivManager.addSessionListener(this._sid,this);
  
  this._cid = sivManager.createChannel(this._sid);
  
  sivManager.openChannel(this._sid,this._cid);  
}

SieveFilterListDialog.prototype.disconnect
    = function (state,message)
{ 
  if (state)
    sivSetStatus(state,message,"status.disconnected");  
  
  if ((!this._sid) || (!this._cid))
    return;
    
  var sivManager = Cc["@sieve.mozdev.org/transport-service;1"]
                       .getService().wrappedJSObject;
  sivManager.removeSessionListener(this._sid, this);
  sivManager.closeChannel(this._sid,this._cid);
  
}

SieveFilterListDialog.prototype.listScript
    = function ()
{
  var request = new SieveListScriptRequest();
  request.addListScriptListener(this);
  request.addErrorListener(this);
  
  this.sendRequest(request);
}

SieveFilterListDialog.prototype.getScript
    = function (script)
{
  var request = new SieveGetScriptRequest(script);
  request.addGetScriptListener(this);
  request.addErrorListener(this);
  
  this.sendRequest(request)
}

SieveFilterListDialog.prototype.sendRequest
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


var gSFLD = null;


/*function onCanChangeAccount(key)
{
  if (!gSFLD)
    return true;
  
  if (gSFLD._key != key)
    return true;
    
  return false;  
}*/
  
function onLoad()
{
  var key = window.frameElement.getAttribute("key");
    
  var account = Components.classes['@mozilla.org/messenger/account-manager;1']
                  .getService(Components.interfaces.nsIMsgAccountManager)
                  .getIncomingServer(key);
                         
  var account = new SieveAccount(account);
    
  document.getElementById("sivStatus").contentWindow
    .onAttach(account,function() { onLoad() });
    
  // the content is heavy weight javascript. So load it lazily
  var iframe = document.getElementById("sivContent")
  
  if (iframe.hasAttribute("src"))
    iframe.contentWindow.location.reload();
  else
    iframe.setAttribute("src","chrome://sieve/content/libs/libSieveDOM/SieveSimpleGui.html");
        
  if ((!account.isEnabled()) || account.isFirstRun())
  {
    account.setFirstRun();
    sivSetStatus(8);
    
    return;
  }
  
  sivSetStatus(3,"progress.connecting");
  
  gSFLD = new SieveFilterListDialog();

  gSFLD.connect(account);
   
}

window.onunload = function ()
{
  if (gSFLD)
    gSFLD.disconnect();
}


function sivSetStatus(state, message)
{        
  // Script ready
  if (state == 0)
  {
    document.getElementById("sivStatus").setAttribute('hidden','true');    
    document.getElementById('sivContent').removeAttribute('hidden');
    return;
  }
  
  // The rest has to be redirected to the status window...
  //document.getElementById('sivExplorerTree').setAttribute('collapsed','true');    
  document.getElementById("sivStatus").contentWindow.onStatus(state,message)
  document.getElementById("sivStatus").removeAttribute('hidden');
  document.getElementById('sivContent').setAttribute('hidden','true');  
}

/*
 * StartUp...
 * 
 * Step 1
 * 0. Connect
 * 1. Get Scripts
 * 
 * 2. Script Active?
 *   2a. No create a new Filter named "Thunderbird"
 *   2b. Make Filter Active
 *   
 * 3. Get Active Script
 * 
 * 4. pass script to iframe
 * 
 * 
 * On Change:
 * 1. is script empty?
 *  1a delete
 *  1b stop;
 *  
 * 2. put script 
 *   
 * 
 * On Close
 *   Disconnect...
 *  
 */

