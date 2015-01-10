// Create the namespace...

"use strict";

// Our server is implemented within an anonymous method...

(function() {

  // Create the namespace, even if we are inside an anonymous method...
  if (!net)
    var net = {};
    
  if (!net.tschmid)
    net.tschmid = {};
    
  if (!net.tschmid.yautt)
    net.tschmid.yautt = {};  
  
  if (!net.tschmid.yautt.test)
    net.tschmid.yautt.test = {};
    
  if (!net.tschmid.yautt.test.server)
    net.tschmid.yautt.test.server = {};
  
  if (!net.tschmid.yautt.test.server.queue)
    net.tschmid.yautt.test.server.queue = [];
	
  net.tschmid.yautt.test.server.onMessage = function(event) {	

  	//alert(event.origin);
    // Do we trust the sender of this message?
 //   if (event.origin !== document.domain)
//      return;

    var msg = JSON.parse(event.data);
  
    if (msg.type == "LOG") {
      this.log(msg.data, msg.level);
      return;
    }
   
    var that = this;
        
    if (msg.type == "FAIL") {
      this.log("##### Test failed: " + msg.data, "Fail");
      // The post event blocks both window. So defere processing...
      window.setTimeout(function() {that.next()}, 10);      
      return;
    }
    
    if (msg.type == "SUCCEED") {
      this.log("##### Test succeeded.","Success")
      // The post event blocks both window. So defere processing...
      window.setTimeout(function() {that.next()}, 10);      
      return;
    }    
    
    alert("Unknown post received");
  }  
  
  net.tschmid.yautt.test.server.log = function(message, style) {
  	
  	if (typeof(style) !== "string")
  	  style = "logInfo";
  	else
  	  style = "log"+style;
  	
    $("<div/>")
      .addClass(style)
      .text(message)
      .appendTo("#divOutput");	
  }

  net.tschmid.yautt.test.server.logTrace = function(message) {
  	this.log(message, "Trace");
  }
  
  net.tschmid.yautt.test.server.logError = function(message) {
  	this.log(message, "Error");
  }
  

  net.tschmid.yautt.test.server.extend = function (name) {
  	
    var base = tests[name];
    var scripts = [];
      
    if (!base)
      return [];
    
    if (base.extend)
    	scripts = this.extend(base.extend);
    
    if (!base.require)
      return scripts;
      
    // TODO Check/ensure if require is an array...
    var that = this;
    $.each(base.require, function (idx, value) {
      scripts.push(value);
    });
    
    return scripts;
  }

  net.tschmid.yautt.test.server.next = function() {
  	
  	var name = this.queue.shift();
  	
  	if (typeof(name) == "undefined")
  	  return;
  
    this.log("Starting test profile "+name);    
    var scripts = this.extend(name);
	
    scripts.push("./../js/Unit.js");
    scripts.push(tests[name].script);
    scripts.push("./../js/UnitInit.js");
	

    var that = this;
    
    $("#divFrame")
      .empty()
      .append($("<iframe/>")
        .attr("id","testFrame")
        .load(function() {        	
          var iframe = document.getElementById("testFrame").contentWindow;
          that.logTrace("Injecting Scripts for "+name+" ...");
          
          $.each(scripts, function (idx,script) {
          	
          	var msg = {type : "IMPORT", data : script};
          	
          	iframe.postMessage(""+JSON.stringify(msg) ,"*");           
          })
        })
        .attr("src","./tests/tests.html"));   
  };

  net.tschmid.yautt.test.server.run = function() {
  
    var that = this;
    window.addEventListener("message", function(event) { that.onMessage(event); }, false);
  
    $.each(tests, function (name, value) {
      // Loop throug tests..
	  if (typeof(value) == "undefined")
	    return;		 

	  if (!value.script)
	    return;
	  
	  that.queue.push(name);
    });
	
    this.next();  
    // TODO add a timeout watchdog.
  };

  
  
  $(document).ready(function() {
  	
    $("#toggleTrace").click(function(){
      $(".logTrace").toggle();
    });
  	
    net.tschmid.yautt.test.server.run();
  });

}());
