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

var EXPORTED_SYMBOLS = [ "Sieve"  ];


const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;


// Handle all imports...
var loader = Cc["@mozilla.org/moz/jssubscript-loader;1"]
               .getService(Ci.mozIJSSubScriptLoader);
               
loader.loadSubScript("chrome://sieve-common/content/libManageSieve/SieveResponseCodes.js", this, "UTF-8" );
loader.loadSubScript("chrome://sieve-common/content/libManageSieve/SieveResponseParser.js", this, "UTF-8" );

loader.loadSubScript("chrome://sieve-common/content/libManageSieve/SieveRequest.js", this, "UTF-8" );
loader.loadSubScript("chrome://sieve-common/content/libManageSieve/SieveResponse.js", this, "UTF-8" );

loader.loadSubScript("chrome://sieve-common/content/libManageSieve/SieveAbstractClient.js", this, "UTF-8" );
                                    
                                    
// Import needed scripts... 

/*Cc["@mozilla.org/consoleservice;1"]
    .getService(Ci.nsIConsoleService)
    .logStringMessage("this "+this.toSource());*/

/*
 *  This class is a simple socket implementation for the manage sieve protocol. 
 *  Due to the asymetric nature of the Mozilla sockets we need message queue.
 *  <p>
 *  New requests are added via the "addRequest" method. In case of a response, 
 *  the corresponding request will be automatically calledback via its 
 *  "addResponse" method.
 *  <p>
 *  If you need a secure connection, set the flag secure in the constructor. 
 *  Then connect to the host. And invoke the "startTLS" Method as soon as you 
 *  nagociated the switch to a crypted connection. After calling startTLS 
 *  Mozilla will imediately switch to a cryped connection.
 *  <p>
 */
 
// A compatibility shim for Mozilla Sockets 

function Sieve() 
{ 
  // Call the parent constructor...
  SieveAbstractClient.call(this);
    
 
  this.timeout.timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
  this.idle.timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
  
  this.outstream = null;
  this.binaryOutStream = null;
   
  // a private function to convert a JSString to an byte array---
  this.bytesFromJSString
    = function (str) 
  {
    // cleanup linebreaks...
    str = str.replace(/\r\n|\r|\n|\u0085|\u000C|\u2028|\u2029/g,"\r\n");
  
    // ... and convert to UTF-8
    var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"]
                      .createInstance(Ci.nsIScriptableUnicodeConverter); 
    converter.charset = "UTF-8"; 
 
    return converter.convertToByteArray(str, {});
  }
}

Sieve.prototype = Object.create(SieveAbstractClient.prototype);
Sieve.prototype.constructor = Sieve;  

 // Needed for the Gecko 2.0 Component Manager...
Sieve.prototype.QueryInterface
  = function(aIID)
{
  if (aIID.equals(Ci.nsISupports))
    return this;
  // onProxyAvailable...
  if (aIID.equals(Ci.nsIProtocolProxyCallback))
    return this;
  // onDataAvailable...
  if (aIID.equals(Ci.nsIStreamListener))
    return this;
  // onStartRequest and onStopRequest...
  if (aIID.equals(Ci.nsIRequestObserver))
    return this;
    
  throw Cr.NS_ERROR_NO_INTERFACE;
}

/**
 * @return {Boolean}
 */
Sieve.prototype.isAlive 
   = function()
{
 if (!SieveAbstractClient.prototype.isAlive.call(this))
   return false;
   
  return this.socket.isAlive(); 
}

/**
 * This method secures the connection to the sieve server. By activating 
 * Transport Layer Security all Data exchanged is crypted. 
 * 
 * Before calling this method you need to request a crypted connection by
 * sending a startTLSRequest. Invoke this method imediately after the server 
 * confirms switching to TLS.
 **/
Sieve.prototype.startTLS 
   = function ( callback )
{
  SieveAbstractClient.prototype.startTLS.call(this);    
 
  var securityInfo = this.socket.securityInfo.QueryInterface(Ci.nsISSLSocketControl);
  securityInfo.StartTLS();
  
  if (callback)
    callback();
}

Sieve.prototype._startTimeoutTimer
    = function () {

  this.timeout.timer.initWithCallback(
      this, this.timeout.delay,
      Components.interfaces.nsITimer.TYPE_ONE_SHOT);
}  

Sieve.prototype._stopTimeoutTimer
    = function () {
    
  if (!this.timeout.timer)
    return;
    
  this.timeout.timer.cancel();
}  

Sieve.prototype._startIdleTimer
    = function () {

  this.idle.timer.initWithCallback(this,this.idle.delay,
         Components.interfaces.nsITimer.TYPE_ONE_SHOT);
}  

Sieve.prototype._stopIdleTimer
    = function () {
    
  if (!this.timeout.idle)
    return;
    
  this.timeout.idle.cancel();
}  



/**
 * Connects to a ManageSieve server.  
 *    
 * @param {String} host 
 *   The target hostname or IP address as String
 * @param {Int} port
 *   The target port as Interger
 * @param {Boolean} secure
 *   If true, a secure socket will be created. This allows switching to a secure
 *   connection.
 * @param {Components.interfaces.nsIBadCertListener2} badCertHandler
 *   Listener to call incase of an SSL Error. Can be null. See startTLS for more 
 *   details. 
 * @param {Array[nsIProxyInfo]} proxy
 *   An Array of nsIProxyInfo Objects which specifies the proxy to use.
 *   Pass an empty array for no proxy. 
 *   Set to null if the default proxy should be resolved. Resolving proxy info is
 *   done asynchronous. The connect method returns imedately, without any 
 *   information on the connection status... 
 *   Currently only the first array entry is evaluated.  
 */

Sieve.prototype.connect
    = function (host, port, secure, badCertHandler, proxy) 
{  
  if( this.socket != null)
    return;

  /*if ( (this.socket != null) && (this.socket.isAlive()) )
    return;*/
 
  this.host = host;
  this.port = port;
  this.secure = secure;
  this.badCertHandler = badCertHandler;

  if (this.debug.level & (1 << 2))
    this.debug.logger.logStringMessage("Connecting to "+this.host+":"+this.port+" ...");
    
  // If we know the proxy setting, we can do a shortcut...
  if (proxy)
  { 
    this.onProxyAvailable(null,null,proxy[0],null);
    return;
  }

  if (this.debug.level & (1 << 2))
    this.debug.logger.logStringMessage("Lookup Proxy Configuration for x-sieve://"+this.host+":"+this.port+" ...");
    
  var ios = Cc["@mozilla.org/network/io-service;1"]
                .getService(Ci.nsIIOService);
                    
  var uri = ios.newURI("x-sieve://"+this.host+":"+this.port, null, null);
    
  var pps = Cc["@mozilla.org/network/protocol-proxy-service;1"]
                .getService(Ci.nsIProtocolProxyService);
  pps.asyncResolve(uri,0,this);
}

/**
 * @private
 * 
 * This is an closure for asyncronous Proxy
 * @param {} aRequest
 * @param {} aURI
 * @param {} aProxyInfo
 * @param {} aStatus
 */
Sieve.prototype.onProxyAvailable
    = function (aRequest, aURI,aProxyInfo,aStatus)
{
  if (this.debug.level & (1 << 2))
  {
    if  (aProxyInfo)
      this.debug.logger.logStringMessage("Using Proxy: ["+aProxyInfo.type+"] "+aProxyInfo.host+":"+aProxyInfo.port);
    else
      this.debug.logger.logStringMessage("Using Proxy: Direct");
  }
  
  var transportService =
      Cc["@mozilla.org/network/socket-transport-service;1"]
        .getService(Ci.nsISocketTransportService);
    
  if (this.secure)
    this.socket = transportService.createTransport(["starttls"], 1,this.host, this.port,aProxyInfo); 
  else
    this.socket = transportService.createTransport(null, 0,this.host, this.port,aProxyInfo);    

  if (this.badCertHandler != null)
    this.socket.securityCallbacks = this.badCertHandler;  
    
  this.outstream = this.socket.openOutputStream(0,0,0);

  this.binaryOutStream = 
      Cc["@mozilla.org/binaryoutputstream;1"]
        .createInstance(Ci.nsIBinaryOutputStream);
 
  this.binaryOutStream.setOutputStream(this.outstream);
  
  var stream = this.socket.openInputStream(0,0,0);
  var pump = Cc["@mozilla.org/network/input-stream-pump;1"].
      createInstance(Ci.nsIInputStreamPump);

  pump.init(stream, -1, -1, 5000, 2, true);
  pump.asyncRead(this,null);
  
}

/**
 * 
 */
Sieve.prototype.disconnect
    = function () 
{ 
  SieveAbstractClient.prototype.disconnect.call(this);
  
  if (this.socket == null)
    return;
  
  this.binaryOutStream.close();
  this.outstream.close();  
  this.socket.close(0);
  
  this.binaryOutStream = null;
  this.outstream = null
  this.socket = null;
  
  if (this.debug.level & (1 << 2))
    this.debug.logger.logStringMessage("Disconnected ...");
    
}

Sieve.prototype.onStopRequest 
    =  function(request, context, status)
{
  //this.debug.logger.logStringMessage("Connection closed");
  // this method is invoked anytime when the socket connection is closed
  // ... either by going to offlinemode or when the network cable is disconnected
  if (this.debug.level & (1 << 2))
    this.debug.logger.logStringMessage("Stop request received ...");
 
  // we can ignore this if we are already disconnected.
  if (this.socket == null)
    return;
    
  // Stop timeout timer, the connection is gone, so... 
  // ... it won't help us anymore...
  this.disconnect();

  // if the request queue is not empty,
  // we should call directly on timeout..
  if ((this.listener) && (this.listener.onDisconnect))
    this.listener.onDisconnect();
}

Sieve.prototype.onStartRequest 
    = function(request, context)
{
  if (this.debug.level & (1 << 2))
    this.debug.logger.logStringMessage("Connected to "+this.host+":"+this.port+" ...");
}

Sieve.prototype.createParser
    = function (data)
{
  return new SieveResponseParser(data);
} 

Sieve.prototype.onDataAvailable 
    = function(aRequest, context, inputStream, offset, count)
{
  var binaryInStream = Cc["@mozilla.org/binaryinputstream;1"]
      .createInstance(Ci.nsIBinaryInputStream)
  
  binaryInStream.setInputStream(inputStream);
  
  var data = binaryInStream.readByteArray(count);

  if (this.debug.level & (1 << 3))
    this.debug.logger.logStringMessage("Server -> Client [Byte Array]\n"+data);
      
  if (this.debug.level & (1 << 1))
  {
    var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"]
                      .createInstance(Ci.nsIScriptableUnicodeConverter);
                      
    converter.charset = "UTF-8" ;
    
    var byteArray = data.slice(0,data.length);
    
    this.debug.logger
      .logStringMessage("Server -> Client\n"+converter.convertFromByteArray(byteArray, byteArray.length));
  }
  
  SieveAbstractClient.prototype.onDataReceived.call(this, data)
}

Sieve.prototype.onSend
  = function(data)
{ 

  // Force String to UTF-8...
  var output = this.bytesFromJSString(data);    
  
  if (this.debug.level & (1 << 3))
    this.debug.logger.logStringMessage("Client -> Server [Byte Array]:\n"+output);
      
  this.binaryOutStream.writeByteArray(output,output.length);
    
  return;
}

 