(function (exports) {

  const tests = new Map();

  // Generic definitions which are shared by multiple profiles...
  tests.set("base", {
    require: [
      // Basic Sieve Elements
      "./../common/libSieve/toolkit/logic/GenericCapabilities.mjs",
      "./../common/libSieve/toolkit/SieveParser.mjs",
      "./../common/libSieve/toolkit/SieveLexer.mjs",
      "./../common/libSieve/toolkit/SieveScriptDOM.mjs",
      "./../common/libSieve/toolkit/logic/AbstractElements.mjs",
      "./../common/libSieve/toolkit/logic/GenericAtoms.mjs",
      "./../common/libSieve/toolkit/logic/GenericElements.mjs"
    ]
  });

  tests.set("rfc5228", {
    require: [
      "./../common/libSieve/extensions/RFC5228/logic/SieveWhiteSpaces.mjs",
      "./../common/libSieve/extensions/RFC5228/logic/SieveStrings.mjs",
      "./../common/libSieve/extensions/RFC5228/logic/SieveMatchTypes.mjs",
      "./../common/libSieve/extensions/RFC5228/logic/SieveComparators.mjs",
      "./../common/libSieve/extensions/RFC5228/logic/SieveAddressParts.mjs",
      "./../common/libSieve/extensions/RFC5228/logic/SieveNumbers.mjs",
      "./../common/libSieve/extensions/RFC5228/logic/SieveBlocks.mjs",
      "./../common/libSieve/extensions/RFC5228/logic/SieveTests.mjs",
      "./../common/libSieve/extensions/RFC5228/logic/SieveOperators.mjs",
      "./../common/libSieve/extensions/RFC5228/logic/SieveConditions.mjs",
      "./../common/libSieve/extensions/RFC5228/logic/SieveActions.mjs",
      "./../common/libSieve/extensions/RFC5228/logic/SieveImports.mjs",
      "./../common/libSieve/tests/ScriptValidator.mjs"
    ],
    extend: "base"
  });

  tests.set("sieve-scripts", {
    script: "./../common/libSieve/extensions/RFC5228/tests/SieveRFC5228ScriptTest.mjs",
    extend: "rfc5228"
  });

  tests.set("sieve-elements", {
    script: "./../common/libSieve/extensions/RFC5228/tests/SieveRFC5228SnippetTest.mjs",
    extend: "rfc5228"
  });

  tests.set("sieve-atoms", {
    script: "./../common/libSieve/extensions/RFC5228/tests/SieveRFC5228AtomsTest.mjs",
    extend: "rfc5228"
  });

  // Specialized profiles which contain the tests...

  tests.set("matchTypes", {
    script: "./../common/libSieve/extensions/RFC5228/tests/SieveMatchTypeTest.mjs",
    extend: "rfc5228"
  });

  tests.set("variables", {
    script: "./../common/libSieve/extensions/variables/tests/SieveVariablesTest.mjs",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/variables/logic/SieveVariables.mjs"
    ]
  });

  tests.set("regex", {
    script: "./../common/libSieve/extensions/regex/tests/SieveRegExTest.mjs",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/regex/logic/SieveRegularExpression.mjs"
    ]
  });

  tests.set("reject", {
    script: "./../common/libSieve/extensions/reject/tests/SieveRejectTest.mjs",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/reject/logic/SieveReject.mjs"
    ]
  });

  tests.set("body", {
    script: "./../common/libSieve/extensions/body/tests/SieveBodyTest.mjs",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/body/logic/SieveBody.mjs"
    ]
  });

  tests.set("vacation", {
    script: "./../common/libSieve/extensions/vacation/tests/SieveVacationTest.mjs",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/vacation/logic/SieveVacation.mjs"
    ]
  });

  tests.set("vacation-seconds", {
    script: "./../common/libSieve/extensions/vacation-seconds/tests/SieveVacationSecondsTest.mjs",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/vacation/logic/SieveVacation.mjs",
      "./../common/libSieve/extensions/vacation-seconds/logic/SieveVacationSeconds.mjs"
    ]
  });

  tests.set("include", {
    script: "./../common/libSieve/extensions/include/tests/SieveIncludeTest.mjs",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/include/logic/SieveInclude.mjs",
      "./../common/libSieve/extensions/variables/logic/SieveVariables.mjs",
      "./../common/libSieve/extensions/relational/logic/SieveRelational.mjs"
    ]
  });

  tests.set("relational", {
    script: "./../common/libSieve/extensions/relational/tests/SieveRelationalTest.mjs",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/relational/logic/SieveRelational.mjs"
    ]
  });

  tests.set("mailbox", {
    script: "./../common/libSieve/extensions/mailbox/tests/SieveMailboxTest.mjs",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/mailbox/logic/SieveMailbox.mjs"
    ]
  });

  tests.set("subaddress", {
    script: "./../common/libSieve/extensions/subaddress/tests/SieveSubaddressTest.mjs",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/subaddress/logic/SieveSubaddress.mjs"
    ]
  });

  tests.set("copy", {
    script: "./../common/libSieve/extensions/copy/tests/SieveCopyTest.mjs",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/copy/logic/SieveCopy.mjs"
    ]
  });

  tests.set("imapflags", {
    script: "./../common/libSieve/extensions/imapflags/tests/SieveImapFlagsTest.mjs",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/imapflags/logic/SieveImapFlags.mjs",
      "./../common/libSieve/extensions/variables/logic/SieveVariables.mjs",
      "./../common/libSieve/extensions/relational/logic/SieveRelational.mjs"
    ]
  });

  tests.set("editheader", {
    script: "./../common/libSieve/extensions/editheader/tests/SieveEditheaderTest.mjs",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/editheader/logic/SieveEditheader.mjs"
    ]
  });

  tests.set("date", {
    script: "./../common/libSieve/extensions/date/tests/SieveDateTest.mjs",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/variables/logic/SieveVariables.mjs",
      "./../common/libSieve/extensions/vacation/logic/SieveVacation.mjs",
      "./../common/libSieve/extensions/relational/logic/SieveRelational.mjs",
      "./../common/libSieve/extensions/editheader/logic/SieveEditheader.mjs",
      "./../common/libSieve/extensions/date/logic/SieveDate.mjs"
    ]
  });

  tests.set("duplicate", {
    script: "./../common/libSieve/extensions/duplicate/tests/SieveDuplicateTest.mjs",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/variables/logic/SieveVariables.mjs",
      "./../common/libSieve/extensions/notify/logic/SieveNotify.mjs",
      "./../common/libSieve/extensions/mailbox/logic/SieveMailbox.mjs",
      "./../common/libSieve/extensions/imapflags/logic/SieveImapFlags.mjs",
      "./../common/libSieve/extensions/duplicate/logic/SieveDuplicate.mjs"
    ]
  });

  tests.set("spamtest", {
    script: "./../common/libSieve/extensions/spamtest/tests/SpamtestTests.mjs",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/spamtest/logic/SieveSpamtest.mjs",
      "./../common/libSieve/extensions/relational/logic/SieveRelational.mjs"
    ]
  });

  tests.set("environment", {
    script: "./../common/libSieve/extensions/environment/tests/SieveEnvironmentTest.mjs",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/environment/logic/SieveEnvironment.mjs"
    ]
  });

  tests.set("convert", {
    script: "./../common/libSieve/extensions/convert/tests/SieveConvertTest.mjs",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/convert/logic/SieveConvert.mjs"
    ]
  });

  tests.set("notify", {
    script: "./../common/libSieve/extensions/notify/tests/SieveNotifyTest.mjs",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/variables/logic/SieveVariables.mjs",
      "./../common/libSieve/extensions/notify/logic/SieveNotify.mjs"
    ]
  });

  tests.set("pipe", {
    script: "./../common/libSieve/extensions/pipe/tests/SievePipeTest.mjs",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/copy/logic/SieveCopy.mjs",
      "./../common/libSieve/extensions/variables/logic/SieveVariables.mjs",
      "./../common/libSieve/extensions/subaddress/logic/SieveSubaddress.mjs",
      "./../common/libSieve/extensions/vacation/logic/SieveVacation.mjs",
      "./../common/libSieve/extensions/pipe/logic/SievePipe.mjs"
    ]
  });

  tests.set("examples-fastmail", {
    script: "./../common/libSieve/tests/SieveFastMailTest.mjs",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/imapflags/logic/SieveImapFlags.mjs",
      "./../common/libSieve/extensions/relational/logic/SieveRelational.mjs",
      "./../common/libSieve/extensions/regex/logic/SieveRegularExpression.mjs"
    ]
  });

  tests.set("examples-dovecot", {
    script: "./../common/libSieve/tests/SieveDovecotTest.mjs",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/imapflags/logic/SieveImapFlags.mjs",
      "./../common/libSieve/extensions/relational/logic/SieveRelational.mjs",
      "./../common/libSieve/extensions/regex/logic/SieveRegularExpression.mjs",
      "./../common/libSieve/extensions/include/logic/SieveInclude.mjs",
      "./../common/libSieve/extensions/spamtest/logic/SieveSpamtest.mjs",
      "./../common/libSieve/extensions/subaddress/logic/SieveSubaddress.mjs",
      "./../common/libSieve/extensions/variables/logic/SieveVariables.mjs",
      "./../common/libSieve/extensions/vacation/logic/SieveVacation.mjs",
      "./../common/libSieve/extensions/date/logic/SieveDate.mjs",
      "./../common/libSieve/extensions/mailbox/logic/SieveMailbox.mjs"
    ]
  });

  tests.set("examples-tty1", {
    script: "./../common/libSieve/tests/SieveTty1Test.mjs",
    extend: "rfc5228",
    require: [
      "./../common/libSieve/extensions/reject/logic/SieveReject.mjs"
    ]
  });

  tests.set("managesieve", {
    script: "./managesieve/ManageSieveTest.mjs",
    agents: ["Firefox"],
    require: [
      "./managesieve/Require.mjs",
      "./../common/libManageSieve/SieveResponseCodes.mjs",
      "./../common/libManageSieve/SieveResponse.mjs",
      "./../common/libManageSieve/SieveRequest.mjs",
      "./../common/libManageSieve/SieveAbstractRequestBuilder.mjs",
      "./../common/libManageSieve/SieveAbstractResponseParser.mjs",
      "./../addon/libs/libManageSieve/SieveMozRequestBuilder.mjs",
      "./../addon/libs//libManageSieve/SieveMozResponseParser.mjs"
    ]
  });

  exports.tests = tests;

})(this);
