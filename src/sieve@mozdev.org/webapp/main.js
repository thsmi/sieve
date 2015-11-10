
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
  
  var account = new SieveAccount();
  
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