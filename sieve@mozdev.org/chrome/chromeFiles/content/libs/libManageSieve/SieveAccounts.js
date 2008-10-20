/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */


var gPref = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

// Sieve No Authentication Class
// This class is used when no authentication is needed
function SieveNoAuth() {}

SieveNoAuth.prototype.getPassword
    = function ()
{
  return null;
}

SieveNoAuth.prototype.getUsername
    = function ()
{
  return null;
}

SieveNoAuth.prototype.hasUsername
    = function ()
{
  return false;
}

SieveNoAuth.prototype.getType
    = function ()
{
  return 0;
}

/**
 * The SieveImapAuth class uses the Authentication settings of the associated 
 * IMAP account. Any Settings are loaded dynamically when needed. This means 
 * any changes to the imap Account apply imediately to this class.
 *  
 * @param {String} imapKey 
 *   The imapKey of the associated IMAP account.
 */
function SieveImapAuth(imapKey)
{
  if (imapKey == null)
    throw "SieveImapHost: IMAP account key can't be null"; 

  this.imapKey = imapKey;
}

SieveImapAuth.prototype.getPassword
    = function ()
{
  // use the IMAP Key to load the Account...
  var account = Components.classes['@mozilla.org/messenger/account-manager;1']
	              .getService(Components.interfaces.nsIMsgAccountManager)
	              .getIncomingServer(this.imapKey);
  	
  // in case the passwordPromptRequired attribute is true...
  // ... thunderbird will take care on retrieving a valid password...
  //       
  if (account.passwordPromptRequired == false)
    return account.password;
    
  // ... otherwise we it is our job...
  var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                  .getService(Components.interfaces.nsIPromptService);
                        
  var input = {value:null};
  var check = {value:false}; 
  var result 
    = prompts.promptPassword(
        window,"Password", 
        "Please enter the password for your Sieve account",
        input, null, check);
  
  prompts = null;
  
  if (result)
    return input.value;

  return null;
}

SieveImapAuth.prototype.getUsername
    = function ()
{
  // use the IMAP Key to load the Account...
  var account = Components.classes['@mozilla.org/messenger/account-manager;1']
	              .getService(Components.interfaces.nsIMsgAccountManager)
	              .getIncomingServer(this.imapKey);
	                
  return account.realUsername;
}

SieveImapAuth.prototype.hasUsername
    = function ()
{
  return true;
}

SieveImapAuth.prototype.getType
    = function ()
{
  return 1;
}
// Sieve Custom Auth Class
// The Sieve account needs a different login than the IMAP Account
function SieveCustomAuth(uri)
{
  if (uri == null)
    throw "SieveCustomAuth: URI can't be null"; 
    
  this.uri = uri;
  this.prefURI = "extensions.sieve.account."+this.uri;
}

SieveCustomAuth.prototype.setUsername
    = function (username)
{
  if ((username == null) || (username == ""))
    throw "SieveCustomAuth: Username is empty or null";

  // drop any existing password, if the username changed...
  if (this.hasPassword())
  {    	
    var pwMgr = Components.classes["@mozilla.org/passwordmanager;1"]
                  .getService(Components.interfaces.nsIPasswordManager);
    try
    {
      pwMgr.removeUser(new String("sieve://"+this.uri) , this.getUsername());
    }
    catch (e)
    { /* do nothing */ }
	  
    // make XPCOM happy...
    pwMgr = null;
  }    

  // set new username...  
  gPref.setBoolPref(this.prefURI+".login.hasPassword",false);
  gPref.setCharPref(this.prefURI+".login.username",username);  
}    

SieveCustomAuth.prototype.getPassword
    = function ()
{
  if (this.hasPassword() == true)
  {
    // the password is remembered...
    var pwMgr = Components.classes["@mozilla.org/passwordmanager;1"]
                  .getService(Components.interfaces.nsIPasswordManager);
    var e = pwMgr.enumerator;
    
    var username = this.getUsername();    
    while (e.hasMoreElements()) 
    {        
      var passwd = e.getNext().QueryInterface(Components.interfaces.nsIPassword);
            
      if (passwd.host != new String("sieve://"+this.uri))
        continue;
            
      if (passwd.user != username)
        continue;

      return passwd.password;
    }
    // no password stored...
  }
  
  // ... prompt for password
  var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                  .getService(Components.interfaces.nsIPromptService);  
                        
  var input = {value:null};
  var check = {value:false};
     
  var result = 
    prompts.promptPassword(//window,
        null,
        "Password", 
        "Please enter the password for your Sieve account", 
        input, 
        "Remember Password", 
        check);
  
  // make XPCOM happy...
  prompts = null;
  
  // user aborts password dialog...
  if (result == false)
    return null;
    
  // user wants the password to be remembered...
  if (check.value == true)
  {
    var pwMgr = Components.classes["@mozilla.org/passwordmanager;1"]
                  .getService(Components.interfaces.nsIPasswordManager);                

    pwMgr.addUser(new String("sieve://"+this.uri),this.getUsername(), input.value);    
    gPref.setBoolPref(this.prefURI+".login.hasPassword",true);
    
    pwMgr = null;
  }
    
  return input.value;
}

SieveCustomAuth.prototype.getUsername
    = function ()
{
  if (gPref.prefHasUserValue(this.prefURI+".login.username"))
    return gPref.getCharPref(this.prefURI+".login.username");

  return "";
}

SieveCustomAuth.prototype.hasPassword
    = function ()
{
  if (gPref.prefHasUserValue(this.prefURI+".login.hasPassword"))
    return gPref.getBoolPref(this.prefURI+".login.hasPassword");

  return false;
}

SieveCustomAuth.prototype.hasUsername
    = function ()
{
  return true;
}

SieveCustomAuth.prototype.getType
    = function ()
{
  return 2;
}

/**
 * This class loads the host settings from an IMAP account. The settings are
 * read dynamically when needed. This ensures the always the most recent 
 * settings are used.
 * 
 * @param {String} imapKey
 *   The IMAP Key which host settings should be used. 
 */
function SieveImapHost(imapKey)
{
  if (imapKey == null)
    throw "SieveImapHost: IMAP account key can't be null"; 
  
  this.imapKey = imapKey;
}

SieveImapHost.prototype.getHostname
    = function ()
{
  // use the IMAP Key to load the Account...
  var account = Components.classes['@mozilla.org/messenger/account-manager;1']  
                    .getService(Components.interfaces.nsIMsgAccountManager)
                    .getIncomingServer(this.imapKey);

  return account.realHostName;
}

SieveImapHost.prototype.getPort
    = function ()
{
  return 2000;
}

SieveImapHost.prototype.isTLS
    = function ()
{
  // use the IMAP Key to load the Account...
  var account = Components.classes['@mozilla.org/messenger/account-manager;1']
                  .getService(Components.interfaces.nsIMsgAccountManager)
                  .getIncomingServer(this.imapKey);

  if ( account.socketType == 0)
    return false;
		
  return true;
}

SieveImapHost.prototype.getType
    = function ()
{
  return 0;
}

/**
 * This Class manages a custom host setting for a Sieve Account. Sieve Accounts 
 * are identified by URIs.
 * 
 * @param {String} uri 
 * @throws Exception 
 */
function SieveCustomHost(uri)
{
  if (uri == null)
    throw "SieveCustomHost: URI can't be null";
    
  this.uri = uri;
  this.prefURI = "extensions.sieve.account."+this.uri;
}

SieveCustomHost.prototype.toString
    = function ()
{
  return "Custom Host";
}

SieveCustomHost.prototype.getHostname
    = function ()
{
  if (gPref.prefHasUserValue(this.prefURI+".hostname"))
    return gPref.getCharPref(this.prefURI+".hostname");

  return "";
}

SieveCustomHost.prototype.setHostname
    = function (hostname)
{
  if ((hostname == null) || (hostname == ""))
    throw "Hostname can't be empty or null";

  gPref.setCharPref(this.prefURI+".hostname",hostname);
}

SieveCustomHost.prototype.getPort
    = function ()
{
  if (gPref.prefHasUserValue(this.prefURI+".port"))
    return gPref.getIntPref(this.prefURI+".port");

  return 2000;
}

SieveCustomHost.prototype.setPort
    = function (port)
{
  // TODO: Check If port is a valid integer
  gPref.setIntPref(this.prefURI+".port",port);
}

// TODO Should be renamed in "secure"
SieveCustomHost.prototype.isTLS
    = function ()
{
  if (gPref.prefHasUserValue(this.prefURI+".TLS"))
    return gPref.getBoolPref(this.prefURI+".TLS");
    
  return true;
}

SieveCustomHost.prototype.setTLS
    = function (enabled)
{
  gPref.setBoolPref(this.prefURI+".TLS",enabled);
}

SieveCustomHost.prototype.getType
    = function ()
{
  return 1;
}


//== SieveCompatibilitySettings ==============================================//
/**
 * This class manages compatibility related settings for the given sieve account
 * <p>
 * According to the RFC, a server should implicitely send his capabilites after 
 * a succesfull TLS Handshake. But Cyrus servers used to expect an explicit 
 * capability request. So there are now two incomaptible TLS Hanshake mechanisms
 * common - the RFC conform and the cyrus like TLS Handshake.
 * <p> 
 * In Addition to the two mechanisms above an automatic detection is implemented
 * by the extension. In case the server fails to send his capabilities within a 
 * given time, it is assumed that the server is not RFC conform and requires an 
 * explicitely capability request.
 * <p>
 * This mechanism is not failsave, in case of a slow connection or a server 
 * suffering from high load, the timeout could be accidentially triggered and
 * causes the Extension to hang.
 *  
 * @param {String} sieveKey
 *   The unique identifiert for the sieve account
 */
function SieveCompatibilitySettings(sieveKey)
{
  if (sieveKey == null)
    throw "SieveCompatibility: Sieve Key can't be null"; 
    
  this.sieveKey = sieveKey+".compatibility";  
}

/**
 * Returns the Hanshake mechanism. A value of 0 means automatic detection, 1 is 
 * equivalent to RFC conform respectively 2 to Cyrus like handshake.
 *  
 * @return {Int} the Handshake mechanism as integer
 */
SieveCompatibilitySettings.prototype.getHandshakeMode
    = function ()
{
  if (gPref.prefHasUserValue(this.sieveKey+".tls"))
    return gPref.getIntPref(this.sieveKey+".tls");

  return 0;
}

/**
 * Sets a the handshake mechanism that should be used. A value of 0 enables 
 * automatic detection. Respectively 1 is equivalent to a RFC conform and 2 
 * equals a Cyrus like handshake.
 * 
 * @param {Int} type
 *   the Handshake mechanism that should be used as integer.
 */
SieveCompatibilitySettings.prototype.setHandshakeMode
    = function (mode)
{
  gPref.setIntPref(this.sieveKey+".tls",mode);
}

/**
 * Returns a timeout, which is needed for the automatic handshake detection.
 * 
 * @return {Int}
 *   the timeout in Milliseconds
 */
SieveCompatibilitySettings.prototype.getHandshakeTimeout
    = function () 
{
  if (gPref.prefHasUserValue(this.sieveKey+".tls.timeout"))
    return gPref.getCharPref(this.sieveKey+".tls.timeout");

  return "7500"; //20*1000 = 20 Seconds
}

/**
 * Defines the timeout for the automatic handshake detection.
 * @param {Int} ms
 *   the timeout in Milliseconds
 */
SieveCompatibilitySettings.prototype.setHandshakeTimeout
    = function (ms)
{
  gPref.setCharPref(this.sieveKey+".tls.timeout",ms);
}


//== SieveAccountSettings ====================================================//
/**
 * This class manages general settings for the given sieve account.
 * 
 * @param {String} SieveKey
 *   The unique internal pref key of the sieve account.  
 */
function SieveAccountSettings(sieveKey)
{
  if (sieveKey == null)
    throw "SieveAccountSettings: Sieve Key can't be null"; 
    
  this.sieveKey = sieveKey;
}

/**
 * XXX:
 * @return {SieveCompatibilitySettings}
 */
SieveAccountSettings.prototype.getCompatibility
    = function () 
{
  return (new SieveCompatibilitySettings(this.sieveKey));
}

SieveAccountSettings.prototype.isKeepAlive
    = function () 
{
  if (gPref.prefHasUserValue(this.sieveKey+".keepalive"))
    return gPref.getBoolPref(this.sieveKey+".keepalive");
        
  return true;
}

SieveAccountSettings.prototype.enableKeepAlive
    = function (enabled) 
{
  gPref.setBoolPref(this.sieveKey+".keepalive",enabled);
}

SieveAccountSettings.prototype.getKeepAliveInterval
    = function () 
{
  if (gPref.prefHasUserValue(this.sieveKey+".keepalive.interval"))
    return gPref.getCharPref(this.sieveKey+".keepalive.interval");

  return "1200000"; //30*60*1000 = 30 Minutes
}

SieveAccountSettings.prototype.setKeepAliveInterval
    = function (ms)
{
  gPref.setCharPref(this.sieveKey+".keepalive.interval",ms);
}

SieveAccountSettings.prototype.hasCompileDelay
    = function ()
{
  if (gPref.prefHasUserValue(this.sieveKey+".compile"))
    return gPref.getBoolPref(this.sieveKey+".compile");
  
  return true;
}

SieveAccountSettings.prototype.enableCompileDelay
    = function (enabled)
{
  gPref.setBoolPref(this.sieveKey+".compile",enabled);
}

/**
 * Returns the minimal delay between a keypress and a automatic syntax check. 
 * This is used while editing a sieve script, it basically prevents useless 
 * systax checks while the User is typing.
 * 
 * @return {Number}
 *  The delay in mili seconds
 */
SieveAccountSettings.prototype.getCompileDelay
    = function () 
{     
  if (gPref.prefHasUserValue(this.sieveKey+".compile.delay"))
    return gPref.getIntPref(this.sieveKey+".compile.delay");
        
  return 500; // = 500 mSec
}
    
SieveAccountSettings.prototype.setCompileDelay
    = function (ms) 
{
  gPref.setIntPref(this.sieveKey+".compile.delay",ms);
}

SieveAccountSettings.prototype.getDebugFlags
    = function ()
{
  if (gPref.prefHasUserValue(this.sieveKey+".debug.flags"))
    return gPref.getIntPref(this.sieveKey+".debug.flags");
        
  return 0;
}

SieveAccountSettings.prototype.hasDebugFlag
    = function (flag)
{
  if (this.getDebugFlags() & (1 << flag))
    return true;
  
  return false;
}

SieveAccountSettings.prototype.setDebugFlag
    = function (flag, value)
{
  if (value)
    gPref.setIntPref(this.sieveKey+".debug.flags",this.getDebugFlags()| (1 << flag)  );
  else
    gPref.setIntPref(this.sieveKey+".debug.flags",this.getDebugFlags() & ~(1 << flag) );
}

SieveAccountSettings.prototype.hasForcedAuthMechanism
    = function ()
{
  if (gPref.prefHasUserValue(this.sieveKey+".sasl.forced"))
    return gPref.getBoolPref(this.sieveKey+".sasl.forced");
        
  return false;
}

SieveAccountSettings.prototype.enableForcedAuthMechanism
    = function(enabled)
{
  gPref.setBoolPref(this.sieveKey+".sasl.forced",enabled);
}

SieveAccountSettings.prototype.setForcedAuthMechanism
    = function(method)
{
  gPref.setCharPref(this.sieveKey+".sasl.mechanism",method);
}
SieveAccountSettings.prototype.getForcedAuthMechanism
    = function ()
{
  if (gPref.prefHasUserValue(this.sieveKey+".sasl.mechanism"))
    return gPref.getCharPref(this.sieveKey+".sasl.mechanism");
        
  return "plain";
}

/******************************************************************************/

function SieveNoAuthorization()
{
}

SieveNoAuthorization.prototype.getType
    = function ()
{
  return 0;
}

SieveNoAuthorization.prototype.getAuthorization
    = function ()
{
  return "";
}

//== SievePromptAuthorization ================================================//

function SievePromptAuthorization()
{  
}

SievePromptAuthorization.prototype.getType
    = function ()
{
  return 2;
}

SievePromptAuthorization.prototype.getAuthorization
    = function ()
{
  var check = {value: false}; 
  var input = {value: ""};
  var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                  .getService(Components.interfaces.nsIPromptService);
  
  var result = 
    prompts.prompt(
       null, 
       "Authorization", 
       "Please enter the username you want to be authorized as", 
       input, 
       null, 
       check);
   
  if (result == false)
    return null;
  
  return input.value;
}

//****************************************************************************//

function SieveCustomAuthorization(uri)
{
  if (uri == null)
    throw "SieveCustomAuthorization: URI can't be null"; 
    
  this.uri = uri;
  this.prefURI = "extensions.sieve.account."+this.uri;  
}

SieveCustomAuthorization.prototype.getType
    = function ()
{
  return 3;
}

SieveCustomAuthorization.prototype.getAuthorization
    = function ()
{
  if (gPref.prefHasUserValue(this.prefURI+".sasl.authorization.username"))
    return gPref.getCharPref(this.prefURI+".sasl.authorization.username");
  
  return null;
}

SieveCustomAuthorization.prototype.setAuthorization
    = function (authorization)
{
  if ((authorization == null) || (authorization == ""))
    throw "Authorization can't be empty or null";

  gPref.setCharPref(this.prefURI+".sasl.authorization.username",authorization);
}


//****************************************************************************//
    
function SieveDefaultAuthorization(authorization)
{
  this.authorization = authorization;
} 

SieveDefaultAuthorization.prototype.getType
    = function ()
{
  return 1;
}

SieveDefaultAuthorization.prototype.getAuthorization
    = function ()
{
  return this.authorization;
}

//****************************************************************************//

/**
 * Sieve depends on IMAP, so every Sieve Accounts is directly bound to an IMAP 
 * accounts. IMAP accounts are idenfified by the "internal pref key", which is 
 * guaranteed to be unique across all servers in a Thunderbird profile.
 * 
 * The account object is only used in the constructor. It is not cached, this
 * ensures, that we use always the most recent settings!
 * 
 * @param {nsIMsgIncomingServer} account 
 *   The account settings of the associated IMAP account.
 */
function SieveAccount(account)
{   
	// Check parameters...
  if (account == null)
    throw "SieveAccount: Parameter missing...";
  
  /** @private */ this.Uri = account.rootMsgFolder.baseMessageURI.slice(15); 
  
  /** @private */ this.sieveKey = "extensions.sieve.account."+this.Uri;
  /** @private */ this.imapKey = account.key;
  
  /** @private */ this.description = account.prettyName;	
}

SieveAccount.prototype.getKey
    = function () { return this.imapKey; }

SieveAccount.prototype.getUri
    = function () { return this.Uri; }

/**
 * As Uris are not very user friendly, Thunderbird uses for every IMAP account 
 * a "PrettyName". It is either an userdefined string or the hostname of the 
 * IMAP account.
 * 
 * @return {String} 
 *   The description for this account.
 */
SieveAccount.prototype.getDescription
    = function () { return this.description; }

/**
 * Retrieves the Authentication Settings for this SieveAccount.
 * 
 * @param {Int} type 
 *   defines which Authentication Settings ({@link SieveNoAuth}, 
 *   {@link SieveCustomAuth}, {@link SieveImapAuth}) should be loaded. If this 
 *   parameter is skipped the default Authentication settings will be returned. 
 * @return {SieveImapAuth,SieveNoAuth,SieveCustomAuth}
 *   Returns the Authentication Settings for this SieveAccount
 */
SieveAccount.prototype.getLogin
    = function (type) 
{
  if ((type == null) && gPref.prefHasUserValue(this.sieveKey+".activeLogin")) 
    type = gPref.getIntPref(this.sieveKey+".activeLogin");

  switch (type)
  {
    case 0  : return new SieveNoAuth();
    case 2  : return new SieveCustomAuth(this.Uri);
    
    default : return new SieveImapAuth(this.imapKey);
  }
}

SieveAccount.prototype.setActiveLogin
    = function (type) 
{
  if (type == null)
    throw "login type is null";
  if ((type < 0) || (type > 2))
    throw "invalid login type";

  gPref.setIntPref(this.sieveKey+".activeLogin",type);
}

SieveAccount.prototype.getHost
    = function (type)
{
  if ((type == null ) && gPref.prefHasUserValue(this.sieveKey+".activeHost"))
    type = gPref.getIntPref(this.sieveKey+".activeHost");

  if (type == 1)
    return new SieveCustomHost(this.Uri)
  
  return new SieveImapHost(this.imapKey)
}

SieveAccount.prototype.setActiveHost
    = function (type)
{	
  if (type == null)
    throw "host type is null";
  if ((type < 0) || (type > 1))
    throw "invalid host type";

  gPref.setIntPref(this.sieveKey+".activeHost",type);
}

SieveAccount.prototype.getAuthorization
    = function (type)
{ 
  if ((type == null) && gPref.prefHasUserValue(this.sieveKey+".activeAuthorization")) 
    type = gPref.getIntPref(this.sieveKey+".activeAuthorization");

  switch (type)
  {
    case 0  : return new SieveNoAuthorization();
    case 2  : return new SievePromptAuthorization();
    case 3  : return new SieveCustomAuthorization(this.Uri);
    
    default : return new SieveDefaultAuthorization(this.getLogin().getUsername()); 
  }
}

SieveAccount.prototype.setActiveAuthorization
    = function (type)
{ 
  if (type == null)
    throw "Authorization type is null";
  if ((type < 0) || (type > 3))
    throw "invalid Authorization type";

  gPref.setIntPref(this.sieveKey+".activeAuthorization",type);
}

SieveAccount.prototype.isEnabled
    = function ()
{
  if (gPref.prefHasUserValue(this.sieveKey+".enabled"))        
    return gPref.getBoolPref(this.sieveKey+".enabled");
    
  return false;
}

SieveAccount.prototype.setEnabled
    = function (enabled) 
{
  gPref.setBoolPref(this.sieveKey+".enabled",enabled);
}
/**
 * XXX ...
 * @return {SieveAccountSettings} returns the account settings.
 */
SieveAccount.prototype.getSettings
    = function ()
{
  return new SieveAccountSettings(this.sieveKey);
}

//****************************************************************************//

function SieveAccounts()
{
  var accountManager = Components.classes['@mozilla.org/messenger/account-manager;1']
                         .getService(Components.interfaces.nsIMsgAccountManager);
                          
  this.accounts = new Array();
	
  for (var i = 0; i < accountManager.allServers.Count(); i++)
  {
    var account = accountManager.allServers.GetElementAt(i)
                    .QueryInterface(Components.interfaces.nsIMsgIncomingServer);
		      
    if (account.type != "imap")
      continue;

    this.accounts.push(new SieveAccount(account));        
  }
}

/**
 * Returns all SieveAccounts of the currently active Thunderbrid profile.  
 * @return {SieveAccount[]}
 *   Array containing SieveAccounts
 */
SieveAccounts.prototype.getAccounts
    = function () 
{   
  return this.accounts;
}
