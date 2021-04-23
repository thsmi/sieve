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

/* eslint-disable no-magic-numbers */

/* global net */
const suite = net.tschmid.yautt.test;

if (!suite)
  throw new Error("Could not initialize test suite");

import { SieveCrypto } from "./../SieveCrypto.mjs";

const DEFAULT_PASSWORD = new Uint8Array([112, 101, 110, 99, 105, 108]);
const DEFAULT_SALT = new Uint8Array([65, 37, 194, 71, 228, 58, 177, 233, 60, 109, 255, 118]);

const DEFAULT_SALTED_PASSWORD = [
  29, 150, 238, 58, 82, 155, 90, 95, 158, 71,
  192, 31, 34, 154, 44, 184, 166, 225, 95, 125];

suite.description(
  "Testing Cryptographic functions...");

suite.add("Crypto SHA1 Hi()", async function () {

  const crypto = new SieveCrypto("SHA-1");

  const password = DEFAULT_PASSWORD;
  const iter = "4096";
  const salt = DEFAULT_SALT;


  const saltedPassword = await (crypto.Hi(password, salt, iter));

  suite.assertEquals(20, saltedPassword.length);

  suite.assertEquals(saltedPassword.toString(), DEFAULT_SALTED_PASSWORD.toString());
});

suite.add("Normalize(str)", function () {
});
