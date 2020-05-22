(function (exports) {

  "use strict";

  const tests = new Map();

  // Generic definitions which are shared by multiple profiles...
  tests.set("base", {
    require: [
      // JQuery
      //"./../common/jquery/jquery.min.js",
      // Basic Sieve Elements
      "./../common/libSieve/toolkit/logic/GenericCapabilities.js",
      "./../common/libSieve/toolkit/SieveParser.js",
      "./../common/libSieve/toolkit/SieveLexer.js",
      "./../common/libSieve/toolkit/SieveScriptDOM.js",
      "./../common/libSieve/toolkit/logic/AbstractElements.js",
      "./../common/libSieve/toolkit/logic/GenericAtoms.js",
      "./../common/libSieve/toolkit/logic/GenericElements.js"
    ]
  });

  tests.set("rfc5228", {
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
  });

  tests.set("sieve-scripts", {
    script: "./../common/libSieve/RFC5228/tests/SieveRFC5228ScriptTest.js",
    extend: "rfc5228"
  });

  tests.set("sieve-elements", {
    script: "./../common/libSieve/RFC5228/tests/SieveRFC5228SnippetTest.js",
    extend: "rfc5228"
  }
  );

  // Specialized profiles which contain the tests...

  tests.set("matchTypes", {
    script: "./../common/libSieve/RFC5228/tests/SieveMatchTypeTest.js",
    extend: "rfc5228"
  }
  );

  tests.set("variables", {
    script: "./../common/libSieve/variables/tests/SieveVariablesTest.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/variables/logic/SieveVariables.js"
    ]
  });

  tests.set("regex", {
    script: "./../common/libSieve/regex/tests/SieveRegExTest.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/regex/logic/SieveRegularExpression.js"
    ]
  });

  tests.set("reject", {
    script: "./../common/libSieve/reject/tests/SieveRejectTest.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/reject/logic/SieveReject.js"
    ]
  });

  tests.set("body", {
    script: "./../common/libSieve/body/tests/SieveBodyTest.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/body/logic/SieveBody.js"
    ]
  });

  tests.set("vacation", {
    script: "./../common/libSieve/vacation/tests/SieveVacationTest.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/vacation/logic/SieveVacation.js"
    ]
  });

  tests.set("vacation-seconds", {
    script: "./../common/libSieve/vacation-seconds/tests/SieveVacationSecondsTest.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/vacation/logic/SieveVacation.js",
      "./../common/libSieve/vacation-seconds/logic/SieveVacationSeconds.js"
    ]
  });

  tests.set("include", {
    script: "./../common/libSieve/include/tests/SieveIncludeTest.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/include/logic/SieveInclude.js"
    ]
  });

  tests.set("relational", {
    script: "./../common/libSieve/relational/tests/SieveRelationalTest.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/relational/logic/SieveRelational.js"
    ]
  });

  tests.set("mailbox", {
    script: "./../common/libSieve/mailbox/tests/SieveMailboxTest.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/mailbox/logic/SieveMailbox.js"
    ]
  });

  tests.set("subaddress", {
    script: "./../common/libSieve/subaddress/tests/SieveSubaddressTest.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/subaddress/logic/SieveSubaddress.js"
    ]
  });

  tests.set("copy", {
    script: "./../common/libSieve/copy/tests/SieveCopyTest.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/copy/logic/SieveCopy.js"
    ]
  });

  tests.set("imapflags", {
    script: "./../common/libSieve/imapflags/tests/SieveImapFlagsTest.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/imapflags/logic/SieveImapFlags.js",
      "./../common/libSieve/variables/logic/SieveVariables.js"
    ]
  });

  tests.set("editheader", {
    script: "./../common/libSieve/editheader/tests/SieveEditheaderTest.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/editheader/logic/SieveEditheader.js"
    ]
  });

  tests.set("date", {
    script: "./../common/libSieve/date/tests/SieveDateTest.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/variables/logic/SieveVariables.js",
      "./../common/libSieve/vacation/logic/SieveVacation.js",
      "./../common/libSieve/relational/logic/SieveRelational.js",
      "./../common/libSieve/editheader/logic/SieveEditheader.js",
      "./../common/libSieve/date/logic/SieveDate.js"
    ]
  });

  tests.set("duplicate", {
    script: "./../common/libSieve/duplicate/tests/SieveDuplicateTest.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/variables/logic/SieveVariables.js",
      "./../common/libSieve/notify/logic/SieveNotify.js",
      "./../common/libSieve/mailbox/logic/SieveMailbox.js",
      "./../common/libSieve/imapflags/logic/SieveImapFlags.js",
      "./../common/libSieve/duplicate/logic/SieveDuplicate.js"
    ]
  });

  tests.set("spamtest", {
    script: "./../common/libSieve/spamtest/tests/SpamtestTests.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/spamtest/logic/SieveSpamtest.js",
      "./../common/libSieve/relational/logic/SieveRelational.js"
    ]
  });

  tests.set("environment", {
    script: "./../common/libSieve/environment/tests/SieveEnvironmentTest.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/environment/logic/SieveEnvironment.js"
    ]
  });

  tests.set("convert", {
    script: "./../common/libSieve/convert/tests/SieveConvertTest.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/convert/logic/SieveConvert.js"
    ]
  });

  tests.set("notify", {
    script: "./../common/libSieve/notify/tests/SieveNotifyTest.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/variables/logic/SieveVariables.js",
      "./../common/libSieve/notify/logic/SieveNotify.js"
    ]
  });

  tests.set("examples-fastmail", {
    script: "./sieve/SieveFastMailTest.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/imapflags/logic/SieveImapFlags.js",
      "./../common/libSieve/relational/logic/SieveRelational.js",
      "./../common/libSieve/regex/logic/SieveRegularExpression.js"
    ]
  });

  tests.set("examples-dovecot", {
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
  });

  tests.set("examples-tty1", {
    script: "./sieve/SieveTty1Test.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/reject/logic/SieveReject.js"
    ]
  });

  tests.set("managesieve", {
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
  });

  exports.tests = tests;

})(this);
