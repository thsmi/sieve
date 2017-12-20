
/* global window */

( function () {

  "use strict";

  /* global net */
  var suite = net.tschmid.yautt.test.server;

  if ( !suite )
    throw new Error( "Could not locate the test server" );

  suite.add( {
    // Generic definitions which are shared by multiple profiles...
    "base": {
      require: [
        // JQuery
        "./../../src/sieve@mozdev.org/common/jQuery/jquery-2.1.1.min.js",
        // Basic Sieve Elements
        "./../../src/sieve@mozdev.org/common/libSieve/toolkit/SieveParser.js",
        "./../../src/sieve@mozdev.org/common/libSieve/toolkit/SieveLexer.js",
        "./../../src/sieve@mozdev.org/common/libSieve/toolkit/SieveScriptDOM.js",
        "./../../src/sieve@mozdev.org/common/libSieve/toolkit/logic/Elements.js",
        "./../../src/sieve@mozdev.org/common/libSieve/toolkit/logic/GenericElement.js"
      ]
    }
  });

  suite.add( {
    "rfc5228": {
      require: [
        "./../../src/sieve@mozdev.org/common/libSieve/RFC5228/logic/SieveWhiteSpaces.js",
        "./../../src/sieve@mozdev.org/common/libSieve/RFC5228/logic/SieveStrings.js",
        "./../../src/sieve@mozdev.org/common/libSieve/RFC5228/logic/SieveMatchTypes.js",
        "./../../src/sieve@mozdev.org/common/libSieve/RFC5228/logic/SieveComparators.js",
        "./../../src/sieve@mozdev.org/common/libSieve/RFC5228/logic/SieveAddressParts.js",
        "./../../src/sieve@mozdev.org/common/libSieve/RFC5228/logic/SieveNumbers.js",
        "./../../src/sieve@mozdev.org/common/libSieve/RFC5228/logic/SieveBlocks.js",
        "./../../src/sieve@mozdev.org/common/libSieve/RFC5228/logic/SieveTests.js",
        "./../../src/sieve@mozdev.org/common/libSieve/RFC5228/logic/SieveOperators.js",
        "./../../src/sieve@mozdev.org/common/libSieve/RFC5228/logic/SieveConditions.js",
        "./../../src/sieve@mozdev.org/common/libSieve/RFC5228/logic/SieveActions.js",
        "./../../src/sieve@mozdev.org/common/libSieve/RFC5228/logic/SieveImports.js",
        "./validators/ScriptValidator.js"
      ],
      extend: "base",
    }
  });

  suite.add( {
    "sieve-scripts": {
      script: "./sieve/SieveRFC5228ScriptTest.js",
      extend: "rfc5228"
    }
  });

  suite.add( {
    "sieve-elements": {
      script: "./sieve/SieveRFC5228SnippletTest.js",
      extend: "rfc5228"
    }
  });

  suite.add( {
    // Specialized profiles which contain the tests...
    "matchTypes": {
      script: "./sieve/SieveMatchTypeTest.js",
      extend: "rfc5228"
    }
  });

  suite.add( {
    "variables": {
      script: "./sieve/SieveVariablesTest.js",
      extend: "rfc5228",
      require: [
        "./../../src/sieve@mozdev.org/common/libSieve/variables/logic/SieveVariables.js"
      ]
    }
  });

  suite.add( {
    "regex": {
      script: "./sieve/SieveRegExTest.js",
      extend: "rfc5228",
      require: [
        "./../../src/sieve@mozdev.org/common/libSieve/regex/logic/SieveRegularExpression.js"
      ]
    }
  });

  suite.add( {
    "reject": {
      script: "./sieve/SieveRejectTest.js",
      extend: "rfc5228",
      require: [
        "./../../src/sieve@mozdev.org/common/libSieve/reject/logic/SieveReject.js"
      ]
    }
  });

  suite.add( {
    "body": {
      script: "./sieve/SieveBodyTest.js",
      extend: "rfc5228",
      require: [
        "./../../src/sieve@mozdev.org/common/libSieve/body/logic/SieveBody.js"
      ]
    }
  });

  suite.add( {
    "vacation": {
      script: "./sieve/SieveVacationTest.js",
      extend: "rfc5228",
      require: [
        "./../../src/sieve@mozdev.org/common/libSieve/vacation/logic/SieveVacation.js"
      ]
    }
  });

  suite.add( {
    "include": {
      script: "./sieve/SieveIncludeTest.js",
      extend: "rfc5228",
      require: [
        "./../../src/sieve@mozdev.org/common/libSieve/include/logic/SieveInclude.js"
      ]
    }
  });

  suite.add( {
    "relational": {
      script: "./sieve/SieveRelationalTest.js",
      extend: "rfc5228",
      require: [
        "./../../src/sieve@mozdev.org/common/libSieve/relational/logic/SieveRelational.js"
      ]
    }
  });

  suite.add( {
    "mailbox": {
      script: "./sieve/SieveMailboxTest.js",
      extend: "rfc5228",
      require: [
        "./../../src/sieve@mozdev.org/common/libSieve/mailbox/logic/SieveMailbox.js"
      ]
    }
  });

  suite.add( {
    "subaddress": {
      script: "./sieve/SieveSubaddressTest.js",
      extend: "rfc5228",
      require: [
        "./../../src/sieve@mozdev.org/common/libSieve/subaddress/logic/SieveSubaddress.js"
      ]
    }
  });

  suite.add( {
    "copy": {
      script: "./sieve/SieveCopyTest.js",
      extend: "rfc5228",
      require: [
        "./../../src/sieve@mozdev.org/common/libSieve/copy/logic/SieveCopy.js"
      ]
    }
  });

  suite.add( {
    "imapflags": {
      script: "./sieve/SieveImapFlagsTest.js",
      extend: "rfc5228",
      require: [
        "./../../src/sieve@mozdev.org/common/libSieve/imapflags/logic/SieveImapFlags.js",
        "./../../src/sieve@mozdev.org/common/libSieve/variables/logic/SieveVariables.js"
      ]
    }
  });

  suite.add( {
    "editheader": {
      script: "./sieve/SieveEditheaderTest.js",
      extend: "rfc5228",
      require: [
        "./../../src/sieve@mozdev.org/common/libSieve/editheader/logic/SieveEditheader.js"
      ]
    }
  });

  suite.add( {
    "managesieve": {
      script: "./managesieve/ManageSieveTest.js",
      require: [
        "./../../src/sieve@mozdev.org/common/libManageSieve/SieveRequest.js",
        "./../../src/sieve@mozdev.org/common/libManageSieve/SieveResponse.js",
        "./../../src/sieve@mozdev.org/common/libManageSieve/SieveResponseParser.js",
        "./../../src/sieve@mozdev.org/common/libManageSieve/SieveResponseCodes.js"
      ]
    }
  });

})( window );