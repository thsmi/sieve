// Create the namespace...

/* global window */

"use strict";

// Our server is implemented within an anonymous method...

(function(exports) {

	/* global $: false */
	/* global net */
	/* global tests */
	/* global document */
	
  // Create the namespace, even if we are inside an anonymous method...
  if (!exports.net)
    exports.net = {};
    
  if (!exports.net.tschmid)
    exports.net.tschmid = {};
    
  if (!exports.net.tschmid.yautt)
    exports.net.tschmid.yautt = {};  
  
  if (!exports.net.tschmid.yautt.test)
    exports.net.tschmid.yautt.test = {};
    
  if (!exports.net.tschmid.yautt.test.server)
    exports.net.tschmid.yautt.test.server = {};
  
  if (!exports.net.tschmid.yautt.test.server.queue)
    exports.net.tschmid.yautt.test.server.queue = [];
	
  exports.net.tschmid.yautt.test.server.onMessage = function(event) {	

    var msg = JSON.parse(event.data);
  
    if (msg.type == "LOG") {
      this.log(msg.data, msg.level);
      return;
    }
   
    var that = this;
        
    if (msg.type == "FAIL") {
      this.log("##### Test failed: " + msg.data, "Fail");
      // The post event blocks both window. So defere processing...
      window.setTimeout(function() {that.next();}, 10);      
      return;
    }
    
    if (msg.type == "SUCCEED") {
      this.log("##### Test succeeded.","Success");
      // The post event blocks both window. So defere processing...
      window.setTimeout(function() {that.next();}, 10);      
      return;
    }    
    
    alert("Unknown post received");
  };
  
  net.tschmid.yautt.test.server.log = function(message, style) {
  	
  	if (typeof(style) !== "string")
  	  style = "logInfo";
  	else
  	  style = "log"+style;
  	
    $("<div/>")
      .addClass(style)
      .text(message)
      .appendTo("#divOutput");	
  };

  net.tschmid.yautt.test.server.logTrace = function(message) {
  	this.log(message, "Trace");
  };
  
  net.tschmid.yautt.test.server.logError = function(message) {
  	this.log(message, "Error");
  };
  

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
  };

  net.tschmid.yautt.test.server.next = function() {
  	
  	var name = this.queue.shift();
  	
  	if (typeof(name) === "undefined")
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
          });
        })
        .attr("src","./tests/tests.html"));   
  };

  net.tschmid.yautt.test.server.run = function() {
  
    var that = this;
    
    this.queue = [];
    
    $.each(tests, function (name, value) {
      // Loop through tests..
      if (typeof(value) === "undefined")
	      return;		 

      if (value.disabled)
	      return;
	    
	    if (!value.script)
	      return;
	  
	    that.queue.push(name);
    });
	
    this.next();  
    // TODO add a timeout watchdog.
  };
  
  net.tschmid.yautt.test.server.init = function() {
    var that = this;
  	window.addEventListener("message", function(event) { that.onMessage(event); }, false);
  };
  
  
  $(document).ready(function() {
  	
  	net.tschmid.yautt.test.server.init();
  	
    $("#toggleTrace").click(function(){
      $(".logTrace").toggle();
    });
  	
    $("#start").click(function() {

    	$.each(tests, function(name,value) {
    	  if(value.disabled)
    	    value.disabled = false;
    	});
    	
    	var items = $("#tests input:checkbox:not(:checked)");    	
    	items.each(function(idx, elm) { 
    		var name = $(this).val();
    		
    		if (tests[name].script)
    	    tests[name].disabled = true;
    	});
    	
      net.tschmid.yautt.test.server.run();
    });
    
    $("#tests-none").click(function () {
      $( "#tests input:checkbox" ).each(function() {
        $(this).prop("checked", false);
      });
    });

    $("#tests-all").click(function () {
      $( "#tests input:checkbox" ).each(function() {
        $(this).prop("checked", true);
      });
    });
    
    $("#result-clear").click(function() {
    	$("#divOutput").empty();
    });
    
    
    var elm = $("#tests");
    
    $.each(tests, function(name, value) {

    	if (!tests[name].script)
    	  return;
    	
    	elm.append(
    	  $("<div />")
    	    .append($("<input />", { type:"checkbox", "checked":"checked" }).val(name))
    	    .append(name));
    	    
    });
  });

}(window));
