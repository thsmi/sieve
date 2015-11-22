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

/* globals SieveSaslLoginRequest */
/* globals SieveResponseParser */
/* globals SieveSaslExternalRequest */
/* globals window */

"use strict";
 
(function(exports) {
	
  var suite  = exports.net.tschmid.yautt.test;
    
  if (!suite)
    throw "Could not initialize test suite";

  suite.add( function() {   
    suite.log("ManageSieve unit tests...");
  });    
  
  suite.add( function() {   
  	 	
  	
   suite.log("SASL Login - OK");
    
   
   var request = new SieveSaslLoginRequest();
   
   var hasError = null;
   var hasSucceded = null;
   
   var handler = {};
   handler.onSaslResponse = function() { hasSucceded = true; };
   handler.onError = function() { hasError = true; };
   
   request.addSaslListener(handler);
   request.addErrorListener(handler);
   
   request.setUsername("blubb");
   request.setPassword("bla");
   
   // CLIENT -> SERVER   
   // Client sends mechanism to server.
   suite.assertEquals(true, request.hasNextRequest());
   suite.assertEquals('AUTHENTICATE "LOGIN"\r\n', request.getNextRequest());
   
   // SERVER -> CLIENT
   // Server responds with a "VXNlcm5hbWU6" which is a "USERNAME:"
   request.addResponse(new SieveResponseParser([0x22, 0x56, 0x58, 0x4e, 0x6c, 0x63, 0x6d, 0x35, 0x68, 0x62, 0x57, 0x55, 0x36, 0x22,0x0D,0x0A]));
   
   // CLIENT -> SERVER
   // Client sends the username, Ymx1YmI= equals blubb
   suite.assertEquals(true, request.hasNextRequest());
   suite.assertEquals('"Ymx1YmI="\r\n', request.getNextRequest());
   
   // SERVER -> CLIENT
   // Server responds with a "UGFzc3dvcmQ6" which is a "PASSWORD:"
   request.addResponse(new SieveResponseParser([0x22,0x55,0x47,0x46,0x7a,0x63,0x33,0x64,0x76,0x63,0x6d,0x51,0x36,0x22,0x0D,0x0A]));
   
   // CLIENT -> SERVER
   // Client sends the password, 
   suite.assertEquals(true, request.hasNextRequest());
   suite.assertEquals('"Ymxh"\r\n', request.getNextRequest());
   
   // SERVER -> CLIENT
   // Server sends OK
   request.addResponse(new SieveResponseParser([0x4f,0x4b,0x0D,0x0A]));
   
   // Server sends NO
   //request.addResponse(new SieveResponseParser([0x4e,0x4f,0x0D,0x0A]));
   
   suite.assertEquals(false, request.hasNextRequest());
   
   suite.assertEquals(true, hasSucceded);
   suite.assertEquals(null, hasError);
  });

  suite.add( function() {   
        
   suite.log("SASL External - OK");
   
   // Single theaded javascript magic...
   var hasError = null;
   var hasSucceded = null;
   
   var handler = {};
   handler.onSaslResponse = function() { hasSucceded = true; };
   handler.onError = function() { hasError = true; };   
    
   
   var request = new SieveSaslExternalRequest();
   request.addSaslListener(handler);
   request.addErrorListener(handler);
   
   // CLIENT -> SERVER   
   // Client sends mechanism to server.   
   suite.assertEquals('AUTHENTICATE "EXTERNAL" ""\r\n', request.getNextRequest());
   suite.assertEquals(false, request.hasNextRequest());
   
   // SERVER -> CLIENT
   request.addResponse(new SieveResponseParser([0x4f,0x4b,0x0D,0x0A]));
   
   // This works only because of closures and javascript single threaded nature...
   suite.assertEquals(true, hasSucceded);
   suite.assertEquals(null, hasError);   
  });
  
  suite.add( function() {   
        
   suite.log("SASL External - NO");

   // Single theaded javascript magic...
   var hasError = null;
   var hasSucceded = null;
   
   var handler = {};
   handler.onSaslResponse = function() { hasSucceded = true; };
   handler.onError = function() { hasError = true; };
   
   
   var request = new SieveSaslExternalRequest();
   
   request.addSaslListener(handler);
   request.addErrorListener(handler);   
   
   // CLIENT -> SERVER   
   // Client sends mechanism to server.   
   suite.assertEquals('AUTHENTICATE "EXTERNAL" ""\r\n', request.getNextRequest());
   suite.assertEquals(false, request.hasNextRequest());
   
   // SERVER -> CLIENT
   request.addResponse(new SieveResponseParser([0x4e,0x4f,0x0D,0x0A]));
   
   // This works only because of closures and javascript single threaded nature...
   suite.assertEquals(null, hasSucceded);
   suite.assertEquals(true, hasError);
  });  


}(window));
