/* 
 * The content of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author(s). Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

const nsISupports = Components.interfaces.nsISupports;

const CLASS_ID = Components.ID("280edf85-fa0d-47b1-87dd-763a90cc0cc7");
const CLASS_NAME = "Manage Sieve Transport";
const CONTRACT_ID = "@sieve.mozdev.org/transport;1";

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
 *   
 * @param {String} host 
 *   The target hostname or IP address as String
 * @param {Int} port
 *   The target port as Interger
 * @param {Boolean} secure
 *   If true, a secure socket will be created. This allows switching to a secure
 *   connection.
 * @param {Int} idleInterval
 *   Specifies the maximal time interval between request. It basically is used 
 *   for sending "Keep alive" packets. It ensures that in worst case every 
 *   idleInterval exactly one Packet is send. This prefents that the connection
 *   to the server times out.
 */
 
function Sieve() 
{  
  // you can cheat and use this
  // while testing without
  // writing your own interface
  this.wrappedJSObject = this;
  
  this.host = null;
  this.port = null;
  this.secure = null;
  
  this.socket = null;
  this.data = null;
  
  this.requests = new Array();
    
  this.watchDog = null;
  
  this.idleInterval = null;
  
  this.debug = new Object();
  this.debug.level  = 0x00;
  this.debug.logger = null;  
  
  this.outstream = null;
  this.binaryOutStream = null;
  
  this.version = 0;
  
  // a private function to convert a JSString to an byte array---
  this.bytesFromJSString
    = function (str) 
  {
    // cleanup linebreaks...
    str = str.replace(/\r\n|\r|\n|\u0085|\u000C|\u2028|\u2029/g,"\r\n");
  
    // ... and convert to UTF-8
    var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"]
                      .createInstance(Components.interfaces.nsIScriptableUnicodeConverter); 
    converter.charset = "UTF-8"; 
 
    return converter.convertToByteArray(str, {});
  }
}

/**
 * Give this socket a hint, which maximal Protocol version of ManageSieve is 
 * supported by the server
 * @param {float} version
 *   the maximal protocol version supported by this server.
 */
Sieve.prototype.setCompatibility
  = function(version) 
{
  this.version = version;
}

/**
 * Returns maximal protocol version of the server. This value is not retrived
 * automatically, you have to set it via setCompatiblity
 * 
 * @return {float}
 *   a floating point number indicating the compatibility
 */
Sieve.prototype.getCompatibility
  = function()
{
  return this.version;
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
Sieve.prototype.startTLS 
   = function (ignoreCertError)
{
  if (this.secure != true)
    throw "TLS can't be started no secure socket";
    
  if (this.socket == null)
    throw "Can't start TLS, your are not connected to "+host;

  var securityInfo = this.socket.securityInfo.QueryInterface(Components.interfaces.nsISSLSocketControl);
  
 /* if ((ignoreCertError != null) && (ignoreCertError == true))
    securityInfo.notificationCallbacks = new BadCertHandler(this.debug.logger);*/

  securityInfo.StartTLS();
}

Sieve.prototype.addWatchDogListener 
   = function(watchDog)
{
  this.watchDog = watchDog;
  this.watchDog.onAttach(this.idleInterval);
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

Sieve.prototype.connect = function (host, port, secure,idleInterval) 
{  
  if( this.socket != null)
    return;

  /*if ( (this.socket != null) && (this.socket.isAlive()) )
    return;*/
 
  this.host = host;
  this.port = port;
  this.secure = secure;
  this.idleInterval = idleInterval;
    
  var transportService =
      Components.classes["@mozilla.org/network/socket-transport-service;1"]
        .getService(Components.interfaces.nsISocketTransportService);
  
  if (this.secure)
    this.socket = transportService.createTransport(["starttls"], 1,this.host, this.port, null); 
  else
    this.socket = transportService.createTransport(null, 0,this.host, this.port, null);    
            
  this.outstream = this.socket.openOutputStream(0,0,0);

  this.binaryOutStream = 
      Components.classes["@mozilla.org/binaryoutputstream;1"]
        .createInstance(Components.interfaces.nsIBinaryOutputStream);
 
  this.binaryOutStream.setOutputStream(this.outstream);
  
  var stream = this.socket.openInputStream(0,0,0);
  var pump = Components.
    classes["@mozilla.org/network/input-stream-pump;1"].
      createInstance(Components.interfaces.nsIInputStreamPump);

  pump.init(stream, -1, -1, 5000, 2, true);
  pump.asyncRead(this,null);
  
  return;
}

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
  var binaryInStream = Components.classes["@mozilla.org/binaryinputstream;1"]
      .createInstance(Components.interfaces.nsIBinaryInputStream)
  
  binaryInStream.setInputStream(inputStream);
  
  var data = binaryInStream.readByteArray(count);

  if (this.debug.level & (1 << 3))
    this.debug.logger.logStringMessage(data);
      
  if (this.debug.level & (1 << 1))
  {
    var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"]
                      .createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
                      
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

// This is the implementation of your component.
Sieve.prototype.QueryInterface
    = function(aIID)
{
  // add any other interfaces you support here
  if (!aIID.equals(nsISupports))
    throw Components.results.NS_ERROR_NO_INTERFACE;
  return this;
}



/******************************************************************************/
// Helper class to override the "bad cert" dialog...
// see nsIBadCertListener for details

/*function BadCertHandler(logger) 
{
  this.logger = logger;
}

BadCertHandler.prototype.confirmUnknownIssuer
    = function(socketInfo, cert, certAddType) 
{
  alert("invalid Password");
  
  if (this.logger != null)
    this.logger.logStringMessage("Sieve BadCertHandler: Unknown issuer");
      
  return true;
}

BadCertHandler.prototype.confirmMismatchDomain
    = function(socketInfo, targetURL, cert) 
{
  if (this.logger != null)
    this.logger.logStringMessage("Sieve BadCertHandler: Mismatched domain");

  return true;
}

BadCertHandler.prototype.confirmCertExpired
    = function(socketInfo, cert) 
{
  if (this.logger != null)
    this.logger.logStringMessage("Sieve BadCertHandler: Expired certificate");

  return true;
}

BadCertHandler.prototype.notifyCrlNextupdate
   = function(socketInfo, targetURL, cert) 
{
}
// BadCert2 Interface...
// 
// http://lxr.mozilla.org/security/source/security/manager/ssl/public/nsISSLStatus.idl
// http://lxr.mozilla.org/seamonkey/source/security/manager/ssl/public/nsICertOverrideService.idl
// http://lxr.mozilla.org/seamonkey/source/security/manager/ssl/public/nsIBadCertListener2.idl
///

BadCertHandler.prototype.notifyCertProblem
  = function (socketInfo,SSLStatus,targetSite)
{
  if (this.logger != null)
    this.logger.logStringMessage("Cert Problem - Override enabled...");  

  // see http://lxr.mozilla.org/seamonkey/source/security/manager/pki/resources/content/exceptionDialog.js
  // addEcsption Method..
  var overrideService = Components.classes["@mozilla.org/security/certoverride;1"]
                                   .getService(Components.interfaces.nsICertOverrideService);
                                   
  var flags = 0;
  //if(gSSLStatus.isUntrusted)
  flags |= overrideService.ERROR_UNTRUSTED;
  //if(gSSLStatus.isDomainMismatch)
  flags |= overrideService.ERROR_MISMATCH;
  //if(gSSLStatus.isNotValidAtThisTime)
  flags |= overrideService.ERROR_TIME;
  
  var cert = SSLStatus.QueryInterface(Components.interfaces.nsISSLStatus).serverCert;
  
  this.logger.logStringMessage(targetSite);
    
    // TODO: add server cert inorder to establish line of trust
  overrideService.rememberValidityOverride(
      targetSite, // Host Name with port (host:port)
      cert,                            // -> SSLStatus
      flags,
      false); //temporary 
}


  // nsIInterfaceRequestor
BadCertHandler.prototype.getInterface
  = function(iid) 
{
  if (iid.equals(Components.interfaces.nsIBadCertListener) ||
        iid.equals(Components.interfaces.nsIBadCertListener2))
    return this;

  Components.returnCode = Components.results.NS_ERROR_NO_INTERFACE;
  return null;
}

// nsISupports
BadCertHandler.prototype.QueryInterface
  = function(iid) 
{
  if (!iid.equals(Components.interfaces.nsIBadCertListener) &&
      !iid.equals(Components.interfaces.nsIBadCertListener2) &&
      !iid.equals(Components.interfaces.nsIInterfaceRequestor) &&
      !iid.equals(Components.interfaces.nsISupports))
  {
    throw Components.results.NS_ERROR_NO_INTERFACE;
  }
    
  return this;
}
*/

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
    aCompMgr = aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    aCompMgr.registerFactoryLocation(CLASS_ID, CLASS_NAME, CONTRACT_ID, aFileSpec, aLocation, aType);
  },

  unregisterSelf: function(aCompMgr, aLocation, aType)
  {
    aCompMgr = aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    aCompMgr.unregisterFactoryLocation(CLASS_ID, aLocation);        
  },
  
  getClassObject: function(aCompMgr, aCID, aIID)
  {
    if (!aIID.equals(Components.interfaces.nsIFactory))
      throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

    if (aCID.equals(CLASS_ID))
      return SieveFactory;

    throw Components.results.NS_ERROR_NO_INTERFACE;
  },

  canUnload: function(aCompMgr) { return true; }
};

//module initialization
function NSGetModule(aCompMgr, aFileSpec) { return SieveModule; }
