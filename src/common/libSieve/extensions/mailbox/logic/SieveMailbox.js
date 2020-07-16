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

import { SieveGrammar } from "./../../../toolkit/logic/GenericElements.js";

// fileinto [:create] <mailbox: string>
const create = {
  node: "action/fileinto/create",
  type: "action/fileinto/",

  requires: "mailbox",

  token: ":create"
};

SieveGrammar.addTag(create);

const fileinto = {
  extends: "action/fileinto",

  properties: [{
    id: "tags",
    optional: true,

    elements: [{
      id: "create",
      type: "action/fileinto/create",
      requires: "mailbox"
    }]
  }]
};

SieveGrammar.extendAction(fileinto);


// mailboxexists <mailbox-names: string-list>
const mailboxexists = {
  node: "test/mailboxexists",
  type: "test",

  requires: "mailbox",

  token: "mailboxexists",

  properties: [{
    id: "parameters",

    elements: [{
      id: "mailboxes",
      type: "stringlist",
      value: '"INBOX"'
    }]
  }]
};

SieveGrammar.addTest(mailboxexists);

// metadataexists <mailbox: string> <annotation-names: string-list>
const metadataexists = {
  node: "test/metadataexists",
  type: "test",

  requires: "mboxmetadata",

  token: "metadataexists",

  properties: [{
    id: "parameters",

    elements: [{
      id: "mailbox",
      type: "string",
      value: '"INBOX"'
    }, {
      id: "annotations",
      type: "stringlist",
      value: '""'
    }]
  }]
};

SieveGrammar.addTest(metadataexists);

// metadata [MATCH-TYPE] [COMPARATOR]
//         <mailbox: string>
//         <annotation-name: string> <key-list: string-list>

/**
 * Retrieves the value of the mailbox annotation "annotation-name" for mailbox
 * "mailbox#". The retrieved value is compared against the key-list.
 *
 * The test returns true if the annotation exists and its value matches and of
 * the keys.
 *
 * The default matchtype is :is and the default comparator is "i;ascii-casemap"
 */

const metadata = {
  node: "test/metadata",
  type: "test",

  requires: "mboxmetadata",

  token: "metadata",

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
      id: "mailbox",
      type: "string",

      value: '"INBOX"'
    }, {
      id: "annotation",
      type: "string",

      value: "\"\""
    }, {
      id: "keys",
      type: "stringlist",

      value: "\"\""
    }]
  }]

};

SieveGrammar.addTest(metadata);

// servermetadataexists <annotation-names: string-list>
const servermetadataexists = {
  node: "test/servermetadataexists",
  type: "test",

  requires: "servermetadata",

  token: "servermetadataexists",

  properties: [{
    id: "parameters",

    elements: [{
      id: "annotations",
      type: "stringlist",

      value: '""'
    }]
  }]
};

SieveGrammar.addTest(servermetadataexists);

// servermetadata [MATCH-TYPE] [COMPARATOR] <annotation-name: string> <key-list: string-list>
const servermetadata = {
  node: "test/servermetadata",
  type: "test",

  requires: "servermetadata",

  token: "servermetadata",

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
      id: "annotation",
      type: "string",

      value: '""'
    }, {
      id: "keys",
      type: "stringlist",

      value: '""'
    }]
  }]
};

SieveGrammar.addTest(servermetadata);
