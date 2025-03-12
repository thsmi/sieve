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

suite.description("RFC5228 Elements unit tests...");

suite.add("Test envelope constructors", () => {
  suite.expectDefaultSnippet("test/envelope", 'envelope "To" "me@example.com"', ["envelope"]);

  suite.expectInvalidSnippet("test/envelope", 'envelope "To" "me@example.com"',
    "Capability not supported");

  suite.expectInvalidSnippet("test/envelope", 'envelope "To"',
    ">>[<< expected but found:", ["envelope"]);
  suite.expectInvalidSnippet("test/envelope", 'envelope',
    ">>[<< expected but found:", ["envelope"]);

  // match-type
  suite.expectValidSnippet("test/envelope", 'envelope :is "To" "me@example.com"', ["envelope"]);
  suite.expectInvalidSnippet("test/envelope", 'envelope :is "To"',
    ">>[<< expected but found:", ["envelope"]);
  suite.expectInvalidSnippet("test/envelope", 'envelope :is',
    ">>[<< expected but found:", ["envelope"]);

  // comparator
  suite.expectValidSnippet("test/envelope", 'envelope :comparator "i;octet" "To" "me@example.com"', ["envelope"]);
  suite.expectInvalidSnippet("test/envelope", 'envelope :comparator "i;octet" "To"',
    ">>[<< expected but found:", ["envelope"]);
  suite.expectInvalidSnippet("test/envelope", 'envelope :comparator "i;octet"',
    ">>[<< expected but found:", ["envelope"]);

  // address-part
  suite.expectValidSnippet("test/envelope", 'envelope :domain "To" "me@example.com"', ["envelope"]);
  suite.expectInvalidSnippet("test/envelope", 'envelope :domain "To"',
    ">>[<< expected but found:", ["envelope"]);
  suite.expectInvalidSnippet("test/envelope", 'envelope :domain',
    ">>[<< expected but found:", ["envelope"]);

  // Match types and Comparators
  suite.expectValidSnippet("test/envelope", 'envelope :is :comparator "i;octet" "To" "me@example.com"', ["envelope"]);
  suite.expectInvalidSnippet("test/envelope", 'envelope :is :comparator "i;octet" "To"',
    ">>[<< expected but found:", ["envelope"]);
  suite.expectInvalidSnippet("test/envelope", 'envelope :is :comparator "i;octet"',
    ">>[<< expected but found:", ["envelope"]);

  // Match types and addresspart
  suite.expectValidSnippet("test/envelope", 'envelope :domain :is "To" "me@example.com"', ["envelope"]);
  suite.expectInvalidSnippet("test/envelope", 'envelope :domain :is "To"',
    ">>[<< expected but found:", ["envelope"]);
  suite.expectInvalidSnippet("test/envelope", 'envelope :domain :is',
    ">>[<< expected but found:", ["envelope"]);

  // addresspart and comparators
  suite.expectValidSnippet("test/envelope", 'envelope :domain :comparator "i;octet" "To" "me@example.com"', ["envelope"]);
  suite.expectInvalidSnippet("test/envelope", 'envelope :domain :comparator "i;octet" "To"',
    ">>[<< expected but found:", ["envelope"]);
  suite.expectInvalidSnippet("test/envelope", 'envelope :domain :comparator "i;octet"',
    ">>[<< expected but found:", ["envelope"]);

  // Match types comparators and addresspart
  suite.expectValidSnippet("test/envelope", 'envelope :is :domain :comparator "i;octet" "To" "me@example.com"', ["envelope"]);
  suite.expectInvalidSnippet("test/envelope", 'envelope :is :domain :comparator "i;octet" "To"',
    ">>[<< expected but found:", ["envelope"]);
  suite.expectInvalidSnippet("test/envelope", 'envelope :is :domain :comparator "i;octet"',
    ">>[<< expected but found:", ["envelope"]);
});

suite.add("Test address constructors", () => {
  suite.expectDefaultSnippet("test/address", 'address "To" "me@example.com"');

  suite.expectInvalidSnippet("test/address", 'address "To"',
    ">>[<< expected but found:");
  suite.expectInvalidSnippet("test/address", 'address',
    ">>[<< expected but found:");

  // Match types
  suite.expectValidSnippet("test/address", 'address :is "To" "me@example.com"');
  suite.expectInvalidSnippet("test/address", 'address :is "To"',
    ">>[<< expected but found:");
  suite.expectInvalidSnippet("test/address", 'address :is',
    ">>[<< expected but found:");

  // Comparator
  suite.expectValidSnippet("test/address", 'address :comparator "i;octet" "To" "me@example.com"');
  suite.expectInvalidSnippet("test/address", 'address :comparator "i;octet" "To"',
    ">>[<< expected but found:");
  suite.expectInvalidSnippet("test/address", 'address :comparator "i;octet"',
    ">>[<< expected but found:");

  // address-part
  suite.expectValidSnippet("test/address", 'address :domain "To" "me@example.com"');
  suite.expectInvalidSnippet("test/address", 'address :domain "To"',
    ">>[<< expected but found:");
  suite.expectInvalidSnippet("test/address", 'address :domain',
    ">>[<< expected but found:");

  // Match types and Comparators
  suite.expectValidSnippet("test/address", 'address :is :comparator "i;octet" "To" "me@example.com"');
  suite.expectInvalidSnippet("test/address", 'address :is :comparator "i;octet" "To"',
    ">>[<< expected but found:");
  suite.expectInvalidSnippet("test/address", 'address :is :comparator "i;octet"',
    ">>[<< expected but found:");

  // Match types and addresspart
  suite.expectValidSnippet("test/address", 'address :is :domain "To" "me@example.com"');
  suite.expectInvalidSnippet("test/address", 'address :is :domain "To"',
    ">>[<< expected but found:");
  suite.expectInvalidSnippet("test/address", 'address :is :domain',
    ">>[<< expected but found:");


  // addresspart and comparators
  suite.expectValidSnippet("test/address", 'address :domain :comparator "i;octet" "To" "me@example.com"');
  suite.expectInvalidSnippet("test/address", 'address :domain :comparator "i;octet" "To"',
    ">>[<< expected but found:");
  suite.expectInvalidSnippet("test/address", 'address :domain :comparator "i;octet"',
    ">>[<< expected but found:");

  // Match types comparators and addresspart
  suite.expectValidSnippet("test/address", 'address :is :domain :comparator "i;octet" "To" "me@example.com"');
  suite.expectInvalidSnippet("test/address", 'address :is :domain :comparator "i;octet" "To"',
    ">>[<< expected but found:");
  suite.expectInvalidSnippet("test/address", 'address :is :domain :comparator "i;octet"',
    ">>[<< expected but found:");
});

suite.add("Test exists constructors", () => {

  suite.expectDefaultSnippet("test/exists", 'exists "From"');

  suite.expectValidSnippet("test/exists", 'exists "Subject"');

  suite.expectInvalidSnippet("test/exists", 'exists',
    ">>[<< expected but found:");
});

suite.add("Test header constructors", () => {
  suite.expectDefaultSnippet("test/header", 'header "Subject" "Example"');

  suite.expectValidSnippet("test/header", 'header "Subject" "Example"');

  // Match-Type
  suite.expectValidSnippet("test/header", 'header :is "Subject" "Example"');

  // Comparator
  suite.expectValidSnippet("test/header", 'header :comparator "i;octet" "Subject" "Example"');

  // Comparator and matchtype
  suite.expectValidSnippet("test/header", 'header :is :comparator "i;octet" "Subject" "Example"');
  suite.expectValidSnippet("test/header", 'header :comparator "i;octet" :is "Subject" "Example"');


  suite.expectInvalidSnippet("test/header", 'header',
    ">>[<< expected but found:");
  suite.expectInvalidSnippet("test/header", 'header "Subject"',
    ">>[<< expected but found:");

  suite.expectInvalidSnippet("test/header", 'header :is',
    ">>[<< expected but found:");
  suite.expectInvalidSnippet("test/header", 'header :is "Subject"',
    ">>[<< expected but found:");

  suite.expectInvalidSnippet("test/header", 'header :comparator "i;octet"',
    ">>[<< expected but found:");
  suite.expectInvalidSnippet("test/header", 'header :comparator "i;octet" "Subject"',
    ">>[<< expected but found:");

  suite.expectInvalidSnippet("test/header", 'header :comparator "i;octet" :is',
    ">>[<< expected but found:");
  suite.expectInvalidSnippet("test/header", 'header :comparator "i;octet" :is "Subject"',
    ">>[<< expected but found:");

  suite.expectInvalidSnippet("test/header", 'header :is :comparator "i;octet"',
    ">>[<< expected but found:");
  suite.expectInvalidSnippet("test/header", 'header :is :comparator "i;octet" "Subject"',
    ">>[<< expected but found:");
});

suite.add("Test boolean constructors", () => {
  suite.expectDefaultSnippet("test/boolean", "false");

  suite.expectValidSnippet("test/boolean", 'true');
  suite.expectValidSnippet("test/boolean", 'false');
});

suite.add("Test size constructors", () => {

  suite.expectDefaultSnippet("test/size", 'size :over 1M');

  suite.expectValidSnippet("test/size", 'size :over 1M');
  suite.expectValidSnippet("test/size", 'size :under 1M');

  suite.expectInvalidSnippet("test/size", 'size 1M',
    "Unknown or incompatible type >>@test/");

  suite.expectInvalidSnippet("test/size", 'size :over',
    "Number expected but found:");
  suite.expectInvalidSnippet("test/size", 'size :under',
    "Number expected but found:");
});

// :comparator "i;ascii-casemap"
