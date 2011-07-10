/* 
 * The content of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author(s). Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

if (typeof(Cc) == "undefined")
  { var Cc = Components.classes; }
if (typeof(Ci) == "undefined")
  { var Ci = Components.interfaces; }
if (typeof(Cr) == "undefined")
  { var Cr = Components.results; }  

Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader) 
    .loadSubScript("chrome://sieve/content/libs/libManageSieve/SieveResponseParser.js"); 

/**
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
 
function Sieve() 
{  
  // as we are using only java script, we can cheat...
  // ... we use this component without writing your own interface.
  this.wrappedJSObject = this;
  
  this.host = null;
  this.port = null;
  this.secure = null;
  
  this.socket = null;
  this.data = null;
  
  this.queueLocked = false;
  
  this.requests = new Array();
    
  this.timeout = {};
  this.timeout.timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
  this.timeout.delay = 20000;
        
  this.idle = {}; 
  this.idle.timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
  this.idle.delay = null;
  
  this.debug = new Object();
  this.debug.level  = 0x00;
  this.debug.logger = null;  
  
  this.outstream = null;
  this.binaryOutStream = null;
  
  // out of the box we support the following manage sieve commands...
  // ... the server might advertise aditional commands they are added ...
  // ... or removed by the set compatibility method
  this.compatibility = {
    authenticate : true,
    starttls     : true,
    logout       : true,
    capability   : true,  
    // until now we do not support havespace...
    //havespace  : false, 
    putscript    : true,
    listscripts  : true,
    setactive    : true,
    getscript    : true,
    deletescript : true  
  };
   
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

 // Needed for the Gecko 2.0 Component Manager...
Sieve.prototype = 
{
  classID : Components.ID("{92025260-14eb-11df-9ae3-0002a5d5c51b}"),
  contactID : "@sieve.mozdev.org/transport;1",
  classDescription : "Manage Sieve Transport",
  
  QueryInterface : function(aIID)
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
}

/**
 * Gives this socket a hint, whether a sieve commands is supported or not.
 * 
 * Setting the corresponding attribute to false, indecates, that a sieve command
 * should not be used. As this is only an advice, such command will still be 
 * processed by this sieve socket.
 * 
 * By default the socket seek maximal compatibility.
 * 
 * @param {Struct} supported commands
 *   the supported sieve commands as an associative array. Attribute names have
 *   to be in lower case, the values can be either null, undefined, true or false.
 * @example
 *   sieve.setCompatibility({checkscript:true,rename:true,starttls:false});
 */

Sieve.prototype.setCompatibility
  = function(capabilites) 
{
  for (var capability in capabilites)
    this.compatibility[capability] = capabilites[capability];  
}

/**
 * Returns a list of supported sieve commands. As the socket seeks 
 * maximal compatibility, it always suggest the absolute minimal sieve 
 * command set defined in the rfc. This value is only a hint, and does 
 * not represent the server's capabilities!
 * 
 * A command is most likely unsupported if the corresponding attribute is null and
 * disabled if the the attribute is false
 * 
 * You should override these defaults as soon as possible.  
 * 
 * @return {Struct}
 *   an associative array structure indecating supported sieve command. 
 *   Unsupported commands are indecated by a null, disabled by false value...
 *   
 * @example
 *   if (sieve.getCompatiblity().putscript)
 *     // put script command supported... 
 *  
 */
Sieve.prototype.getCompatibility
  = function()
{
  return this.compatibility;
}

/**
 *  The Method setDebugLevel specifies which Debuglevel which Logger should be
 *  used. 
 *  <p>
 *  The debug level specified is a bitmask. Setting all bits to zero disables 
 *  any logging. The first bit activates request, the second response logging. 
 *  If the third is set, status information and exceptions from the stateengine 
 *  are logged. The fourth, fifth etc. Bits are unused and should be set to zero.
 *  <p>
 *  In order to activate request and response logging, you have to set the first
 *  and the second bit to high any other bit to low. In this case this bitmask 
 *  is equivalent to the mummeric representation of the number 3.
 *  
 * @param {int} level
 *   specifies the debug settings as bitfield.
 * @param {nsIConsoleService} logger
 *   an nsIConsoleService compatible Object. Any Debuginforamtion will be 
 *   posted to the logStringMessage(String) Method of this object.
 */

Sieve.prototype.setDebugLevel 
   = function(level, logger)
{
  // make sure that any existing logger is freed...
  // ... this should prevent xpcom memory holes.  
  this.debug.logger = null;
   
  // set the debuglevel...
  if (level == null)  
    this.debug.level = 0x00;    
  else
    this.debug.level = level;   

  // a debug level of 0x00 means no debugging, ...
  // ... therefore we can skip setting up the logger.
  if (this.debug.level == 0x00)
    return;
  
  // ... and bind the new login device
  this.debug.logger = logger;
  
  return;
}

/**
 * @return {Boolean}
 */
Sieve.prototype.isAlive 
   = function()
{
  if (this.socket == null)
    return false;
  
  return this.socket.isAlive(); 
}

// if the parameter ignoreCertError is set, cert errors will be ignored
/**
 * This method secures the connection to the sieve server. By activating 
 * Transport Layer Security all Data exchanged is crypted. 
 * 
 * Before calling this method you need to request a crypted connection by
 * sending a startTLSRequest. Invoke this method imediately after the server 
 * confirms switching to TLS.
 **/
Sieve.prototype.startTLS 
   = function ()
{
  if (this.secure != true)
    throw "TLS can't be started no secure socket";
    
  if (this.socket == null)
    throw "Can't start TLS, your are not connected to "+host;

  var securityInfo = this.socket.securityInfo.QueryInterface(Ci.nsISSLSocketControl);

  securityInfo.StartTLS();
}

/**
 * Specifies the maximal interval between a request and a response. If the
 * timeout elapsed, all pending request will be canceled and the event queue
 * will be cleared. Either the onTimeout() method of the most recend request 
 * will invoked or in case the request does not support onTimeout() the
 * default's listener will be called.
 *    
 * @param {int} interval
 *   the number of milliseconds before the timeout is triggered.
 *   Pass null to set the default timeout.
 */
Sieve.prototype.setTimeoutInterval
    = function (interval)
{
  if (!interval)
    this.timeout.delay = 20000;
  else
    this.timeout.delay = interval;
}

/**
 * Specifies the maximal interval between a response and a request. 
 * If the max time elapsed, the listener's OnIdle() event will be called. 
 * Thus it can be used for sending "Keep alive" packets. 
 *   
 * @param {int} interval
 *  the maximal number of milliseconds between a response and a request,
 *  pass null to deactivate.  
 */
Sieve.prototype.setKeepAliveInterval
    = function (interval)
{
  if (interval)
  {
    this.idle.delay = interval;
    return;
  }
  
  // No keep alive Packets should be sent, so null the timer and the delay.
  if (this.idle.timer)
  {
    this.idle.timer.cancel();
    this.idle.timer = null;
  }
  
  this.idle.delay = null;

  return;      
}

Sieve.prototype.addListener
   = function(listener)
{
  this.listener = listener;
}

Sieve.prototype.addRequest 
    = function(request,greedy)
{
  if (this.listener)
    request.addByeListener(this.listener);
    
  // TODO: we should realy store this internally, instead of tagging objects
  if (greedy)
    request.isGreedy = true;
     
  // Add the request to the message queue
  this.requests.push(request);

  // If the message queue was empty, we might have to reinitalize the...
  // ... request pump.
  
  // We can skip this if queue is locked...
  if (this.queueLocked)
    return;
    
  // ... or it contains more than one full request
  for (var idx = 0 ; idx<this.requests.length; idx++)
    if ( this.requests[idx].getNextRequest )
      break;
  
  if (idx == this.requests.length)
    return;

  if (this.requests[idx] != request)
    return;
   
  this._sendRequest();
  
  return;
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

  if ((this.debug.level & (1 << 1)) || (this.debug.level & (1 << 0)))
    this.debug.logger.logStringMessage("Connecting to "+this.host+":"+this.port+" ...");
    
  // If we know the proxy setting, we can do a shortcut...
  if (proxy)
  {
    this.onProxyAvailable(null,null,proxy[0],null);
    return;
  }
  
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
  // free requests...
  //this.requests = new Array();    
  if (this.timeout.timer != null)
  {
    this.timeout.timer.cancel();
    this.timeout.timer = null;
  }
  
  if (this.idle.timer != null)
  {
    this.idle.timer.cancel();
    this.idle.timer = null;
  }
  
  if (this.socket == null)
    return;
  
  this.binaryOutStream.close();
  this.outstream.close();  
  this.socket.close(0);
  
  this.binaryOutStream = null;
  this.outstream = null
  this.socket = null;
  
  if ((this.debug.level & (1 << 1)) || (this.debug.level & (1 << 0)))
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
  if ((this.debug.level & (1 << 1)) || (this.debug.level & (1 << 0)))
    this.debug.logger.logStringMessage("Connected to "+this.host+":"+this.port+" ...");
}

Sieve.prototype.notify
    = function (timer) 
{
  timer.cancel();
  
  if ((this.idle.timer == timer) && (this.listener != null))
  {
    this.listener.onIdle();
    return;
  }
  
  if (this.timeout.timer != timer)
    return;
    
  if (this.debug.level & (1 << 2))
    this.debug.logger.logStringMessage("libManageSieve/Sieve.js:\nOnTimeout");
    
  // clear receive buffer and any pending request...
  this.data = null;
 
  var idx = 0;
  while ((idx < this.requests.length) && (this.requests[idx].isGreedy))
    idx++;

  // ... and cancel any active request. It will automatically invoke the ... 
  // ... request's onTimeout() listener.    
  if (idx < this.requests.length)
  {
    var request = this.requests[idx];
    this.requests.splice(0,idx+1);
    
    request.cancel();
    return;    
  }
  
  // in case no request is active, we call the global listener
  this.requests = [];
   
  if ((this.listener != null) && (this.listener.onTimeout)) 
    this.listener.onTimeout();
}

Sieve.prototype._onStart
    = function ()
{
  this.timeout.timer.initWithCallback(
         this, this.timeout.delay,
         Components.interfaces.nsITimer.TYPE_ONE_SHOT);
}

Sieve.prototype._onStop
    = function()
{
  if (this.timeout.timer != null)
    this.timeout.timer.cancel();
    
  if (this.idle.timer == null)
    return;
      
  this.idle.timer.cancel();  
  this.idle.timer.initWithCallback(this,this.idle.delay,
         Components.interfaces.nsITimer.TYPE_ONE_SHOT);
    
  return;
}

Sieve.prototype.onDataAvailable 
    = function(request, context, inputStream, offset, count)
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

  // responses packets could be fragmented...    
  if ((this.data == null) || (this.data.length == 0))
    this.data = data;
  else
    this.data = this.data.concat(data);
  
  // is a request handler waiting?
  if (this.requests.length == 0)
    return;


  // first clear the timeout, parsing starts...
  this._onStop();
  
  // As we are callback driven, we need to lock the event queue. Otherwise our
  // callbacks could manipulate the event queue while we are working on it.
  var requests = this._lockMessageQueue();

  // greedy request take might have an response but do not have to have one. 
  // They munch what they get. If there's a request they are fine,
  // if there's no matching request it's also ok.
  var idx = -1;
  
  while (idx+1 < requests.length)
  {
    idx++
    var parser = new SieveResponseParser(this.data);
          
    try
    {
      
      requests[idx].addResponse(parser);
      
      // We do some cleanup as we don't need the parsed data anymore...
      this.data = parser.getByteArray();
      
      // parsing was successfull, so drop every previous request...
      // ... keep in mid previous greedy request continue on exceptions.
      requests = requests.slice(idx);
      
      // we started to parse the request, so it can't be greedy anymore.
    }
    catch (ex)
    { 
      // request could be fragmented or something else, as it's greedy,
      // we don't care about any exception. We just log them in oder
      // to make debugging easier....
      if (this.debug.level & (1 << 2))
        this.debug.logger.logStringMessage("Parsing Warning in libManageSieve/Sieve.js:\n"+ex.toSource());
        
      // a greedy request might or might not get an request, thus 
      // it's ok if it failes
      if (requests[idx].isGreedy)
        continue;
        
      // ... but a non greedy response must parse without an error. Otherwise...
      // ... something is broken. this is most likely caused by a fragmented ... 
      // ... packet, but could be also a broken response. So skip processing...
      // ... and restart the timeout. Either way the next packet or the ...
      // ... timeout will resolve this situation for us.
        
      this._unlockMessageQueue(requests);
      this._onStart();
      
      return;
    }
    
    // Request is completed...
    if (!requests[0].hasNextRequest())
    {
      // so remove it from the event queue.
      var request = requests.shift();
      
      // ... if it was greedy, we munched an unexpected packet...
      // ... so there is still a valid request dangeling around.
      if (request.isGreedy)
        break;
    }
      
    if (!parser.isEmpty())
      continue;      
     
    this._unlockMessageQueue(requests);
     
    // Are there any other requests waiting in the queue.
    this._sendRequest();     
     
    return;
  }

  
  // we endup here if all responses were greedy and did not match.
  // Or if a greedy response ate an unexpected response...
  // ... should never happen
  this._unlockMessageQueue(requests);
     
  if (this.debug.level & (1 << 2))
    this.debug.logger.logStringMessage("Skipping Event Queue");  
}

Sieve.prototype._sendRequest
  = function()
{ 
  for (var idx = 0; idx<this.requests.length; idx++)    
    if ( this.requests[idx].getNextRequest )
      break;
       
  if (idx >= this.requests.length)
    return;
    
  // start the timout, before sending anything. Sothat we will timeout...
  // ... in case the socket is jammed...
  this._onStart();
    
  var output = this.requests[idx].getNextRequest();
  
  if (this.debug.level & (1 << 0))
    this.debug.logger.logStringMessage("Client -> Server:\n"+output);    

  // Force String to UTF-8...
  output = this.bytesFromJSString(output);    
  
  if (this.debug.level & (1 << 3))
    this.debug.logger.logStringMessage("Client -> Server [Byte Array]:\n"+output);
      
  this.binaryOutStream.writeByteArray(output,output.length);
    
  return;
}

Sieve.prototype._lockMessageQueue
  = function()
{
  this.queueLocked = true;
  var requests = this.requests.concat();
  
  this.requests = [];

  return requests;
}

Sieve.prototype._unlockMessageQueue
  = function(requests)
{
  this.requests = requests.concat(this.requests);
  this.queueLocked = false;
}

//=================================================
// Factory
/**
 * @deprecated since Gecko 2.0  
 */
var SieveFactory = {
  createInstance: function (aOuter, aIID)
  {
    if (aOuter != null)
      throw Components.results.NS_ERROR_NO_AGGREGATION;
    return (new Sieve()).QueryInterface(aIID);
  }
};

// Module
/**
 * @deprecated since Gecko 2.0  
 */
var SieveModule = {
  registerSelf: function(aCompMgr, aFileSpec, aLocation, aType)
  {
    aCompMgr = aCompMgr.QueryInterface(Ci.nsIComponentRegistrar);
    aCompMgr.registerFactoryLocation(
        Sieve.prototype.classID, 
        Sieve.prototype.classDescription, 
        Sieve.prototype.contactID, 
        aFileSpec, aLocation, aType);
  },

  unregisterSelf: function(aCompMgr, aLocation, aType)
  {
    aCompMgr = aCompMgr.QueryInterface(Ci.nsIComponentRegistrar);
    aCompMgr.unregisterFactoryLocation(Sieve.prototype.classID, aLocation);        
  },
  
  getClassObject: function(aCompMgr, aCID, aIID)
  {
    if (!aIID.equals(Ci.nsIFactory))
      throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

    if (aCID.equals(Sieve.prototype.classID))
      return SieveFactory;

    throw Components.results.NS_ERROR_NO_INTERFACE;
  },

  canUnload: function(aCompMgr) { return true; }
};


try
{
  Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
}
catch (e) { }

// Gecko 2.x uses NSGetFactory to register XPCOM Components...
// ... while Gecko 1.x uses NSGetModule
if ((typeof(XPCOMUtils) != "undefined") && (typeof(XPCOMUtils.generateNSGetFactory) != "undefined"))
  var NSGetFactory = XPCOMUtils.generateNSGetFactory([Sieve])
else
  var NSGetModule = function(compMgr, fileSpec) { return SieveModule; }
