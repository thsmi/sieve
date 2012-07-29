// Enable Strict Mode
"use strict";  

var EXPORTED_SYMBOLS = [ "SieveMailWindowOverlay" , "SieveFilterListOverlay", "SieveToolbarOverlay"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("chrome://sieve/content/modules/overlays/SieveOverlayManager.jsm");

function SieveAbstractOverlay()
{
  this._callbacks = [];
  this.window = null;  
}

SieveAbstractOverlay.prototype.getWindow
  = function ()
{
  return this.window;
}

SieveAbstractOverlay.prototype.unloadCallback
  = function (callback)
{
  this._callbacks.push(callback);   
}

SieveAbstractOverlay.prototype.unload
  = function()
{
  while (this._callbacks.length)
    this._callbacks.pop()();
    
  delete this._callbacks;
  delete this.window;
}

// Sieve Filter window overlay...
function SieveFilterListOverlay()
{
  SieveAbstractOverlay.call(this);
}

SieveFilterListOverlay.prototype.__proto__ = SieveAbstractOverlay.prototype;


SieveFilterListOverlay.prototype.loadAccount
    = function(server)
{   
  var document = this.window.document;
  if (!server)
    server = document.getElementById("serverMenu").selectedItem._folder.server;
    
  if (!server)
    return false;

  if ((server.type != "imap") && (server.type != "pop3"))
  {
    document.getElementById("sivFilterList").tabs.getItemAtIndex(1).collapsed = true;    
    document.getElementById("sivFilterList").selectedIndex = 0;
    
    return true;
  }
  
  document.getElementById("sivFilterList").tabs.getItemAtIndex(1).collapsed = false;
    
  // we initialize sieve just in time in oder to save resources...
  if (document.getElementById("sivFilterList").selectedIndex != 1)
    return true;  

  var key = ""+server.key;
  
  var iframe = document.getElementById('sivFilterListFrame');
  
  if (iframe.getAttribute("key") == key)
    return true;
    
  
  
/*  if (iframe.contentWindow)
    if (iframe.contentWindow.onCanChangeAccount(key) == false)
      return true;
      
  //'DOMContentLoaded'
  // 'DOMFrameContentLoaded'
  iframe.addEventListener('load', function iframeReady(ev) {
      
    document.getElementById('sivFilterListFrame')
      .removeEventListener('load',iframeReady,true)
      
    document.getElementById('sivFilterListFrame')      
      .contentWindow.onLoad(key);
        
    }, true);*/
    
    
  /*document.getElementById('sivFilterListFrame').src =
    document.getElementById('sivFilterListFrame').src;*/
  /*document.getElementById('sivFilterListFrame').contentDocument
    .location.reload(true);*/
    
  /*document.getElementById('sivFilterListFrame').contentWindow
    .location.reload(true);*/
  if (iframe.hasAttribute("src"))
    iframe.contentWindow.location.reload();
  else
    iframe.setAttribute("src","chrome://sieve/content/filterList/SieveFilterList.xul");
    
  iframe.setAttribute("key",key);  
  
  /*document.getElementById("sivFilterListFrame")
    .contentWindow.onAccountChange(server.key);*/
    
  return true;
}

SieveFilterListOverlay.prototype.load
  = function(window)
{   
  Cu.reportError("load overlay filter list 1");
  
  if (this.window)
    throw "already bound to window";
    
  var that = this;
  this.window = window;
  
  var document = window.document;
  Cu.import("chrome://sieve/content/modules/utils/SieveWindowHelper.jsm");  
    

  var dialog = window.document.getElementById("filterListDialog");

  var grid = document.getElementsByTagName("grid");

  // there should be exactly one grid otherwise we collided with some other...
  // ... extension. In order to avoid incompatibilies, we show an error...
  // ... message and skip ...    
  if (grid.length != 1)
  {
    var elm = document.createElement("hbox");
    elm.setAttribute("align","center");
    elm.style.backgroundImage = "-moz-linear-gradient(center bottom , rgb(255, 221, 102), rgb(255, 235, 125))";
    elm.style.borderTop = "1pt solid #fff1a3";
    elm.style.borderBottom = "1pt solid #c0972e";
    elm.style.margin = "0pt";
    elm.style.padding = "0.7em";
    elm.style.marginBottom = "1em";

    elm.appendChild(document.createElement("hbox"));      
    elm.lastChild.setAttribute("flex","1");
      
    elm.lastChild.appendChild(document.createElement("description"));
    elm.lastChild.lastChild.setAttribute("value","Initializing Server Side Filters failed!");
    elm.lastChild.lastChild.style.fontWeight = "bold";
 
    elm.lastChild.appendChild(document.createElement("description"));
    elm.lastChild.lastChild.setAttribute("value","Please report bug to schmid-thomas@gmx.net");
   
    dialog.insertBefore(elm,dialog.firstChild)

    this.unloadCallback(
      function() { elm.parentNode.removeChild(elm)}) 
      
    return;      
  }
      
  // setup all listeners before binding...
  var folderChangeListener = function(event) {
    var folder = event.target._folder;
  
    if (!folder.server)
    {
      //FIXME
      alert("Incompatible folder");
      return;
    }
    that.loadAccount(folder.server);    
  }
  
  var tabSelectListener = function() {
    that.loadAccount();
  }

  var filterListListener = function(event) {
    if (that.loadAccount())
      event.currentTarget.removeEventListener('select', filterListListener, false);  
  }

  
  // start modifiying the UI
  grid = grid.item(0);
  
  // create the tabbox...
  var elm = document.createElement("tabbox");
  elm.setAttribute("id","sivFilterList");
  elm.setAttribute("flex","1");
  elm.style.padding = "5px";
  elm.style.paddingBottom = "0px";
  
  // ... and insert it before the grid ...
  grid.parentNode.insertBefore(elm,grid);

  // ... then create the tabs ...
  var tabs = elm.appendChild(document.createElement("tabs"));
  tabs.addEventListener("select",tabSelectListener,true);

  this.unloadCallback(
      function() { tabs.removeEventListener("select",tabSelectListener,true)});
      
  tabs.appendChild(document.createElement("tab"));
  tabs.lastChild.setAttribute("label","Local Filters");
  
  tabs.appendChild(document.createElement("tab"));
  tabs.lastChild.setAttribute("label","Server side filters");
  tabs.lastChild.collapsed = true;  
  
  // ... finally the corresponding tabpanels...
  var tabpanels = elm.appendChild(document.createElement("tabpanels"));
  
  // ... the first one is the grid element, so we move this element into...
  // ... tabbox...
  tabpanels.setAttribute("flex","1");
  tabpanels.appendChild(grid);
  
  // ... then we add the iframe for our sieve scripts...
  tabpanels.appendChild(document.createElement("iframe"));
  tabpanels.lastChild.setAttribute("flex","1");
  tabpanels.lastChild.setAttribute("type","chrome");
  tabpanels.lastChild.setAttribute("id","sivFilterListFrame");
  tabpanels.lastChild.setAttribute("style",
        "overflow:auto; -moz-appearance: textfield;")

  var menu = document.getElementById("serverMenu"); 
  menu.addEventListener("command",folderChangeListener,true);
  
  this.unloadCallback(
      function() { menu.removeEventListener("command",folderChangeListener,true)});
  
  // When the server Menu gets populated the first time no command event is...
  // ... fired thus we need this hack. We listen to the filter list's selection...
  // ... changes and wait until the menu is populated.  
  var filterList =  document.getElementById("filterList");
    
  filterList.addEventListener("select",filterListListener, false);

  this.unloadCallback(
      function() { filterList.removeEventListener("select",filterListListener,false)});      
  // Ensure the first tab is selected...
  elm.selectedIndex = 0;
    
  Cu.reportError("load overlay filter list ");
}


//****************************************************************************//

// Mail window Overlay... 
function SieveMailWindowOverlay()
{
  SieveAbstractOverlay.call(this);   
}

SieveMailWindowOverlay.prototype.__proto__ = SieveAbstractOverlay.prototype;


SieveMailWindowOverlay.prototype.load
  = function(window)
{   
  if (this.window)
    throw "already bound to window";
    
  var that = this;
  this.window = window;
  
  var document = window.document;
  Cu.import("chrome://sieve/content/modules/utils/SieveWindowHelper.jsm");  

  var strings = Services.strings.createBundle("chrome://sieve/locale/locale.properties");  
  
  Cu.reportError("load overlay 2");
  // Add Toolbar Overlay
  var onOpenFilterCmd = 
    function() {  SieveUtils.OpenFilter(document.defaultView) };

  var onOpenSettingsCmd =
    function() { SieveUtils.OpenSettings(document.defaultView) };
  
  // Add Tabtypes Overlay
  SieveOverlayManager.require("chrome://sieve/content/modules/utils/SieveTabType.jsm",this,window)
  var tabmail = document.getElementById('tabmail');
  
  
  SieveOverlayUtils.addTabType(SieveTabType,tabmail);
// TODO ad afinnaly method when all windows are closed, ot unload components
  this.unloadCallback( 
    function() { SieveOverlayUtils.removeTabType(SieveTabType,tabmail);})
        
  var toolbarbutton = document.createElement("toolbarbutton");
  toolbarbutton.setAttribute("id","btnSieveFilter");
  toolbarbutton.setAttribute("label",strings.GetStringFromName("toolbar.filters.title")); 
  toolbarbutton.setAttribute("tooltiptext",strings.GetStringFromName("toolbar.filters.tooltip"));
  toolbarbutton.addEventListener("command", onOpenFilterCmd );
  toolbarbutton.setAttribute("class","toolbarbutton-1 chromeclass-toolbar-additional");
 
  var toolbox =  document.getElementById("mail-toolbox");
  
  SieveOverlayUtils.addToolBarItem(
    document,
    toolbox,
    toolbarbutton);

  SieveOverlayUtils.addStyleSheet(document,"chrome://sieve/skin/ToolBarButton.css");    
  
  this.unloadCallback(
    function() { SieveOverlayUtils.removeStyleSheet(document,"chrome://sieve/skin/ToolBarButton.css")});
  
  this.unloadCallback(
    function() { toolbarbutton.removeEventListener("command",onOpenFilterCmd)})
    
  this.unloadCallback( 
    function() { SieveOverlayUtils.removeToolBarItem(toolbarbutton);})
  
    
  // Add Menu Overlay
  
  var menu = document.getElementById("filtersCmd");
  
  var mmuOpenFilters = document.createElement("menuitem");
  mmuOpenFilters.setAttribute("id","mnuSieveListDialog");
  mmuOpenFilters.setAttribute("label", strings.GetStringFromName("menu.filters")); 
  mmuOpenFilters.setAttribute("accesskey", strings.GetStringFromName("menu.filters.key") );
  mmuOpenFilters.addEventListener("command", onOpenFilterCmd );
  
  this.unloadCallback(
    function() { mmuOpenFilters.removeEventListener("command",onOpenFilterCmd)})  
  
  this.unloadCallback(
    function() {SieveOverlayUtils.removeMenuItem(mmuOpenFilters)} )  
  
  SieveOverlayUtils.addMenuItem( document, mmuOpenFilters, menu);
 
  
  var mnuOpenSettings = document.createElement("menuitem");
  mnuOpenSettings.setAttribute("id","mnuSieveOptionsDialog");
  mnuOpenSettings.setAttribute("label",strings.GetStringFromName("menu.options")); //&menu.options;
  mnuOpenSettings.setAttribute("accesskey",strings.GetStringFromName("menu.options.key"));  
  mnuOpenSettings.addEventListener('command', onOpenSettingsCmd );
  
  this.unloadCallback(
    function() { mnuOpenSettings.removeEventListener("command",onOpenSettingsCmd)})  
  
  this.unloadCallback(
    function() {SieveOverlayUtils.removeMenuItem(mnuOpenSettings)} )  
    
  SieveOverlayUtils.addMenuItem( document, mnuOpenSettings, menu);    

  
  var mnuSeparator = document.createElement("menuseparator");
  mnuSeparator.setAttribute("id","mnuSieveSeparator");
  
  this.unloadCallback(
    function () { SieveOverlayUtils.removeMenuItem(mnuSeparator) } )

  SieveOverlayUtils.addMenuItem( document, mnuSeparator, menu);
  
  Cu.reportError("load overlay 3");
}

// Filter window Overlay...Components

//****************************************************************************//

function SieveToolbarOverlay()
{
  SieveAbstractOverlay.call(this);   
}

SieveToolbarOverlay.prototype.__proto__ = SieveAbstractOverlay.prototype;


SieveToolbarOverlay.prototype.load
  = function(window)
{   
  if (this.window)
    throw "already bound to window";
    
  var that = this;
  this.window = window;
  
  var document = window.document;
  
  SieveOverlayUtils.addStyleSheet(document,"chrome://sieve/skin/ToolBarButton.css");    
  
  this.unloadCallback(
    function() { SieveOverlayUtils.removeStyleSheet(document,"chrome://sieve/skin/ToolBarButton.css")}); 
}
