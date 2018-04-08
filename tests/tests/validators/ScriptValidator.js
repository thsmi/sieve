/*
 * The contents of this file are licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via
 * email from the author.
 *
 * Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 *
 */

/* global window */


( function ( exports ) {

  "use strict";

	/* global SieveDocument */
	/* global SieveLexer */
  /* global SieveGrammar */

  var suite = exports.net.tschmid.yautt.test;

  if (!suite)
    throw new Error( "Could not append script test tools to test suite" );

  /**
   * Parses the given script and returns a SieveDocument.
   * It honors the server's capabilities.
   *
   * @param{string} script
   *   the script to parse
   * @param{Object.<string, boolean>} [capabilities]
   *   optional parameter which simulates the the server's capabilities
   *
   * @return{SieveDocument}
   *  the parsed sieve document
   */
  function parseScript( script, capabilities ) {

    SieveGrammar.create( capabilities );

    if (capabilities)
      SieveLexer.capabilities(capabilities);

    var doc = new SieveDocument(SieveLexer,null);

    doc.script(script);

    return doc;
  }
  suite.parseScript = parseScript;

  function validateDocument( doc, script, capabilities ) {

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
        suite.assertEquals( true, requires[capability], "Did not find capability '" + capability + "'" );
      }
    }
  }
  suite.validateDocument = validateDocument;

  function expectValidScript( script, capabilities ) {

    suite.logTrace( "Start Parsing Script" );
    var doc = suite.parseScript( script, capabilities );
    suite.logTrace( "End Parsing Script" );

    suite.logTrace( "Start Serializing Script" );
    validateDocument( doc, script, capabilities );
    suite.logTrace( "End Serializing Script" );

    return doc;
  }

  suite.expectValidScript = expectValidScript;


  function expectInvalidScript( script, exception, capabilities ) {

    SieveGrammar.create( capabilities );

    if (capabilities)
      SieveLexer.capabilities(capabilities);

      let doc = new SieveDocument(SieveLexer, null);

    suite.logTrace("Start Parsing Script");
    try {
      doc.script(script);
    }
    catch(e) {
      suite.logTrace("Exception caught");
      suite.assertEquals( exception, e.toString().substr( 0, exception.length ) );

      return;
    }

    throw new Error( "Exception expected" );
  }

  suite.expectInvalidScript = expectInvalidScript;


  function expectValidSnipplet( type, snipplet, capabilities ) {

    SieveGrammar.create( capabilities );

    if ( capabilities )
      SieveLexer.capabilities( capabilities );

    var doc = new SieveDocument( SieveLexer, null );

    // Create element with defaults and convert it to a script sniplet...
    let element = doc.createByName( type );
    let rv1 = element.toScript();

    // ... and should match our expectation.
    suite.assertEquals( snipplet, rv1 );

    // ... then try to parse these script sniplet
    var rv2 = doc.createByName( type, rv1 ).toScript();

    // and ensure both snipplets should be identical...
    suite.assertEquals( rv1, rv2 );

    if ( capabilities ) {
      var requires = {};
      element.require( requires );

      suite.logTrace( rv1 );

      for ( var capability in capabilities ) {
        suite.logTrace( "Testing Capability: " + capability );
        suite.assertEquals( true, requires[capability], "Did not find capability '" + capability + "'" );
      }
    }

    return doc;
  }

  suite.expectValidSnipplet = expectValidSnipplet;

}( window ) );
