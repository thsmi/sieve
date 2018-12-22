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

/* global window */

(function () {

  "use strict";
  /* global SieveGrammar */

  // Flags and keywords are defined in http://tools.ietf.org/html/rfc5788

  if (!SieveGrammar)
    throw new Error("Could not register ImapFlags");

  // Inject :flags into  fileinto
  // :flags" <list-of-flags: string-list>
  SieveGrammar.addTag({
    node: "action/fileinto/flags",
    type: "action/fileinto/",

    requires: "imap4flags",

    token: ":flags",


    properties: [{
      id: "parameters",

      elements: [{
        id: "flags",

        type: "stringlist",
        value: '["\\\\Flagged"]'
      }]
    }]
  });

  SieveGrammar.extendAction({
    extends: "action/fileinto",

    properties: [{
      id: "tags",
      optional: true,

      elements: [{
        id: "flags",
        type: "action/fileinto/flags",
        requires: "imap4flags"
      }]
    }]
  });

  // Inject :flags into keep
  SieveGrammar.addTag({
    node: "action/keep/flags",
    type: "action/keep/",

    requires: "imap4flags",

    token: ":flags",

    properties: [{
      id: "parameters",

      elements: [{
        id: "flags",

        type: "stringlist",
        value: '["\\\\Flagged"]'
      }]
    }]
  });

  SieveGrammar.extendAction({
    extends: "action/keep",

    properties: [{
      id: "tags",
      optional: true,

      elements: [{
        id: "flags",
        type: "action/keep/flags",
        requires: "imap4flags"
      }]
    }]
  });

  // Usage:   setflag [<variablename: string>]  <list-of-flags: string-list>
  SieveGrammar.addAction({
    node: "action/setflag",
    type: "action",
    token: "setflag",

    requires: "imap4flags",

    properties: [{
      id: "variablename",
      type: "string",

      dependent: true,

      requires: "variables"
    }, {
      id: "parameters",

      elements: [{
        id: "flags",

        type: "stringlist",
        value: '"\\\\Flagged"'
      }]
    }]
  });

  //     Usage:   addflag [<variablename: string>]
  //            <list-of-flags: string-list>
  SieveGrammar.addAction({
    node: "action/addflag",
    type: "action",
    token: "addflag",

    requires: "imap4flags",

    properties: [{
      id: "variablename",
      type: "string",

      dependent: true,

      requires: "variables"
    }, {
      id: "parameters",

      elements: [{
        id: "flags",

        type: "stringlist",
        value: '"\\\\Flagged"'
      }]
    }]
  });


  //  Usage:   removeflag [<variablename: string>]
  //         <list-of-flags: string-list>

  SieveGrammar.addAction({

    node: "action/removeflag",
    type: "action",

    requires: "imap4flags",

    token: "removeflag",

    properties: [{
      id: "variablename",
      type: "string",

      dependent: true,

      requires: "variables"
    },
    {
      id: "parameters",

      elements: [{

        id: "flags",
        type: "stringlist",

        value: '"\\Flagged"'
      }]
    }]
  });


  //     Usage: hasflag [MATCH-TYPE] [COMPARATOR]
  //          [<variable-list: string-list>]
  //          <list-of-flags: string-list>

  SieveGrammar.addTest({

    node: "test/hasflag",
    type: "test",

    requires: "imap4flags",

    token: "hasflag",

    properties: [{
      id: "tags",
      optional: true,

      elements: [{
        id: "match-type",
        type: "match-type"
      }, {
        id: "comparator",
        type: "comparator"
      }]

    }, {

      id: "variables",
      type: "stringlist",

      dependent: true,

      requires: "variables"
    }, {

      id: "parameters",
      elements: [{
        id: "flags",
        type: "stringlist"
      }]
    }]
  });


})(window);
