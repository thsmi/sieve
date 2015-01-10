"use strict";
 
(function() {

  var suite  = net.tschmid.yautt.test;
    
  if (!suite)
    throw "Could not initialize test suite";

  suite.add( function() {  	
  	suite.log("Match-type unit tests...")
  });    

  function testScript(script) {     
    var doc = new SieveDocument(SieveLexer,null);
    
    doc.script(script);
  
    var rv = doc.script();
  
    suite.assertEquals(script, rv);
  
    return doc;
  }

  
  suite.add( function() {	
   suite.log("Parse :regex match-type with single import");
	
   SieveLexer.capabilities({"regex":true});
 
    var script =
      'require "regex";\r\n'
        + 'if header :regex "Sender" "owner-ietf-mta-filters@imc.org" \r\n'
        + '{\r\n'
        + '  keep; \r\n'
        + '}\r\n';
      
    var doc = testScript(script);
  
    // Test if import requirement for regex was added..
    var requires = {};
  
    doc.root().require(requires); 
  
    suite.assertEquals(true, requires['regex']);
  });

  suite.add( function() {

    suite.log("Parse :regex match-type with multiple import");
  
    SieveLexer.capabilities({"regex":true, "fileinto":true});
  
    var script =
      'require ["regex", "fileinto"];\r\n'
        +'if address :comparator "i;ascii-casemap" :regex ["to", "cc"] "j(i|la).*@mydomain.com"\r\n'
        + '{\r\n'
        + '  fileinto "INBOX";\r\n'
        + '  stop;\r\n'
        + '}\r\n';      
      
    var doc = testScript(script);
  
    // Test if import requirement for regex was added correctly ..
    var requires = {};
  
    doc.root().require(requires); 
  
    suite.assertEquals(true, requires['regex']);
    suite.assertEquals(true, requires['fileinto']);
  });


}());

