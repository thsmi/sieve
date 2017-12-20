/* global window */
/* global parent */
/* global document */

( function ( exports ) {

"use strict";

  if ( !exports.net )
    exports.net = {};
  
  if ( !exports.net.tschmid )
    exports.net.tschmid = {};
  
  if ( !exports.net.tschmid.yautt )
    exports.net.tschmid.yautt = {};

  if ( !exports.net.tschmid.yautt.test )
    exports.net.tschmid.yautt.test = {};

  exports.net.tschmid.yautt.test.tests = [];
 

  function log( message, level ) {
  
  if (typeof(level) !== "string")
    level = "Info";
    
  var msg = {};
  msg.type = "LOG";
  msg.level = level;
  msg.data = ""+message;
  
  parent.postMessage(""+JSON.stringify(msg), "*");
  }

  function logError( message ) {
    log( message, "Error" );
  }

  function logTrace( message ) {
    log( message, "Trace" );
  }

/**
 * Signals the test suit, tests succeeded.
   * @return{undefined}
 */
  function succeed() {
  var msg = {};
  msg.type = "SUCCEED";
  
  parent.postMessage(""+JSON.stringify(msg), "*");
  }

/**
   * Signals the test suit, a test failed.
   *
   * @param {String|Error} [message]
   *   an optional error or error why tests failed.
   * @returns {undefined}
 */
  function fail( message ) {

  var msg = {};
  msg.type = "FAIL";
    msg.description = "" + message;

    if ( ( message instanceof Error === true ) && ( message.stack ) )
      msg.details = "" + message.stack;
  
  parent.postMessage(""+JSON.stringify(msg), "*");
  }

  function require( script ) {
	
    var elm = document.createElement("script");
    elm.type = "text/javascript";
    elm.src = ""+script;

    elm.addEventListener( 'error', function () {
      fail( "Failed to load script " + script );
    }, true);    
//    elm.onerror = function(ev) {
//    	debugger;
//    	that.abort("Script error "+ev.message+"\n"+ev.filename+"\n"+ev.lineno+"\n"+ev.colno+"\n") };
    
    // The order maters wich means we need to get async.
    elm.async = false;
    
    logTrace( "  + Injecting script " + script + " ..." );
    
    document.head.appendChild(elm);              	
  }

  function assertEquals( expected, actual, message ) {
	
    if ( expected === actual ) {
      logTrace( "Assert successfull:\n" + expected );
      return;
    }
  
    if ( typeof ( message ) === 'undefined' || message === null )
      message = "Assert failed\nExpected: \n" + expected + "\n\nBut got\n" + actual;

    throw new Error( "" + message );
  }
	
  function add( test ) {
	
    if ( !exports.net.tschmid.yautt.test.tests )
      exports.net.tschmid.yautt.test.tests = [];

    exports.net.tschmid.yautt.test.tests.push( test );
  }

  function run() {
	
    var tests = exports.net.tschmid.yautt.test.tests;
  
    if ( !tests || !tests.length ) {
      fail( "Empty test configuration" );
  	return;
  }
    
  try {
      tests.forEach( function ( test ) { test(); });
  }
    catch ( e ) {
      fail( e );
    return;
  }	

    succeed();
  }


  // We communicate via postMessage command with our parent frame...
  window.addEventListener("message", function(event) { // net.tschmid.yautt.test.onMessage(event);
  	
  	//alert(event.origin);
    // Do we trust the sender of this message?
 //   if (event.origin !== document.domain)
//      return;

    var msg = JSON.parse(event.data);
  
    if ( msg.type !== "IMPORT" )
      return;

    require( msg.data );
  }, false);
  
  // ... we need to catch any errors...
  var oldErrorHandler = window.onerror;
  
  window.onerror = function(message, url, line) {
  	
    fail( "Script error " + message + "\n" + url + "\n" + line + "\n" );
    
    if (!oldErrorHandler)
      return false;  
    
    return oldErrorHandler(message, url, line);
  };
  
  exports.net.tschmid.yautt.test.log = log;
  exports.net.tschmid.yautt.test.logTrace = logTrace;
  exports.net.tschmid.yautt.test.logError = logError;
  
  exports.net.tschmid.yautt.test.require = require;
  exports.net.tschmid.yautt.test.succeed = succeed;
  exports.net.tschmid.yautt.test.fail = fail;

  exports.net.tschmid.yautt.test.assertEquals = assertEquals;

  exports.net.tschmid.yautt.test.add = add;

  exports.net.tschmid.yautt.test.run = run;

})( window );

