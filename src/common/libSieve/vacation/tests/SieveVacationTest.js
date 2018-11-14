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

  /* global net */

  let suite = net.tschmid.yautt.test;

  if (!suite)
    throw new Error("Could not initialize test suite");


  const ONE_ELEMENT = 1;
  const FIRST_ELEMENT = 0;


  suite.add(function () {
    suite.log("Vacation Unit Tests...");
  });

  suite.add(function () {

    suite.log("Parse Vacation Example 1");

    let script =
      'require "vacation";\r\n'
      + 'if header :contains "subject" "cyrus" {\r\n'
      + '    vacation "I\'m out -- send mail to cyrus-bugs";\r\n'
      + '} else {\r\n'
      + '    vacation "I\'m out -- call me at +1 304 555 0123";\r\n'
      + '}\r\n';

    suite.expectValidScript(script, ["vacation"]);
  });

  suite.add(function () {

    suite.log("Parse Vacation Example 2");

    let script =
      'require ["vacation"];\r\n'
      + 'if header :matches "subject" "*" {\r\n'
      + '  vacation :subject "Automatic response to: ${1}"\r\n'
      + '           "I\'m away -- send mail to foo in my absence";\r\n'
      + '}\r\n';

    suite.expectValidScript(script, ["vacation"]);
  });

  suite.add(function () {

    suite.log("Parse Vacation Example 3");

    let script =
      'require "vacation";\r\n'
      + 'if header :contains "subject" "lunch" {\r\n'
      + '    vacation :handle "ran-away" "I\'m out and can\'t meet for lunch";\r\n'
      + '} else {\r\n'
      + '    vacation :handle "ran-away" "I\'m out";\r\n'
      + '}\r\n';

    suite.expectValidScript(script, ["vacation"]);
  });


  suite.add(function () {

    suite.log("Parse Vacation Example 4");

    let script =
      'require "vacation";\r\n'
      + 'vacation :mime text:\r\n'
      + 'Content-Type: multipart/alternative; boundary=foo\r\n'
      + '\r\n'
      + '--foo\r\n'
      + '\r\n'
      + 'I\'m at the beach relaxing.  Mmmm, surf...\r\n'
      + '\r\n'
      + '--foo\r\n'
      + 'Content-Type: text/html; charset=us-ascii\r\n'
      + '\r\n'
      + '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0//EN"\r\n'
      + ' "http://www.w3.org/TR/REC-html40/strict.dtd">\r\n'
      + '<HTML><HEAD><TITLE>How to relax</TITLE>\r\n'
      + '<BASE HREF="http://home.example.com/pictures/"></HEAD>\r\n'
      + '<BODY><P>I\'m at the <A HREF="beach.gif">beach</A> relaxing.\r\n'
      + 'Mmmm, <A HREF="ocean.gif">surf</A>...\r\n'
      + '</BODY></HTML>\r\n'
      + '\r\n'
      + '--foo--\r\n'
      + '\r\n.\r\n'
      + ';\r\n';

    suite.expectValidScript(script, ["vacation"]);
  });

  suite.add(function () {

    suite.log("Parse Vacation Example 5");

    let script =
      'require "vacation";\r\n'
      + 'vacation :days 23 :addresses ["tjs@example.edu",\r\n'
      + '                              "ts4z@landru.example.edu"]\r\n'
      + '"I\'m away until October 19.  If it\'s an emergency, call 911, I guess." ;\r\n';

    suite.expectValidScript(script, ["vacation"]);
  });

  suite.add(function () {

    suite.log("Parse Vacation Example 6 ");

    let script =
      'require "vacation";\r\n'
      + 'if header :contains "from" "boss@example.edu" {\r\n'
      + '    redirect "pleeb@isp.example.org";\r\n'
      + '} else {\r\n'
      + '    vacation "Sorry, I\'m away, I\'ll read your\r\n'
      + 'message when I get around to it.";\r\n'
      + '}\r\n';

    suite.expectValidScript(script, ["vacation"]);
  });

  suite.add(function () {

    suite.log("Parse Vacation Example 7");

    let script =
      'require "vacation";\r\n'
      + 'if header :contains ["accept-language", "content-language"] "en"\r\n'
      + '{\r\n'
      + '    vacation "I am away this week.";\r\n'
      + '} else {\r\n'
      + '    vacation "Estoy ausente esta semana.";\r\n'
      + '} \r\n';

    suite.expectValidScript(script, ["vacation"]);
  });

  suite.add(function () {

    suite.log("Parse Vacation Example 8");

    let script =
      'require "vacation";\r\n'
      + 'if address :matches "from" "*@ourdivision.example.com"\r\n'
      + '{\r\n'
      + '    vacation :subject "Gone fishing"\r\n'
      + '             "Having lots of fun! Back in a day or two!";\r\n'
      + '} else {\r\n'
      + '    vacation :subject "Je suis parti cette semaine"\r\n'
      + '             "Je lirai votre message quand je retourne.";\r\n'
      + '}\r\n';

    suite.expectValidScript(script, ["vacation"]);
  });

  suite.add(function () {

    suite.log("Parse Vacation :from ");

    let script =
      'require "vacation";\r\n'
      + 'vacation :subject "Gone fishing"\r\n'
      + '         :from "myfallbackaddress@example.edu"\r\n'
      + '         "Having lots of fun! Back in a day or two!";\r\n';

    suite.expectValidScript(script, ["vacation"]);
  });

  suite.add(function () {
    suite.log("Manipulate Vacation Element - No values set - Set all values");

    let script =
      'require "vacation";\r\n'
      + 'vacation\r\n'
      + '         "Having lots of fun! Back in a day or two!";\r\n';

    let doc = suite.parseScript(script, ["vacation"]);

    let elms = doc.queryElements("action/vacation");

    suite.assertEquals(ONE_ELEMENT, elms.length, "Invalid number of vacation elements");

    suite.assertEquals('Having lots of fun! Back in a day or two!', elms[FIRST_ELEMENT].getElement("reason").value());

    suite.assertEquals('', elms[FIRST_ELEMENT].getElement("subject").getElement("subject").value());
    suite.assertEquals(false, elms[FIRST_ELEMENT].enable("subject"));

    suite.assertEquals('', elms[FIRST_ELEMENT].getElement("from").getElement("from").value());
    suite.assertEquals(false, elms[FIRST_ELEMENT].enable("from"));

    suite.assertEquals("7", elms[FIRST_ELEMENT].getElement("days").getElement("days").getValue());
    suite.assertEquals(false, elms[FIRST_ELEMENT].enable("days"));

    suite.assertEquals('', elms[FIRST_ELEMENT].getElement("handle").getElement("handle").value());
    suite.assertEquals(false, elms[FIRST_ELEMENT].enable("handle"));

    suite.assertEquals(false, elms[FIRST_ELEMENT].enable("mime"));

    // TODO Test and change the addresses
    elms[FIRST_ELEMENT].getElement("reason").value("some reason");

    elms[FIRST_ELEMENT].getElement("subject").getElement("subject").value("some subject");
    elms[FIRST_ELEMENT].enable("subject", true);

    elms[FIRST_ELEMENT].getElement("from").getElement("from").value("some from");
    elms[FIRST_ELEMENT].enable("from", true);

    elms[FIRST_ELEMENT].getElement("days").getElement("days").setValue(12);
    elms[FIRST_ELEMENT].enable("days", true);

    elms[FIRST_ELEMENT].getElement("handle").getElement("handle").value("some handle");
    elms[FIRST_ELEMENT].enable("handle", true);

    elms[FIRST_ELEMENT].enable("mime", true);


    let rv =
      'require "vacation";\r\n'
      + 'vacation :subject "some subject" :from "some from" :days 12 :handle "some handle" :mime\r\n'
      + '         "some reason";\r\n';

    suite.validateDocument(doc, rv, ["vacation"]);

    // elms[FIRST_ELEMENT].getElement( "addresses" ).getElement( "addresses" );
  });


  suite.add(function () {
    suite.log("Manipulate Vacation Element - All values set - Change all values");

    let script =
      'require "vacation";\r\n'
      + 'vacation :subject "Gone fishing"\r\n'
      + '         :from "myfallbackaddress@example.edu"\r\n'
      + '         :days 14\r\n'
      + '         :handle "some handle"\r\n'
      + '         :mime\r\n'
      + '         "Having lots of fun! Back in a day or two!";\r\n';

    let doc = suite.parseScript(script, ["vacation"]);

    let elms = doc.queryElements("action/vacation");

    suite.assertEquals(ONE_ELEMENT, elms.length, "Invalid number of vacation elements");

    suite.assertEquals('Having lots of fun! Back in a day or two!', elms[FIRST_ELEMENT].getElement("reason").value());

    suite.assertEquals('Gone fishing', elms[FIRST_ELEMENT].getElement("subject").getElement("subject").value());
    suite.assertEquals(true, elms[FIRST_ELEMENT].enable("subject"));

    suite.assertEquals('myfallbackaddress@example.edu', elms[FIRST_ELEMENT].getElement("from").getElement("from").value());
    suite.assertEquals(true, elms[FIRST_ELEMENT].enable("from"));

    suite.assertEquals("14", elms[FIRST_ELEMENT].getElement("days").getElement("days").getValue());
    suite.assertEquals(true, elms[FIRST_ELEMENT].enable("days"));

    suite.assertEquals('some handle', elms[FIRST_ELEMENT].getElement("handle").getElement("handle").value());
    suite.assertEquals(true, elms[FIRST_ELEMENT].enable("handle"));

    suite.assertEquals(true, elms[FIRST_ELEMENT].enable("mime"));

    // TODO Test and change the addresses
    elms[FIRST_ELEMENT].getElement("reason").value("some other reason");
    elms[FIRST_ELEMENT].getElement("subject").getElement("subject").value("some other subject");
    elms[FIRST_ELEMENT].getElement("from").getElement("from").value("some other from");
    elms[FIRST_ELEMENT].getElement("days").getElement("days").setValue(12);
    elms[FIRST_ELEMENT].getElement("handle").getElement("handle").value("some other handle");


    let rv =
      'require "vacation";\r\n'
      + 'vacation :subject "some other subject"\r\n'
      + '         :from "some other from"\r\n'
      + '         :days 12\r\n'
      + '         :handle "some other handle"\r\n'
      + '         :mime\r\n'
      + '         "some other reason";\r\n';

    suite.validateDocument(doc, rv, ["vacation"]);

    // elms[FIRST_ELEMENT].getElement( "addresses" ).getElement( "addresses" );
  });

  suite.add(function () {
    suite.log("Manipulate Vacation Element - All values set - Remove all values");

    let script =
      'require "vacation";\r\n'
      + 'vacation :subject "Gone fishing"\r\n'
      + '         :from "myfallbackaddress@example.edu"\r\n'
      + '         :days 14\r\n'
      + '         :handle "some handle"\r\n'
      + '         :mime\r\n'
      + '         "Having lots of fun! Back in a day or two!";\r\n';

    let doc = suite.parseScript(script, ["vacation"]);

    let elms = doc.queryElements("action/vacation");

    suite.assertEquals(ONE_ELEMENT, elms.length, "Invalid number of vacation elements");

    suite.assertEquals('Having lots of fun! Back in a day or two!', elms[FIRST_ELEMENT].getElement("reason").value());

    suite.assertEquals('Gone fishing', elms[FIRST_ELEMENT].getElement("subject").getElement("subject").value());
    suite.assertEquals(true, elms[FIRST_ELEMENT].enable("subject"));

    suite.assertEquals('myfallbackaddress@example.edu', elms[FIRST_ELEMENT].getElement("from").getElement("from").value());
    suite.assertEquals(true, elms[FIRST_ELEMENT].enable("from"));

    suite.assertEquals("14", elms[FIRST_ELEMENT].getElement("days").getElement("days").getValue());
    suite.assertEquals(true, elms[FIRST_ELEMENT].enable("days"));

    suite.assertEquals('some handle', elms[FIRST_ELEMENT].getElement("handle").getElement("handle").value());
    suite.assertEquals(true, elms[FIRST_ELEMENT].enable("handle"));

    suite.assertEquals(true, elms[FIRST_ELEMENT].enable("mime"));

    elms[FIRST_ELEMENT].enable("subject", false);
    elms[FIRST_ELEMENT].enable("from", false);
    elms[FIRST_ELEMENT].enable("days", false);
    elms[FIRST_ELEMENT].enable("handle", false);
    elms[FIRST_ELEMENT].enable("mime", false);

    let rv =
      'require "vacation";\r\n'
      + 'vacation\r\n'
      + '         "Having lots of fun! Back in a day or two!";\r\n';

    suite.validateDocument(doc, rv, ["vacation"]);

  });

  suite.add(function () {
    suite.log("Validate vacation action's constructor");

    let snipplet = 'vacation "";\r\n';
    suite.expectValidSnipplet("action/vacation", snipplet, ["vacation"]);
  });

})();
