// Enable Strict Mode
"use strict";

var EXPORTED_SYMBOLS = [ "SieveTabType" ];

const Cu = Components.utils;

var SieveTabType =
{
  name: "SieveExplorerTab",
  perTabPanel: "iframe",

  modes: {
    SieveExplorerTab: {
      type: "SieveExplorerTab",
      maxTabs: 1,
      
      openTab: function(aTab, aArgs)
      {
        aTab.title = "Loading...";
        aTab.busy = true
//113         tabmail.setTabBusy(this.mTab, true);
//114         tabmail.setTabTitle(this.mTab);        
        aArgs.wrappedJSObject = aArgs;
        aTab.panel.contentWindow.arguments = [aArgs];
       
        this._addListeners(aTab);
        
        // this is nasty, we don't have a document object in our scope...
        // ... we we have to retrive it manually... 
        aTab.panel.contentWindow.tabmail 
          = aTab.panel.ownerDocument.getElementById("tabmail");        
        
        aTab.panel.setAttribute("src","chrome://sieve/content/editor/SieveFilterExplorer.xul");
      },
      
      closeTab: function(aTab)
      { 
        delete aTab.panel.contentWindow.tabmail;
        this._removeListeners(aTab);      
      },
      
      persistTab: function(aTab)  
      {
        return {
          account: aTab.panel.contentWindow.getSelectedAccount().getUri()
        }
      },
      
      restoreTab: function(aTabmail, aPersistedState)
      {
        aTabmail.openTab("SieveExplorerTab",{server:  aPersistedState.account})
      }      
    },
    
    SieveEditorTab: {
      type: "SieveEditorTab",
      
      openTab: function(aTab, aArgs)
      {
        if (aArgs["uri"])
          aTab.uri = aArgs["uri"];
        
        // we don't have a document in our scope as we are a jsm...
        // ... so we need an ugly hack...
        var tabmail = aTab.panel.ownerDocument.getElementById("tabmail"); 
        aArgs["close"] = function () { tabmail.closeTab(aTab); };
        
        aArgs.wrappedJSObject = aArgs;
        aTab.panel.contentWindow.arguments = [aArgs];
               
        this._addListeners(aTab);        
        
        aTab.panel.setAttribute("src","chrome://sieve/content/editor/SieveFilterEditor.xul");
      },
      
      persistTab: function(aTab)  
      {
        if (! aTab.panel.contentWindow.onWindowPersist)
          return null;
          
        var args = aTab.panel.contentWindow.onWindowPersist();
        
        if (aTab.uri)
          args["uri"] = aTab.uri;
          
        return args;
      },
      
      restoreTab: function(aTabmail, aPersitedState)
      {
        aTabmail.openTab("SieveEditorTab",  aPersitedState);
      }
    }
  }, 
  
  closeTab: function(aTab)
  {          
    this._removeListeners(aTab);
  },
  
  showTab: function onShowTab(aTab)
  {
    //aTab.panel.setAttribute("type", "content-primary");
  },
  
  saveTabState: function onSaveTabState(aTab)
  {
  },
      
  onTitleChanged: function(aTab, aTabNode)
  {
    aTab.title = aTab.panel.contentWindow.document.title;
    aTab.busy = false;
  },
  
  tryCloseTab: function(aTab)
  {
    // we need a catch exceptions. Otherwise we could endup in case of with 
    // an unclosable tab...
    try {
      if (! aTab.panel.contentWindow.onWindowClose())
        return false;
    }
    catch (ex)  {
      Cu.reportError("Unclosable tab"+ex);
    }
    return true;
  },
  
  _addListeners: function(aTab)
  {
    function onDOMTitleChanged(aEvent)
    {
      aTab.panel.ownerDocument.getElementById("tabmail").setTabTitle(aTab);
    }
    // Save the function we'll use as listener so we can remove it later.
    aTab.titleListener = onDOMTitleChanged;

    function onDOMWindowClose(aEvent)
    {     
      if (!aEvent.isTrusted)
        return;
 
      // Redirect any window.close events to closing the tab. As a 3-pane tab
      // must be open, we don't need to worry about being the last tab open.
      aTab.panel.ownerDocument.getElementById("tabmail").closeTab(aTab);
      aEvent.preventDefault();
    }
    // Save the function we'll use as listener so we can remove it later.
    aTab.closeListener = onDOMWindowClose;        
    
    function onLoad(aEvent)
    {
      //document.getElementById("tabmail").setTabTitle(aTab);      
    }    
    aTab.loadListener = onLoad;    
       
    // Add the listener.
    aTab.panel.contentWindow.addEventListener("DOMTitleChanged", aTab.titleListener, true);
       
    aTab.panel.contentWindow.addEventListener("DOMWindowClose", aTab.closeListener, true);
    
    aTab.panel.contentWindow.addEventListener("load",aTab.loadListener,true);      
  },
  
  _removeListeners: function(aTab)
  {
    if (aTab.titleListener)
      aTab.panel.contentWindow.removeEventListener("DOMTitleChanged", aTab.titleListener, true);
    
    if (aTab.closeListener)
      aTab.panel.contentWindow.removeEventListener("DOMWindowClose", aTab.closeListener, true);
    
    if (aTab.loadListeners)
      aTab.panel.contentWindow.removeEventListener("load",aTab.loadListener,true)
    
    aTab.titleListener = null;
    aTab.closeListener = null;
    aTab.loadListener = null;
  }
    
};
