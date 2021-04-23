(function (exports) {

  const tests = new Map();

  // Generic definitions which are shared by multiple profiles...
  tests.set("base", {
    require: [
      // Basic Sieve Elements
      "${workspace}/libSieve/toolkit/logic/GenericCapabilities.mjs",
      "${workspace}/libSieve/toolkit/SieveParser.mjs",
      "${workspace}/libSieve/toolkit/SieveLexer.mjs",
      "${workspace}/libSieve/toolkit/SieveScriptDOM.mjs",
      "${workspace}/libSieve/toolkit/logic/AbstractElements.mjs",
      "${workspace}/libSieve/toolkit/logic/GenericAtoms.mjs",
      "${workspace}/libSieve/toolkit/logic/GenericElements.mjs"
    ]
  });

  tests.set("rfc5228", {
    require: [
      "${workspace}/libSieve/extensions/RFC5228/logic/SieveWhiteSpaces.mjs",
      "${workspace}/libSieve/extensions/RFC5228/logic/SieveStrings.mjs",
      "${workspace}/libSieve/extensions/RFC5228/logic/SieveMatchTypes.mjs",
      "${workspace}/libSieve/extensions/RFC5228/logic/SieveComparators.mjs",
      "${workspace}/libSieve/extensions/RFC5228/logic/SieveAddressParts.mjs",
      "${workspace}/libSieve/extensions/RFC5228/logic/SieveNumbers.mjs",
      "${workspace}/libSieve/extensions/RFC5228/logic/SieveBlocks.mjs",
      "${workspace}/libSieve/extensions/RFC5228/logic/SieveTests.mjs",
      "${workspace}/libSieve/extensions/RFC5228/logic/SieveOperators.mjs",
      "${workspace}/libSieve/extensions/RFC5228/logic/SieveConditions.mjs",
      "${workspace}/libSieve/extensions/RFC5228/logic/SieveActions.mjs",
      "${workspace}/libSieve/extensions/RFC5228/logic/SieveImports.mjs",
      "${workspace}/libSieve/tests/ScriptValidator.mjs"
    ],
    extend: "base"
  });

  tests.set("sieve-scripts", {
    script: "${workspace}/libSieve/extensions/RFC5228/tests/SieveRFC5228ScriptTest.mjs",
    extend: "rfc5228"
  });

  tests.set("sieve-elements", {
    script: "${workspace}/libSieve/extensions/RFC5228/tests/SieveRFC5228SnippetTest.mjs",
    extend: "rfc5228"
  });

  tests.set("sieve-atoms", {
    script: "${workspace}/libSieve/extensions/RFC5228/tests/SieveRFC5228AtomsTest.mjs",
    extend: "rfc5228"
  });

  // Specialized profiles which contain the tests...

  tests.set("matchTypes", {
    script: "${workspace}/libSieve/extensions/RFC5228/tests/SieveMatchTypeTest.mjs",
    extend: "rfc5228"
  });

  tests.set("variables", {
    script: "${workspace}/libSieve/extensions/variables/tests/SieveVariablesTest.mjs",
    extend: "rfc5228",
    require: [
      "${workspace}/libSieve/extensions/variables/logic/SieveVariables.mjs"
    ]
  });

  tests.set("regex", {
    script: "${workspace}/libSieve/extensions/regex/tests/SieveRegExTest.mjs",
    extend: "rfc5228",
    require: [
      "${workspace}/libSieve/extensions/regex/logic/SieveRegularExpression.mjs"
    ]
  });

  tests.set("reject", {
    script: "${workspace}/libSieve/extensions/reject/tests/SieveRejectTest.mjs",
    extend: "rfc5228",
    require: [
      "${workspace}/libSieve/extensions/reject/logic/SieveReject.mjs"
    ]
  });

  tests.set("body", {
    script: "${workspace}/libSieve/extensions/body/tests/SieveBodyTest.mjs",
    extend: "rfc5228",
    require: [
      "${workspace}/libSieve/extensions/body/logic/SieveBody.mjs"
    ]
  });

  tests.set("vacation", {
    script: "${workspace}/libSieve/extensions/vacation/tests/SieveVacationTest.mjs",
    extend: "rfc5228",
    require: [
      "${workspace}/libSieve/extensions/vacation/logic/SieveVacation.mjs"
    ]
  });

  tests.set("vacation-seconds", {
    script: "${workspace}/libSieve/extensions/vacation-seconds/tests/SieveVacationSecondsTest.mjs",
    extend: "rfc5228",
    require: [
      "${workspace}/libSieve/extensions/vacation/logic/SieveVacation.mjs",
      "${workspace}/libSieve/extensions/vacation-seconds/logic/SieveVacationSeconds.mjs"
    ]
  });

  tests.set("include", {
    script: "${workspace}/libSieve/extensions/include/tests/SieveIncludeTest.mjs",
    extend: "rfc5228",
    require: [
      "${workspace}/libSieve/extensions/include/logic/SieveInclude.mjs",
      "${workspace}/libSieve/extensions/variables/logic/SieveVariables.mjs",
      "${workspace}/libSieve/extensions/relational/logic/SieveRelational.mjs"
    ]
  });

  tests.set("relational", {
    script: "${workspace}/libSieve/extensions/relational/tests/SieveRelationalTest.mjs",
    extend: "rfc5228",
    require: [
      "${workspace}/libSieve/extensions/relational/logic/SieveRelational.mjs"
    ]
  });

  tests.set("mailbox", {
    script: "${workspace}/libSieve/extensions/mailbox/tests/SieveMailboxTest.mjs",
    extend: "rfc5228",
    require: [
      "${workspace}/libSieve/extensions/mailbox/logic/SieveMailbox.mjs"
    ]
  });

  tests.set("subaddress", {
    script: "${workspace}/libSieve/extensions/subaddress/tests/SieveSubaddressTest.mjs",
    extend: "rfc5228",
    require: [
      "${workspace}/libSieve/extensions/subaddress/logic/SieveSubaddress.mjs"
    ]
  });

  tests.set("copy", {
    script: "${workspace}/libSieve/extensions/copy/tests/SieveCopyTest.mjs",
    extend: "rfc5228",
    require: [
      "${workspace}/libSieve/extensions/copy/logic/SieveCopy.mjs"
    ]
  });

  tests.set("imapflags", {
    script: "${workspace}/libSieve/extensions/imapflags/tests/SieveImapFlagsTest.mjs",
    extend: "rfc5228",
    require: [
      "${workspace}/libSieve/extensions/imapflags/logic/SieveImapFlags.mjs",
      "${workspace}/libSieve/extensions/variables/logic/SieveVariables.mjs",
      "${workspace}/libSieve/extensions/relational/logic/SieveRelational.mjs"
    ]
  });

  tests.set("editheader", {
    script: "${workspace}/libSieve/extensions/editheader/tests/SieveEditheaderTest.mjs",
    extend: "rfc5228",
    require: [
      "${workspace}/libSieve/extensions/editheader/logic/SieveEditheader.mjs"
    ]
  });

  tests.set("date", {
    script: "${workspace}/libSieve/extensions/date/tests/SieveDateTest.mjs",
    extend: "rfc5228",
    require: [
      "${workspace}/libSieve/extensions/variables/logic/SieveVariables.mjs",
      "${workspace}/libSieve/extensions/vacation/logic/SieveVacation.mjs",
      "${workspace}/libSieve/extensions/relational/logic/SieveRelational.mjs",
      "${workspace}/libSieve/extensions/editheader/logic/SieveEditheader.mjs",
      "${workspace}/libSieve/extensions/date/logic/SieveDate.mjs"
    ]
  });

  tests.set("duplicate", {
    script: "${workspace}/libSieve/extensions/duplicate/tests/SieveDuplicateTest.mjs",
    extend: "rfc5228",
    require: [
      "${workspace}/libSieve/extensions/variables/logic/SieveVariables.mjs",
      "${workspace}/libSieve/extensions/notify/logic/SieveNotify.mjs",
      "${workspace}/libSieve/extensions/mailbox/logic/SieveMailbox.mjs",
      "${workspace}/libSieve/extensions/imapflags/logic/SieveImapFlags.mjs",
      "${workspace}/libSieve/extensions/duplicate/logic/SieveDuplicate.mjs"
    ]
  });

  tests.set("spamtest", {
    script: "${workspace}/libSieve/extensions/spamtest/tests/SpamtestTests.mjs",
    extend: "rfc5228",
    require: [
      "${workspace}/libSieve/extensions/spamtest/logic/SieveSpamtest.mjs",
      "${workspace}/libSieve/extensions/relational/logic/SieveRelational.mjs"
    ]
  });

  tests.set("environment", {
    script: "${workspace}/libSieve/extensions/environment/tests/SieveEnvironmentTest.mjs",
    extend: "rfc5228",
    require: [
      "${workspace}/libSieve/extensions/environment/logic/SieveEnvironment.mjs"
    ]
  });

  tests.set("convert", {
    script: "${workspace}/libSieve/extensions/convert/tests/SieveConvertTest.mjs",
    extend: "rfc5228",
    require: [
      "${workspace}/libSieve/extensions/convert/logic/SieveConvert.mjs"
    ]
  });

  tests.set("notify", {
    script: "${workspace}/libSieve/extensions/notify/tests/SieveNotifyTest.mjs",
    extend: "rfc5228",
    require: [
      "${workspace}/libSieve/extensions/variables/logic/SieveVariables.mjs",
      "${workspace}/libSieve/extensions/notify/logic/SieveNotify.mjs"
    ]
  });

  tests.set("pipe", {
    script: "${workspace}/libSieve/extensions/pipe/tests/SievePipeTest.mjs",
    extend: "rfc5228",
    require: [
      "${workspace}/libSieve/extensions/copy/logic/SieveCopy.mjs",
      "${workspace}/libSieve/extensions/variables/logic/SieveVariables.mjs",
      "${workspace}/libSieve/extensions/subaddress/logic/SieveSubaddress.mjs",
      "${workspace}/libSieve/extensions/vacation/logic/SieveVacation.mjs",
      "${workspace}/libSieve/extensions/pipe/logic/SievePipe.mjs"
    ]
  });

  tests.set("examples-fastmail", {
    script: "${workspace}/libSieve/tests/SieveFastMailTest.mjs",
    extend: "rfc5228",
    require: [
      "${workspace}/libSieve/extensions/imapflags/logic/SieveImapFlags.mjs",
      "${workspace}/libSieve/extensions/relational/logic/SieveRelational.mjs",
      "${workspace}/libSieve/extensions/regex/logic/SieveRegularExpression.mjs"
    ]
  });

  tests.set("examples-dovecot", {
    script: "${workspace}/libSieve/tests/SieveDovecotTest.mjs",
    extend: "rfc5228",
    require: [
      "${workspace}/libSieve/extensions/imapflags/logic/SieveImapFlags.mjs",
      "${workspace}/libSieve/extensions/relational/logic/SieveRelational.mjs",
      "${workspace}/libSieve/extensions/regex/logic/SieveRegularExpression.mjs",
      "${workspace}/libSieve/extensions/include/logic/SieveInclude.mjs",
      "${workspace}/libSieve/extensions/spamtest/logic/SieveSpamtest.mjs",
      "${workspace}/libSieve/extensions/subaddress/logic/SieveSubaddress.mjs",
      "${workspace}/libSieve/extensions/variables/logic/SieveVariables.mjs",
      "${workspace}/libSieve/extensions/vacation/logic/SieveVacation.mjs",
      "${workspace}/libSieve/extensions/date/logic/SieveDate.mjs",
      "${workspace}/libSieve/extensions/mailbox/logic/SieveMailbox.mjs"
    ]
  });

  tests.set("examples-tty1", {
    script: "${workspace}/libSieve/tests/SieveTty1Test.mjs",
    extend: "rfc5228",
    require: [
      "${workspace}/libSieve/extensions/reject/logic/SieveReject.mjs"
    ]
  });

  tests.set("managesieve-crypto", {
    script: "${workspace}/libManageSieve/tests/SieveCryptoTest.mjs",
    require: [
      "${workspace}/libManageSieve/SieveCrypto.mjs"
    ]
  });

  tests.set("managesieve-sasl-request", {
    script: "${workspace}/libManageSieve/tests/SieveSaslRequestTest.mjs",
    require: [
      "${workspace}/libManageSieve/SieveResponseCodes.mjs",
      "${workspace}/libManageSieve/SieveResponse.mjs",
      "${workspace}/libManageSieve/SieveRequest.mjs",
      "${workspace}/libManageSieve/SieveResponseParser.mjs",
      "${workspace}/libManageSieve/SieveRequestBuilder.mjs"
    ]
  });

  tests.set("managesieve-base64", {
    script: "${workspace}/libManageSieve/tests/SieveBase64Test.mjs",
    require: [
      "${workspace}/libManageSieve/SieveAbstractBase64.mjs",
      "${workspace}/libManageSieve/SieveBase64.mjs"
    ]
  });

  exports.tests = tests;

})(this);
