
function SieveAccount() {	
}

SieveAccount.prototype = {
	
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
        return "abc@tschmid.net"
      },
      getPassword : function() {
        return "abc";
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