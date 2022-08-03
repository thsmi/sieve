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

import { id, token } from "../../../toolkit/logic/SieveGrammarHelper.mjs";
import { SieveGrammar } from "./../../../toolkit/logic/GenericElements.mjs";

//   :user "+" :detail "@" :domain
// \----:local-part----/

SieveGrammar.addTag(
  id("address-part/user", "@address-part/", "subaddress"),
  token(":user")
);

SieveGrammar.addTag(
  id("address-part/detail", "@address-part/", "subaddress"),
  token(":detail")
);
