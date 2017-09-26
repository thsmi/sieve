/* 
 * The content of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author(s). Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

/* global Components */
/* global Sieve */
/* global SieveInitRequest */

// Enable Strict Mode
"use strict";

var EXPORTED_SYMBOLS = [ "SieveAutoConfig" ];

const Cc = Components.classes; 
const Ci = Components.interfaces;
const Cu = Components.utils;



function SieveAutoConfig()
{
  Cu.import("chrome://sieve/content/modules/sieve/SieveMozLogger.js");
  Cu.import("chrome://sieve/content/modules/sieve/SieveMozClient.js"); 
  
  this.logger =  new SieveLogger();
  this.hosts = [];
}

SieveAutoConfig.prototype =
{
  addHost: function(host, port, proxy)
  {
    if (this.activeHosts > 0)
      throw new Error("Auto config already running");
    
    this.hosts.push(new SieveAutoConfigHost(host,port,proxy,this, this.logger));
  },
  
  run: function(listener)
  { 
    if (this.activeHosts > 0)
      throw new Error("Auto config already running");
    
    this.listener = listener;
    this.activeHosts = this.hosts.length;
    
    for (var i=0; i<this.hosts.length; i++)
      this.hosts[i].run();
  },
  
  cancel: function()
  {
    for (var i=0; i<this.hosts.length; i++)
      this.hosts[i].cancel();    
      
    this.hosts = [];
    this.activeHosts = this.hosts.length;
  },
  
  onError: function(sender)
  {
    this.activeHosts--;
    
    // the error listener is only invoked, when all tests failed... 
    if (this.activeHosts > 0)
      return;
    
    this.cancel();
    this.listener.onError();
  },
  
  onSuccess: function(sender)
  {
    // decrement our ref counter;
    this.activeHosts--;
    
    // the first successfull test wins...
    // ... so cancel all pending ones...
    this.cancel();
    
    // ... and invoke the callback
    this.listener.onSuccess(sender.host,sender.port,sender.proxy);   
  }
};


function SieveAutoConfigHost(host, port, proxy, listener, logger)
{
  this.port =  port;
  this.host = host;
  this.proxy = proxy;
  this.listener = listener;
 
  this.sieve = new Sieve(logger);

  this.sieve.addListener(this);
  
  var request = new SieveInitRequest();
  request.addErrorListener(this);
  request.addInitListener(this);
  this.sieve.addRequest(request); 
}

SieveAutoConfigHost.prototype = 
{
  onInitResponse: function(response)
  {
    this.listener.onSuccess(this);
    this.cancel();
  },
  
  onIdle: function(response)
  {
    // just an empty stub...
  },
    
  onError: function(response)
  {
    if (this.listener)
      this.listener.onError(this);
      
    this.cancel();
  },
    
  onTimeout: function(message)
  {
    this.onError();
  },
    
  onDisconnect: function()
  {
    this.onError();
  },

  cancel: function()
  {
    this.callback = null;
    this.sieve.disconnect();
  },
  
  run: function()
  {
    this.sieve.connect(this.host,this.port,false,null,this.proxy);
  }
};
