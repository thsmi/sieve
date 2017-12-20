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
  	suite.log("Sieve Variables (RFC5229) unit tests...");
  });    


  suite.add( function() {
  	
    suite.log("Simple Set Actions without modifiers");
      
    var script =
      'require ["variables"];\r\n'
        + 'set "dollar" "$";\r\n'
        + 'set "text" "regarding ${dollar}{beep}";';
    
   suite.expectValidScript(script,{"variables":true} ) ;
  });

  suite.add( function() {	
    
    suite.log("Complex Set Action without modifiers");
 
    var script =
      'require "variables";\r\n\r\n'
        +'set "honorific"  "Mr";\r\n'
        + 'set "first_name" "Wile";\r\n'
        + 'set "last_name"  "Coyote";\r\n'
        + 'set "vacation" text:\r\n'
        + 'Dear ${HONORIFIC} ${last_name},\r\n'
        + 'I\'m out, please leave a message after the meep.\r\n'
        + '.\r\n'
        + ';\r\n';
      
    suite.expectValidScript(script, {"variables":true});
  });
  
  suite.add( function() {

    suite.log("Complex Set Action with modifiers");    
  
    var script =
      'require "variables";\r\n\r\n'
        + '# The value assigned to the variable is printed after the arrow\r\n'
        + 'set "a" "juMBlEd lETteRS";\r\n'        //     => "juMBlEd lETteRS"
        + 'set :length "b" "${a}";\r\n'           //     => "15"
        + 'set :lower "b" "${a}";\r\n'            //     => "jumbled letters"
        + 'set :upperfirst "b" "${a}";\r\n'       //     => "JuMBlEd lETteRS"
        + 'set :upperfirst :lower "b" "${a}";\r\n'//     => "Jumbled letters"
        + 'set :quotewildcard "b" "Rock*";\r\n';  //     => "Rock\*"      
      
    suite.expectValidScript(script, {"variables":true});
  });

  
//  suite.add( function() {
//    suite.log("Parse :contains match-type");
// 
//    var script = 
//      'require ["encoded-character", "variables"];\r\n'
//        + 'set "name" "Ethelbert"\r\n'
//        + 'if header :contains "Subject" "dear${hex:20 24 7b 4e}ame}" {\r\n'
//        + '    # the test string is "dear Ethelbert"\r\n'
//        + '}\r\n'    
//      
//    testScript(script);
//  });


  suite.add( function() {
    suite.log("Match Variables Example");
  
    var script = 
      'require ["fileinto" /*, "variables"*/];\r\n'
        + '\r\n'
        + 'if header :matches "List-ID" "*<*@*" {\r\n'
        + '    fileinto "INBOX.lists.${2}"; stop;\r\n'
        + '}\r\n'
        + '\r\n'
        + '# Imagine the header\r\n'
        + '# Subject: [acme-users] [fwd] version 1.0 is out\r\n'
        + 'if header :matches "Subject" "[*] *" {\r\n'
        + '    # ${1} will hold "acme-users",\r\n'
        + '    # ${2} will hold "[fwd] version 1.0 is out"\r\n'
        + '    fileinto "INBOX.lists.${1}"; stop;\r\n'
        + '}\r\n'
        + '\r\n'
        + '# Imagine the header\r\n'
        + '# To: coyote@ACME.Example.COM\r\n'
        + 'if address :matches ["To", "Cc"] ["coyote@**.com",\r\n'
        + '        "wile@**.com"] {\r\n'
        + '    # ${0} is the matching address\r\n'
        + '    # ${1} is always the empty string\r\n'
        + '    # ${2} is part of the domain name ("ACME.Example")\r\n'
        + '    fileinto "INBOX.business.${2}"; stop;\r\n'
        + '} else {\r\n'
        + '    # Control wouldn\'t reach this block if any match was\r\n'
        + '    # successful, so no match variables are set at this\r\n'
        + '    # point.\r\n'
        + '}\r\n'
        + '\r\n'
        + 'if anyof (true, address :domain :matches "To" "*.com") {\r\n'
        + '    # The second test is never evaluated, so there are\r\n'
        + '    # still no match variables set.\r\n'
        + '    stop;\r\n'
        + '}\r\n';
        
    suite.expectValidScript(script,{/*"variables":true,*/ "fileinto":true});        
  });

  

  suite.add( function() {

    suite.log("Test string");
   
    var script =
      'require "variables";\r\n'
        + 'set "state" "${state} pending";\r\n'
        + 'if string :matches " ${state} " "* pending *" {\r\n'
        + '    # the above test always succeeds\r\n'
        + '}\r\n';    
      
    suite.expectValidScript(script, {"variables":true});
  });  
  
  suite.add( function () {

    suite.log( "Manipulate SetVariable - No values set - Set all values (upper)" );

    var script = ''
      + 'require "variables";\r\n'
      + 'set "b" "${a}";\r\n';

    var doc = suite.parseScript( script, { "variables": true });

    var elms = doc.queryElements( "action/set" );

    suite.assertEquals( 1, elms.length, "Invalid number of set variable elements" );

    elms[0].enable( "modifier/10", true );
    elms[0].getElement( "modifier/10" ).setValue( ":length" );

    elms[0].enable( "modifier/20", true );
    elms[0].getElement( "modifier/20" ).setValue( ":quotewildcard" );

    elms[0].enable( "modifier/30", true );
    elms[0].getElement( "modifier/30" ).setValue( ":upperfirst" );

    elms[0].enable( "modifier/40", true );
    elms[0].getElement( "modifier/40" ).setValue( ":upper" );

    var rv =
      'require "variables";\r\n'
      + 'set :length :quotewildcard :upperfirst :upper "b" "${a}";\r\n';

    suite.validateDocument( doc, rv, { "variables": true });
  });

  suite.add( function () {

    suite.log( "Manipulate SetVariable - No values set - Set all values (lower)" );

    var script = ''
      + 'require "variables";\r\n'
      + 'set "b" "${a}";\r\n';

    var doc = suite.parseScript( script, { "variables": true });

    var elms = doc.queryElements( "action/set" );

    suite.assertEquals( 1, elms.length, "Invalid number of set variable elements" );

    elms[0].enable( "modifier/10", true );
    elms[0].getElement( "modifier/10" ).setValue( ":length" );

    elms[0].enable( "modifier/20", true );
    elms[0].getElement( "modifier/20" ).setValue( ":quotewildcard" );

    elms[0].enable( "modifier/30", true );
    elms[0].getElement( "modifier/30" ).setValue( ":lowerfirst" );

    elms[0].enable( "modifier/40", true );
    elms[0].getElement( "modifier/40" ).setValue( ":lower" );

    var rv =
      'require "variables";\r\n'
      + 'set :length :quotewildcard :lowerfirst :lower "b" "${a}";\r\n';

    suite.validateDocument( doc, rv, { "variables": true });
  });

  suite.add( function () {

    suite.log( "Manipulate SetVariable - All values set - Remove all values" );

    var script = ''
      + 'require "variables";\r\n'
      + 'set :length :quotewildcard :lowerfirst :lower "b" "${a}";\r\n';

    var doc = suite.parseScript( script, { "variables": true });

    var elms = doc.queryElements( "action/set" );

    suite.assertEquals( 1, elms.length, "Invalid number of set variable elements" );

    elms[0].enable( "modifier/10", false );
    elms[0].getElement( "modifier/10" ).setValue();

    elms[0].enable( "modifier/20", false );
    elms[0].getElement( "modifier/20" ).setValue();

    elms[0].enable( "modifier/30", false );
    elms[0].getElement( "modifier/30" ).setValue();

    elms[0].enable( "modifier/40", false );
    elms[0].getElement( "modifier/40" ).setValue();

    elms[0].getElement( "name" ).value( "Name" );
    elms[0].getElement( "value" ).value( "Value" );

    var rv =
      'require "variables";\r\n'
      + 'set "Name" "Value";\r\n';

    suite.validateDocument( doc, rv, { "variables": true });
  });

  /*suite.add( function () {

    suite.log( "Manipulate SetVariable - All values set - Change all values" );

    var script = ''
      + 'require "variables";\r\n'
      + 'set :upperfirst "b" "${a}";\r\n';
    
    var doc = suite.parseScript( script, { "variables": true });

    var elms = doc.queryElements( "action/set" );

    suite.assertEquals( 1, elms.length, "Invalid number of set variable elements" );

    elms[0].enable( "modifier/10", true );
    elms[0].getElement( "modifier/10" ).setValue( ":length" );

    elms[0].enable( "modifier/20", true );
    elms[0].getElement( "modifier/20" ).setValue( ":quotewildcard" );

    elms[0].enable( "modifier/30", true );
    elms[0].getElement( "modifier/30" ).setValue( ":upperfirst" );

    elms[0].enable( "modifier/40", true );
    elms[0].getElement( "modifier/40" ).setValue( ":upper" );
    
    var rv =
      'require "variables";\r\n'
      + 'set "b" "${a}";\r\n';
    
    suite.validateDocument( doc, rv, { "variables": true });
  });*/

  suite.add( function () {
    suite.log( "Validate set action constructors" );

    var snipplet = 'set "variable" "";\r\n';
    suite.expectValidSnipplet( "action/set", snipplet /*,{ "variables": true }*/);
  });

  suite.add( function () {
    suite.log( "Validate string test constructors" );

    var snipplet = 'string "" ""';
    suite.expectValidSnipplet( "test/string", snipplet/*,{ "variables": true }*/);
  });

}());

