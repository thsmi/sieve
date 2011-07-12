/*const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;*/

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

/**
 * This class pools and caches concurrent connections (Channel) to an destinct 
 * remote server (Session).
 * Furthermore it's a wrapper around the Sieve object. It implements
 * the login/logout process, a watchdog, an hartbeat an much more. 
 * 
 * A session can contain arbitary connections, but there will be only one 
 * "physical" link to the server. All channels share the session's link.
 * 
 * @param {SieveAccount} account
 *   an reference to a sieve account. this is needed to obtain login informations.
 * @param @optional {Object} sid
 *   a unique Identifier for this Session. Only neede to make debugging easyer.
 *   
 */
function SieveSession(accountId,sid)
{
  this.idx = 0;

  // Load Account by ID
  this.account = (new SieveAccounts()).getAccount(accountId);
  
  this.debug = {};
  this.debug.level = this.account.getSettings().getDebugFlags();
  
  // Use an empty logger stub, it makes the logger easily exchangable...
  // ... this.logger.logString is garanteed to exist within this file.
  this.debug.logger = {}
  //this.debug.logger.logStringMessage = function(msg) { };

  /*this.debug.logger = Cc["@mozilla.org/consoleservice;1"]
    .getService(Ci.nsIConsoleService);*/
  
  /*this.debug.logger = {}
  this.debug.logger.logStringMessage = function(msg) {
    Cc["@mozilla.org/embedcomp/prompt-service;1"]
      .getService(Components.interfaces.nsIPromptService)
      .alert(null, "Alert", msg);
  }*/
  
  this.debug.logger = {}
  this.debug.logger.logStringMessage = function(msg) {
    Cc["@mozilla.org/consoleservice;1"]
      .getService(Ci.nsIConsoleService)
      .logStringMessage("["+sid+"] "+msg);
  }
  
  this.sid = sid;
}

SieveSession.prototype = 
{
  onIdle: function ()
  {
    // as we send a keep alive request, we don't care
    // about the response...
    var request = null;
    
    if (this.sieve.getCompatibility().noop)
      request = new SieveNoopRequest();
    else
      request = new SieveCapabilitiesRequest();
    
    this.sieve.addRequest(request);
  },

  onInitResponse: function(response)
  {
    // establish a secure connection if TLS ist enabled and if the Server ...
    // ... is capable of handling TLS, otherwise simply skip it and ...
    // ... use an insecure connection
    
    if (!this.account.getHost().isTLSEnabled())
    {
      this.onAuthenticate(response);
      return;
    }
    
    if (!response.getTLS() && !this.account.getHost().isTLSForced())
    {
      this.onAuthenticate(response);
      return;
    }
    
    var request = new SieveStartTLSRequest();
    request.addStartTLSListener(this);
    request.addErrorListener(this);
    
    this.sieve.addRequest(request);
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
    

    // Notify the listener to display capabilities. We simply pass the response... 
    // ... to the listener. So the listener can pick whatever he needs.
    if (this.listener && this.listener.onChannelStatus)
      this.listener.onChannelStatus(7,response);

    // We have to figure out which ist the best SASL Mechanism for the login ...
    // ... therefore we check first whether a mechanism is forced by the user ...
    // ... if no one is specified, we follow the rfc advice and use the first 
    // .... mechanism listed in the capability response we support.
    
    var mechanism = [];        
    if (account.getSettings().hasForcedAuthMechanism())
      mechanism = [account.getSettings().getForcedAuthMechanism()];      
    else
      mechanism = response.getSasl();

    // ... translate the SASL Mechanism into an SieveSaslLogin Object ...      
    var request = null;
    while((mechanism.length > 0) && (request == null))
    {
      // remove and test the first element...
      switch (mechanism.shift().toUpperCase())
      {
        case "PLAIN":
          request = new SieveSaslPlainRequest();
          request.addSaslPlainListener(this);      
          break;
          
        case "CRAM-MD5":
          request = new SieveSaslCramMd5Request();
          request.addSaslCramMd5Listener(this);
          break;
          
        case "LOGIN":
          // we use SASL LOGIN only as last resort...
          // ... as suggested in the RFC.        
          if (mechanism.length > 0)
          {
            mechanism.push("LOGIN");
            break;
          }
          request = new SieveSaslLoginRequest();      
          request.addSaslLoginListener(this);
          break;
      }      
    }

    if (request == null)
    {
      this.disconnect(false,2,"error.sasl");
      return;
    }
    
    request.addErrorListener(this);
    request.setUsername(account.getLogin().getUsername())
    
    var password = account.getLogin().getPassword();
    
    if (password == null)
    {
      this.disconnect(false,2,"error.authentication")
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
        this.disconnect(false,2,"error.authentication");
        return;
      }
      
      request.setAuthorization(authorization);
    }
     
    this.sieve.addRequest(request);    
  },

  onStartTLSResponse : function(response)
  { 
    this.sieve.startTLS();

    var that = this;
    
    var lEvent = 
    {
      onCapabilitiesResponse: function(response)
      {        
        that.onAuthenticate(response); 
      }
    }
    
    // explicitely request capabilites
    var request = new SieveCapabilitiesRequest();
    request.addCapabilitiesListener(lEvent);
    
    this.sieve.addRequest(request);
    
    // With a bugfree server we endup with two capability request, one 
    // implicit after startTLS and one explicite from capbilites. So we have
    // to consume one of them silently...
    this.sieve.addRequest(new SieveInitRequest(),true);
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

  /** @private */  
  onLogoutResponse: function(response)
  {
    this.disconnect(true);
  },
  
  /**
   * Called by the sieve object in case we received an BYE response.
   * @param {} response
   */
  onByeResponse: function(response)
  {
    // The server is going to disconnected our session nicely...
    var code = response.getResponseCode();
    
    // ... we most likely received a referal 
    if (code.equalsCode("REFERRAL"))
    {
      this.disconnect(true);
      
      if (this.debug.level & (1 << 4))
        this.debug.logger.logStringMessage("Referred to Server: "+code.getHostname());
      
      this.connect(code.getHostname(), code.getPort());    
      return;
    }
    
    // ... it's either a timeout or we tried the wrong password...
    // ... the best we can do is to report an error.
    this.onError(response);
  },
  
  /** @private */
  onError: function(response)
  {
    this.debug.logger.logStringMessage("OnError: "+response.getMessage());
    this.disconnect(false,4,response.getMessage())
  },

  /** @private */
  onTimeout: function(message)
  {
    var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);  
    
    if (ioService.offline && this.listener && this.listener.onOffline)
    {
      this.listener.onOffline();
      return;
    }
    
    if (this.listener && this.listener.onTimeout)
      this.listener.onTimeout(message);    
  },
  
  /**
   * Connects to a remote Sieve server. 
   * 
   * It warps the complex login process. For example it automatically requests 
   * for a password, picks an authentication mechanism and starts a secure 
   * connection.
   * 
   * You get notification on the login status through the listener. 
   *
   * @param {String} hostname - optional
   *   overrides the default hostname supplied by the account. This is needed
   *   for referrals and similar stuff.
   * @param {int} port - optional
   *   overrides the default port supplied by the account.
   */    
  connect : function(hostname,port)
  {                   
    if (this.sieve && this.sieve.isAlive())
    {        
      this.onLoginResponse(null);     
      return;
    }
        
    this.sieve = Cc["@sieve.mozdev.org/transport;1"]
                   .createInstance().wrappedJSObject;
    
    // Step 1: Setup configure settings
    this.sieve.setDebugLevel(
        this.account.getSettings().getDebugFlags(),
        this.debug.logger);
                   
    this.sieve.addListener(this);
  
    // TODO Load Timeout interval from account settings...
    
    if (this.account.getSettings().isKeepAlive(this.account.getSettings()))
      this.sieve.setKeepAliveInterval(this.account.getSettings().getKeepAliveInterval());    
    
    // Step 2: Initialize Message Queue...
    var request = new SieveInitRequest();
    request.addErrorListener(this)
    request.addInitListener(this)
    this.sieve.addRequest(request);   

    // Step 3: Connect...
    if (hostname == null)
      hostname = this.account.getHost().getHostname();
      
    if (port == null)
      port = this.account.getHost().getPort()
      
    this.sieve.connect(
        hostname,port,
        this.account.getHost().isTLSEnabled(),
        this,
        this.account.getProxy().getProxyInfo());    
  },
  
  disconnect : function(force, id, message)
  {
    // at first we update the status, so that the user ...
    // ... knows what happened.
    if (id && this.listener && this.listener.onChannelStatus)
      this.listener.onChannelStatus(id,message);
    
    // Skip if the connection already closed...
    if (!this.sieve)
      return;
      
    // ... we always try to exit with an Logout request...
    if ( !force && this.sieve.isAlive())
    {
      var request = new SieveLogoutRequest();
      request.addLogoutListener(this);
      /*request.addErrorListener(levent);*/
      this.sieve.addRequest(request);
      
      return;
    }
    
    // ... but this obviously is not always usefull
    this.sieve.disconnect();      
    this.sieve = null;
      
    return;
  },
    
  /**
   * Requests a channel for to this session. After use you have to revoke it via
   * "removeChannel", this will close the channel. Otherwise the connection
   * to the remote server might stay open. 
   *    
   * @return {} An unique Identifier
   */
  addChannel : function()
  {
    
    if (!this.channels)
      this.channels = new Array();
      
    var cid = "cid="+(this.idx++);
    
    this.channels.push(cid);     
     
    
    if (this.debug.level & (1 << 4))
      this.debug.logger.logStringMessage("Channel Added: "+this.sid+"/"+cid+" ["+this.channels+"]");
     
    return cid;
  },
  
  /**
   * Closes and Invalidates a channel. In case all channels of a session are
   * closed, the connection to the remote server will be terminated. That's why
   * there's no close session command. Thus always close your channels.
   * 
   * This Method does not throw an Exception, even if you pass an invalid 
   * session identifier! So it's save to call this method if you are unsure
   * if you already closed a channel.
   *  
   * @param {} cid
   *   The unique Identifier of the channel which should be closed and invalidated.
   * @return {Boolean}
   *   return true if the channel could be closed and false if not. A "false" 
   *   means the identifier is invalid. 
   */
  removeChannel : function(cid)
  { 
    if (!this.channels)
      return false
      
    var i = this.channels.indexOf(cid)
    if (i == -1)
      return false;
      
    this.channels.splice(i, 1);
    
    if (this.debug.level & (1 << 4))
      this.debug.logger.logStringMessage("Channel Closed: "+this.sid+"/"+cid+" ["+this.channels+"]");
     
    return true;
  },
  
  /**
   * Checks if the session has open/registered channels.
   * @return {Boolean}
   *   returns true incase the session has open channels. Otherwise false.
   */
  hasChannels : function()
  { 
    if ((this.channels) && (this.channels.length > 0))
      return true;
      
    return false;
  },
  
  /**
   * Checks if a channel is registed with this session
   * @param {} cid
   *   the channels unique identifier
   * @return {Boolean}
   *   returns false in case the channel identifier is not registered with 
   *   this session's object.
   */
  hasChannel : function(cid)
  {
    return (this.channels.indexOf(cid) == -1)?false:true;    
  },
  
  // Needed for Bad Cert Listener....
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
      
    // nsIBadCerListener ist deprectated since Gecko 1.8 (Thunderbird 2), ...
    // ... we just keep it for compatibility
    if (aIID.equals(Ci.nsIBadCertListener))
      return this;
      
    throw Components.results.NS_ERROR_NO_INTERFACE;
  },
  
  // Ci.nsIInterfaceRequestor
  getInterface : function (aIID)
  {
    return this.QueryInterface(aIID);
  },  
  
  // Ci.nsiBadCertListerner2
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
    if (this.debug.logger != null)
      this.debug.logger.logStringMessage("Sieve BadCertHandler: notifyCertProblem");
  
    // no listener registert, show the default UI 
    if ( !(this.listener) || !(this.listener.onBadCert))
      return false;
      
    // otherwise call the listener and supress the default UI
    this.listener.onBadCert(targetSite,sslStatus);
    return true;
  },
  
  // Ci.nsISSLErrorListener
  /**
   * 
   * @param {} socketInfo
   * @param {} error
   * @param {} targetSite
   * @return {Boolean}
   */
  notifySSLError : function (socketInfo, error, targetSite)
  {
    if (this.debug.logger != null)
      this.debug.logger.logStringMessage("Sieve BadCertHandler: notifySSLError");
    
    // no listener registert, show the default UI 
    if ( !(this.listener) || !(this.listener.onBadCert))
      return false;

    // otherwise call the listener and supress the default UI
    this.listener.onBadCert(targetSite,error);
    return true;
  },
  
  // Ci.nsIBadCertListener (Thunderbird 2 / Gecko 1.8.x compatibility)
  /**
   * @deprecated Interface removed in Gecko 1.9.1 (Thunderbird 3)
   * @param {} socketInfo
   * @param {} cert
   * @return {Boolean}
   */
  confirmCertExpired : function(socketInfo, cert) 
  {
    if (this.debug.logger != null)
      this.debug.logger.logStringMessage("Sieve BadCertHandler: Expired certificate");

    return true;
  },

  /**
   * @deprecated Interface removed in Gecko 1.9.1 (Thunderbird 3)
   * @param {} socketInfo
   * @param {} targetURL
   * @param {} cert
   * @return {Boolean}
   */
  confirmMismatchDomain : function(socketInfo, targetURL, cert) 
  {
    if (this.debug.logger != null)
      this.debug.logger.logStringMessage("Sieve BadCertHandler: Mismatched domain");

    return true;
  },
 
  /**
   * @deprecated Interface removed in Gecko 1.9.1 (Thunderbird 3)
   * @param {} socketInfo
   * @param {} cert
   * @param {} certAddType
   * @return {Boolean}
   */
  confirmUnknownIssuer : function(socketInfo, cert, certAddType) 
  { 
    if (this.debug.logger != null)
      this.debug.logger.logStringMessage("Sieve BadCertHandler: Unknown issuer");
      
    return true;
  },
  
  /**
   * @deprecated Interface removed in Gecko 1.9.1 (Thunderbird 3)
   * @param {} socketInfo
   * @param {String} targetURL
   * @param {} cert
   */
  notifyCrlNextupdate : function(socketInfo, targetURL, cert) 
  {
    if (this.debug.logger != null)
      this.debug.logger.logStringMessage("Sieve BadCertHandler: notifyCrlNextupdate");
  }  
  

}