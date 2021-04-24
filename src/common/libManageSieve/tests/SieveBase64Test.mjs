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

import {
  SieveBase64Decoder,
  SieveBase64Encoder
} from "./../SieveBase64.mjs";


// Test vectors from RFC
suite.add("Base64 Decoder - Empty String", function () {
  suite.assertArrayEquals("",
    (new SieveBase64Decoder("")).toArray());

  suite.assertEquals("",
    (new SieveBase64Decoder("")).toUtf8());
});

suite.add("Base64 Decoder - Zg==", function () {
  suite.assertArrayEquals("f",
    (new SieveBase64Decoder("Zg==")).toArray());

  suite.assertEquals("f",
    (new SieveBase64Decoder("Zg==")).toUtf8());
});

suite.add("Base64 Decoder - Zm8=", function () {
  suite.assertArrayEquals("fo",
    (new SieveBase64Decoder("Zm8=")).toArray());

  suite.assertEquals("fo",
    (new SieveBase64Decoder("Zm8=")).toUtf8());
});

suite.add("Base64 Decoder - Zm9v", function () {
  suite.assertArrayEquals("foo",
    (new SieveBase64Decoder("Zm9v")).toArray());

  suite.assertEquals("foo",
    (new SieveBase64Decoder("Zm9v")).toUtf8());
});

suite.add("Base64 Decoder - Zm9vYg==", function () {
  suite.assertArrayEquals("foob",
    (new SieveBase64Decoder("Zm9vYg==")).toArray());

  suite.assertEquals("foob",
    (new SieveBase64Decoder("Zm9vYg==")).toUtf8());
});

suite.add("Base64 Decoder - Zm9vYmE=", function () {
  suite.assertArrayEquals("fooba",
    (new SieveBase64Decoder("Zm9vYmE=")).toArray());

  suite.assertEquals("fooba",
    (new SieveBase64Decoder("Zm9vYmE=")).toUtf8());
});

suite.add("Base64 Decoder - Zm9vYmFy", function () {
  suite.assertArrayEquals("foobar",
    (new SieveBase64Decoder("Zm9vYmFy")).toArray());

  suite.assertEquals("foobar",
    (new SieveBase64Decoder("Zm9vYmFy")).toUtf8());
});

// Test vectors from Wikipedia
suite.add("Base64 Decoder - YW55IGNhcm5hbCBwbGVhcw", function () {
  suite.assertArrayEquals("any carnal pleas",
    (new SieveBase64Decoder("YW55IGNhcm5hbCBwbGVhcw")).toArray());

  suite.assertEquals("any carnal pleas",
    (new SieveBase64Decoder("YW55IGNhcm5hbCBwbGVhcw")).toUtf8());
});

suite.add("Base64 Decoder - YW55IGNhcm5hbCBwbGVhcw==", function () {
  suite.assertArrayEquals("any carnal pleas",
    (new SieveBase64Decoder("YW55IGNhcm5hbCBwbGVhcw==")).toArray());

  suite.assertEquals("any carnal pleas",
    (new SieveBase64Decoder("YW55IGNhcm5hbCBwbGVhcw==")).toUtf8());
});

suite.add("Base64 Decoder - YW55IGNhcm5hbCBwbGVhc3U", function () {
  suite.assertArrayEquals("any carnal pleasu",
    (new SieveBase64Decoder("YW55IGNhcm5hbCBwbGVhc3U")).toArray());

  suite.assertEquals("any carnal pleasu",
    (new SieveBase64Decoder("YW55IGNhcm5hbCBwbGVhc3U")).toUtf8());
});

suite.add("Base64 Decoder - YW55IGNhcm5hbCBwbGVhc3U=", function () {
  suite.assertArrayEquals("any carnal pleasu",
    (new SieveBase64Decoder("YW55IGNhcm5hbCBwbGVhc3U=")).toArray());

  suite.assertEquals("any carnal pleasu",
    (new SieveBase64Decoder("YW55IGNhcm5hbCBwbGVhc3U=")).toUtf8());
});

suite.add("Base64 Decoder - YW55IGNhcm5hbCBwbGVhc3Vy", function () {
  suite.assertArrayEquals("any carnal pleasur",
    (new SieveBase64Decoder("YW55IGNhcm5hbCBwbGVhc3Vy")).toArray());

  suite.assertEquals("any carnal pleasur",
    (new SieveBase64Decoder("YW55IGNhcm5hbCBwbGVhc3Vy")).toUtf8());
});

suite.add("Base64 Decoder - YW55IGNhcm5hbCBwbGVhc3VyZQ==", function () {
  suite.assertArrayEquals("any carnal pleasure",
    (new SieveBase64Decoder("YW55IGNhcm5hbCBwbGVhc3VyZQ==")).toArray());

  suite.assertEquals("any carnal pleasure",
    (new SieveBase64Decoder("YW55IGNhcm5hbCBwbGVhc3VyZQ==")).toUtf8());
});

suite.add("Base64 Decoder - dj1wZVI4RWI2dU5mNFpkN0h6SjB2N09CZy9DNWN4cEtWdU1SeDNsY25hT2hFPQ=", function () {
  suite.assertArrayEquals("v=peR8Eb6uNf4Zd7HzJ0v7OBg/C5cxpKVuMRx3lcnaOhE=",
    (new SieveBase64Decoder("dj1wZVI4RWI2dU5mNFpkN0h6SjB2N09CZy9DNWN4cEtWdU1SeDNsY25hT2hFPQ=")).toArray());

  suite.assertEquals("v=peR8Eb6uNf4Zd7HzJ0v7OBg/C5cxpKVuMRx3lcnaOhE=",
    (new SieveBase64Decoder("dj1wZVI4RWI2dU5mNFpkN0h6SjB2N09CZy9DNWN4cEtWdU1SeDNsY25hT2hFPQ=")).toUtf8());
});

suite.add("Base64 Decoder - peR8Eb6uNf4Zd7HzJ0v7OBg/C5cxpKVuMRx3lcnaOhE=", function () {

  const expectation = new Uint8Array([0xA5, 0xE4, 0x7C, 0x11, 0xBE, 0xAE, 0x35, 0xFE, 0x19,
    0x77, 0xB1, 0xF3, 0x27, 0x4B, 0xFB, 0x38, 0x18, 0x3F, 0x0B, 0x97, 0x31,
    0xA4, 0xA5, 0x6E, 0x31, 0x1C, 0x77, 0x95, 0xC9, 0xDA, 0x3A, 0x11]);

  suite.assertArrayEquals(expectation,
    (new SieveBase64Decoder("peR8Eb6uNf4Zd7HzJ0v7OBg/C5cxpKVuMRx3lcnaOhE=")).toArray());
});

suite.add("Base64 Decoder - peR8Eb6uNf4Zd7HzJ0v7OBg/C5cxpKVuMRx3lcnaOhE", function () {

  const expectation = new Uint8Array([0xA5, 0xE4, 0x7C, 0x11, 0xBE, 0xAE, 0x35, 0xFE, 0x19,
    0x77, 0xB1, 0xF3, 0x27, 0x4B, 0xFB, 0x38, 0x18, 0x3F, 0x0B, 0x97, 0x31,
    0xA4, 0xA5, 0x6E, 0x31, 0x1C, 0x77, 0x95, 0xC9, 0xDA, 0x3A, 0x11]);

  suite.assertArrayEquals(expectation,
    (new SieveBase64Decoder("peR8Eb6uNf4Zd7HzJ0v7OBg/C5cxpKVuMRx3lcnaOhE")).toArray());
});

// Test vectors from RFC
suite.add("Base64 Encoder - Empty String", function () {
  suite.assertArrayEquals("",
    (new SieveBase64Encoder("")).toArray());

  suite.assertEquals("",
    (new SieveBase64Encoder("")).toUtf8());
});

suite.add("Base64 Encoder - Zg==", function () {
  suite.assertArrayEquals("Zg==",
    (new SieveBase64Encoder("f")).toArray());

  suite.assertEquals("Zg==",
    (new SieveBase64Encoder("f")).toUtf8());
});

suite.add("Base64 Encoder - Zm8=", function () {
  suite.assertArrayEquals("Zm8=",
    (new SieveBase64Encoder("fo")).toArray());

  suite.assertEquals("Zm8=",
    (new SieveBase64Encoder("fo")).toUtf8());
});

suite.add("Base64 Encoder - Zm9v", function () {
  suite.assertArrayEquals("Zm9v",
    (new SieveBase64Encoder("foo")).toArray());

  suite.assertEquals("Zm9v",
    (new SieveBase64Encoder("foo")).toUtf8());
});

suite.add("Base64 Encoder - Zm9vYg==", function () {
  suite.assertArrayEquals("Zm9vYg==",
    (new SieveBase64Encoder("foob")).toArray());

  suite.assertEquals("Zm9vYg==",
    (new SieveBase64Encoder("foob")).toUtf8());
});

suite.add("Base64 Encoder - Zm9vYmE=", function () {
  suite.assertArrayEquals("Zm9vYmE=",
    (new SieveBase64Encoder("fooba")).toArray() );

  suite.assertEquals("Zm9vYmE=",
    (new SieveBase64Encoder("fooba")).toUtf8() );
});

suite.add("Base64 Encoder - Zm9vYmFy", function () {
  suite.assertArrayEquals("Zm9vYmFy",
    (new SieveBase64Encoder("foobar")).toArray());

  suite.assertEquals("Zm9vYmFy",
    (new SieveBase64Encoder("foobar")).toUtf8());
});


// Test vectors from Wikipedia

suite.add("Base64 Encoder - YW55IGNhcm5hbCBwbGVhcw==", function () {
  suite.assertArrayEquals("YW55IGNhcm5hbCBwbGVhcw==",
    (new SieveBase64Encoder("any carnal pleas")).toArray());

  suite.assertEquals("YW55IGNhcm5hbCBwbGVhcw==",
    (new SieveBase64Encoder("any carnal pleas")).toUtf8());
});

suite.add("Base64 Encoder - YW55IGNhcm5hbCBwbGVhc3U=", function () {
  suite.assertArrayEquals("YW55IGNhcm5hbCBwbGVhc3U=",
    (new SieveBase64Encoder("any carnal pleasu")).toArray());

  suite.assertEquals("YW55IGNhcm5hbCBwbGVhc3U=",
    (new SieveBase64Encoder("any carnal pleasu")).toUtf8());
});

suite.add("Base64 Encoder - YW55IGNhcm5hbCBwbGVhc3Vy", function () {
  suite.assertArrayEquals("YW55IGNhcm5hbCBwbGVhc3Vy",
    (new SieveBase64Encoder("any carnal pleasur")).toArray());

  suite.assertEquals("YW55IGNhcm5hbCBwbGVhc3Vy",
    (new SieveBase64Encoder("any carnal pleasur")).toUtf8());
});

suite.add("Base64 Encoder - YW55IGNhcm5hbCBwbGVhc3VyZQ==", function () {
  suite.assertArrayEquals("YW55IGNhcm5hbCBwbGVhc3VyZQ==",
    (new SieveBase64Encoder("any carnal pleasure")).toArray());

  suite.assertEquals("YW55IGNhcm5hbCBwbGVhc3VyZQ==",
    (new SieveBase64Encoder("any carnal pleasure")).toUtf8());
});

suite.add("Base64 Encoder - dj1wZVI4RWI2dU5mNFpkN0h6SjB2N09CZy9DNWN4cEtWdU1SeDNsY25hT2hFPQ==", function () {
  suite.assertArrayEquals("dj1wZVI4RWI2dU5mNFpkN0h6SjB2N09CZy9DNWN4cEtWdU1SeDNsY25hT2hFPQ==",
    (new SieveBase64Encoder("v=peR8Eb6uNf4Zd7HzJ0v7OBg/C5cxpKVuMRx3lcnaOhE=")).toArray());

  suite.assertEquals("dj1wZVI4RWI2dU5mNFpkN0h6SjB2N09CZy9DNWN4cEtWdU1SeDNsY25hT2hFPQ==",
    (new SieveBase64Encoder("v=peR8Eb6uNf4Zd7HzJ0v7OBg/C5cxpKVuMRx3lcnaOhE=")).toUtf8());
});

suite.add("Base64 Encoder - peR8Eb6uNf4Zd7HzJ0v7OBg/C5cxpKVuMRx3lcnaOhE=", function () {

  const actual = new Uint8Array([0xA5, 0xE4, 0x7C, 0x11, 0xBE, 0xAE, 0x35, 0xFE, 0x19,
    0x77, 0xB1, 0xF3, 0x27, 0x4B, 0xFB, 0x38, 0x18, 0x3F, 0x0B, 0x97, 0x31,
    0xA4, 0xA5, 0x6E, 0x31, 0x1C, 0x77, 0x95, 0xC9, 0xDA, 0x3A, 0x11]);

  suite.assertArrayEquals("peR8Eb6uNf4Zd7HzJ0v7OBg/C5cxpKVuMRx3lcnaOhE=",
    (new SieveBase64Encoder(actual)).toArray());

  suite.assertEquals("peR8Eb6uNf4Zd7HzJ0v7OBg/C5cxpKVuMRx3lcnaOhE=",
    (new SieveBase64Encoder(actual)).toUtf8());
});

