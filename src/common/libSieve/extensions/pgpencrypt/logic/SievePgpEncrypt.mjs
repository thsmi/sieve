/*
 * The contents of this file are licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via
 * email from the author.
 *
 * Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   kaivol <github@kavol.de>
 *
 */

import { SieveGrammar } from "./../../../toolkit/logic/GenericElements.mjs";

// :keys
SieveGrammar.addTag({
  node: "action/pgpencrypt/keys",
  type: "action/pgpencrypt/",

  token: ":keys",

  properties: [{
    id: "parameters",

    elements: [{
      id: "keys",
      type: "string",

      value: '""'
    }]
  }]
});

//     Usage:   pgp_encrypt :keys <key: string>
SieveGrammar.addAction({
  node: "action/pgpencrypt",
  type: "action",

  token: "pgp_encrypt",

  requires: "vnd.dovecot.pgp-encrypt",

  properties: [{
    id: "tags",
    optional: true,

    elements: [{
      id: "keys",
      type: "action/pgpencrypt/keys"
    }]
  }]
});
