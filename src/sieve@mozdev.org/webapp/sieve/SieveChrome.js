"use strict";

(function(exports) {

  // Compatibility Shim for Google Chrome sockets ..
	
  function SieveChrome() {  	
  	// Call the parent constructor...
  	Sieve.call(this);   
  }
  
  SieveChrome.prototype = Object.create(Sieve.prototype);
  SieveChrome.prototype.constructor = SieveChrome;  
    
  SieveChrome.prototype.setPaused
    = function (value)
  {
  	chrome.sockets.tcp.setPaused(this.socket.socketId, value)
  }
  
  SieveChrome.prototype.startTLS 
    = function ( callback ) {

    Sieve.prototype.startTLS.call(this);    	
    	
    chrome.sockets.tcp.secure(
        this.socket.socketId, {}, 
        function(response) {
        	if (response < 0)
        	  console.error("Secure "+response+ " "+chrome.runtime.lastError);
        	  
        	callback() 
        });    
  }  
  
  // Method used to controll the timers...
  
  SieveChrome.prototype._startTimeoutTimer
    = function () {
    		
    var that = this;
    this.timeout.timer
       = window.setTimeout(function() { that.notify(that.timeout.timer) }, that.timeout.delay);        
  }
  
  SieveChrome.prototype._stopTimeoutTimer
    = function () {

    if (!this.timeout.timer)
      return;
    
    window.clearTimeout(this.timeout.timer);
    this.timeout.timer = null;
  }  

  SieveChrome.prototype._startIdleTimer
    = function () {
            
    var that = this;    
    this.idle.timer 
       = window.setTimeout(function() { that.notify(that.idle.timer) }, that.idle.delay);
  }
  
  SieveChrome.prototype._stopIdleTimer
    = function () {

    if (!this.idle.timer)
      return;
    
    window.clearTimeout(this.idle.timer);
    this.idle.timer = null;
  }   
  
  // connect...
  
  SieveChrome.prototype.connect
    = function (host, port, secure) {
    	
    if( this.socket != null)
      return;           
    	
    this.host = host;
    this.port = port;
    this.secure = secure;
    		
    var that = this;
    chrome.sockets.tcp.create( {}, function(socket) { that.onSocketCreated(socket) }); 	    	
  }
  
  SieveChrome.prototype.onSocketCreated
    = function (socket) {
    
    var that = this;
    
    this.socket = socket;
    	
    chrome.sockets.tcp.connect(socket.socketId, this.host, this.port, function(result) { that.onSocketConnected(result) });
    
    chrome.sockets.tcp.onReceive.addListener(function (receiveInfo) { that.onReceive(receiveInfo); } );
    chrome.sockets.tcp.onReceiveError.addListener(function(info) { that.onReceiveError(info); });    
  }
  
  
  SieveChrome.prototype.disconnect
    = function () {    
    
    Sieve.prototype.disconnect.call(this);
    
    if (this.socket == null)
      return;

    chrome.sockets.tcp.disconnect(this.socket.socketId);  
    this.socket = null;
  }  
  
  // TODO detect server disconnects and communication errors...
  
  SieveChrome.prototype.onReceive
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
    
    Sieve.prototype.onDataReceived.call(this, data);      
  }
  
  SieveChrome.prototype.onReceiveError
    = function (info) {
    	
    if (info.socketId != this.socket.socketId)
      return;     
      
    console.error('Unable to reveive data'+chrome.runtime.lastError);  
    
    
  }
  
  SieveChrome.prototype.onSocketConnected
    = function (result) {
    
    // negative value is an error...
    console.log('socket connected');
  }
  
  SieveChrome.prototype._send
    = function (data) {   
    	
    chrome.sockets.tcp.send(
      this.socket.socketId, 
      new TextEncoder("utf-8").encode(data).buffer, function() {/*called when sent*/} );
  }  

    
  exports.SieveChrome = SieveChrome;

})(window);