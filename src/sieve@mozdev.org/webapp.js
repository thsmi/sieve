/* 
 * The content of this file is licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via 
 * email from the author.
 * 
 * Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */
 
/* global chrome */
/* global window */

'use strict';

chrome.app.runtime.onLaunched.addListener(function() {
	
	window.open("./webapp/main.html");
  window.open("./common/libSieve/SieveGui.html");
  
  /*chrome.app.window.create('main.html', {
  	'id': 'SieveAppMain',
    'innerBounds': {
      'width': 880,
      'height': 500
    }
  });*/
});
