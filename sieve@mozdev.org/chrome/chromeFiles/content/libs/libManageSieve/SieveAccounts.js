var gPref = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

// Sieve No Authentication Class
// This class is used when no authentication is needed
function SieveNoAuth() 
{}

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
    var pwMgr =
      Components.classes["@mozilla.org/passwordmanager;1"]
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

// Sieve account Settings class

function SieveAccountSettings(uri)
{
  if (uri == null)
    throw "SieveAccountSettings: URI can't be null"; 
    
	this.uri = uri;
  this.prefURI = "extensions.sieve.account."+this.uri;
}

SieveAccountSettings.prototype.isCyrusBugCompatible
    = function ()
{
  if (gPref.prefHasUserValue(this.prefURI+".cyrusBugCompatibility"))
    return gPref.getBoolPref(this.prefURI+".cyrusBugCompatibility");
        
  return false;
}

SieveAccountSettings.prototype.enableCyrusBugCompatibility
    = function (enabled)
{
  gPref.setBoolPref(this.prefURI+".cyrusBugCompatibility",enabled);
}

SieveAccountSettings.prototype.isKeepAlive
    = function () 
{
  if (gPref.prefHasUserValue(this.prefURI+".keepalive"))
    return gPref.getBoolPref(this.prefURI+".keepalive");
        
  return true;
}

SieveAccountSettings.prototype.enableKeepAlive
    = function (enabled) 
{
    gPref.setBoolPref(this.prefURI+".keepalive",enabled);
}

SieveAccountSettings.prototype.getKeepAliveInterval
    = function () 
{
    if (gPref.prefHasUserValue(this.prefURI+".keepalive.interval"))
        return gPref.getCharPref(this.prefURI+".keepalive.interval");

    return "1200000"; //30*60*1000 = 30 Minuten
}

SieveAccountSettings.prototype.setKeepAliveInterval
    = function (ms)
{
    gPref.setCharPref(this.prefURI+".keepalive.interval",ms);
}

SieveAccountSettings.prototype.hasCompileDelay
    = function ()
{
    if (gPref.prefHasUserValue(this.prefURI+".compile"))
        return gPref.getBoolPref(this.prefURI+".compile");
        
    return true;
}

SieveAccountSettings.prototype.enableCompileDelay
    = function (enabled)
{
  gPref.setBoolPref(this.prefURI+".compile",enabled);
}

SieveAccountSettings.prototype.getCompileDelay
    = function () 
{     
	if (gPref.prefHasUserValue(this.prefURI+".compile.delay"))
        return gPref.getIntPref(this.prefURI+".compile.delay");
        
    return 500; // = 500 mSec
}
    

SieveAccountSettings.prototype.setCompileDelay
    = function (ms) 
{
    gPref.setIntPref(this.prefURI+".compile.delay",ms);
}

SieveAccountSettings.prototype.getDebugFlags
    = function ()
{
    if (gPref.prefHasUserValue(this.prefURI+".debug.flags"))
        return gPref.getIntPref(this.prefURI+".debug.flags");
        
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
    gPref.setIntPref(this.prefURI+".debug.flags",this.getDebugFlags()| (1 << flag)  );
  else
    gPref.setIntPref(this.prefURI+".debug.flags",this.getDebugFlags() & ~(1 << flag) );
}

SieveAccountSettings.prototype.hasForcedAuthMechanism
    = function ()
{
  if (gPref.prefHasUserValue(this.prefURI+".sasl.forced"))
    return gPref.getBoolPref(this.prefURI+".sasl.forced");
        
  return false;
}

SieveAccountSettings.prototype.enableForcedAuthMechanism
    = function(enabled)
{
  gPref.setBoolPref(this.prefURI+".sasl.forced",enabled);
}

SieveAccountSettings.prototype.setForcedAuthMechanism
    = function(method)
{
  gPref.setCharPref(this.prefURI+".sasl.mechanism",method);
}
SieveAccountSettings.prototype.getForcedAuthMechanism
    = function ()
{
    if (gPref.prefHasUserValue(this.prefURI+".sasl.mechanism"))
      return gPref.getCharPref(this.prefURI+".sasl.mechanism");
        
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

/******************************************************************************/

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

/******************************************************************************/

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


/******************************************************************************/
    
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
 * @param {String} sieveUri 
 *   Identifies this account, has to be unique.
 * @param {String} imapKey 
 *   The unique internal pref key of the IMAP account. 
 * @param {String} description 
 *   A human readable description for this account.  
 */
function SieveAccount(sieveUri,imapKey,description)
{
	// Check parameters...
  if ((sieveUri == null) || (imapKey == null) || (description == null))
    throw "SieveAccount: Parameter missing...";
    
  this.Uri = sieveUri;
  this.prefURI = "extensions.sieve.account."+this.Uri;
  
  this.imapKey = imapKey;
  this.description = description;	
}

SieveAccount.prototype.getUri
    = function () { return this.Uri; }

/**
 * As Uris are not very user friendly, Thunderbird uses for every IMAP account 
 * a "PrettyName". It is either an an userdefined string or the hostname of the 
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
	if ((type == null) && gPref.prefHasUserValue(this.prefURI+".activeLogin")) 
	  type = gPref.getIntPref(this.prefURI+".activeLogin");

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

	gPref.setIntPref(this.prefURI+".activeLogin",type);
}

SieveAccount.prototype.getHost
    = function (type)
{
	if ((type == null ) && gPref.prefHasUserValue(this.prefURI+".activeHost"))
	  type = gPref.getIntPref(this.prefURI+".activeHost");

  if (type == 1)
    return new SieveCustomHost(this.Uri)
  else
    return new SieveImapHost(this.imapKey)
}

SieveAccount.prototype.setActiveHost
    = function (type)
{	
	if (type == null)
		throw "host type is null";
	if ((type < 0) || (type > 1))
		throw "invalid host type";

	gPref.setIntPref(this.prefURI+".activeHost",type);
}

SieveAccount.prototype.getAuthorization
    = function (type)
{ 
  if ((type == null) && gPref.prefHasUserValue(this.prefURI+".activeAuthorization")) 
  {
   type = gPref.getIntPref(this.prefURI+".activeAuthorization");
  }

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

  gPref.setIntPref(this.prefURI+".activeAuthorization",type);
}

SieveAccount.prototype.isEnabled
    = function ()
{
    if (gPref.prefHasUserValue(this.prefURI+".enabled"))        
        return gPref.getBoolPref(this.prefURI+".enabled");
    
    return false;
}

SieveAccount.prototype.setEnabled
    = function (enabled) 
{
  gPref.setBoolPref(this.prefURI+".enabled",enabled);
}

SieveAccount.prototype.getSettings
    = function ()
{
  return new SieveAccountSettings(this.Uri);
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

    // pass the key if the imap account, not the account! This ensures, that... 
    // ... we always use the most recent settings.
    this.accounts.push(
      new SieveAccount(
        account.rootMsgFolder.baseMessageURI.slice(15),
        account.key,
        account.prettyName));
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
