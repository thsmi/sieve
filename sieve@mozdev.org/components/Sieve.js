/* 
 * The content of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author(s). Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;

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
  
  this.requests = new Array();
    
  this.watchDog = null;
  
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
    
    throw Cr.NS_ERROR_NO_INTERFACE;;
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
 *   
 * @param {nsIBadCertListener2} ignoreCertError
 *   an nsIBadCertListerner2 compatible Object, which handles any certificate
 *   errors while establishing the TLS link 
 */
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

Sieve.prototype.addWatchDogListener 
   = function(watchDog)
{
  this.watchDog = watchDog;
  this.watchDog.onAttach();
}

Sieve.prototype.getWatchDogListener
   = function()
{
  return this.watchDog;    
}

Sieve.prototype.removeWatchDogListener 
   = function()
{
  if( this.watchDog != null)
    this.watchDog.onDeattach();
    
  this.watchDog = null;
}

Sieve.prototype.addRequest 
    = function(request)
{
  // Add the request to the message queue
  this.requests[this.requests.length] = request;
  
  // If the queue was empty before adding the new request, we have to...
  // ... reinitialize the request pump. If not we can skip right here.
  if (this.requests.length > 1)
    return;

  if( this.watchDog != null)
    this.watchDog.onStart();

  //if (request instanceof SieveInitRequest)
  // Catch the init request, we simply check for an addInitListener function,
  // ... as instanceof does not work with properly with components. The Scope...
  // ... could be different.
  if (request.addInitListener != null)
    return;    
  
  var output = request.getNextRequest();
  
  if (this.debug.level & (1 << 0))
    this.debug.logger.logStringMessage(output);
    
  output = this.bytesFromJSString(output);    
  
  if (this.debug.level & (1 << 3))
    this.debug.logger.logStringMessage(output);
    
  this.binaryOutStream.writeByteArray(output,output.length)
  //this.outstream. write(output,output.length);
  
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
  if( this.watchDog != null)
    this.watchDog.onDeattach();
  
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
  // this method is invoked anytime when the socket connection is closed
  // ... either by going to offlinemode or when the network cable is disconnected
/*  if (this.debug.level & (1 << 2))
    this.debug.logger.logStringMessage("Stop request received ...");
 
  this.onWatchDogTimeout();
           
  if (this.socket != null)
    this.disconnect();*/        
}

Sieve.prototype.onStartRequest 
    = function(request, context)
{
  if ((this.debug.level & (1 << 1)) || (this.debug.level & (1 << 0)))
    this.debug.logger.logStringMessage("Connected to "+this.host+":"+this.port+" ...");
}

Sieve.prototype.onWatchDogTimeout 
    = function() 
{
  if (this.debug.level & (1 << 2))
    this.debug.logger.logStringMessage("libManageSieve/Sieve.js:\nOnTimeout");
      
  // clear receive buffer and any pending request...
  this.data = null;
  var request = this.requests[0];
  this.requests.splice(0,1);

  // then signal with a null response a timeout
  if (request != null)   
    request.cancel();
}

Sieve.prototype.onDataAvailable 
    = function(request, context, inputStream, offset, count)
{
  var binaryInStream = Cc["@mozilla.org/binaryinputstream;1"]
      .createInstance(Ci.nsIBinaryInputStream)
  
  binaryInStream.setInputStream(inputStream);
  
  var data = binaryInStream.readByteArray(count);

  if (this.debug.level & (1 << 3))
    this.debug.logger.logStringMessage(data);
      
  if (this.debug.level & (1 << 1))
  {
    var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"]
                      .createInstance(Ci.nsIScriptableUnicodeConverter);
                      
    converter.charset = "UTF-8" ;
    
    var byteArray = data.slice(0,data.length);
    
    this.debug.logger
      .logStringMessage(converter.convertFromByteArray(byteArray, byteArray.length));
  }

  // is a request handler waiting?
  if ((this.requests.length == 0))
    return;

  // responses packets could be fragmented...    
  if (this.data == null)
    this.data = data;
  else
    this.data = this.data.concat(data);
  
  // ... therefore we test, if the response is parsable
  try
  {
    // first clear the timeout...
    if( this.watchDog != null)
      this.watchDog.onStop();
	  
    // ... then try to parse the request
    this.requests[0].addResponse(this.data); 
  }
  catch (ex)
  {
    // we encounterned an error, this is most likely caused by a fragmented ... 
    // ... packet, so we skip processing and start the timeout timer again... 
    // ... Either the next packet or a timeout will resolve this situation.
  
    if (this.debug.level & (1 << 2))
      this.debug.logger.logStringMessage("Parsing Exception in libManageSieve/Sieve.js:\n"+ex);	  

    if( this.watchDog != null)
      this.watchDog.onStart();
  
	  return;
  }
  
  // As we reached this point the response was parsable and has been processed.
  // We do some cleanup as we don't need the transmitted data anymore...
  this.data = null;
     
  // ... and delete the request, if it is processed.	
  if (this.requests[0].hasNextRequest() == false)
  	this.requests.splice(0,1);


  // Are there any other requests waiting in the queue.
  if ((this.requests.length > 0))
  {
    var output = this.requests[0].getNextRequest();
    
    if (this.debug.level & (1 << 0))
      this.debug.logger.logStringMessage(output);    
    // force to UTF-8...
    output = this.bytesFromJSString(output);    
  
    if (this.debug.level & (1 << 3))
      this.debug.logger.logStringMessage(output);
      
    this.binaryOutStream.writeByteArray(output,output.length)      
	  
    // the request is transmited, therefor activate the timeout
    if( this.watchDog != null)
      this.watchDog.onStart();	  
  }
}





//=================================================
// Note: You probably don't want to edit anything
// below this unless you know what you're doing.
//
// Factory
var SieveFactory = {
  createInstance: function (aOuter, aIID)
  {
    if (aOuter != null)
      throw Components.results.NS_ERROR_NO_AGGREGATION;
    return (new Sieve()).QueryInterface(aIID);
  }
};

// Module
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
if ((XPCOMUtils) && (XPCOMUtils.generateNSGetFactory))
  var NSGetFactory = XPCOMUtils.generateNSGetFactory([Sieve])
else
  var NSGetModule = function(compMgr, fileSpec) { return SieveModule; }
