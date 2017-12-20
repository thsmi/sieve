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

( function () {

    "use strict";

    /* global net */

    var suite = net.tschmid.yautt.test;

    if ( !suite )
        throw new Error( "Could not initialize test suite" );

    suite.add( function () {
        suite.log( "Editheader Unit Tests..." );
    });

    /*suite.add( function () {

        suite.log( "RFC5293 Sniplet I" );

        var script = ""
            + 'require ["editheader"];\r\n'
            + '// Don\'t redirect if we already redirected'
            + 'if not header :contains "X-Sieve-Filtered"\r\n'
            + '        ["<kim@job.example.com>", "<kim@home.example.com>"]\r\n'
            + '{\r\n'
            + '        addheader "X-Sieve-Filtered" "<kim@job.example.com>";\r\n'
            + '        redirect "kim@home.example.com";\r\n'
            + '}\r\n';

        suite.expectValidScript( script, { "editheader": true });
    });*/

    suite.add( function () {

        suite.log( "RFC5293 Sniplet II" );

        var script = ""
            + 'require ["editheader"];\r\n'
            //+ 'addheader "X-Hello" "World";\r\n'
            + 'deleteheader :index 1 "X-Hello";\r\n';
        
        suite.expectValidScript( script, { "editheader": true });
    });

    suite.add( function () {

        suite.log( "RFC5293 Sniplet III" );

        var script = ""
            + 'require ["editheader"];\r\n'
            + 'deleteheader :index 1 "X-Hello";\r\n'
            + 'deleteheader :index 2 "X-Hello";\r\n';

        suite.expectValidScript( script, { "editheader": true });
    });

    suite.add( function () {

        suite.log( "RFC5293 Sniplet IV" );

        var script = ""
            + 'require ["editheader", "fileinto"];\r\n'
            + 'addheader "X-Hello" "World";\r\n'
            + 'if header :contains "X-Hello" "World"\r\n'
            + '{\r\n'
            + '        fileinto "international";\r\n'
            + '}\r\n';

        suite.expectValidScript( script, { "editheader": true, "fileinto": true });
    });

    suite.add( function () {

        suite.log( "RFC5293 Sniplet V" );

        var script = ""
            + 'require ["editheader"];\r\n'
            + 'keep;\r\n'
            + 'addheader "X-Flavor" "vanilla";\r\n'
            + 'keep;\r\n';

        suite.expectValidScript( script, { "editheader": true });
    });

    suite.add( function () {

        suite.log( "RFC5293 Sniplet VI" );

        var script = ""
            + 'require ["editheader"];\r\n'
            + 'deleteheader :index 1 :contains "Delivered-To"\r\n'
            + '                        "bob@example.com";\r\n';

        suite.expectValidScript( script, { "editheader": true });
    });

}() );

