// Enable Strict Mode
"use strict";  

var EXPORTED_SYMBOLS = [ "SieveMailWindowOverlay" ];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("chrome://sieve/content/modules/overlays/SieveOverlayManager.jsm");

Cu.reportError("Scope"+this);

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
  toolbarbutton.setAttribute("label","Label"); //bundle.GetStringFromName("") //&list.title;
  toolbarbutton.setAttribute("tooltiptext","Tooltop"); //&list.title;
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
  var bundle = Services.strings.createBundle("chrome://sieve/locale/locale.properties");
  
  var menu = document.getElementById("filtersCmd");
  
  var mmuOpenFilters = document.createElement("menuitem");
  mmuOpenFilters.setAttribute("id","mnuSieveListDialog");
  mmuOpenFilters.setAttribute("label", bundle.GetStringFromName("menu.filters")); //&menu.filters;
  mmuOpenFilters.setAttribute("accesskey", bundle.GetStringFromName("menu.filters.key") ); //"&menu.filters.key;" 
  mmuOpenFilters.addEventListener("command", onOpenFilterCmd );
  
  this.unloadCallback(
    function() { mmuOpenFilters.removeEventListener("command",onOpenFilterCmd)})  
  
  this.unloadCallback(
    function() {SieveOverlayUtils.removeMenuItem(mmuOpenFilters)} )  
  
  SieveOverlayUtils.addMenuItem( document, mmuOpenFilters, menu);
 
  
  var mnuOpenSettings = document.createElement("menuitem");
  mnuOpenSettings.setAttribute("id","mnuSieveOptionsDialog");
  mnuOpenSettings.setAttribute("label",bundle.GetStringFromName("menu.options")); //&menu.options;
  mnuOpenSettings.setAttribute("accesskey",bundle.GetStringFromName("menu.options.key"));  
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