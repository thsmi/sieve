/*******************************************************************************
 
  FACTSHEET: 
  ==========
    CLASS NAME          : Sieve
        
    CONSCTURCTOR        : Sieve(String host, int port, boolean secure, int timeout)
    DECLARED FUNCTIONS  : void connect()
                          void disconnect()
                          boolean isAlive()
                          void startTLS()
                          void addRequest(SieveRequest request)
    EXCEPTIONS          : 
    AUTHOR              : Thomas Schmid        
    
  DESCRIPTION:
  ============
    This class is a simple socket implementation for sieve requests. Due to the 
    asymetric nature of the Mozilla sockets we need some kind of message queue. 
    New requests can be added via the "addRequest" method. In case of an response, 
    the corresponding request will be automatically calledback via its "addResponse"
    method.
    If you need a secure connection, set the flag secure in the constructor. Then
    connect to the host. And invoke the "startTLS" Method as soon as you nagociated 
    the switch to a crypted connection. After calling startTLS Mozilla will imediately
    switch to a cryped connection.
    The Method setDebugLevel specifies wheather only requests, only responses, 
    both or nothing is logged to the error console. A "level" value of "1" means 
    olny request "2" is equivalent to responses only, "3" states that both (request 
    and responses) should be logged and a "0" disables any logging.

  EXAMPLE:
  ========
   
    var sieve = new Sieve("example.com",2000,false,1800000);
    
    var request = new SieveInitRequest();    
    sieve.addRequest(request);
     
    sieve.connect();
		    
    var request = new SieveSaslLoginRequest('geek');
    request.setPassword('th3g33k1');                        
    sieve.addRequest(request);
    
    sieve.disconnect();

********************************************************************************/

function Sieve(host, port, secure, idleInterval) 
{  
  
  this.host = host;
  this.port = port;
  this.secure = secure;
  
  this.socket = null;
  this.data = "";
  
  this.requests = new Array();
    
  this.watchDog = null;
  
  this.idleInterval = idleInterval;
  
  this.debug = new Object();
  this.debug.level  = 0x00;
  this.debug.logger = null;  
}

/*
 * level:
 *   is a bitfield which defines which debugmessages are logged to the console.
 * 
 * console: 
 *   passes the logger which should be used. 
 *   A via logger needs to interface a logStringMessage(String) Method. 
 */

Sieve.prototype.setDebugLevel = function(level, logger)
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

Sieve.prototype.isAlive = function()
{
  if (this.socket == null)
    return false;
    
	return this.socket.isAlive(); 
}

// if the parameter ignoreCertError is set, cert errors will be ignored
Sieve.prototype.startTLS = function (ignoreCertError)
{
  if (this.secure != true)
    throw new Exception("TLS can't be started no secure socket");
    
  if (this.socket == null)
    throw new Exception("Can't start TLS, your are not connected to "+host);

  var securityInfo = this.socket.securityInfo.QueryInterface(Components.interfaces.nsISSLSocketControl);
  
  if ((ignoreCertError != null) && (ignoreCertError == true))
    securityInfo.notificationCallbacks = new BadCertHandler(this.debug.logger);

  securityInfo.StartTLS();
}

Sieve.prototype.addWatchDogListener = function(watchDog)
{
  this.watchDog = watchDog;
  this.watchDog.onAttach(1000,this.idleInterval);
}

Sieve.prototype.addRequest = function(request)
{
	this.requests[this.requests.length] = request;
	// wenn die länge nun eins ist war sie vorher null
	// daher muss die Requestwarteschalnge neu angestoßen werden.
	if (this.requests.length > 1)
		return;

  if( this.watchDog != null)
    this.watchDog.onStart();
  
	// filtert den initrequest heraus...	 	
	if (request instanceof SieveInitRequest)
	  return;

  var output = request.getNextRequest();
  
  if (this.debug.level & (1 << 0))
    this.debug.logger.logStringMessage(output);

  this.outstream.write(output,output.length);
  
  return;
}

Sieve.prototype.connect = function () 
{
	if( this.socket != null)
		return;

  if ( (this.socket != null) && (this.socket.isAlive()))
    return;
  
  var transportService =
      Components.classes["@mozilla.org/network/socket-transport-service;1"]
        .getService(Components.interfaces.nsISocketTransportService);
  
  if (this.secure)
    this.socket = transportService.createTransport(["starttls"], 1,this.host, this.port, null); 
  else
    this.socket = transportService.createTransport(null, 0,this.host, this.port, null);    
        
  this.outstream = this.socket.openOutputStream(0,0,0);
  
  var stream = this.socket.openInputStream(0,0,0);
  var pump = Components.
    classes["@mozilla.org/network/input-stream-pump;1"].
      createInstance(Components.interfaces.nsIInputStreamPump);
                  
  pump.init(stream, -1, -1, 5000, 2, true);
  pump.asyncRead(this,null);
  
  return;
}

Sieve.prototype.disconnect = function () 
{	
  // free requests...
  //this.requests = new Array();
  if( this.watchDog != null)
    this.watchDog.onDeattach();
  
  if (this.socket == null)
    return;
  
  this.socket.close(0);
  this.socket = null;
}

Sieve.prototype.onStopRequest =  function(request, context, status)
{
  if (this.socket != null)
    this.disconnect();
}

Sieve.prototype.onStartRequest = function(request, context)
{
  if (this.debug.level)
    this.debug.logger.logStringMessage("Connected to "+this.host+":"+this.port+" ...");
}

//Sieve.prototype.onTimeout = function()
Sieve.prototype.onWatchDogTimeout = function() 
{
  
  // clear receive buffer and any pending request...
  this.data = "";  
  var request = this.requests[0];
  this.requests.splice(0,1);

  // then signal with a null response a timeout
  if (request != null)   
    request.addResponse(null);  
}

Sieve.prototype.onDataAvailable = function(request, context, inputStream, offset, count)
{
  
  var instream = Components.classes["@mozilla.org/scriptableinputstream;1"]
      .createInstance(Components.interfaces.nsIScriptableInputStream);  
  instream.init(inputStream);
      
  var data = instream.read(count);

  if (this.debug.level & (1 << 1))
    this.debug.logger.logStringMessage(data);

	// is a request handler waiting?
	if ((this.requests.length == 0))
		return;
		
	// responses packets could be fragmented...
	this.data += data;
	
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
	  if (this.debug.level)      
	    this.debug.logger.logStringMessage("Parsing Exception:\n"+ex);
	  // ... we encounterned an error, this is most likely caused ...
	  // ... by a fragmented packet, so we skip processing and start ...
	  // ... the timeout timer again. Either the next packet or a timeout ...
	  // ... will resolve this situation.

    if( this.watchDog != null)
      this.watchDog.onStart();
	  
	  return;
	}
  
  // if we are here the response was parsable, so we can drop the
  // transmitted data, thus it is now saved in the object
  this.data = "";
     
 	// ... delete the request, it is processed...	
	if (this.requests[0].hasNextRequest() == false)
  	this.requests.splice(0,1);


	// ... are there any other requests waiting in the queue.
	if ((this.requests.length > 0))
	{
	  var output = this.requests[0].getNextRequest();
	  
    if (this.debug.level & (1 << 0))
      this.debug.logger.logStringMessage(output);
    
	  this.outstream.write(output,output.length);
	  
	  // the request is transmitted, therefor activate the timeout
    if( this.watchDog != null)
      this.watchDog.onStart();
	  
	}
}

/******************************************************************************/
// Helper class to override the "bad cert" dialog...
// see nsIBadCertListener for details

function BadCertHandler(logger) 
{
  this.logger = logger;
}

BadCertHandler.prototype.confirmUnknownIssuer = function(socketInfo, cert, certAddType) 
{
  alert("invalid Password");
  
  if (this.logger != null)
    this.logger.logStringMessage("Sieve BadCertHandler: Unknown issuer");
      
  return true;
}

BadCertHandler.prototype.confirmMismatchDomain = function(socketInfo, targetURL, cert) 
{
  if (this.logger != null)
    this.logger.logStringMessage("Sieve BadCertHandler: Mismatched domain");

  return true;
}

BadCertHandler.prototype.confirmCertExpired = function(socketInfo, cert) 
{
  if (this.logger != null)
    this.logger.logStringMessage("Sieve BadCertHandler: Expired certificate");

  return true;
}

BadCertHandler.prototype.notifyCrlNextupdate = function(socketInfo, targetURL, cert) 
{
}
/* BadCert2 Interface...
 * 
 * http://lxr.mozilla.org/security/source/security/manager/ssl/public/nsISSLStatus.idl
 * http://lxr.mozilla.org/seamonkey/source/security/manager/ssl/public/nsICertOverrideService.idl
 * http://lxr.mozilla.org/seamonkey/source/security/manager/ssl/public/nsIBadCertListener2.idl
 */

BadCertHandler.prototype.notifyCertProblem = function (socketInfo,/*nsISSLStatus*/SSLStatus,/*String*/targetSite)
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
    
  overrideService.rememberValidityOverride(
      targetSite, // Host Name with port (host:port)
      cert,                            // -> SSLStatus
      flags,
      false); //temporary 
}


  // nsIInterfaceRequestor
BadCertHandler.prototype.getInterface = function(iid) 
{
  if (iid.equals(Components.interfaces.nsIBadCertListener) ||
        iid.equals(Components.interfaces.nsIBadCertListener2))  
    return this;

  Components.returnCode = Components.results.NS_ERROR_NO_INTERFACE;
  return null;
}

  // nsISupports
BadCertHandler.prototype.QueryInterface = function(iid) 
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

