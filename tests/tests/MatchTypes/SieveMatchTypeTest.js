"use strict";
  
(function() {

	/* global net */
	
  var suite  = net.tschmid.yautt.test;
    
  if (!suite)
    throw "Could not initialize test suite";

  suite.add( function() {  	
  	suite.log("Match-type unit tests...");
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

}());

