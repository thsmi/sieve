
"use strict";

if (!net)
  var net = {};
  
if (!net.tschmid)
  net.tschmid = {};
  
if (!net.tschmid.yautt)
  net.tschmid.yautt = {};  

if (!net.tschmid.yautt.test)
  net.tschmid.yautt.test = {};  

net.tschmid.yautt.test.tests = [];
 
net.tschmid.yautt.test.log = function(message, level) {
  
  if (typeof(level) !== "string")
    level = "Info"
    
  var msg = {};
  msg.type = "LOG";
  msg.level = level;
  msg.data = ""+message;
  
  parent.postMessage(""+JSON.stringify(msg), "*");
}

net.tschmid.yautt.test.logError = function(message) {
  this.log(message,"Error");
}

net.tschmid.yautt.test.logTrace = function(message) {
  this.log(message,"Trace");
}

/**
 * Signals the test suit, tests succeeded.
 */
net.tschmid.yautt.test.succeed = function() {
  var msg = {};
  msg.type = "SUCCEED";
  
  parent.postMessage(""+JSON.stringify(msg), "*");
}

/**
 * Signals the test suit, test failed.
 * @param {} message
 *   an option error message why tests failed.
 */
net.tschmid.yautt.test.fail = function(message) {
  var msg = {};
  msg.type = "FAIL";
  msg.data = ""+message;
  
  parent.postMessage(""+JSON.stringify(msg), "*");
}

net.tschmid.yautt.test.require = function(script) {
	
	var that = this;
	
    var elm = document.createElement("script");
    elm.type = "text/javascript";
    elm.src = ""+script;

    elm.addEventListener('error', function(ev) {
      debugger;
      that.fail("Failed to load script "+script );
    }, true);    
//    elm.onerror = function(ev) {
//    	debugger;
//    	that.abort("Script error "+ev.message+"\n"+ev.filename+"\n"+ev.lineno+"\n"+ev.colno+"\n") };
    
    // The order maters wich means we need to get async.
    elm.async = false;
    
    this.logTrace("  + Injecting script "+script+" ...");
    
    document.head.appendChild(elm);              	
}

net.tschmid.yautt.test.assertEquals = function assertEquals(expected, actual) {
  
  if (expected != actual)
	throw "Test failed expected: \n"+expected+"\n\nBut got\n"+actual;
};

net.tschmid.yautt.test.add = function(test) {
	
  if (!this.tests)
    this.tests = [];
	
  this.tests.push(test);
};


net.tschmid.yautt.test.run = function() {
	
  var that = this;
  
  if (!this.tests || !this.tests.length) {
  	this.fail("Empty test configuration");
  	return;
  }
    
  try {
    this.tests.forEach( function(test){  test(that)  });
  }
  catch (e)
  {
  	this.fail(e)
    return;
  }	

  this.succeed();
};


// Hook up custom error and event handler. And wrap them into an anonymous function..
(function() {
  var that = this;

  // We communicate via postMessage command with our parent frame...
  window.addEventListener("message", function(event) { // net.tschmid.yautt.test.onMessage(event);
  	
  	//alert(event.origin);
    // Do we trust the sender of this message?
 //   if (event.origin !== document.domain)
//      return;

    var msg = JSON.parse(event.data);
  
    if (msg.type != "IMPORT")
      return;

    net.tschmid.yautt.test.require(msg.data);  
  }, false);
  
  // ... we need to catch any errors...
  var oldErrorHandler = window.onerror;
  
  window.onerror = function(message, url, line) {
  	
    net.tschmid.yautt.test.fail("Script error "+message+"\n"+url+"\n"+line+"\n");
    
    if (!oldErrorHandler)
      return false;  
    
    return oldErrorHandler(message, url, line);
  }
  
  
} ());
