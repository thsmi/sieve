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

(function() {
	
  "use strict";
	/* global net */

  var suite  = net.tschmid.yautt.test;
    
  if (!suite)
    throw new Error( "Could not initialize test suite" );

  suite.add( function() {  	
  	suite.log("Vacation Unit Tests...");
  });    
  
  suite.add( function() {

    suite.log("Parse Vacation Example 1");
  
    var script = 
          'require "vacation";\r\n'
            + 'if header :contains "subject" "cyrus" {\r\n'
            + '    vacation "I\'m out -- send mail to cyrus-bugs";\r\n'
            + '} else {\r\n'
            + '    vacation "I\'m out -- call me at +1 304 555 0123";\r\n'
            + '}\r\n';
         
    suite.expectValidScript(script,{"vacation":true} );
  });   
     
  suite.add( function() {

    suite.log("Parse Vacation Example 2");
  
    var script = 
          'require ["vacation"];\r\n'
            + 'if header :matches "subject" "*" {\r\n'
            + '  vacation :subject "Automatic response to: ${1}"\r\n'
            + '           "I\'m away -- send mail to foo in my absence";\r\n'
            + '}\r\n';

    suite.expectValidScript(script,{"vacation":true} );
  });   
     
  suite.add( function() {

    suite.log("Parse Vacation Example 3");
  
    var script = 
          'require "vacation";\r\n'
            + 'if header :contains "subject" "lunch" {\r\n'
            + '    vacation :handle "ran-away" "I\'m out and can\'t meet for lunch";\r\n'
            + '} else {\r\n'
            + '    vacation :handle "ran-away" "I\'m out";\r\n'
            + '}\r\n';
         
    suite.expectValidScript(script,{"vacation":true} );
  });   
  
  
  suite.add( function() {

    suite.log("Parse Vacation Example 4");
  
    var script = 
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
         
    suite.expectValidScript(script,{"vacation":true} );
  });     
  
  suite.add( function() {

    suite.log("Parse Vacation Example 5");
  
    var script = 
          'require "vacation";\r\n'
             + 'vacation :days 23 :addresses ["tjs@example.edu",\r\n'
             + '                              "ts4z@landru.example.edu"]\r\n'
             + '"I\'m away until October 19.  If it\'s an emergency, call 911, I guess." ;\r\n';
         
    suite.expectValidScript(script,{"vacation":true} );
  });  

  suite.add( function() {

    suite.log("Parse Vacation Example 6 ");
  
    var script = 
          'require "vacation";\r\n'
             + 'if header :contains "from" "boss@example.edu" {\r\n'
             + '    redirect "pleeb@isp.example.org";\r\n'
             + '} else {\r\n'
             + '    vacation "Sorry, I\'m away, I\'ll read your\r\n'
             + 'message when I get around to it.";\r\n'
             + '}\r\n';
         
    suite.expectValidScript(script,{"vacation":true} );
  });  
  
  suite.add( function() {

    suite.log("Parse Vacation Example 7");
    
    var script = 
          'require "vacation";\r\n'
             + 'if header :contains ["accept-language", "content-language"] "en"\r\n'
             + '{\r\n'
             + '    vacation "I am away this week.";\r\n'
             + '} else {\r\n'
             + '    vacation "Estoy ausente esta semana.";\r\n'
             + '} \r\n';
         
    suite.expectValidScript(script,{"vacation":true} );
  });
  
  suite.add( function() {

    suite.log("Parse Vacation Example 8");
    
    var script = 
          'require "vacation";\r\n'
             + 'if address :matches "from" "*@ourdivision.example.com"\r\n'
             + '{\r\n'
             + '    vacation :subject "Gone fishing"\r\n'
             + '             "Having lots of fun! Back in a day or two!";\r\n'
             + '} else {\r\n'
             + '    vacation :subject "Je suis parti cette semaine"\r\n'
             + '             "Je lirai votre message quand je retourne.";\r\n'
             + '}\r\n';
         
    suite.expectValidScript(script,{"vacation":true} );
  });  
  
  suite.add( function() {

    suite.log("Parse Vacation :from ");
  
    var script = 
          'require "vacation";\r\n'
             + 'vacation :subject "Gone fishing"\r\n'
             + '         :from "myfallbackaddress@example.edu"\r\n'
             + '         "Having lots of fun! Back in a day or two!";\r\n';
         
    suite.expectValidScript(script,{"vacation":true} );
  });  
  
  suite.add( function () {
    suite.log( "Manipulate Vacation Element - No values set - Set all values" );

    var script =
      'require "vacation";\r\n'
      + 'vacation\r\n'
      + '         "Having lots of fun! Back in a day or two!";\r\n';

    var doc = suite.parseScript( script, { "vacation": true });

    var elms = doc.queryElements( "action/vacation" );

    suite.assertEquals( 1, elms.length, "Invalid number of vacation elements" );

    suite.assertEquals( 'Having lots of fun! Back in a day or two!', elms[0].getElement( "reason" ).value() );

    suite.assertEquals( '', elms[0].getElement( "subject" ).getElement( "subject" ).value() );
    suite.assertEquals( false, elms[0].enable( "subject" ) );

    suite.assertEquals( '', elms[0].getElement( "from" ).getElement( "from" ).value() );
    suite.assertEquals( false, elms[0].enable( "from" ) );

    suite.assertEquals( "7", elms[0].getElement( "days" ).getElement( "days" ).value() );
    suite.assertEquals( false, elms[0].enable( "days" ) );

    suite.assertEquals( '', elms[0].getElement( "handle" ).getElement( "handle" ).value() );
    suite.assertEquals( false, elms[0].enable( "handle" ) );

    suite.assertEquals( false, elms[0].enable( "mime" ) );

    //TODO Test and change the addresses
    elms[0].getElement( "reason" ).value( "some reason" );

    elms[0].getElement( "subject" ).getElement( "subject" ).value( "some subject" );
    elms[0].enable( "subject", true );

    elms[0].getElement( "from" ).getElement( "from" ).value( "some from" );
    elms[0].enable( "from", true );

    elms[0].getElement( "days" ).getElement( "days" ).value( 12 );
    elms[0].enable( "days", true );

    elms[0].getElement( "handle" ).getElement( "handle" ).value( "some handle" );
    elms[0].enable( "handle", true );

    elms[0].enable( "mime", true );


    var rv =
      'require "vacation";\r\n'
      + 'vacation :subject "some subject" :from "some from" :days 12 :handle "some handle" :mime\r\n'
      + '         "some reason";\r\n';

    suite.validateDocument( doc, rv, { "vacation": true });

    //elms[0].getElement( "addresses" ).getElement( "addresses" );
  });


  suite.add( function () {
    suite.log( "Manipulate Vacation Element - All values set - Change all values" );

    var script =
      'require "vacation";\r\n'
      + 'vacation :subject "Gone fishing"\r\n'
      + '         :from "myfallbackaddress@example.edu"\r\n'
      + '         :days 14\r\n'
      + '         :handle "some handle"\r\n'
      + '         :mime\r\n'
      + '         "Having lots of fun! Back in a day or two!";\r\n';

    var doc = suite.parseScript( script, { "vacation": true });

    var elms = doc.queryElements( "action/vacation" );

    suite.assertEquals( 1, elms.length, "Invalid number of vacation elements" );

    suite.assertEquals( 'Having lots of fun! Back in a day or two!', elms[0].getElement( "reason" ).value() );

    suite.assertEquals( 'Gone fishing', elms[0].getElement( "subject" ).getElement( "subject" ).value() );
    suite.assertEquals( true, elms[0].enable( "subject" ) );

    suite.assertEquals( 'myfallbackaddress@example.edu', elms[0].getElement( "from" ).getElement( "from" ).value() );
    suite.assertEquals( true, elms[0].enable( "from" ) );

    suite.assertEquals( "14", elms[0].getElement( "days" ).getElement( "days" ).value() );
    suite.assertEquals( true, elms[0].enable( "days" ) );

    suite.assertEquals( 'some handle', elms[0].getElement( "handle" ).getElement( "handle" ).value() );
    suite.assertEquals( true, elms[0].enable( "handle" ) );

    suite.assertEquals( true, elms[0].enable( "mime" ) );

    //TODO Test and change the addresses
    elms[0].getElement( "reason" ).value( "some other reason" );
    elms[0].getElement( "subject" ).getElement( "subject" ).value( "some other subject" );
    elms[0].getElement( "from" ).getElement( "from" ).value( "some other from" );
    elms[0].getElement( "days" ).getElement( "days" ).value( 12 );
    elms[0].getElement( "handle" ).getElement( "handle" ).value( "some other handle" );


    var rv =
      'require "vacation";\r\n'
      + 'vacation :subject "some other subject"\r\n'
      + '         :from "some other from"\r\n'
      + '         :days 12\r\n'
      + '         :handle "some other handle"\r\n'
      + '         :mime\r\n'
      + '         "some other reason";\r\n';
    
    suite.validateDocument( doc, rv, { "vacation": true });

    //elms[0].getElement( "addresses" ).getElement( "addresses" );
  });

  suite.add( function () {
    suite.log( "Manipulate Vacation Element - All values set - Remove all values" );

    var script =
      'require "vacation";\r\n'
      + 'vacation :subject "Gone fishing"\r\n'
      + '         :from "myfallbackaddress@example.edu"\r\n'
      + '         :days 14\r\n'
      + '         :handle "some handle"\r\n'
      + '         :mime\r\n'
      + '         "Having lots of fun! Back in a day or two!";\r\n';

    var doc = suite.parseScript( script, { "vacation": true });

    var elms = doc.queryElements( "action/vacation" );

    suite.assertEquals( 1, elms.length, "Invalid number of vacation elements" );

    suite.assertEquals( 'Having lots of fun! Back in a day or two!', elms[0].getElement( "reason" ).value() );

    suite.assertEquals( 'Gone fishing', elms[0].getElement( "subject" ).getElement( "subject" ).value() );
    suite.assertEquals( true, elms[0].enable( "subject" ) );

    suite.assertEquals( 'myfallbackaddress@example.edu', elms[0].getElement( "from" ).getElement( "from" ).value() );
    suite.assertEquals( true, elms[0].enable( "from" ) );

    suite.assertEquals( "14", elms[0].getElement( "days" ).getElement( "days" ).value() );
    suite.assertEquals( true, elms[0].enable( "days" ) );

    suite.assertEquals( 'some handle', elms[0].getElement( "handle" ).getElement( "handle" ).value() );
    suite.assertEquals( true, elms[0].enable( "handle" ) );

    suite.assertEquals( true, elms[0].enable( "mime" ) );
    
    elms[0].enable( "subject", false );
    elms[0].enable( "from", false );
    elms[0].enable( "days", false );
    elms[0].enable( "handle", false );
    elms[0].enable( "mime", false );

    var rv =
      'require "vacation";\r\n'
      + 'vacation\r\n'
      + '         "Having lots of fun! Back in a day or two!";\r\n';
    
    suite.validateDocument( doc, rv, { "vacation": true });
    
  });

  suite.add( function () {
    suite.log( "Validate vacation action's constructor" );

    var snipplet = 'vacation "";\r\n';
    suite.expectValidSnipplet( "action/vacation", snipplet/*,{ "variables": true }*/);
  });  


}());
