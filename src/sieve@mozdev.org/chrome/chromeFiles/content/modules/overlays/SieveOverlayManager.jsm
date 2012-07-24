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
    Cu.reportError("Remove Tabtypes");
    
    if (!aTabType || !aTabType.name)
      throw "Invalid Tabtype"+aTabType.name;
      
    if (!tabmail)
      throw "Invalid Tabmail"+tabmail;
    
    if (!tabmail.tabTypes)
      throw "Invalid tabtypes"+tabmail.tabTypes;
      
    Cu.reportError("Tabtype Name"+aTabType.name);  
    Cu.reportError("Tabtypes"+tabmail.tabTypes);  
      
    if ((aTabType.name in tabmail.tabTypes) == false)
      return;
 
    for (let [modeName] in Iterator(aTabType.modes))
    {
      if ( !tabmail.tabModes[modeName])
        continue;
        
      while (tabmail.tabModes[modeName].tabs.length)
      {
        // TODO we need a force close here....
        tabmail.closeTab(tabmail.tabModes[modeName].tabs[0],true)
        // Sleep -> Sync
        Cu.reportError("tabs open3...");
        // TODO close tabs...
      }
        
      delete tabmail.tabModes[modeName];
    }
    
    delete tabmail.tabTypes[aTabType.name]; 
    
    if (aTabType.name in tabmail.tabTypes)
      throw "error";
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
            Cu.reportError("OFFSET")
            continue;
        }
       
        // ... all other elements can be found.
        var sel = "#"+currentset[pos];
        Cu.reportError("SEL: "+sel)
        
        sib = toolbars[i].querySelector(sel);
        
        if (sib)
          break;
      }

      if (!sib && offset)
      {
        sib = toolbars[i].lastChild;
        offset--;
        Cu.reportError("AA "+sib.id);
      }
        
      while (sib && offset--)
      {
        sib = sib.previousSibling;
        Cu.reportError("BB "+sib.id);
      }
        
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
        
      Cu.reportError(document.styleSheets[i].ownerNode);
      
      document.styleSheets[i].ownerNode.parentNode.removeChild(document.styleSheets[i].ownerNode)
    }    
  }   
}

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

var SieveOverlayManager =
{
  _overlays : [],
  _windowTypes : {},
  _imports : {},
  
  require : function(aUrl,scope,aWindow)
  { 
    if (aUrl.substr(0,15) != "chrome://sieve/")
      aUrl = "chrome://sieve/content/modules" +aUrl;
      
    Cu.reportError("Require aUrl "+aUrl+ " "+scope);
    if (scope)
      Cu.import(aUrl,Cu.getGlobalForObject(scope));  
    
    if(typeof(aWindow) == "undefined")
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
      }
      
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
      SieveOverlayManager.require("/sieve/SieveSession.js",null,aWindow);
      
    // Session depend on Sieve
    if (aUrl == "chrome://sieve/content/modules/sieve/SieveSession.js")
    {
      SieveOverlayManager.require("/sieve/Sieve.js",null,aWindow);
      SieveOverlayManager.require("/sieve/SieveAccounts.js",null,aWindow);
    }
    
    // ... same applies to autoconfig
    if (aUrl == "chrome://sieve/content/modules/sieve/SieveAutoConfig.js")
      SieveOverlayManager.require("/sieve/Sieve.js",null,aWindow);
    
    // Sieve depends on request and responses 
    if (aUrl == "chrome://sieve/content/modules/sieve/Sieve.js")
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
   
    Cu.reportError("Releasing  url "+url);
    // TODO unload dependent nodes. e.g. when the connection manager 
    // is gone there should be no more a request...
    Cu.unload(url);
    
    delete this._imports[url].windows;
    delete this._imports[url].callbacks;
    delete this._imports[url];
  },
  
  // nsIWindowMediatorListener functions
  onOpenWindow: function(window)
  {
    // A new window has opened
    var domWindow = window.QueryInterface(Ci.nsIInterfaceRequestor)
                             .getInterface(Ci.nsIDOMWindowInternal);

    // Wait for it to finish loading
    domWindow.addEventListener("load", function listener() {
      domWindow.removeEventListener("load", listener, false);

      SieveOverlayManager.applyOverlay(domWindow);
    
    }, false);
  },

  onCloseWindow: function(window)
  {
    Components.utils.reportError("onCloseWindow !...");
    
    window = window.QueryInterface(Ci.nsIInterfaceRequestor)
                             .getInterface(Ci.nsIDOMWindowInternal)
    
    // we mutate the array thus we interate backwards...
    for (var i=this._overlays.length-1; i>=0; i--)
    {
      Components.utils.reportError("Comp Overlay...:"+this._overlays[i].window+" "+window) 
      if (this._overlays[i].window != window)
        continue;
        
      Components.utils.reportError("Clenup Overlay...") 
      SieveOverlayManager._overlays[i].unload();
      SieveOverlayManager._overlays.splice(i,1);
    }
 
    // cleanup imports...
    for (var url in this._imports)
      for (var i=0; i<this._imports[url].windows.length; i++)
        if (this._imports[url].windows[i] == window)
          this._imports[url].callbacks[i]();
      
  },

  onWindowTitleChange: function(window, newTitle) { },
  
  // ...
  addOverlay : function (overlay,type)
  {
    if ( !this._windowTypes[type] ) 
      this._windowTypes[type] = [];
      
    this._windowTypes[type].push(overlay);
  },
  
  applyOverlay : function (window)
  { 
    var windowtype = window.document.documentElement.getAttribute("windowtype");
    
    Components.utils.reportError("Windowtype:"+windowtype)
    
    if (!windowtype)
      return;
    
    if (!this._windowTypes[windowtype])
      return;
    
    for (var i=0; i<this._windowTypes[windowtype].length; i++)
    {
      let overlay = new (this._windowTypes[windowtype][i])();
      this._overlays.push(overlay);
      overlay.load(window);
      
      Components.utils.reportError("Overlaying!...") 
    }    
  },
  
  load : function()
  {
    Components.utils.reportError("Load called!...") 
    // Step 2: Inject code into UI
    var wm = Cc["@mozilla.org/appshell/window-mediator;1"].
               getService(Ci.nsIWindowMediator);

    var windows = wm.getEnumerator(null);
    while (windows.hasMoreElements())
    {
      var domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
      SieveOverlayManager.applyOverlay(domWindow);
    }

    // Wait for any new browser windows to open
    wm.addListener(this);
  },
  
  unload : function() {
   Components.utils.reportError("Unloadcalleds!...") 
   
    var wm = Cc["@mozilla.org/appshell/window-mediator;1"].
                 getService(Ci.nsIWindowMediator);
                 
    while (this._overlays.length)
      this._overlays.pop().unload();
   
    wm.removeListener(this);

    // invoke callbacks inorder to cleanup imports...
    for(var url in this._imports)
      while (this._imports[url])
        this._imports[url].callbacks[0]();
        
    delete this._windowTypes;        
  }
}

