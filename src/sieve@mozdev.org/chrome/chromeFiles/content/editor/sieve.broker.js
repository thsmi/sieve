"use strict"


if (!net)
  var net = {}
  
if (!net.tschmid)
  net.tschmid = {};
  
if (!net.tschmid.sieve)
  net.tschmid.sieve = {};

if (!net.tschmid.sieve.broker)
  net.tschmid.sieve.broker = {};
  
if (!net.tschmid.sieve.broker)
  net.tschmid.sieve.broker = {};

  
/**
 * Interacts alike a broke between two iframes. Virtually glues the two frame via html5 
 * post message to gether. So that bidirectional messaging is possible
 **/
  
(function() {

  function SieveBroker(target) {
    this.target = target;
  }
  
  SieveBroker.prototype = {
  	
    target : null,
    listener : null,

    getTarget : function() {    	
    	  
      if (!this.target)
        return parent;
            		
      var elm = document.getElementById(this.target);  	 
      
  	  if (elm && elm.contentWindow)
  	    return elm.contentWindow;
          	
  	  throw "No Target Element found";  	  
    },  
    
    sendMessage : function(event, data) {
    	
  	  var msg = {};
  	  msg.event = event;
  	  msg.data = data  
  	
  	  var target = this.getTarget();
  	  target.postMessage(JSON.stringify(msg),'*');
    },
	  
    setListener : function(listener) {
  	
  	  var that = this;
  	  
  	  if (!this.listener)
  	    window.addEventListener("message", function(event) { that.onMessage(event); }, false);
    	   	 
  	  this.listener = listener;
    },
    
    getListener : function() {
    	return this.listener;
    },
  
    onMessage : function(event) {
       // Do we trust the sender of this message?
      //if (event.origin !== "http://example.com:8080")
      //  return;
    
      if (!this.listener)
        return;
              
      var msg = JSON.parse(event.data)      
      this.listener(msg.event, msg.data);
    }
  } 
    
  // Export the constructor...
  net.tschmid.sieve.Broker = SieveBroker;
  
}());
  