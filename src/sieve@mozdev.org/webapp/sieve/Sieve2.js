
(function(exports) {

  function Sieve() {
  	
  	this.host = null;
    this.port = null;
    this.secure = null;
    
    this.socket = null;
    this.data = null;
  
    this.queueLocked = false;
    
    this.requests = [];   
    
    // Timeout and idle timer...
    
    this.debug = new Object();
    this.debug.level  = 0x00;
    this.debug.logger = null;
    
    // out of the box we support the following manage sieve commands...
    // ... the server might advertise additional commands they are added ...
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
  }
  
  Sieve.prototype.connect
    = function (host, port, secure) {
    	
    this.host = host;
    this.port = port;
    this.secure = secure; 
  } 
  
  Sieve.prototype.onResponse
    = function (data) {
    	
  }
  
  Sieve.prototype.onReceive
    = function (info) {
    	
    if (info.socketId != this.socket.socketId)
      return;  
      
    var data = info.data;
      
    // responses packets could be fragmented...    
    if ((this.data == null) || (this.data.length == 0))
      this.data = data;
    else
      this.data = this.data.concat(data);
    
    // is a request handler waiting?
    if (this.requests.length == 0)
      return;
      
    // first clear the timeout, parsing starts...
    //this._onStop();
      
    var dataView = new DataView(info.data);        
    console.log('onDataRead'+(new TextDecoder("utf-8")).decode(dataView)); 
  }
  
  Sieve.prototype.onReceiveError
    = function (info) {
    	
    if (info.socketId != this.socket.socketId)
      return;     
      
    console.error('Unable to reveive data');  
    
    
  }
  
  Sieve.prototype.onSocketConnected
    = function (result) {
    
    // negative value is an error...
    console.log('socket connected');
  }
  
  Sieve.prototype.send
    = function () {    	
    chrome.sockets.tcp.send(this.socket.socketId, new TextEncoder("utf-8").encode("CAPABILITY\r\n").buffer, function() {/*called when sent*/} );
  }
  
  Sieve.prototype.startTLS 
    = function () {

    var that = this;    	
    	
    if (this.secure != true)
      throw "TLS can't be started no secure socket";
    
    if (this.socket == null)
      throw "Can't start TLS, your are not connected to "+this.host;

    chrome.sockets.tcp.secure(this.socket.socketId, {}, function() {that.onSocketSecured()});    
  }
  
  Sieve.prototype.onSocketSecured
    = function (result) {
    
    console.log('socket secured');
  }
  
  
  Sieve.prototype.disconnect
    = function () {    
    console.log('disconnected');
    chrome.sockets.tcp.disconnect(this.socket.socketId);        	
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
  if (!this.requests)
    this.requests = [];
    
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

    
  exports.Sieve = Sieve;

})(window);