
(function(exports) {
 
/*  function () {
  	
  	var request = new SieveStartTLSRequest();
    request.addStartTLSListener(this);
    request.addErrorListener(this);
    
    this.sieve.addRequest(request);
  }*/
  
  console.log('initializing');
  
  //var sieve = new Sieve();  
  //sieve.connect( "imap.1und1.com", 2000, true);
  
  document.getElementById("capability").addEventListener("click",function() { sieve.send()});
  document.getElementById("tls").addEventListener("click",function() { sieve.startTLS()});
  
  
  var account = {
    getHost : function() {  	
  	  return {
  		isTLSEnabled : function() {
  			return true;
  		},
        isTLSForced : function() {
  		   return false;
  	    },
  	    getHostname : function() {
  			return "pop.kundenserver.de";
  	    },
  	    getPort : function() {
  			return 2000;
  	    }
  	  }
  	},
  	
  	getLogin : function() {
  	  return {
  	  	hasUsername : function() {
  	  	  return true;
  	  	},
  	  	getUsername : function() {
  	  	  return "ccc@yyy.com"
  	  	},
  	  	getPassword : function() {
  	  	  return "abcp";
  	  	}
  	  }
  	},
  	
  	getAuthorization : function() {
  	  return {
  		getAuthorization : function() {
  		  return "";
  		}
  	  }
  	},
  	
  	getSettings : function () {
  	  return {
  		getDebugFlags : function() {
  		  return 255;
  		},
  		
  		hasForcedAuthMechanism : function() {
  		  return false;
  		},
  		
  		isKeepAlive : function() {
  		  return true;	
  		},
  		
  		getKeepAliveInterval : function() {
  		  return 20*60*1000;
  		}
  	  }
  	}
  };
  
  var session = (new SieveSession(account, "sid2"));  
  
  var listener = {
    onListScriptResponse : function(response)
    {
      console.error(response.getScripts());
    },  	
  	
  	onChannelCreated : function () {
  		
      var request = new SieveListScriptRequest();
      request.addListScriptListener(this);
      request.addErrorListener(this);
  
      session.sieve.addRequest(request);  	
  	}  	  	
  }
  
    
  session.addListener(listener);
  session.connect();  

})(window);