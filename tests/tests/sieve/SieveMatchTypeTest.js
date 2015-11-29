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

	/* global net */
	
  var suite  = net.tschmid.yautt.test;
    
  if (!suite)
    throw "Could not initialize test suite";

  suite.add( function() {  	
  	suite.log("Match-type unit tests...");
  });

  suite.add( function() {
    suite.log("Parse :is match-type");
  
    var script =
      'if header :is "Sender" "owner-ietf-mta-filters@imc.org" \r\n'
        + '{\r\n'
        + '  keep;\r\n'
        + '}\r\n';
      
    suite.expectValidScript(script); 
  });


  suite.add( function() {
    suite.log("Parse :matches match-type");
 
    var script = 
      'if header :matches "Sender" "owner-ietf-mta-filters@imc.org" \r\n'
        + '{\r\n'
        + '  keep; \r\n'
        + '}\r\n';
      
    suite.expectValidScript(script);
  });


  suite.add( function() {
    suite.log("Parse :contains match-type");
  
    var script = 
      'if header :contains "Sender" "owner-ietf-mta-filters@imc.org" \r\n'
        + '{\r\n'
        + '  keep; \r\n'
        + '}\r\n';
      
    suite.expectValidScript(script);	
  });

}());

