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

import {
  id, token,
  parameters, items,
  attribute,
  value
} from "../../../toolkit/logic/SieveGrammarHelper.mjs";

import { SieveGrammar } from "./../../../toolkit/logic/GenericElements.mjs";

/*
  relational-match = DQUOTE
          ("gt" / "ge" / "lt" / "le" / "eq" / "ne") DQUOTE
          ; "gt" means "greater than", the C operator ">".
          ; "ge" means "greater than or equal", the C operator ">=".
          ; "lt" means "less than", the C operator "<".
          ; "le" means "less than or equal", the C operator "<=".
          ; "eq" means "equal to", the C operator "==".
          ; "ne" means "not equal to", the C operator "!=".
 */

SieveGrammar.addTag(
  id("relational-match/gt", "@relational-match/"),
  token('"gt"'));

SieveGrammar.addTag(
  id("relational-match/ge", "@relational-match/"),
  token('"ge"'));

SieveGrammar.addTag(
  id("relational-match/lt", "@relational-match/"),
  token('"lt"'));

SieveGrammar.addTag(
  id("relational-match/le", "@relational-match/"),
  token('"le"'));

SieveGrammar.addTag(
  id("relational-match/eq", "@relational-match/"),
  token('"eq"'));

SieveGrammar.addTag(
  id("relational-match/ne", "@relational-match/"),
  token('"ne"'));

SieveGrammar.addGroup(
  id("relational-match"),
  items("@relational-match/"),
  value('"eq"')
);

/**
 * The value match type does a relational comparison between strings
 *
 *  VALUE = ":value" relational-match
 */
SieveGrammar.addTag(
  id("match-type/value", "@match-type/", "relational"),

  token(":value"),
  parameters(
    attribute("relational-match", "relational-match", '"eq"'))
);

/**
 * The count match type determines the number of the specified entities in the
 * message and then does a relational comparison of numbers of entities
 *
 * Count should only be used with a numeric comparator.
 */
SieveGrammar.addTag(
  id("match-type/count", "@match-type/", "relational"),
  token(":count"),
  parameters(
    attribute("relational-match", "relational-match", '"eq"'))
);
