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

import { SieveGrammar } from "./../../../toolkit/logic/GenericElements.mjs";

import {
  id, token,
  stringField, stringListField, parameters
} from "./../../../toolkit/logic/SieveGrammarHelper.mjs";


// Usage: convert  <quoted-from-media-type: string>
//                 <quoted-to-media-type: string>
//                 <transcoding-params: string-list>
//
// can be either a test or an action...

const properties = [
  parameters(
    stringField("from", 'image/tiff'),
    stringField("to", 'mage/jpeg'),
    stringListField("transcoding", ["pix-x=320", "pix-y=240"]))
];

SieveGrammar.addTest(
  id("test/convert", "test", "convert"),
  token("convert"),
  ...properties);

SieveGrammar.addAction(
  id("action/convert", "action", "convert"),
  token("convert"),
  ...properties
);

