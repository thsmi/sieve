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

(function () {

  "use strict";
  /* global SieveGrammar */

  if (!SieveGrammar)
    throw new Error("Could not register Comparator");

  /**
   * Comparators sepcify the charset which should be used for string comparison
   * By default two matchtypes are supported.
   *
   * "i;octet"
   *   Compares strings byte by byte (octet by octet) used typically with UTF-8 octetts
   *
   * "i;ascii-codemap"
   *   Converts strings before comparison to US-ASCII.
   *   All US-ASCII letters are converted to upercase (0x61-0x7A to 0x41-0x5A)
   *   "hello" equals "HELLO"
   *
   * "i;ascii-numeric"
   *   Interprets the string as decimal positive integer represented in US-ASCII digits (0x30 to 0x39).
   *   The comparison starts from tbe beginning of the string and ends with the first non-digit or the
   *   end of string.
   **/

  SieveGrammar.addTag({
    node: "comparator/i;octet",
    type: "comparator/",

    token: "\"i;octet\""
  });

  SieveGrammar.addTag({
    node: "comparator/i;ascii-casemap",
    type: "comparator/",

    token: "\"i;ascii-casemap\""
  });

  /**
   * 9.1.1.  ASCII Numeric Collation Description
   *
   * The "i;ascii-numeric" collation is a simple collation intended for
   * use with arbitrarily-sized, unsigned decimal integer numbers stored
   * as octet strings.  US-ASCII digits (0x30 to 0x39) represent digits of
   * the numbers.  Before converting from string to integer, the input
   * string is truncated at the first non-digit character.  All input is
   * valid; strings that do not start with a digit represent positive
   * infinity.
   *
   * The collation supports equality and ordering, but does not support
   * the substring operation.
   *
   * The equality operation returns "match" if the two strings represent
   * the same number (i.e., leading zeroes and trailing non-digits are
   * disregarded), and "no-match" if the two strings represent different
   * numbers.
   *
   * The ordering operation returns "less" if the first string represents
   * a smaller number than the second, "equal" if they represent the same
   * number, and "greater" if the first string represents a larger number
   * than the second.
   *
   * Some examples: "0" is less than "1", and "1" is less than
   * "4294967298". "4294967298", "04294967298", and "4294967298b" are all
   * equal. "04294967298" is less than "". "", "x", and "y" are equal.
   */
  SieveGrammar.addTag({
    node: "comparator/i;ascii-numeric",
    type: "comparator/",

    requires: "comparator-i;ascii-numeric",

    token: "\"i;ascii-numeric\""
  });

  // *******************************************************************

  SieveGrammar.addGroup({
    node: "comparator",
    type: "comparator",

    token: ":comparator",

    value: "\"i;ascii-casemap\"",

    items: ["comparator/"]
  });

})(window);
