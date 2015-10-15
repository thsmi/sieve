"use strict"

if (!net)
  var net = {}
  
if (!net.tschmid)
  net.tschmid = {};
  
if (!net.tschmid.sieve)
  net.tschmid.sieve = {};

if (!net.tschmid.sieve.webapp)
  net.tschmid.sieve.webapp = {};  
  
(function() {

  function SieveWebApp() {  
  	this.editor = new net.tschmid.sieve.editor.glue("sivEditor");  	
  	
  	var that = this;
  	this.editor.setListener(this);
  }
	
  SieveWebApp.prototype = {
  	
    loadScript : function(script) {
      if (!script) {     	
        var date = new Date();
        script = "#\r\n# "+date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+"\r\n#\r\n";
      }
      
      this.editor.setScript(script);
	},
	
	getScript : function() {
		this.editor.getScript();
	},
	
	onGetScript: function(script) {
	  window.alert(script);
	},
	
	onChange : function() {
	}	
	
  }
  
  // We offer only a single instance...
  var instance = null;
  
  net.tschmid.sieve.webapp.getInstance = function() {
  	
  	if (!instance)
  	  instance = new SieveWebApp();
  	  
  	return instance;
  }
  
}());
