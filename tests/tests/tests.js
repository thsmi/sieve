
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
        "./../common/libSieve/toolkit/logic/GenericCapabilities.js",
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
      script: "./../common/libSieve/RFC5228/tests/SieveRFC5228ScriptTest.js",
      extend: "rfc5228"
    }
  });

  suite.add({
    "sieve-elements": {
      script: "./../common/libSieve/RFC5228/tests/SieveRFC5228SnippletTest.js",
      extend: "rfc5228"
    }
  });

  suite.add({
    // Specialized profiles which contain the tests...
    "matchTypes": {
      script: "./../common/libSieve/RFC5228/tests/SieveMatchTypeTest.js",
      extend: "rfc5228"
    }
  });

  suite.add({
    "variables": {
      script: "./../common/libSieve/variables/tests/SieveVariablesTest.js",
      extend: "rfc5228",
      require: [
        "./../common/libSieve/variables/logic/SieveVariables.js"
      ]
    }
  });

  suite.add({
    "regex": {
      script: "./../common/libSieve/regex/tests/SieveRegExTest.js",
      extend: "rfc5228",
      require: [
        "./../common/libSieve/regex/logic/SieveRegularExpression.js"
      ]
    }
  });

  suite.add({
    "reject": {
      script: "./../common/libSieve/reject/tests/SieveRejectTest.js",
      extend: "rfc5228",
      require: [
        "./../common/libSieve/reject/logic/SieveReject.js"
      ]
    }
  });

  suite.add({
    "body": {
      script: "./../common/libSieve/body/tests/SieveBodyTest.js",
      extend: "rfc5228",
      require: [
        "./../common/libSieve/body/logic/SieveBody.js"
      ]
    }
  });

  suite.add({
    "vacation": {
      script: "./../common/libSieve/vacation/tests/SieveVacationTest.js",
      extend: "rfc5228",
      require: [
        "./../common/libSieve/vacation/logic/SieveVacation.js"
      ]
    }
  });

  suite.add({
    "vacation-seconds": {
      script: "./../common/libSieve/vacation-seconds/tests/SieveVacationSecondsTest.js",
      extend: "rfc5228",
      require: [
        "./../common/libSieve/vacation/logic/SieveVacation.js",
        "./../common/libSieve/vacation-seconds/logic/SieveVacationSeconds.js"
      ]
    }
  });

  suite.add({
    "include": {
      script: "./../common/libSieve/include/tests/SieveIncludeTest.js",
      extend: "rfc5228",
      require: [
        "./../common/libSieve/include/logic/SieveInclude.js"
      ]
    }
  });

  suite.add({
    "relational": {
      script: "./../common/libSieve/relational/tests/SieveRelationalTest.js",
      extend: "rfc5228",
      require: [
        "./../common/libSieve/relational/logic/SieveRelational.js"
      ]
    }
  });

  suite.add({
    "mailbox": {
      script: "./../common/libSieve/mailbox/tests/SieveMailboxTest.js",
      extend: "rfc5228",
      require: [
        "./../common/libSieve/mailbox/logic/SieveMailbox.js"
      ]
    }
  });

  suite.add({
    "subaddress": {
      script: "./../common/libSieve/subaddress/tests/SieveSubaddressTest.js",
      extend: "rfc5228",
      require: [
        "./../common/libSieve/subaddress/logic/SieveSubaddress.js"
      ]
    }
  });

  suite.add({
    "copy": {
      script: "./../common/libSieve/copy/tests/SieveCopyTest.js",
      extend: "rfc5228",
      require: [
        "./../common/libSieve/copy/logic/SieveCopy.js"
      ]
    }
  });

  suite.add({
    "imapflags": {
      script: "./../common/libSieve/imapflags/tests/SieveImapFlagsTest.js",
      extend: "rfc5228",
      require: [
        "./../common/libSieve/imapflags/logic/SieveImapFlags.js",
        "./../common/libSieve/variables/logic/SieveVariables.js"
      ]
    }
  });

  suite.add({
    "editheader": {
      script: "./../common/libSieve/editheader/tests/SieveEditheaderTest.js",
      extend: "rfc5228",
      require: [
        "./../common/libSieve/editheader/logic/SieveEditheader.js"
      ]
    }
  });

  suite.add({
    "date": {
      script: "./../common/libSieve/date/tests/SieveDateTest.js",
      extend: "rfc5228",
      require: [
        "./../common/libSieve/variables/logic/SieveVariables.js",
        "./../common/libSieve/vacation/logic/SieveVacation.js",
        "./../common/libSieve/relational/logic/SieveRelational.js",
        "./../common/libSieve/editheader/logic/SieveEditheader.js",
        "./../common/libSieve/date/logic/SieveDate.js"
      ]
    }
  });

  suite.add({
    "duplicate": {
      script: "./../common/libSieve/duplicate/tests/SieveDuplicateTest.js",
      extend: "rfc5228",
      require: [
        "./../common/libSieve/variables/logic/SieveVariables.js",
        "./../common/libSieve/notify/logic/SieveNotify.js",
        "./../common/libSieve/mailbox/logic/SieveMailbox.js",
        "./../common/libSieve/imapflags/logic/SieveImapFlags.js",
        "./../common/libSieve/duplicate/logic/SieveDuplicate.js"
      ]
    }
  });

  suite.add({
    "spamtest": {
      script : "./../common/libSieve/spamtest/tests/SpamtestTests.js",
      extend: "rfc5228",
      require: [
        "./../common/libSieve/spamtest/logic/SieveSpamtest.js",
        "./../common/libSieve/relational/logic/SieveRelational.js"
      ]
    }
  });

  suite.add({
    "environment": {
      script: "./../common/libSieve/environment/tests/SieveEnvironmentTest.js",
      extend: "rfc5228",
      require: [
        "./../common/libSieve/environment/logic/SieveEnvironment.js"
      ]
    }
  });

  suite.add({
    "convert" : {
      script: "./../common/libSieve/convert/tests/SieveConvertTest.js",
      extend: "rfc5228",
      require: [
        "./../common/libSieve/convert/logic/SieveConvert.js"
      ]
    }
  });

  suite.add({
    "notify" : {
      script: "./../common/libSieve/notify/tests/SieveNotifyTest.js",
      extend: "rfc5228",
      require: [
        "./../common/libSieve/variables/logic/SieveVariables.js",
        "./../common/libSieve/notify/logic/SieveNotify.js"
      ]
    }
  });

  suite.add({
    "examples-fastmail": {
      script: "./sieve/SieveFastMailTest.js",
      extend: "rfc5228",
      require: [
        "./../common/libSieve/imapflags/logic/SieveImapFlags.js",
        "./../common/libSieve/relational/logic/SieveRelational.js",
        "./../common/libSieve/regex/logic/SieveRegularExpression.js"
      ]
    }
  });

  suite.add({
    "examples-dovecot": {
      script: "./sieve/SieveDovecotTest.js",
      extend: "rfc5228",
      require: [
        "./../common/libSieve/imapflags/logic/SieveImapFlags.js",
        "./../common/libSieve/relational/logic/SieveRelational.js",
        "./../common/libSieve/regex/logic/SieveRegularExpression.js",
        "./../common/libSieve/include/logic/SieveInclude.js",
        "./../common/libSieve/spamtest/logic/SieveSpamtest.js",
        "./../common/libSieve/subaddress/logic/SieveSubaddress.js",
        "./../common/libSieve/variables/logic/SieveVariables.js",
        "./../common/libSieve/vacation/logic/SieveVacation.js",
        "./../common/libSieve/date/logic/SieveDate.js",
        "./../common/libSieve/mailbox/logic/SieveMailbox.js"
      ]
    }
  });

  suite.add({
    "examples-tty1": {
      script: "./sieve/SieveTty1Test.js",
      extend: "rfc5228",
      require: [
        "./../common/libSieve/reject/logic/SieveReject.js"
      ]
    }
  });

  suite.add({
    "managesieve": {
      script: "./managesieve/ManageSieveTest.js",
      agents: ["Firefox"],
      require: [
        "./managesieve/Require.js",
        "./../common/libManageSieve/SieveResponseCodes.js",
        "./../common/libManageSieve/SieveResponse.js",
        "./../common/libManageSieve/SieveRequest.js",
        "./../common/libManageSieve/SieveAbstractRequestBuilder.js",
        "./../common/libManageSieve/SieveAbstractResponseParser.js",
        "./../addon/libs/libManageSieve/SieveMozRequestBuilder.js",
        "./../addon/libs//libManageSieve/SieveMozResponseParser.js"
      ]
    }
  });

})(window);
