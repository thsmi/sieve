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
    throw "Could not append script test tools to test suite";
  
  
  suite.expectValidScript
    = function (script, capabilities) {     
    
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
 
  suite.expectInvalidScript
    = function (script, exception, capabilities) {     
    
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
  
}());

