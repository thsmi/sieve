(function (exports) {

  "use strict";

  const tests = new Map();

  // Generic definitions which are shared by multiple profiles...
  tests.set("base", {
    require: [
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
      "./../common/libSieve/extensions/RFC5228/logic/SieveWhiteSpaces.js",
      "./../common/libSieve/extensions/RFC5228/logic/SieveStrings.js",
      "./../common/libSieve/extensions/RFC5228/logic/SieveMatchTypes.js",
      "./../common/libSieve/extensions/RFC5228/logic/SieveComparators.js",
      "./../common/libSieve/extensions/RFC5228/logic/SieveAddressParts.js",
      "./../common/libSieve/extensions/RFC5228/logic/SieveNumbers.js",
      "./../common/libSieve/extensions/RFC5228/logic/SieveBlocks.js",
      "./../common/libSieve/extensions/RFC5228/logic/SieveTests.js",
      "./../common/libSieve/extensions/RFC5228/logic/SieveOperators.js",
      "./../common/libSieve/extensions/RFC5228/logic/SieveConditions.js",
      "./../common/libSieve/extensions/RFC5228/logic/SieveActions.js",
      "./../common/libSieve/extensions/RFC5228/logic/SieveImports.js",
      "./validators/ScriptValidator.js"
    ],
    extend: "base"
  });

  tests.set("sieve-scripts", {
    script: "./../common/libSieve/extensions/RFC5228/tests/SieveRFC5228ScriptTest.js",
    extend: "rfc5228"
  });

  tests.set("sieve-elements", {
    script: "./../common/libSieve/extensions/RFC5228/tests/SieveRFC5228SnippetTest.js",
    extend: "rfc5228"
  });

  tests.set("sieve-atoms", {
    script: "./../common/libSieve/extensions/RFC5228/tests/SieveRFC5228AtomsTest.js",
    extend: "rfc5228"
  });

  // Specialized profiles which contain the tests...

  tests.set("matchTypes", {
    script: "./../common/libSieve/extensions/RFC5228/tests/SieveMatchTypeTest.js",
    extend: "rfc5228"
  });

  tests.set("variables", {
    script: "./../common/libSieve/extensions/variables/tests/SieveVariablesTest.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/variables/logic/SieveVariables.js"
    ]
  });

  tests.set("regex", {
    script: "./../common/libSieve/extensions/regex/tests/SieveRegExTest.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/regex/logic/SieveRegularExpression.js"
    ]
  });

  tests.set("reject", {
    script: "./../common/libSieve/extensions/reject/tests/SieveRejectTest.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/reject/logic/SieveReject.js"
    ]
  });

  tests.set("body", {
    script: "./../common/libSieve/extensions/body/tests/SieveBodyTest.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/body/logic/SieveBody.js"
    ]
  });

  tests.set("vacation", {
    script: "./../common/libSieve/extensions/vacation/tests/SieveVacationTest.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/vacation/logic/SieveVacation.js"
    ]
  });

  tests.set("vacation-seconds", {
    script: "./../common/libSieve/extensions/vacation-seconds/tests/SieveVacationSecondsTest.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/vacation/logic/SieveVacation.js",
      "./../common/libSieve/extensions/vacation-seconds/logic/SieveVacationSeconds.js"
    ]
  });

  tests.set("include", {
    script: "./../common/libSieve/extensions/include/tests/SieveIncludeTest.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/include/logic/SieveInclude.js",
      "./../common/libSieve/extensions/variables/logic/SieveVariables.js",
      "./../common/libSieve/extensions/relational/logic/SieveRelational.js"
    ]
  });

  tests.set("relational", {
    script: "./../common/libSieve/extensions/relational/tests/SieveRelationalTest.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/relational/logic/SieveRelational.js"
    ]
  });

  tests.set("mailbox", {
    script: "./../common/libSieve/extensions/mailbox/tests/SieveMailboxTest.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/mailbox/logic/SieveMailbox.js"
    ]
  });

  tests.set("subaddress", {
    script: "./../common/libSieve/extensions/subaddress/tests/SieveSubaddressTest.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/subaddress/logic/SieveSubaddress.js"
    ]
  });

  tests.set("copy", {
    script: "./../common/libSieve/extensions/copy/tests/SieveCopyTest.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/copy/logic/SieveCopy.js"
    ]
  });

  tests.set("imapflags", {
    script: "./../common/libSieve/extensions/imapflags/tests/SieveImapFlagsTest.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/imapflags/logic/SieveImapFlags.js",
      "./../common/libSieve/extensions/variables/logic/SieveVariables.js",
      "./../common/libSieve/extensions/relational/logic/SieveRelational.js"
    ]
  });

  tests.set("editheader", {
    script: "./../common/libSieve/extensions/editheader/tests/SieveEditheaderTest.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/editheader/logic/SieveEditheader.js"
    ]
  });

  tests.set("date", {
    script: "./../common/libSieve/extensions/date/tests/SieveDateTest.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/variables/logic/SieveVariables.js",
      "./../common/libSieve/extensions/vacation/logic/SieveVacation.js",
      "./../common/libSieve/extensions/relational/logic/SieveRelational.js",
      "./../common/libSieve/extensions/editheader/logic/SieveEditheader.js",
      "./../common/libSieve/extensions/date/logic/SieveDate.js"
    ]
  });

  tests.set("duplicate", {
    script: "./../common/libSieve/extensions/duplicate/tests/SieveDuplicateTest.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/variables/logic/SieveVariables.js",
      "./../common/libSieve/extensions/notify/logic/SieveNotify.js",
      "./../common/libSieve/extensions/mailbox/logic/SieveMailbox.js",
      "./../common/libSieve/extensions/imapflags/logic/SieveImapFlags.js",
      "./../common/libSieve/extensions/duplicate/logic/SieveDuplicate.js"
    ]
  });

  tests.set("spamtest", {
    script: "./../common/libSieve/extensions/spamtest/tests/SpamtestTests.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/spamtest/logic/SieveSpamtest.js",
      "./../common/libSieve/extensions/relational/logic/SieveRelational.js"
    ]
  });

  tests.set("environment", {
    script: "./../common/libSieve/extensions/environment/tests/SieveEnvironmentTest.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/environment/logic/SieveEnvironment.js"
    ]
  });

  tests.set("convert", {
    script: "./../common/libSieve/extensions/convert/tests/SieveConvertTest.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/convert/logic/SieveConvert.js"
    ]
  });

  tests.set("notify", {
    script: "./../common/libSieve/extensions/notify/tests/SieveNotifyTest.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/variables/logic/SieveVariables.js",
      "./../common/libSieve/extensions/notify/logic/SieveNotify.js"
    ]
  });

  tests.set("pipe", {
    script: "./../common/libSieve/extensions/pipe/tests/SievePipeTest.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/copy/logic/SieveCopy.js",
      "./../common/libSieve/extensions/variables/logic/SieveVariables.js",
      "./../common/libSieve/extensions/subaddress/logic/SieveSubaddress.js",
      "./../common/libSieve/extensions/vacation/logic/SieveVacation.js",
      "./../common/libSieve/extensions/pipe/logic/SievePipe.js"
    ]
  });

  tests.set("examples-fastmail", {
    script: "./../common/libSieve/tests/SieveFastMailTest.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/imapflags/logic/SieveImapFlags.js",
      "./../common/libSieve/extensions/relational/logic/SieveRelational.js",
      "./../common/libSieve/extensions/regex/logic/SieveRegularExpression.js"
    ]
  });

  tests.set("examples-dovecot", {
    script: "./../common/libSieve/tests/SieveDovecotTest.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/imapflags/logic/SieveImapFlags.js",
      "./../common/libSieve/extensions/relational/logic/SieveRelational.js",
      "./../common/libSieve/extensions/regex/logic/SieveRegularExpression.js",
      "./../common/libSieve/extensions/include/logic/SieveInclude.js",
      "./../common/libSieve/extensions/spamtest/logic/SieveSpamtest.js",
      "./../common/libSieve/extensions/subaddress/logic/SieveSubaddress.js",
      "./../common/libSieve/extensions/variables/logic/SieveVariables.js",
      "./../common/libSieve/extensions/vacation/logic/SieveVacation.js",
      "./../common/libSieve/extensions/date/logic/SieveDate.js",
      "./../common/libSieve/extensions/mailbox/logic/SieveMailbox.js"
    ]
  });

  tests.set("examples-tty1", {
    script: "./../common/libSieve/tests/SieveTty1Test.js",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/reject/logic/SieveReject.js"
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
