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


/* global net */
const suite = net.tschmid.yautt.test;

if (!suite)
  throw new Error("Could not initialize test suite");

import { SieveUrl } from "./../SieveUrl.mjs";

const SIEVE_DEFAULT_PORT = 4190;
const SIEVE_CUSTOM_PORT = 1234;

suite.add("Parsing sieve://host", function () {

  const url = new SieveUrl("sieve://host");

  suite.assertEquals("host", url.getHost());
  suite.assertEquals(SIEVE_DEFAULT_PORT, url.getPort());
  suite.assertNull(url.getUser());
  suite.assertNull(url.getPassword());
});

suite.add("Parsing sieve://user@host", function () {

  const url = new SieveUrl("sieve://user@host");

  suite.assertEquals("host", url.getHost());
  suite.assertEquals(SIEVE_DEFAULT_PORT, url.getPort());
  suite.assertEquals("user", url.getUser());
  suite.assertNull(url.getPassword());
});

suite.add("Parsing sieve://user:password@host", function () {

  const url = new SieveUrl("sieve://user:password@host");

  suite.assertEquals("host", url.getHost());
  suite.assertEquals(SIEVE_DEFAULT_PORT, url.getPort());
  suite.assertEquals("user", url.getUser());
  suite.assertEquals("password", url.getPassword());
});

suite.add("Parsing sieve://host:1234", function () {

  const url = new SieveUrl("sieve://host:1234");

  suite.assertEquals("host", url.getHost());
  suite.assertEquals(SIEVE_CUSTOM_PORT, url.getPort());
  suite.assertNull(null, url.getUser());
  suite.assertNull(url.getPassword());
});

suite.add("Parsing sieve://user@host:1234", function () {

  const url = new SieveUrl("sieve://user@host:1234");

  suite.assertEquals("host", url.getHost());
  suite.assertEquals(SIEVE_CUSTOM_PORT, url.getPort());
  suite.assertEquals("user", url.getUser());
  suite.assertNull(url.getPassword());
});

suite.add("Parsing sieve://user:password@host:1234", function () {

  const url = new SieveUrl("sieve://user:password@host:1234");

  suite.assertEquals("host", url.getHost());
  suite.assertEquals(SIEVE_CUSTOM_PORT, url.getPort());
  suite.assertEquals("user", url.getUser());
  suite.assertEquals("password", url.getPassword());
});

suite.add("Parsing sieve://c3.mail.example.com", function () {

  const url = new SieveUrl("sieve://c3.mail.example.com");

  suite.assertEquals("c3.mail.example.com", url.getHost());
  suite.assertEquals(SIEVE_DEFAULT_PORT, url.getPort());
  suite.assertEquals(null, url.getUser());
  suite.assertEquals(null, url.getPassword());
});

suite.add("Parsing invalid port sieve://c3.mail.example.com:abc", function () {

  try {
    // eslint-disable-next-line no-new
    new SieveUrl("sieve://c3.mail.example.com:abc");
  } catch (ex) {
    suite.assertEquals(ex.message, "Not a valid sieve url sieve://c3.mail.example.com:abc");
    return;
  }

  suite.fail("Function should throw but did not");

});
