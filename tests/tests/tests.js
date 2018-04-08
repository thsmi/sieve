
/* global window */

(function () {

  "use strict";

  /* global net */
  let suite = net.tschmid.yautt.test.server;

  if (!suite)
    throw new Error("Could not locate the test server");

  suite.add({
    // Generic definitions which are shared by multiple profiles...
    "base": {
      require: [
        // JQuery
        "./../common/jQuery/jquery.min.js",
        // Basic Sieve Elements
        "./../common/libSieve/toolkit/SieveParser.js",
        "./../common/libSieve/toolkit/SieveLexer.js",
        "./../common/libSieve/toolkit/SieveScriptDOM.js",
        "./../common/libSieve/toolkit/logic/AbstractElements.js",
        "./../common/libSieve/toolkit/logic/GenericAtoms.js",
        "./../common/libSieve/toolkit/logic/GenericElements.js"
      ]
    }
  });

  suite.add({
    "rfc5228": {
      require: [
        "./../common/libSieve/RFC5228/logic/SieveWhiteSpaces.js",
        "./../common/libSieve/RFC5228/logic/SieveStrings.js",
        "./../common/libSieve/RFC5228/logic/SieveMatchTypes.js",
        "./../common/libSieve/RFC5228/logic/SieveComparators.js",
        "./../common/libSieve/RFC5228/logic/SieveAddressParts.js",
        "./../common/libSieve/RFC5228/logic/SieveNumbers.js",
        "./../common/libSieve/RFC5228/logic/SieveBlocks.js",
        "./../common/libSieve/RFC5228/logic/SieveTests.js",
        "./../common/libSieve/RFC5228/logic/SieveOperators.js",
        "./../common/libSieve/RFC5228/logic/SieveConditions.js",
        "./../common/libSieve/RFC5228/logic/SieveActions.js",
        "./../common/libSieve/RFC5228/logic/SieveImports.js",
        "./validators/ScriptValidator.js"
      ],
      extend: "base"
    }
  });

  suite.add({
    "sieve-scripts": {
      script: "./sieve/SieveRFC5228ScriptTest.js",
      extend: "rfc5228"
    }
  });

  suite.add({
    "sieve-elements": {
      script: "./sieve/SieveRFC5228SnippletTest.js",
      extend: "rfc5228"
    }
  });

  suite.add({
    // Specialized profiles which contain the tests...
    "matchTypes": {
      script: "./sieve/SieveMatchTypeTest.js",
      extend: "rfc5228"
    }
  });

  suite.add({
    "variables": {
      script: "./sieve/SieveVariablesTest.js",
      extend: "rfc5228",
      require: [
        "./../common/libSieve/variables/logic/SieveVariables.js"
      ]
    }
  });

  suite.add({
    "regex": {
      script: "./sieve/SieveRegExTest.js",
      extend: "rfc5228",
      require: [
        "./../common/libSieve/regex/logic/SieveRegularExpression.js"
      ]
    }
  });

  suite.add({
    "reject": {
      script: "./sieve/SieveRejectTest.js",
      extend: "rfc5228",
      require: [
        "./../common/libSieve/reject/logic/SieveReject.js"
      ]
    }
  });

  suite.add({
    "body": {
      script: "./sieve/SieveBodyTest.js",
      extend: "rfc5228",
      require: [
        "./../common/libSieve/body/logic/SieveBody.js"
      ]
    }
  });

  suite.add({
    "vacation": {
      script: "./sieve/SieveVacationTest.js",
      extend: "rfc5228",
      require: [
        "./../common/libSieve/vacation/logic/SieveVacation.js"
      ]
    }
  });

  suite.add({
    "include": {
      script: "./sieve/SieveIncludeTest.js",
      extend: "rfc5228",
      require: [
        "./../common/libSieve/include/logic/SieveInclude.js"
      ]
    }
  });

  suite.add({
    "relational": {
      script: "./sieve/SieveRelationalTest.js",
      extend: "rfc5228",
      require: [
        "./../common/libSieve/relational/logic/SieveRelational.js"
      ]
    }
  });

  suite.add({
    "mailbox": {
      script: "./sieve/SieveMailboxTest.js",
      extend: "rfc5228",
      require: [
        "./../common/libSieve/mailbox/logic/SieveMailbox.js"
      ]
    }
  });

  suite.add({
    "subaddress": {
      script: "./sieve/SieveSubaddressTest.js",
      extend: "rfc5228",
      require: [
        "./../common/libSieve/subaddress/logic/SieveSubaddress.js"
      ]
    }
  });

  suite.add({
    "copy": {
      script: "./sieve/SieveCopyTest.js",
      extend: "rfc5228",
      require: [
        "./../common/libSieve/copy/logic/SieveCopy.js"
      ]
    }
  });

  suite.add({
    "imapflags": {
      script: "./sieve/SieveImapFlagsTest.js",
      extend: "rfc5228",
      require: [
        "./../common/libSieve/imapflags/logic/SieveImapFlags.js",
        "./../common/libSieve/variables/logic/SieveVariables.js"
      ]
    }
  });

  suite.add({
    "editheader": {
      script: "./sieve/SieveEditheaderTest.js",
      extend: "rfc5228",
      require: [
        "./../common/libSieve/editheader/logic/SieveEditheader.js"
      ]
    }
  });

  suite.add({
    "managesieve": {
      script: "./managesieve/ManageSieveTest.js",
      require: [
        "./../common/libManageSieve/SieveRequest.js",
        "./../common/libManageSieve/SieveResponse.js",
        "./../common/libManageSieve/SieveResponseParser.js",
        "./../common/libManageSieve/SieveResponseCodes.js"
      ]
    }
  });

})(window);
