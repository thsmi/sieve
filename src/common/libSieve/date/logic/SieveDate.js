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


/* time-zone  =  ( "+" / "-" ) 4DIGIT */

/*
time-zone

"year"      => the year, "0000" .. "9999".
"month"     => the month, "01" .. "12".
"day"       => the day, "01" .. "31".
"date"      => the date in "yyyy-mm-dd" format.
"julian"    => the Modified Julian Day, that is, the date
               expressed as an integer number of days since
               00:00 UTC on November 17, 1858 (using the Gregorian
               calendar).  This corresponds to the regular
               Julian Day minus 2400000.5.  Sample routines to
               convert to and from modified Julian dates are
               given in Appendix A.
"hour"      => the hour, "00" .. "23".
"minute"    => the minute, "00" .. "59".
"second"    => the second, "00" .. "60".
"time"      => the time in "hh:mm:ss" format.
"iso8601"   => the date and time in restricted ISO 8601 format.
"std11"     => the date and time in a format appropriate
               for use in a Date: header field [RFC2822].
"zone"      => the time zone in use.  If the user specified a
               time zone with ":zone", "zone" will
               contain that value.  If :originalzone is specified
               this value will be the original zone specified
               in the date-time value.  If neither argument is
               specified the value will be the server's default
               time zone in offset format "+hhmm" or "-hhmm".  An
               offset of 0 (Zulu) always has a positive sign.
"weekday"   => the day of the week expressed as an integer between
               "0" and "6". "0" is Sunday, "1" is Monday, etc.
*/

/* :orignalzone" */


(function () {

  "use strict";
  /* global SieveGrammar */

  if (!SieveGrammar)
    throw new Error("Could not register Variables");

  SieveGrammar.addTag({
    node: "zone/originalzone",
    type: "zone/",

    token: ":originalzone"
  });

  SieveGrammar.addTag({
    node: "zone/zone",
    type: "zone/",

    token: ":zone",

    requires: "date",

    properties: [{
      id: "parameters",

      elements: [{
        id: "time-zone",
        type: "string",

        value: '"+0100"'
      }]
    }]
  });

  SieveGrammar.addGroup({
    node: "zone",
    type: "zone",

    value: ":originalzone",

    items: ["zone/"]
  });

  // usage: date [<":zone" <time-zone: string>> / ":originalzone"]
  //                 [COMPARATOR] [MATCH-TYPE] <header-name: string>
  //                 <date-part: string> <key-list: string-list>

  SieveGrammar.addTest({
    node: "test/date",
    type: "test",

    requires: "date",

    token: "date",

    properties: [{
      id: "tags",
      optional: true,

      elements: [{
        id: "zone",
        type: "zone"
      }, {
        id: "match-type",
        type: "match-type"
      }, {
        id: "comparator",
        type: "comparator"
      }]
    }, {
      id: "parameters",

      elements: [{
        id: "header",
        type: "string",
        value: '"date"'
      }, {
        id: "datepart",
        type: "string",
        value: '"date"'
      }, {
        id: "keys",
        type: "stringlist",
        // the easiest way to get th current date in yyyy-mm-dd format
        value: '"' + new Date().toJSON().substring(0, "yyyy-mm-dd".length) + '"'
      }]
    }]
  });


  /* Usage:   currentdate [":zone" <time-zone: string>]
  [COMPARATOR] [MATCH-TYPE]
  <date-part: string>
  <key-list: string-list>
   */

  SieveGrammar.addTest({
    node: "test/currentdate",
    type: "test",

    requires: "date",

    token: "currentdate",

    properties: [{
      id: "tags",
      optional: true,

      elements: [{
        id: "zone",
        type: "zone"
      }, {
        id: "match-type",
        type: "match-type"
      }, {
        id: "comparator",
        type: "comparator"
      }]
    }, {
      id: "parameters",

      elements: [{
        id: "datepart",
        type: "string",
        value: '"date"'
      }, {
        id: "keys",
        type: "stringlist",
        value: '"' + new Date().toJSON().substring(0, "yyyy-mm-dd".length) + '"'
      }]
    }]
  });


  // TODO extend date by index tag (requires index)
  // Syntax:   date [":index" <fieldno: number> [":last"]]
  //                [<":zone" <time-zone: string>> / ":originalzone"]
  //                [COMPARATOR] [MATCH-TYPE] <header-name: string>
  //                <date-part: string> <key-list: string-list>


  // TODO extend header by index tag (requires index)
  // Syntax:   header [":index" <fieldno: number> [":last"]]
  //                  [COMPARATOR] [MATCH-TYPE]
  //                  <header-names: string-list> <key-list: string-list>

  // TODO extend address by index tag (requires index)
  // Syntax:   address [":index" <fieldno: number> [":last"]]
  //                   [ADDRESS-PART] [COMPARATOR] [MATCH-TYPE]
  //                   <header-list: string-list> <key-list: string-list>



})(window);
