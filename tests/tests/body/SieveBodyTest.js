 /*
 * The contents of this file are licenced. You may obtain a copy of 
 * the license at https://github.com/thsmi/sieve/ or request it via 
 * email from the author.
 *
 * Do not remove or change this comment.
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 *      
 */

"use strict";
 
(function() {

  var suite  = net.tschmid.yautt.test;
    
  if (!suite)
    throw "Could not initialize test suite";

  suite.add( function() {  	
  	suite.log("Body Unit Tests...")
  });    
  
  function testScript(script) {     
    var doc = new SieveDocument(SieveLexer,null);
    
    doc.script(script);
  
    var rv = doc.script();
  
    suite.assertEquals(script, rv);
  
    return doc;
  }
  
  suite.add( function() {

    suite.log("Parse body transform :raw");
  
    SieveLexer.capabilities({"body":true});
  
    var script =
      'require "body";\r\n'
        + '\r\n'
        + '# This will match a message containing the literal text\r\n'
        + '# "MAKE MONEY FAST" in body parts (ignoring any\r\n'
        + '# content-transfer-encodings) or MIME headers other than\r\n'
        + '# the outermost RFC 2822 header.\r\n'
        + '\r\n'
        + 'if body :raw :contains "MAKE MONEY FAST" {\r\n'
        + '        discard;\r\n'
        + '}\r\n'
      
    var doc = testScript(script);
  
    // Test if import requirement for regex was added correctly ..
    var requires = {};
  
    doc.root().require(requires); 
  
    suite.assertEquals(true, requires['body']);
  });    
  
  suite.add( function() {

    suite.log("Parse body transform :content");
  
    SieveLexer.capabilities({"body":true, "fileinto":true});
  
    var script =
      'require ["body", "fileinto"];\r\n'
        + '\r\n'
        + '# Save any message with any text MIME part that contains the\r\n'
        + '# words "missile" or "coordinates" in the "secrets" folder.\r\n'
        +' if body :content "text" :contains ["missile", "coordinates"] {\r\n'
        + '  fileinto "secrets";\r\n'
        + '}\r\n'
        + '\r\n'
        + '# Save any message with an audio/mp3 MIME part in\r\n'
        + '# the "jukebox" folder.\r\n'
        + 'if body :content "audio/mp3" :contains "" {\r\n'
        + '  fileinto "jukebox";\r\n'
        + '}\r\n';        
      
    var doc = testScript(script);
  
    // Test if import requirement for regex was added correctly ..
    var requires = {};
  
    doc.root().require(requires); 
  
    suite.assertEquals(true, requires['body']);
    suite.assertEquals(true, requires['fileinto']);
  });  
  

  suite.add( function() {

    suite.log("Parse body transform :text");
  
    SieveLexer.capabilities({"body":true, "fileinto":true});
  
    var script =
      'require ["body", "fileinto"];\r\n'
        + '\r\n'
        + '# Save messages mentioning the project schedule in the\r\n'
        + '# project/schedule folder.\r\n'
        +' if body :text :contains "project schedule" {\r\n'
        + '  fileinto "project/schedule";'
        + '}\r\n';      
      
    var doc = testScript(script);
  
    // Test if import requirement for regex was added correctly ..
    var requires = {};
  
    doc.root().require(requires); 
  
    suite.assertEquals(true, requires['body']);
    suite.assertEquals(true, requires['fileinto']);
  });


}());

