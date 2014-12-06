"use strict";

// Create the namespace...
if (!org)
  var org = {};
  
if (!org.mozdev)
  org.mozdev = {};
  
if (!org.mozdev.sieve)
  org.mozdev.sieve = {};  

if (!org.mozdev.sieve.test)
  org.mozdev.sieve.test = {};  

org.mozdev.sieve.test.tests = [];
  
org.mozdev.sieve.test.log = function(message) {
  $("<li/>")
    .text(message)
    .css("white-space","pre")
    .appendTo("#divOutput");	
}

org.mozdev.sieve.test.logError = function(message) {
  $("<li/>")
    .text(message)
    .css("white-space","pre")
    .css("color","red")
    .appendTo("#divOutput");	
}

org.mozdev.sieve.test.assertEquals = function assertEquals(expected, actual) {
  
  if (expected != actual)
	throw "Test failed expected: \n"+expected+"\n\nBut got\n"+actual;
};

org.mozdev.sieve.test.add = function(test) {
	
  if (!this.tests)
    this.tests = [];
	
  this.tests.push(test);
};


org.mozdev.sieve.test.run = function() {	
  var that = this;
  
  try {
    this.tests.forEach( function(test){  test(that)  });
  }
  catch (e)
  {
    this.logError(e)
    return;
  }	

  this.log("tests passed...");
};

  
(function() {

  var suite  = org.mozdev.sieve.test;
    
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
    suite.log("Parse :is match-type");
  
    var script =
      'if header :is "Sender" "owner-ietf-mta-filters@imc.org" \r\n'
        + '{\r\n'
        + '  keep;\r\n'
        + '}\r\n';
      
    testScript(script); 
  });


  suite.add( function() {
    suite.log("Parse :matches match-type");
 
    var script = 
      'if header :matches "Sender" "owner-ietf-mta-filters@imc.org" \r\n'
        + '{\r\n'
        + '  keep; \r\n'
        + '}\r\n';
      
    testScript(script);
  });


  suite.add( function() {
    suite.log("Parse :contains match-type");
  
    var script = 
      'if header :contains "Sender" "owner-ietf-mta-filters@imc.org" \r\n'
        + '{\r\n'
        + '  keep; \r\n'
        + '}\r\n';
      
    testScript(script);	
  });

  
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

