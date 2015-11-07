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
    suite.log("Sieve Include (RFC6609) unit tests...")
  });    

  function testScript(script, capabilities) {     
    
    if (capabilities)
      SieveLexer.capabilities(capabilities);
    
    
    var doc = new SieveDocument(SieveLexer,null);
    
    suite.logTrace("Start Parsing Script");
    doc.script(script);
    suite.logTrace("End Parsing Script");
    
    suite.logTrace("Start Serializing Script");
    var rv = doc.script();
    suite.logTrace("End Serializing Script");
  
    suite.assertEquals(script, rv);

    if (capabilities) {
      var requires = {};      
      doc.root().require(requires);
      
      suite.logTrace(rv);
      
      for (var capability in capabilities) {
        suite.logTrace("Testing Capability: "+capability);
        suite.assertEquals(true, requires[capability]);
      }
    }
    
    return doc;
  }
 
  function testScriptInvalid(script, exception, capabilities) {     
    
    if (capabilities)
      SieveLexer.capabilities(capabilities);
    
    
    var doc = new SieveDocument(SieveLexer,null);
    
    suite.logTrace("Start Parsing Script");
    try {
      doc.script(script);
    }
    catch(e) {
    	suite.logTrace("Exception caught");
    	suite.assertEquals(exception, e);
    	
    	return;
    }
    
    throw "Exception expected"    
  }

  suite.add( function() {

    suite.log("return test");
   
    var script =
      'require "include";\r\n'
        + 'return;\r\n';    
      
    testScript(script, {"include":true});
  });  
  
  suite.add( function() {

    suite.log("include ambigious location ");
   
    var script =
      'require ["include"];\r\n'
        + '\r\n'
        + 'include :personal :global "always_allow";\r\n';
    
    var exception = "Location can be either personal or global but not both";
      
    testScriptInvalid(script, exception, {"include":true});
  });   

  
  suite.add( function() {

    suite.log("include multiple scripts");
   
    var script =
      'require ["include"];\r\n'
        + '\r\n'
        + 'include :personal "always_allow";\r\n'
        + 'include :global "spam_tests";\r\n'
        + 'include :personal "spam_tests";\r\n'
        + 'include :personal "mailing_lists";\r\n'; 
      
    testScript(script, {"include":true});
  }); 
  
  suite.add( function() {

    suite.log("include test2");
   
    var script =
      'require ["fileinto", "include", "variables", "relational"];\r\n'
        + 'global "test";\r\n'
        + 'global "test_mailbox";\r\n'
        + '\r\n'
        + '#set "test" "$$";\r\n'
        + 'include "subject_tests";\r\n'
        + '\r\n'
        + '#set "test" "Make money";\r\n'
        + 'include "subject_tests";\r\n'
        + '\r\n'
        + '#if string :count "eq" "${test_mailbox}" "1"\r\n'
        + '#{\r\n'
        + '#    fileinto "${test_mailbox}";\r\n'
        + '    stop;\r\n'
        + '#}\r\n' 
      
    testScript(script, {"include":true, "variables":true});
  });   

  suite.add( function() {

    suite.log("multiple globals");
   
    var script =
      'require ["include", "variables"];\r\n'
        + 'global ["test", "test_mailbox"];\r\n'
        + '\r\n'
        + 'if header :contains "Subject" "${test}"\r\n'
        + '{\r\n'
        + '#    set "test_mailbox" "spam-${test}";\r\n'
        + '}\r\n';
      
    testScript(script, {"include":true, "variables":true});
  }); 

  
  suite.add( function() {

    suite.log("single global");
   
    var script =
      'require ["variables", "include", "vacation"];\r\n'
        + 'global "i_am_on_vacation";\r\n'
        + '\r\n'
        + '#set "global.i_am_on_vacation" "1";\r\n'
        + '\r\n'
        + '#if string :is "${i_am_on_vacation}" "1"\r\n'
        + '#{\r\n'
        + ' #   vacation "It\'s true, I am on vacation.";\r\n'
        + '#}\r\n';
      
    testScript(script, {"include":true, "variables":true});
  });   
  

  
}());

