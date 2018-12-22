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

  if (!SieveGrammar)
    throw new Error("Could not register AddressParts");

  SieveGrammar.addTag({
    node: "address-part/domain",
    type: "address-part/",

    token: ":domain"
  });


  SieveGrammar.addTag({
    node: "address-part/local",
    type: "address-part/",

    token: ":localpart"
  });

  SieveGrammar.addTag({
    node: "address-part/all",
    type: "address-part/",

    token: ":all"
  });


  SieveGrammar.addGroup({
    node: "address-part",
    type: "address-part",

    value: ":all",

    items: ["address-part/"]
  });

})(window);
