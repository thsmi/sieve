/*const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;*/

Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader) 
    .loadSubScript("chrome://sieve/content/libs/libManageSieve/SieveWatchDog.js");

Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader) 
    .loadSubScript("chrome://sieve/content/libs/libManageSieve/SieveAccounts.js");
    
Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader) 
    .loadSubScript("chrome://sieve/content/libs/libManageSieve/SieveRequest.js");
    
Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader) 
    .loadSubScript("chrome://sieve/content/libs/libManageSieve/SieveResponseParser.js");
    
Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader) 
    .loadSubScript("chrome://sieve/content/libs/libManageSieve/SieveResponseCodes.js");

Cc["@mozilla.org/moz/jssubscript-loader;1"]
    .getService(Ci.mozIJSSubScriptLoader) 
    .loadSubScript("chrome://sieve/content/libs/libManageSieve/SieveResponse.js");
    
function SieveSession(account,sid)
{
  this.idx = 0;
  this.sieve = Cc["@sieve.mozdev.org/transport;1"]
                   .createInstance().wrappedJSObject;
  // Step 1: Register logging facility...
  this.logger = Cc["@mozilla.org/consoleservice;1"]
                    .getService(Ci.nsIConsoleService);
  this.account = account;
  this.sid = sid;
}

SieveSession.prototype = 
{  
  onIdle: function ()
  { 
    // redirect to window managing the session...
    /*if ((this.listener) && (this.listener.onIdle))
     this.listener.onIdle(this.sieve);*/
 
    // as we send a keep alive request, we don't care
    // about the response...
    var request = null;
    
    if (this.sieve.getCompatibility().noop)
      request = new SieveNoopRequest();
    else
      request = new SieveCapabilitiesRequest();
  
    this.sieve.addRequest(request);      
  },
    
  onWatchDogTimeout : function()
  {
    // call sieve object indirect inorder to prevent a 
    // ring reference and threading issues
    this.sieve.onWatchDogTimeout();
  },

  onInitResponse: function(response)
  {
    // establish a secure connection if TLS ist enabled and if the Server ...
    // ... is capable of handling TLS, otherwise simply skip it and ...
    // ... use an insecure connection
    
    this.sieve.setCompatibility(response.getCapabilities());
    
    if (this.account.getHost().isTLS() && response.getTLS())
    {
      var request = new SieveStartTLSRequest();
      request.addStartTLSListener(this);
      request.addErrorListener(this);
      
      this.sieve.addRequest(request);
      
      return;
    }
    
    this.onAuthenticate(response);
  },
  
  onAuthenticate: function(response)
  {
    this.listener.onChannelStatus(3,"progress.authenticating");
    var account =  this.account;
    
    // Without a username, we can skip the authentication 
    if (account.getLogin().hasUsername() == false)
    {
      this.onLoginResponse(null);
      return;
    }
    

    if (this.listener && this.listener.onChannelStatus)
      this.listener.onChannelStatus(7,response);
    // TODO Update Capabilies...
    /*document.getElementById('txtSASL').value
        = response.getSasl();
    document.getElementById('txtExtensions').value    
        = response.getExtensions(); 
    document.getElementById('txtImplementation').value 
        = response.getImplementation();
    document.getElementById('txtVersion').value
        = response.getVersion();*/

    // We have to figure out which ist the best SASL Mechanism for the login ...
    // ... therefore we check first whether a mechanism is forced by the user ...
    // ... if no one is specified, we follow the rfc advice and use the first 
    // .... mechanism listed in the capability response we support.
    
    var mechanism = [];        
    if (account.getSettings().hasForcedAuthMechanism())
      mechanism = [account.getSettings().getForcedAuthMechanism()];      
    else
      mechanism = response.getSasl();

    // ... translate the SASL Mechanism String into an SieveSaslLogin Object ...      
    var request = null;
    while((mechanism.length > 0) && (request == null))
    {
      // remove and test the first element...
      switch (mechanism.shift().toLowerCase())
      {
        case "plain":
          request = new SieveSaslPlainRequest();
          request.addSaslPlainListener(this);      
          break;
        case "crammd5":
          request = new SieveSaslCramMd5Request();
          request.addSaslCramMd5Listener(this);
          break;          
        case "login":
          // we use SASL LOGIN only as last resort...
          // ... as suggested in the RFC.        
          if (mechanism.length > 0)
          {
            mechanism.push("login");
            break;
          }
          request = new SieveSaslLoginRequest();      
          request.addSaslLoginListener(this);
          break;
      }      
    }

    if (request == null)
    {
      //TODO Fix me... 
      sivDisconnect(2, "error.sasl");
      return;
    }
    
    request.addErrorListener(this);
    request.setUsername(account.getLogin().getUsername())
    
    var password = account.getLogin().getPassword();
    
    if (password == null)
    {
      //TODO Fix me...
      sivDisconnect(2, "error.authentication");
      return;
    }
      
    request.setPassword(password);
    
    // check if the authentication method supports proxy authorization...
    if (request.isAuthorizable())
    {
      // ... if so retrieve the authorization identity   
      var authorization = account.getAuthorization().getAuthorization();
      if (authorization == null)
      {
        sivDisconnect(2, "error.authentication");
        return;
      }
      
      request.setAuthorization(authorization);
    }
     
    this.sieve.addRequest(request);       
    
  },

  onStartTLSResponse : function(response)
  {
    // As we are an object we can't use this...
    // it would refer to lEvent instead of SieveSession
    var that = this;
    // workaround for timsieved bug...
    var lEvent = 
    {
      onInitResponse: function(response)
      {
        that.listener.onChannelStatus(3,"progress.tls.rfc");
        
        that.sieve.getWatchDogListener().setTimeoutInterval();
        that.onAuthenticate(response);
      },
      
      onError: function(response)
      {
        that.sieve.getWatchDogListener().setTimeoutInterval();
        that.onError(response);
      },
      
      onTimeout: function()
      {
        that.listener.onChannelStatus(3,"progress.tls.cyrus");
        
        that.sieve.getWatchDogListener().setTimeoutInterval();
        var request = new SieveCapabilitiesRequest();
        request.addCapabilitiesListener(that);
        request.addErrorListener(that);  
    
        that.sieve.addRequest(request);
      }     
    }
        
    // after calling startTLS the server will propagate his capabilities...
    // ... like at the login, therefore we reuse the SieveInitRequest
    
    // some revision of timsieved fail to resissue the capabilities...
    // ... which causes the extension to be jammed. Therefore we have to ...
    // ... do a rather nasty workaround. The jammed extension causes a timeout,
    // ... we catch this timeout and continue as if nothing happend...
    
    var compatibility = this.account.getSettings().getCompatibility(); 
    
    switch (compatibility.getHandshakeMode())
    {
      case 0:
        this.listener.onChannelStatus(3,"progress.tls.auto");      
        var request = new SieveInitRequest();
        request.addInitListener(lEvent);
        request.addErrorListener(lEvent);
        
        this.sieve.getWatchDogListener().setTimeoutInterval(compatibility.getHandshakeTimeout());
        this.sieve.addRequest(request);
            
        this.sieve.startTLS();   
        break;
        
      case 1:
        this.listener.onChannelStatus(3,"progress.tls.rfc");
             
        var request = new SieveInitRequest();
        request.addInitListener(lEvent);
        request.addErrorListener(this);  
        this.sieve.addRequest(request);
    
        // activate TLS
        this.sieve.startTLS();
        
        break;
      case 2:
        this.listener.onChannelStatus(3,"progress.tls.cyrus");
        //sivSetStatus(3,"progress.tls.cyrus");
      
        this.sieve.startTLS();
      
        var request = new SieveCapabilitiesRequest();
        request.addCapabilitiesListener(this);
        request.addErrorListener(this);  
    
        this.sieve.addRequest(request);
        break;
    }
  },
  
  onCapabilitiesResponse: function(response)
  {
    this.onAuthenticate(response);
  },
  
  onSaslLoginResponse: function(response)
  {
    this.onLoginResponse(response);
  },
  
  onSaslPlainResponse: function(response)
  {
    this.onLoginResponse(response);
  },

  onSaslCramMd5Response: function(response)
  {
    this.onLoginResponse(response);
  },
   
  onLoginResponse: function(response)
  {
    if (this.listener)
      this.listener.onChannelCreated(this.sieve);    
  },
  
  onLogoutResponse: function(response)
  {
    if (this.sieve)
      this.sieve.disconnect();
      
    this.sieve = null;
  },
  
  onError: function(response)
  {      
    var code = response.getResponseCode();

    if (code instanceof SieveResponseCodeReferral)
    {
      // We skip sending a logout message, this speeds up the referral 
      this.disconnect(true);      
      this.connect(this.account,code.getHostname);
      
      return;
    }

    this.logger.logStringMessage("OnError: "+response.getMessage());
    
    // TODO FixMe:
    /*sivDisconnect(4,response.getMessage());*/

    // Kill the session, in case the sieve object terminated...
    if ((this.sieve) || !(this.sieve.isAlive()))
      this.onLogoutResponse(null);
    
    if (this.listener && this.listener.onChannelError)
      this.listener.onChannelError(); 
  },
  
  /**************/
    
  connect : function(hostname)
  {
    if (this.sieve.isAlive())
    {        
      this.onLoginResponse(null);
     
      return;
    }
    
    // Step 1: Setup configure settings
    this.sieve.setDebugLevel(
        this.account.getSettings().getDebugFlags(),
        this.logger);
                   
    // Step 2: Create a Watchdog Instance...
    this.watchDog = null;
  
    // TODO load Timeout interval from account settings...
    if (this.account.getSettings().isKeepAlive(this.account.getSettings()))
      this.watchDog = new SieveWatchDog(20000,this.account.getSettings().getKeepAliveInterval());
    else
      this.watchDog = new SieveWatchDog(20000);
     
    this.watchDog.addListener(this);
  
    this.sieve.addWatchDogListener(this.watchDog);    
  
    // Step 3: Initialize Message Queue...
    var request = new SieveInitRequest();
    request.addErrorListener(this)
    request.addInitListener(this)
    this.sieve.addRequest(request);   

    // Step 4: Connect...
    if (hostname == null)
      hostname = this.account.getHost().getHostname();
      
    this.sieve.connect(
        hostname,this.account.getHost().getPort(),
        this.account.getHost().isTLS(),
        this,
        this.account.getProxy().getProxyInfo());    
  },
  
  disconnect : function(force)
  {
    if (force)
      return this.onLogoutResponse(null);
    
    if (!(this.sieve) || !(this.sieve.isAlive()))
      return this.onLogoutResponse(null);
      
    var request = new SieveLogoutRequest();
    request.addLogoutListener(this);
    /*request.addErrorListener(levent);*/
    this.sieve.addRequest(request);    
  },
    
  /****/
  addChannel : function()
  {
    
    if (!this.channels)
      this.channels = new Array();
      
    var cid = "cid="+(this.idx++);
    
    this.channels.push(cid);     
     
    this.logger.logStringMessage("Channel Added: "+this.sid+"/"+cid+" ["+this.channels+"]");
     
    return cid;
  },
  
  removeChannel : function(cid)
  { 
    if (!this.channels)
      return false
      
    var i = this.channels.indexOf(cid)
    if (i == -1)
      return false;
      
    this.channels.splice(i, 1);
    
    this.logger.logStringMessage("Channel Closed: "+this.sid+"/"+cid+" ["+this.channels+"]");
     
    return true;
  },
  
  hasChannels : function()
  { 
    if ((this.channels) && (this.channels.length > 0))
      return true;
      
    return false;
  },
  
  hasChannel : function(cid)
  {
    return (this.channels.indexOf(cid) == -1)?false:true;    
  },
  
  QueryInterface :  function badcert_queryinterface(aIID)
  {
    if (aIID.equals(Ci.nsISupports))
      return this;
      
    if (aIID.equals(Ci.nsIBadCertListener2))
      return this;
    if (aIID.equals(Ci.nsISSLErrorListener))
      return this;
      
    if (aIID.equals(Ci.nsIInterfaceRequestor))
      return this;
      
    // Deprecated interface used needed for Gecko 1.8 (Thunderbird 2)
    if (aIID.equals(Ci.nsIBadCertListener))
      return this;
      
    throw Components.results.NS_ERROR_NO_INTERFACE;
  },
  
  // Ci.nsIInterfaceRequestor
  getInterface : function (aIID)
  {
    return this.QueryInterface(aIID);
  },  
  
  // Implement nsIBadCertListener2 Interface to override
  
  // the "bad cert" dialog. The the connection will be closed
  // after an Certificate error...
  /**
   * @param {} socketInfo
   * @param {} sslStatus
   * @param {String} targetSite
   * @return {Boolean}
   */
  notifyCertProblem : function (socketInfo, sslStatus, targetSite)
  {
    if (this.logger != null)
      this.logger.logStringMessage("Sieve BadCertHandler: notifyCertProblem");
  
    // no listener registert, show the default UI 
    if ( !(this.listener) || !(this.listener.onBadCert))
      return false;
      
    // otherwise call the listener and supress the default UI
    this.listener.onBadCert(targetSite,sslStatus);
    return true;
  },
  
  // Implement nsISSLErrorListener
  /**
   * 
   * @param {} socketInfo
   * @param {} error
   * @param {} targetSite
   * @return {Boolean}
   */
  notifySSLError : function (socketInfo, error, targetSite)
  {
    if (this.logger != null)
      this.logger.logStringMessage("Sieve BadCertHandler: notifySSLError");
    
    // no listener registert, show the default UI 
    if ( !(this.listener) || !(this.listener.onBadCert))
      return false;

    // otherwise call the listener and supress the default UI
    this.listener.onBadCert(targetSite,error);
    return true;
  },
  
  // Implement nsIBadCertListener for TB2 / Gecko 1.8 compatibility
  /**
   * @deprecated Interface removed since Gecko 1.9.1 (Thunderbird 3)
   * @param {} socketInfo
   * @param {} cert
   * @return {Boolean}
   */
  confirmCertExpired : function(socketInfo, cert) 
  {
    if (this.logger != null)
      this.logger.logStringMessage("Sieve BadCertHandler: Expired certificate");

    return true;
  },

  /**
   * @deprecated Interface removed since Gecko 1.9.1 (Thunderbird 3)
   * @param {} socketInfo
   * @param {} targetURL
   * @param {} cert
   * @return {Boolean}
   */
  confirmMismatchDomain : function(socketInfo, targetURL, cert) 
  {
    if (this.logger != null)
      this.logger.logStringMessage("Sieve BadCertHandler: Mismatched domain");

    return true;
  },
 
  /**
   * @deprecated Interface removed since Gecko 1.9.1 (Thunderbird 3)
   * @param {} socketInfo
   * @param {} cert
   * @param {} certAddType
   * @return {Boolean}
   */
  confirmUnknownIssuer : function(socketInfo, cert, certAddType) 
  { 
    if (this.logger != null)
      this.logger.logStringMessage("Sieve BadCertHandler: Unknown issuer");
      
    return true;
  },
  
  /**
   * @deprecated Interface removed since Gecko 1.9.1 (Thunderbird 3)
   * @param {} socketInfo
   * @param {String} targetURL
   * @param {} cert
   */
  notifyCrlNextupdate : function(socketInfo, targetURL, cert) 
  {
    if (this.logger != null)
      this.logger.logStringMessage("Sieve BadCertHandler: notifyCrlNextupdate");
  }  

}