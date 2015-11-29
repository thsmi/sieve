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

/* global Components */
/* global Iterator */

// Enable Strict Mode
"use strict";  

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

var EXPORTED_SYMBOLS = [ "SieveOverlayUtils","SieveOverlayManager" ];

var SieveOverlayUtils =
{
  addTabType : function (aTabType,tabmail)
  {  
    if ( !tabmail )
      throw "adding extension failed";
      
    tabmail.registerTabType(aTabType); 
  },  

  removeTabType : function (aTabType,tabmail)
  {
    /*if (tabmail.unregisterTabType)
    {      
      tabmail.unregisterTabType(aTabType);

      if (aTabType.name in tabmail.tabTypes)
        throw "error";
        
      return;
    }*/
     
    if (!aTabType || !aTabType.name)
      throw "Invalid Tabtype"+aTabType.name;
      
    if (!tabmail)
      throw "Invalid Tabmail"+tabmail;
    
    if (!tabmail.tabTypes)
      throw "Invalid tabtypes"+tabmail.tabTypes;
      
    if ((aTabType.name in tabmail.tabTypes) == false)
      return;
 
    for (let [modeName] in Iterator(aTabType.modes))
    {
      if ( !tabmail.tabModes[modeName])
        continue;
        
      while (tabmail.tabModes[modeName].tabs.length)
      {
        // TODO we need a force close here....
        tabmail.closeTab(tabmail.tabModes[modeName].tabs[0],true);
        // Sleep -> Sync
        // TODO close tabs...
      }
        
      delete tabmail.tabModes[modeName];
    }
    
    delete tabmail.tabTypes[aTabType.name]; 
    
    if (aTabType.name in tabmail.tabTypes)
      throw new Error("Removing Tabtypes failed");
  },

  addToolBarItem : function (document,toolbox, button)
  { 
      
    toolbox.palette.appendChild(button);
    
    // now it's getting ugly, the toolbar is already initialzed, so our button
    // is missing.
  
    // At first we are looking for toolbars containing a currentset 
    // attribute with our id. The current set attribute is used to restore
    // the toolbar and does not change.
    var toolbars = document.querySelectorAll('toolbar[currentset*="'+button.id+'"]');

    // we need to loop through all toolbars as querySelector's can't match
    // attributes containing kommas. So we have to do that on our own.
    for (var i=0; i<toolbars.length; i++)
    {      
      var currentset = toolbars[i].getAttribute("currentset").split(",");
      var pos = currentset.indexOf(""+button.id);
      
      if (pos == -1 )
        continue;
        
      var sib = null;
      var offset = 0;
      
      // we are now looking for the element directly behind us...
      while (pos < currentset.length-1)
      {
        pos++;
  
        // these types are hardcoded in toolbar.xml and have no real Id
        // so we have no chance to find them. So we need a hack...
        switch (currentset[pos])
        {
          case "separator":
          case "spring":
          case "spacer":
            offset++;
            continue;
        }
       
        // ... all other elements can be found.
        var sel = "#"+currentset[pos];
        
        sib = toolbars[i].querySelector(sel);
        
        if (sib)
          break;
      }

      if (!sib && offset)
      {
        sib = toolbars[i].lastChild;
        offset--;
      }
        
      while (sib && offset--)
        sib = sib.previousSibling;
        
      toolbars[i].insertItem(""+button.id,sib);
    }    
  },
  
  removeToolBarItem: function(item)
  {    
    item.parentNode.removeChild(item); 
  },  
  
  addMenuItem : function (document,item,sibling)
  {  
    sibling.parentNode.insertBefore(item,sibling);  
  },
  
  removeMenuItem : function(item)
  {
    item.parentNode.removeChild(item);    
  },
  
  addStyleSheet : function(document,url)
  {
    var style = document.createProcessingInstruction(
                   "xml-stylesheet",
                   'href="'+url+'" "type="text/css"');
    document.insertBefore(style,document.documentElement);     
  },

  removeStyleSheet : function (document,url)
  {
    for (var i=document.styleSheets.length-1; i>= 0; i--) 
    {
      if (document.styleSheets[i].href != url)
        continue;
      
      document.styleSheets[i].ownerNode.parentNode.removeChild(document.styleSheets[i].ownerNode);
    }    
  }   
};

// TODO scripts should pass an unique identifier like 
// "Sieve.Accounts", "Sieve.Session", "Sieve.AutoConfig" instead
// of an url
//
// SieveAccounts.js, SieveSessions.js and SieveAutoConfig need
// to register at SieveOverlayManager and declare their imports
// as chrome urls on which marschalling should work.
//
// SOM.manage("sieve.session",aUrl, ["chrome://...","chrome://...",...]);
//
// within ui code:
// SOM.require("sieve.session",scope,window) 
// java scrip scope is where to add the import, the global object is alys picked
// window the object to wich this import is bound if the window is gone the import 
// might be released. If null lifetime is boud to bootstrap and will be reasesed 
// upon shutdown.
//
// within modules:
// SOM.require(chrome://) 
// checks if a window is registered or this url if not an exeption is thrown.
// if yes the code is managed an imported into callers global object..
// safe require, manage

function SieveDict() {
  this.keys = [];
  this.values = [];
}

SieveDict.prototype.hasKey
  = function(object)
{
  if (this.keys.indexOf(object) != -1)
    return true;
  
  return false;
};

SieveDict.prototype.getValue
    = function(key)
{
  if (!this.hasKey(key))
    throw "No value for key";
    
  return this.values[this.keys.indexOf(key)];
};

SieveDict.prototype.setValue
    = function(key, value)
{
  if (this.hasKey(key))
  {
    this.values[this.keys.indexOf(key)] = value;
    return this;
  }
    
  this.keys.push(key);
  this.values.push(value);
};

SieveDict.prototype.deleteKey
    = function(key)
{
  var idx = this.keys.indexOf(key);
  
  if (idx == -1)
    throw "Invalid index";
   
  this.keys.splice(idx,1);
  this.values.splice(idx,1);
};

SieveDict.prototype.clear
    = function()
 {
  this.keys = [];
  this.values = [];
 };
 
SieveDict.prototype.hasKeys
    = function()
{
  return (this.keys.length); 
};

SieveDict.prototype.first
    = function()
{
  return this.keys[0]; 
};

      

var SieveOverlayManager =
{
  _overlays : [],
  _overlayUrls : {},
  _imports : {},
  
  _unload : new SieveDict() /*<window,callback>*/ ,
  
  require : function(aUrl,scope,aWindow)
  { 
    if (aUrl.substr(0,15) != "chrome://sieve/")
      aUrl = "chrome://sieve/content/modules" +aUrl;
      
    if (scope)
      Cu.import(aUrl,Cu.getGlobalForObject(scope));  
    
    if(typeof(aWindow) === "undefined")
      return;
      
    if (!this._imports[aUrl])
      this._imports[aUrl] = {windows:[],callbacks:[]};
    
    if (this._imports[aUrl].windows.indexOf(aWindow) == -1)
    { 
      var callback = function _callback(ev) {
        
        if (ev && (ev.target.defaultView != aWindow))
          return; 
        
        aWindow.removeEventListener("unload", _callback,false);
        SieveOverlayManager.release(aWindow,aUrl);         
      };
      
      this._imports[aUrl].windows.push(aWindow);
      this._imports[aUrl].callbacks.push(callback);
      
      // oberserver window...
      aWindow.addEventListener("unload", callback, false);
    }
    
    // Dendencies:
    // The scope is null, as the might load these modules on demand. So we... 
    // ... are just binding the url to this window. Releasing an unused...
    // ... url is not an error, but fogetting to release one is a memory...
    // ... hole
    
    // Sieve Connection Manager depends a Session
    if (aUrl == "chrome://sieve/content/modules/sieve/SieveConnectionManager.js")
      SieveOverlayManager.require("/sieve/SieveMozSession.js",null,aWindow);
      
    // Session depend on Sieve
    if (aUrl == "chrome://sieve/content/modules/sieve/SieveMozSession.js")
    {
      SieveOverlayManager.require("/sieve/SieveMozClient.js",null,aWindow);
      SieveOverlayManager.require("/sieve/SieveAccounts.js",null,aWindow);
    }
    
    // ... same applies to autoconfig
    if (aUrl == "chrome://sieve/content/modules/sieve/SieveAutoConfig.js")
      SieveOverlayManager.require("/sieve/SieveMozClient.js",null,aWindow);
    
    // Sieve depends on request and responses 
    if (aUrl == "chrome://sieve/content/modules/sieve/SieveMozClient.js")
    {
      SieveOverlayManager.require("/sieve/SieveRequest.js",null,aWindow);
      SieveOverlayManager.require("/sieve/SieveResponse.js",null,aWindow);
      SieveOverlayManager.require("/sieve/SieveResponseCodes.js",null,aWindow);
      SieveOverlayManager.require("/sieve/SieveResponseParser.js",null,aWindow);      
    }      
  },
  
  release : function(window,url)
  {  
    if (!this._imports[url])
      return;
    
    let pos = this._imports[url].windows.indexOf(window);
    
    if (pos > -1)
    {
      this._imports[url].windows.splice(pos,1);
      this._imports[url].callbacks.splice(pos,1);
    }
    
    if (this._imports[url].windows.length > 0)
      return;
   
    // TODO unload dependent nodes. e.g. when the connection manager 
    // is gone there should be no more a request...
    Cu.unload(url);
    
    delete this._imports[url].windows;
    delete this._imports[url].callbacks;
    delete this._imports[url];
  },
  
  // nsIWindowMediatorListener functions
  onOpenWindow: function(aWindow)
  {      
    // A new window has opened
    aWindow = aWindow.QueryInterface(Ci.nsIInterfaceRequestor)
                             .getInterface(Ci.nsIDOMWindowInternal);

    var url = aWindow.document.baseURI;
      
    // Wait for it to finish loading
    aWindow.addEventListener("load", function listener() {
      aWindow.removeEventListener("load", listener, false);

      SieveOverlayManager.loadOverlay(aWindow);
    
    }, false);
  },

  onCloseWindow: function(window)
  {      
  },
  
  onUnloadWindow: function(aWindow)
  {

    SieveOverlayManager.unloadWatcher(aWindow);
    
    // we mutate the array thus we interate backwards...
    for (let i=SieveOverlayManager._overlays.length-1; i>=0; i--)
    {
      if (SieveOverlayManager._overlays[i].window != aWindow)
        continue;
        
      SieveOverlayManager._overlays[i].unload();
      SieveOverlayManager._overlays.splice(i,1);
    }
 
    // cleanup imports...
    for (var url in SieveOverlayManager._imports)
      for (let i=0; i<SieveOverlayManager._imports[url].windows.length; i++)
        if (SieveOverlayManager._imports[url].windows[i] == aWindow)
          SieveOverlayManager._imports[url].callbacks[i]();    
  },

  onWindowTitleChange: function(window, newTitle) { },
  
  loadWatcher : function (window)
  {
    
    if (SieveOverlayManager._unload.hasKey(window))
      return;
    
    SieveOverlayManager._unload.setValue(window, function (aEvent) { 
      let window = aEvent.currentTarget;
      window = window.QueryInterface(Ci.nsIInterfaceRequestor)
                       .getInterface(Ci.nsIDOMWindowInternal);
      SieveOverlayManager.onUnloadWindow(window);
    });
        
    window.addEventListener("unload", SieveOverlayManager._unload.getValue(window));
  },
  
  unloadWatcher : function (window)
  {
    if (typeof(window) === "undefined")
    {      
      while (this._unload.hasKeys())
        this.unloadWatcher(this._unload.first());

      return;
    } 
          
    if (!SieveOverlayManager._unload.hasKey(window))
      return;
                       
    window.removeEventListener("unload",SieveOverlayManager._unload.getValue(window));    
    SieveOverlayManager._unload.deleteKey(window);
  },
  
  // ...
  addOverlay : function (overlay,url)
  {
    if ( !this._overlayUrls[url] ) 
      this._overlayUrls[url] = [];
      
    this._overlayUrls[url].push(overlay);
  },
  
  loadOverlay : function (window)
  {
    var url = window.document.baseURI;
    
    if (!this._overlayUrls[url])
      return;
    
    SieveOverlayManager.loadWatcher(window);
    
    for (var i=0; i < this._overlayUrls[url].length; i++)
    {
      let overlay = new (this._overlayUrls[url][i])();
      this._overlays.push(overlay);
      overlay.load(window);      
    }
  },
  
  load : function()
  {
    // Step 2: Inject code into UI
    var wm = Cc["@mozilla.org/appshell/window-mediator;1"].
               getService(Ci.nsIWindowMediator);

    var windows = wm.getEnumerator(null);
    while (windows.hasMoreElements())
    {
      var domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
      SieveOverlayManager.loadOverlay(domWindow);
    }

    // Wait for any new browser windows to open
    wm.addListener(this);
  },
  
  unload : function()
  { 
    var wm = Cc["@mozilla.org/appshell/window-mediator;1"].
                 getService(Ci.nsIWindowMediator);
                 
    while (this._overlays.length)
      this._overlays.pop().unload();
   
    wm.removeListener(this);
    
    SieveOverlayManager.unloadWatcher();

    // invoke callbacks inorder to cleanup imports...
    for(var url in this._imports)
      while (this._imports[url])
        this._imports[url].callbacks[0]();
        
    delete this._overlayUrls;        
  }
};

