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

"use strict";

/* global SieveAbstractClient */
/* global SieveResponseParser */

/* global DataView */
/* global Uint8Array*/
/* global TextDecoder */
/* global TextEncoder */

/* global chrome */
/* global console */ 
/* global window */

(function(exports) {

	
  // Compatibility Shim for Google Chrome sockets ..
	
  function Sieve(logger) {  	
  	// Call the parent constructor...
  	SieveAbstractClient.call(this);
  	
  	this._logger = logger;
  }
  
  Sieve.prototype = Object.create(SieveAbstractClient.prototype);
  Sieve.prototype.constructor = Sieve;  
    
  Sieve.prototype.setPaused
    = function (value)
  {
  	chrome.sockets.tcp.setPaused(this.socket.socketId, value);
  };
  
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
    	
    chrome.sockets.tcp.secure(
        this.socket.socketId, {}, 
        function(response) {
        	if (response < 0)
        	  console.error("Secure "+response+ " "+chrome.runtime.lastError);
        	  
        	callback();
        });    
  };
  
  // Method used to controll the timers...
  
  Sieve.prototype._startTimeoutTimer
    = function () {
    		
    var that = this;
    this.timeout.timer
       = window.setTimeout(function() { that.notify(that.timeout.timer); }, that.timeout.delay);        
  };
  
  Sieve.prototype._stopTimeoutTimer
    = function () {

    if (!this.timeout.timer)
      return;
    
    window.clearTimeout(this.timeout.timer);
    this.timeout.timer = null;
  }; 

  Sieve.prototype._startIdleTimer
    = function () {
            
    var that = this;    
    this.idle.timer 
       = window.setTimeout(function() { that.notify(that.idle.timer); }, that.idle.delay);
  };
  
  Sieve.prototype._stopIdleTimer
    = function () {

    if (!this.idle.timer)
      return;
    
    window.clearTimeout(this.idle.timer);
    this.idle.timer = null;
  };
  
  Sieve.prototype.createParser
      = function (data)
  {
    return new SieveResponseParser(data);
  };  
    
  Sieve.prototype.getLogger
      = function ()
  {
    return this._logger;
  };

  // connect...
  
  Sieve.prototype.connect
    = function (host, port, secure) {
    	
    if( this.socket != null)
      return;           
    	
    this.host = host;
    this.port = port;
    this.secure = secure;
    		
    var that = this;
    chrome.sockets.tcp.create( {}, function(socket) { that.onSocketCreated(socket); }); 	    	
  };
  
  Sieve.prototype.onSocketCreated
    = function (socket) {
    
    var that = this;
    
    this.socket = socket;
    	
    chrome.sockets.tcp.connect(socket.socketId, this.host, this.port, function(result) { that.onSocketConnected(result); });
    
    chrome.sockets.tcp.onReceive.addListener(function (receiveInfo) { that.onReceive(receiveInfo); } );
    chrome.sockets.tcp.onReceiveError.addListener(function(info) { that.onReceiveError(info); });    
  };
  
  Sieve.prototype.disconnect
    = function () {    
    
    SieveAbstractClient.prototype.disconnect.call(this);
    
    if (this.socket == null)
      return;

    chrome.sockets.tcp.disconnect(this.socket.socketId);  
    this.socket = null;
  };
  
  // TODO detect server disconnects and communication errors...
  
  Sieve.prototype.onReceive
    = function (info) {
    	
    if (info.socketId != this.socket.socketId)
      return;  

    var dataView = new DataView(info.data);        
    console.log('onDataRead ('+info.data.byteLength+')\n'+(new TextDecoder("utf-8")).decode(dataView));       
      
    var view = new Uint8Array(info.data);
    var data = [];
    
    for (var i = 0; i < view.byteLength; i++) {
    	data[i] = view[i]; 
    }    
    
    SieveAbstractClient.prototype.onDataReceived.call(this, data);      
  };
  
  Sieve.prototype.onReceiveError
    = function (info) {
    	
    if (info.socketId != this.socket.socketId)
      return;     
      
    console.error('Unable to reveive data'+chrome.runtime.lastError);  
    
  };
  
  Sieve.prototype.onSocketConnected
    = function (result) {
    
    // negative value is an error...
    console.log('socket connected');
  };
  
  Sieve.prototype.onSend
    = function (data) {   
    	
    chrome.sockets.tcp.send(
      this.socket.socketId, 
      new TextEncoder("utf-8").encode(data).buffer, function() {/*called when sent*/} );
  };  

    
  exports.Sieve = Sieve;

})(window);