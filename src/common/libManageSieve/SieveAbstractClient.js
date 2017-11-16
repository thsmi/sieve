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

(function(exports) {

/**
 * This Code is used for a mozilla module as well as a Google chrome sandbox.
 *  
 * This means the javascript syntax is limited.  
 * There is no window object and no toSource().
 * 
 * You should also avoid new as this makes imports difficult.
 */


function SieveAbstractClient() 
{ 
  this.host = null;
  this.port = null;
  this.secure = null;
  
  this.socket = null;
  this.data = null;
  
  this.queueLocked = false;
  
  this.requests = [];      
  
  this.timeout = {};
  this.timeout.timer = null;
  this.timeout.delay = 20000;
        
  this.idle = {}; 
  this.idle.timer = null;
  this.idle.delay = null;
  
  
  // out of the box we support the following manage sieve commands...
  // ... the server might advertise additional commands they are added ...
  // ... or removed by the set compatibility method
  this.compatibility = {
    authenticate : true,
    starttls     : true,
    logout       : true,
    capability   : true,  
    // until now we do not support havespace...
    // havespace  : false, 
    putscript    : true,
    listscripts  : true,
    setactive    : true,
    getscript    : true,
    deletescript : true  
  };  
}

/**
 * Gives this socket a hint, whether a sieve commands is supported or not.
 * 
 * Setting the corresponding attribute to false, indicates, that a sieve command
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

SieveAbstractClient.prototype.setCompatibility
  = function(capabilites) 
{
  for (var capability in capabilites)
    this.compatibility[capability] = capabilites[capability];  
};

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
SieveAbstractClient.prototype.getCompatibility
  = function()
{
  return this.compatibility;
};


/**
 * Gets a reference to the current logger 
 * @returns {SieveAbstractLogger} 
 *   the current logger
 * 
 * @abstract
 */
SieveAbstractClient.prototype.getLogger
  = function ()
{
  throw new Error("Implement getLogger()");
};

  /**
   * Checks if the connection to the server is still alive and can be used to send
   * and receive messages
   * @return {Boolean}
   *   true in case the connection is alive otherwise false
   */
  SieveAbstractClient.prototype.isAlive 
     = function()
  {
    if (!this.socket)
      return false;
      
    return true;
  };
  
  /**
   * This method secures the connection to the sieve server. By activating 
   * Transport Layer Security all Data exchanged is crypted. 
   * 
   * Before calling this method you need to request a crypted connection by
   * sending a startTLSRequest. Invoke this method imediately after the server 
   * confirms switching to TLS.
   * 
   * @param {function} callback 
   *   the callback which is invoked after a successfully switch to tls.
   * @return {SieveAbstractClient}
   *   a self reference
   **/
  SieveAbstractClient.prototype.startTLS 
     = function (callback)
  {
    if (this.secure !== true)
      throw new Error("TLS can't be started no secure socket");
      
    if (!this.socket)
      throw new Error("Can't start TLS, your are not connected to "+this.host);
      
    // Need to be overwritten in a subclass....
    return this;
  };

  SieveAbstractClient.prototype._startTimeoutTimer
    = function () {
    throw new Error("Implement _startTimeoutTimer()");
  };
  
  SieveAbstractClient.prototype._stopTimeoutTimer
    = function () {
    throw new Error("Implement _stopTimeoutTimer()");
  };  

  SieveAbstractClient.prototype._startIdleTimer
    = function () {
    throw new Error("Implement _startIdleTimer()"); 
  };
  
  SieveAbstractClient.prototype._stopIdleTimer
    = function () {
    throw new Error("Implement _stopIdleTimer()");
  };  


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
   * @returns {SieveAbstractClient}
   *   a self reference
   */
  SieveAbstractClient.prototype.setTimeoutInterval
      = function (interval)
  {
    if (!interval)
      this.timeout.delay = 20000;
    else
      this.timeout.delay = interval;

    return this;
  };
  
  /**
   * Specifies the maximal interval between a response and a request. 
   * If the max time elapsed, the listener's OnIdle() event will be called. 
   * Thus it can be used for sending "Keep alive" packets. 
   *   
   * @param {int} interval
   *  the maximal number of milliseconds between a response and a request,
   *  pass null to deactivate.  
   * @returns {SieveAbstractClient}
   *   a self reference
   */
  SieveAbstractClient.prototype.setKeepAliveInterval
      = function (interval)
  {
    if (interval)
    {
      this.idle.delay = interval;
      return this;
    }
    
    // No keep alive Packets should be sent, so null the timer and the delay.
    this._stopIdleTimer();
    this.idle.delay = null;
  
    return this;      
  };
  
  SieveAbstractClient.prototype.addListener
     = function(listener)
  {
    this.listener = listener;
  };

  /**
   * Adds a request to the send queue. 
   * 
   * Normal request runs to completion, so they are blocking the queue
   * until they are fully processed. If the request failes, the error 
   * handler is triggered and the request is dequeued.
   * 
   * A greedy request in constrast accepts whatever it can get. Upon an 
   * error greedy request are not dequeued. They fail silently and the next 
   * requests is processed. This continues until a request succeeds, a non 
   * greedy request failes or the queue has no more requests. 
   *  
   * @param {SieveAbstractRequest} request
   *   the request object which should be added to the queue
   *   
   * @param {boolean} [greedy]
   *   if true requests fail silently
   *      
   * @returns {SieveAbstractClient}
   *   a self reference
   */
  SieveAbstractClient.prototype.addRequest 
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
      return this;
      
    let idx;
    // ... or it contains more than one full request
    for (idx = 0 ; idx<this.requests.length; idx++)
      if ( this.requests[idx].isUnsolicited() )
        break;
    
    if (idx == this.requests.length)
      return this;
  
    if (this.requests[idx] != request)
      return this;
     
    this._sendRequest();
    
    return this;
  };
  
  
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
   * @param {nsIProxyInfo[]} proxy
   *   An Array of nsIProxyInfo Objects which specifies the proxy to use.
   *   Pass an empty array for no proxy. 
   *   Set to null if the default proxy should be resolved. Resolving proxy info is
   *   done asynchronous. The connect method returns imedately, without any 
   *   information on the connection status... 
   *   Currently only the first array entry is evaluated.  
   * 
   * @returns {SieveAbstractClient}
   *   a self reference
   * 
   * @abstract
   */
  SieveAbstractClient.prototype.connect
      = function (host, port, secure, badCertHandler, proxy) 
  {
    throw new Error("Implement me SieveAbstractClient ");
  };
  
  
  /**
   * @abstract
   */
  SieveAbstractClient.prototype.disconnect
      = function () 
  { 
  
    this.getLogger().log("Disconnecting ...", (1 << 2));
      
    // free requests...
    //this.requests = new Array();  
    this._stopTimeoutTimer();
    this.timeout.timer = null;
    
    this._stopIdleTimer();   
  };
  
  
  SieveAbstractClient.prototype.notify
      = function (timer) 
  { 
        
    if (this.idle.timer == timer)
    {
    	this._stopIdleTimer(timer);
    	
    	if (this.listener && this.listener.onIdle)
        this.listener.onIdle();
        
      return;
    }
    
    if (this.timeout.timer != timer)
      return;
      
    this._stopTimeoutTimer(timer);
  
    this.getLogger().log("libManageSieve/Sieve.js:\nOnTimeout", (1 << 2));
      
    // clear receive buffer and any pending request...
    this.data = null;
   
    let idx = 0;
    while ((idx < this.requests.length) && (this.requests[idx].isGreedy))
      idx++;
  
    // ... and cancel any active request. It will automatically invoke the ... 
    // ... request's onTimeout() listener.    
    if (idx < this.requests.length)
    {
      let request = this.requests[idx];
      this.requests.splice(0,idx+1);
      
      request.cancel();
      return;    
    }
    
    // in case no request is active, we call the global listener
    this.requests = [];
     
    if (this.listener && this.listener.onTimeout) 
      this.listener.onTimeout();
  };
  
  SieveAbstractClient.prototype._onStart
      = function ()
  {
    this._startTimeoutTimer();
  };
  
  SieveAbstractClient.prototype._onStop
      = function()
  {
  	
    this._stopTimeoutTimer();
    this._stopIdleTimer();
    
    if (this.idle.delay == null)
      return;
      
    this._startIdleTimer();    
    return;
  };
  
  SieveAbstractClient.prototype.createParser
      = function (data)
  {
    throw new Error("Implement SieveAbstractClient::createParser "+data);
  };

  SieveAbstractClient.prototype.createRequestBuilder
      = function ()
  {
    throw new Error("Implement SieveAbstractClient::createRequestBuilder");
  };
  
  SieveAbstractClient.prototype.onDataReceived 
      = function(data)
  {
    // responses packets could be fragmented...    
    if ((this.data == null) || (this.data.length === 0))
      this.data = data;
    else
      this.data = this.data.concat(data); 
    
    // is a request handler waiting?
    if (this.requests.length === 0)
      return;
  
    // first clear the timeout, parsing starts...
    this._onStop();
    
    // As we are callback driven, we need to lock the event queue. Otherwise our
    // callbacks could manipulate the event queue while we are working on it.
    let requests = this._lockMessageQueue();
  
    // greedy request take might have an response but do not have to have one. 
    // They munch what they get. If there's a request they are fine,
    // if there's no matching request it's also ok.
    let idx = -1;
    
    while (idx+1 < requests.length)
    {
      idx++;
      let parser = this.createParser(this.data);
            
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
        if (this.getLogger().isLoggable(1 << 2)) {
        	//console.error(ex);
          this.getLogger().log("Parsing Warning in libManageSieve/Sieve.js:\n"+ex.toString());
          this.getLogger().log(ex.stack);
        }
          
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
        let request = requests.shift();
        // and update the index
        idx--;
        
        // ... if it was greedy, we munched an unexpected packet...
        // ... so there is still a valid request dangeling around.
        if (request.isGreedy)
          continue;
      }
        
      if (!parser.isEmpty())
        continue;      
       
      this._unlockMessageQueue(requests);
       
  
      // Are there any other requests waiting in the queue.
      
      // TODO FIX ME should always be dispatched, to relax the main thread.
      // But in mozilla modules we don't have access to a window object and 
      // timeouts are more compilcated.    
 
      //var that = this;
      //window.setTimeout(function () {that._sendRequest()}, 0);
  
      this._sendRequest();
       
      return;
    }
  
    
    // we endup here only if all responses where greedy or there were no...
    // ... response parser at all. Thus all we can do is release the message...
    // ... queue, cache the data and wait for a new response to be added.
    
    this._unlockMessageQueue(requests);
       
    this.getLogger().log("Skipping Event Queue", (1 << 2));  
  };
  
  SieveAbstractClient.prototype._sendRequest
    = function()
  { 
    for (var idx = 0; idx<this.requests.length; idx++)    
      if ( this.requests[idx].isUnsolicited() )
        break;
         
    if (idx >= this.requests.length)
      return;
      
    // start the timout, before sending anything. Sothat we will timeout...
    // ... in case the socket is jammed...
    this._onStart();
      
    let output = this.requests[idx].getNextRequest(this.createRequestBuilder()).getBytes();
    
    this.getLogger().log("Client -> Server:\n"+output, (1 << 0));
  
    this.onSend(output);
      
    return;
  };
  
  SieveAbstractClient.prototype._lockMessageQueue
    = function()
  {
    this.queueLocked = true;
    let requests = this.requests.concat();
    
    this.requests = [];
  
    return requests;
  };
  
  SieveAbstractClient.prototype._unlockMessageQueue
    = function(requests)
  {
    this.requests = requests.concat(this.requests);
    this.queueLocked = false;
  };

  exports.SieveAbstractClient = SieveAbstractClient;
})(this);
