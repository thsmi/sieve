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

(function () {

  "use strict";

  /* global SieveGrammar */

  if (!SieveGrammar)
    throw new Error("Could not register Notify");

  // Usage:  notify
  //           [":from" string]
  //           [":importance" <"1" / "2" / "3">]
  //           [":options" string-list]
  //           [":message" string]
  //           <method: string>

  SieveGrammar.addAction({
    node: "action/notify",
    type: "action",

    requires: "enotify",

    token: "notify",

    properties: [{
      id: "tags",
      optional: true,

      elements: [{
        id: "from",
        type: "action/notify/from"
      }, {
        id: "importance",
        type: "action/notify/importance"
      }, {
        id: "options",
        type: "action/notify/options"
      }, {
        id: "message",
        type: "action/notify/message"
      }]
    }, {
      id: "parameters",

      elements: [{
        id: "method",
        type: "string",
        value: '""'
      }]
    }]
  });

  SieveGrammar.addTag({
    node: "action/notify/from",
    type: "action/notify/from",

    token: ":from",

    properties: [{
      id: "parameters",

      elements: [{
        id: "from",
        type: "string"
      }]
    }]
  });

  SieveGrammar.addTag({
    node: "action/notify/importance",
    type: "action/notify/importance",

    token: ":importance",

    properties: [{
      id: "parameters",

      // TODO should be either "1", "2" or "3"
      elements: [{
        id: "importance",
        type: "string",
        value: '"2"'
      }]
    }]
  });

  SieveGrammar.addTag({
    node: "action/notify/options",
    type: "action/notify/options",

    token: ":options",

    properties: [{
      id: "parameters",

      elements: [{
        id: "options",
        type: "stringlist"
      }]
    }]
  });

  SieveGrammar.addTag({
    node: "action/notify/message",
    type: "action/notify/message",

    token: ":message",

    properties: [{
      id: "parameters",

      elements: [{
        id: "message",
        type: "string"
      }]
    }]
  });

  // Test valid_notify_method
  // Usage:  valid_notify_method
  //           <notification-uris: string-list>

  SieveGrammar.addTest({
    node: "test/valid_notify_method",
    type: "test",

    requires: "enotify",

    token: "valid_notify_method",

    properties: [{
      id: "parameters",
      elements: [{
        id: "uris",
        type: "stringlist",
        value: '"Example"'
      }]
    }]
  });

  // Test notify_method_capability
  // Usage:  notify_method_capability
  //            [COMPARATOR] [MATCH-TYPE]
  //            <notification-uri: string>
  //            <notification-capability: string>
  //            <key-list: string-list>

  SieveGrammar.addTest({
    node: "test/notify_method_capability",
    type: "test",

    requires: "enotify",

    token: "notify_method_capability",

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
      id: "parameters",
      elements: [{
        id: "uri",
        type: "string",
        value: '""'
      }, {
        id: "capability",
        type: "string",
        value: '"online"'
      }, {
        id: "keys",
        type: "stringlist",
        value: '"yes"'
      }]
    }]
  });


  //  Usage:  ":encodeurl"
  //
  // :encodeurl modifier to the 'set' Action
  //
  // requires variables and enotify and has a
  // has precedence of 15.

  SieveGrammar.addTag({
    node: "modifier/15/encodeurl",
    type: "modifier/15/",

    requires: { all: ["variables", "enotify"] },

    token: ":encodeurl"
  });

  SieveGrammar.addGroup({
    node: "modifier/15",
    type: "modifier/",

    items: ["modifier/15/"]
  });

  SieveGrammar.extendAction({
    extends: "action/set",

    properties: [{
      id: "tags",
      optional: true,

      elements: [{
        id: "modifier/15",
        type: "modifier/15"
      }]
    }]
  });

})(window);
