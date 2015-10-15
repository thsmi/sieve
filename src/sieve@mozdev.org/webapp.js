'use strict';

chrome.app.runtime.onLaunched.addListener(function() {
	
  window.open("./webapp/main4.html");
  
  /*chrome.app.window.create('main.html', {
  	'id': 'SieveAppMain',
    'innerBounds': {
      'width': 880,
      'height': 500
    }
  });*/
});
