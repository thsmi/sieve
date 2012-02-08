/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

// Enable Strict Mode
"use strict";

var gPref = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

/**
 * The SieveNoAuth is used when no authentication is needed o access the sieve
 * account. This class is basically an empty stub, mostly returning null or false
 */
function SieveNoAuth() {}

/**
 * An human readable description, which describes the authentication procedure.
 * @return {String} String containing the description.
 */
SieveNoAuth.prototype.getDescription
    = function ()
{
  return Components.classes["@mozilla.org/intl/stringbundle;1"]
           .getService(Components.interfaces.nsIStringBundleService)
           .createBundle("chrome://sieve/locale/locale.properties")
           .GetStringFromName("account.auth.none");
}

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
 * If you want to use the Authentication Settings of an existing IMAP account 
 * use this class. Any Settings are loaded dynamically when needed. This means 
 * any changes to the IMAP account apply imediately to this class.
 *  
 * @param {String} imapKey 
 *   The unique imapKey of the IMAP account, which should be used.
 */
function SieveImapAuth(imapKey)
{
  if (imapKey == null)
    throw "SieveImapAuth: IMAP account key can't be null"; 

  this.imapKey = imapKey;
}

SieveImapAuth.prototype.getDescription
    = function ()
{
  return Components.classes["@mozilla.org/intl/stringbundle;1"]
           .getService(Components.interfaces.nsIStringBundleService)
           .createBundle("chrome://sieve/locale/locale.properties")
           .GetStringFromName("account.auth.imap");
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
        null,"Password", 
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

/**
 * Incase the Sieve Account requires a different login than the IMAP Account,
 * use this Class. It stores the username and the password if desired.
 * 
 * This class is named SieveCustomAuth2 because the new password manager in 
 * Thunderbird 3 broke compatibility with older releases. The SieveCustomAuth
 * class was compatible with the legacy password manager and was was removed 
 * from code when the extension dropped support for pre Thunderbird 3 releases. 
 * 
 * Entries in the new Login-Manager are identified and enumerated by their 
 * original hostname. Furthermore the username is stored in the prefs and 
 * is used to find a matching account, as the original hostname is not 
 * garanteed to be unique.
 * 
 * @param {String} host
 *   the original hostname for this account  
 * @param {String} uri
 *   the unique URI of the associated sieve account
 */
function SieveCustomAuth2(host, uri)
{
  if (("@mozilla.org/login-manager;1" in Components.classes) == false)
    throw "SieveCustomAuth2: No login manager component found...";
  
  if (uri == null)
    throw "SieveCustomAuth2: URI can't be null"; 

  if (host == null || host == "")
    throw "SieveCustomAuth2: Host can't be empty or null";
    
  // the "original hostname"
  this.host = host;

  // We actually don't use the uri anymore. As described in bug 474277 ...
  // ... the original hostname is a better option. But we still need it ...
  // ... for backward compatibility ...
  this.uri = uri;
  
  // ... and to recover our pref key.
  this.sieveKey = "extensions.sieve.account."+this.uri;
  
  return;
}

SieveCustomAuth2.prototype.getDescription
    = function ()
{
  return Components.classes["@mozilla.org/intl/stringbundle;1"]
           .getService(Components.interfaces.nsIStringBundleService)
           .createBundle("chrome://sieve/locale/locale.properties")
           .GetStringFromName("account.auth.custom");
}

/**
 * Updates the username. 
 * Any saved passwords associated with this account will be updated too.
 * This is the default behaviour for Thunderbird3 an up.
 * 
 * @param {String} username
 *   the username as string, has to be neither empty nor null.
 */
SieveCustomAuth2.prototype.setUsername
    = function (username)
{
  if (username == null)
    username = "";

  // first we need to cache the old username...
  var oldUserName = this.getUsername();
  
  // ... and update the new username.
  gPref.setCharPref(this.sieveKey+".login.username",username);
  
  
  // we should also update the LoginManager...
  var loginManager = Components.classes["@mozilla.org/login-manager;1"]
                        .getService(Components.interfaces.nsILoginManager);
                        
  // ...first look for entries which meet the proposed naming...  
  var logins = 
        loginManager.findLogins(
            {},"sieve://"+this.host,null,"sieve://"+this.host);
    
  for (var i = 0; i < logins.length; i++)
  {
    if (logins[i].username != oldUserName)
      continue;
   
    loginManager.removeLogin(logins[i]);
    
    logins[i].username = username;
    
    loginManager.addLogin(logins[i]);
    return;
  }
    
  // but as Thunderbird fails to import the password and username properly...
  // ...there might be entries which want to be repaired...    
  
  logins = 
    loginManager.findLogins({},"sieve://"+this.uri,"",null);
  
  for (var i = 0; i < logins.length; i++)
  {
    if (logins[i].username != oldUserName)
      continue;
   
    loginManager.removeLogin(logins[i]);
    
    logins[i].hostname = "sieve://"+this.host;
    logins[i].httpRealm = "sieve://"+this.host;
    logins[i].formSubmitURL = null;
    logins[i].username = username;
    logins[i].usernameField = "";
    logins[i].passwordField = "";
    
    loginManager.addLogin(logins[i]);
    return;
  }
  
  // ok we give up, there is no passwort entry, this might be because...
  // ... the user might never set one, or because it deleted it in the...
  // ... Login-Manager
}    


/**
 * Retrieves the password for the given account.
 * 
 * If no suitable login information is stored in the password manager, a ...
 * ... dialog requesting the user for his password will be automatically ...
 * ... displayed, if needed.
 * 
 * @return {String}
 *   The password as string or null in case the password could not be retrived.
 */

SieveCustomAuth2.prototype.getPassword
    = function ()
{
  var username = this.getUsername();
    
  var loginManager = Components.classes["@mozilla.org/login-manager;1"]
                        .getService(Components.interfaces.nsILoginManager);
  
  // First look for entries which meet the proposed naming...  
  var logins = 
        loginManager.findLogins(
            {},"sieve://"+this.host,null,"sieve://"+this.host);

  for (var i = 0; i < logins.length; i++)
  {
    if (logins[i].username != username)
      continue;
    
    return logins[i].password;    
  }
  
  // but as Thunderbird fails to import the passwort and username properly...
  // ...there might be some slightly different entries...      
  logins = 
    loginManager.findLogins({},"sieve://"+this.uri,"",null);
  
  for (var i = 0; i < logins.length; i++)
  {
    if (logins[i].username != username)
      continue;
    
    return logins[i].password;    
  }
  
  // we found no password, so let's prompt for it
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
  
  // no password, as the user canceled the dialog...
  if (result == false)
    return null;
  
  // user wants the password to be remembered...
  if (check.value == true)
  {
    // the password might be already added while the password prompt is displayed    
    try
    {      
      var login = Components.classes["@mozilla.org/login-manager/loginInfo;1"]
                            .createInstance(Components.interfaces.nsILoginInfo); 

      login.init("sieve://"+this.host,null,"sieve://"+this.host, 
                 ""+this.getUsername(),""+input.value,"", "");
    
      loginManager.addLogin(login);
    }
    catch (e)
    {
      // we don't care if we fail, it might work the next time...
    }
  }
    
  return input.value;
}

/**
 * Returns the username for this login. 
 * 
 * The username is stored in the user preferences not in the Login Manager!
 * 
 * @return {String}
 *   The username or an empty string in case of an error
 */
SieveCustomAuth2.prototype.getUsername
    = function ()
{
  if (gPref.prefHasUserValue(this.sieveKey+".login.username"))
    return gPref.getCharPref(this.sieveKey+".login.username");

  return "";
}

SieveCustomAuth2.prototype.hasUsername
    = function ()
{
  return true;
}

SieveCustomAuth2.prototype.getType
    = function ()
{
  return 2;
}



/**
 * Maintains SOCKS proxy settings 
 * @param {String} sieveKey
 *   the unique URI of the associated sieve account
 */
function SieveNoProxy()
{
}

SieveNoProxy.prototype.getType
    = function()
{
  return 0;
}

SieveNoProxy.prototype.getProxyInfo
    = function()
{
  return [];
}

/**
 * 
 * @param {} imapKey
 */
function SieveSystemProxy()
{
}

SieveSystemProxy.prototype.getType
    = function()
{
  return 1;
}

SieveSystemProxy.prototype.getProxyInfo
    = function()
{
  return null;
}


/**
 * 
 * @param {} imapKey
 */
function SieveSocks4Proxy(sieveKey)
{
  this.prefURI = sieveKey+".proxy.socks4";
}

// Inherrit prototypes from SieveSystemProxy...
SieveSocks4Proxy.prototype.__proto__ = SieveSystemProxy.prototype;

SieveSocks4Proxy.prototype.getType
    = function()
{
  return 2;
}

SieveSocks4Proxy.prototype.getHost
    = function()
{
  if (gPref.prefHasUserValue(this.prefURI+".host"))
    return gPref.getCharPref(this.prefURI+".host");

  return "localhost"; 
}

SieveSocks4Proxy.prototype.setHost
    = function(host)
{
  gPref.setCharPref(this.prefURI+".host",host);
}

SieveSocks4Proxy.prototype.getPort
    = function()
{
  if (gPref.prefHasUserValue(this.prefURI+".port"))
    return gPref.getCharPref(this.prefURI+".port");

  return "1080"; 
}

/**
 * Specifies on which TCP/IP Port the socks Proxy is listening. 
 * @param {Int} port
 *   the port as integer
 */
SieveSocks4Proxy.prototype.setPort
    = function(port)
{
  port = parseInt(port,10);
  
  if (isNaN(port))
    throw "Invalid Port Number";
    
  if ((port < 0) || (port > 65535))
    throw "Ivalid Port Number";

  gPref.setCharPref(this.prefURI+".port",""+port);
}

SieveSocks4Proxy.prototype.getProxyInfo
    = function()
{
  // generate proxy info
  var pps = Components.classes["@mozilla.org/network/protocol-proxy-service;1"]
                .getService(Components.interfaces.nsIProtocolProxyService);
  return [pps.newProxyInfo("socks4",this.getHost(),this.getPort(),0,4294967295,null)]
}

/**
 * 
 * @param {} sieveKey
 */
function SieveSocks5Proxy(sieveKey)
{
  this.prefURI = sieveKey+".proxy.socks5";
}

// Inherrit prototypes from SieveSocksProxy...
SieveSocks5Proxy.prototype.__proto__ = SieveSocks4Proxy.prototype;

SieveSocks5Proxy.prototype.getType
    = function()
{
  return 3;
}

SieveSocks5Proxy.prototype.usesRemoteDNS
    = function()
{
  if (gPref.prefHasUserValue(this.prefURI+".remote_dns"))
    return gPref.getBoolPref(this.prefURI+".remote_dns");

  return true; 
}

SieveSocks5Proxy.prototype.setRemoteDNS
    = function(enabled)
{
  gPref.setBoolPref(this.prefURI+".remote_dns",enabled);
}

SieveSocks5Proxy.prototype.getProxyInfo
    = function()
{
  // generate proxy info
  var pps = Components.classes["@mozilla.org/network/protocol-proxy-service;1"]
                .getService(Components.interfaces.nsIProtocolProxyService);
                                
  return [ pps.newProxyInfo("socks",this.getHost(),this.getPort(),(this.usesRemoteDNS()?(1<<0):0),4294967295,null)]; 
}

/*********************************/

function SieveAbstractHost(uri)
{
  if (uri == null)
    throw "SieveCustomHost: URI can't be null";
    
  this.uri = uri;
  this.prefURI = "extensions.sieve.account."+this.uri;  
}

SieveAbstractHost.prototype.getPort
    = function (type)
{    
  var port = 4190;
  
  if ((type == null) && (gPref.prefHasUserValue(this.prefURI+".port.type"))) 
    type = gPref.getIntPref(this.prefURI+".port.type");

  if ((type == 2) && gPref.prefHasUserValue(this.prefURI+".port"))
    return gPref.getIntPref(this.prefURI+".port");
    
  if (type == 1)
    return 2000;

  return 4190;
}

SieveAbstractHost.prototype.setPort
    = function (port)
{
  var type = 2;
  
  if (port == 4190)
    type = 0;
  else if (port == 2000)
    type = 1;
    
  gPref.setIntPref(this.prefURI+".port.type",type);
  
  if (type != 2)
    return;
    
  port = parseInt(port,10);
  
  if (isNaN(port))
    port = 4190;
    
  gPref.setIntPref(this.prefURI+".port",port);
}

SieveAbstractHost.prototype.isTLSForced
    = function ()
{
  if (!this.isTLSEnabled())
    return false;
    
  if (gPref.prefHasUserValue(this.prefURI+".TLS"))
    return gPref.getBoolPref(this.prefURI+".TLS");

  return true;      
}

SieveAbstractHost.prototype.isTLSEnabled
    = function ()
{
   if (gPref.prefHasUserValue(this.prefURI+".TLS.forced"))
    return gPref.getBoolPref(this.prefURI+".TLS.forced");

   return true;
}

SieveAbstractHost.prototype.setTLS
    = function (enabled, forced)
{
  gPref.setBoolPref(this.prefURI+".TLS",!!enabled);
  gPref.setBoolPref(this.prefURI+".TLS.forced",!!forced);
}

/***********/

/**
 * This class loads the hostname from an IMAP account. The hostname is not 
 * cached it. This ensures that always the most recent settings are used.
 * 
 * @param {String} imapKey
 *   The IMAP Key which host settings should be used. 
 */
function SieveImapHost(uri,imapKey)
{
  SieveAbstractHost.call(this,uri);
  
  if (imapKey == null)
    throw "SieveImapHost: IMAP account key can't be null"; 
  
  this.imapKey = imapKey;
}

SieveImapHost.prototype.__proto__ = SieveAbstractHost.prototype;

SieveImapHost.prototype.getHostname
    = function ()
{
  // use the IMAP Key to load the Account...
  var account = Components.classes['@mozilla.org/messenger/account-manager;1']  
                    .getService(Components.interfaces.nsIMsgAccountManager)
                    .getIncomingServer(this.imapKey);

  return account.realHostName;
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
  SieveAbstractHost.call(this,uri);
}

SieveCustomHost.prototype.__proto__ = SieveAbstractHost.prototype;

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
  if (hostname == null)
    throw "Hostname can't be null";

  gPref.setCharPref(this.prefURI+".hostname",hostname);
}

SieveCustomHost.prototype.getType
    = function ()
{
  return 1;
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

  return "300000"; //5*60*1000 = 5 Minutes
}

SieveAccountSettings.prototype.setKeepAliveInterval
    = function (ms)
{
  ms = parseInt(ms,10);
  
  if (isNaN(ms))
    ms = 300000;

  // We limit the keep alive packet to 1 Minute.
  if (ms < 60*1000)
    ms = 60*1000;
  
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
  ms = parseInt(ms,10);
  
  if (isNaN(ms))
    ms = 500;
    
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

//** SieveNoAuthorization ****************************************************//
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

//** SievePromptAuthorization ************************************************//

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
  
  // the "original" hostname...
  /** @private */ this.host = account.hostName
}

/**
 * Every SIEVE Account needs to be bound to an IMAP Account. IMAP Accounts
 * are usually accessed via the so called IMAP Key. It is garanteed to uniquely 
 * Identify the IMAP Account. Therefore it is used for binding SIEVE and IMAP 
 * Account together. 
 *  
 * @return {String} 
 *   Returns the unique IMAP Key of the IMAP Account bound to this SIEVE Account.
 */
SieveAccount.prototype.getKey
    = function () { return this.imapKey; }

SieveAccount.prototype.getUri
    = function () { return this.Uri; }

/**
 * As URIs are not very user friendly, Thunderbird uses for every IMAP account 
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
 *   {@link SieveCustomAuth2}, {@link SieveImapAuth}) should be loaded. If this 
 *   parameter is skipped the default Authentication settings will be returned. 
 * @return {SieveImapAuth,SieveNoAuth,SieveCustomAuth2}
 *   Returns the Authentication Settings for this SieveAccount
 */
SieveAccount.prototype.getLogin
    = function (type) 
{
  if ((type == null) && gPref.prefHasUserValue(this.sieveKey+".activeLogin")) 
    type = gPref.getIntPref(this.sieveKey+".activeLogin");

  switch (type)
  {
    case 0:
      return new SieveNoAuth();
      
    case 2:
      return new SieveCustomAuth2(this.host,this.Uri);
    
    default:
      return new SieveImapAuth(this.imapKey);
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
  
  return new SieveImapHost(this.Uri, this.imapKey)
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

SieveAccount.prototype.isFirstRun
    = function ()
{
  // if the host settings are set manually, we obiously don't need
  // to show the first run dialog 
  if ( this.getHost().getType() == 1)
  {
    this.setFirstRun();
    return false;
  }

  if (gPref.prefHasUserValue(this.sieveKey+".firstRunDone"))
    return !(gPref.getBoolPref(this.sieveKey+".firstRunDone"));
  
  return true;
}

SieveAccount.prototype.setFirstRun
    = function()
{
  gPref.setBoolPref(this.sieveKey+".firstRunDone",true);      
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

SieveAccount.prototype.getProxy
    = function (type)
{
  if ((type == null) && gPref.prefHasUserValue(this.sieveKey+".proxy.type")) 
    type = gPref.getIntPref(this.sieveKey+".proxy.type");

  switch (type)
  {
    case 0  : return new SieveNoProxy();
    case 2  : return new SieveSocks4Proxy(this.sieveKey);
    case 3  : return new SieveSocks5Proxy(this.sieveKey);
    
    default : return new SieveSystemProxy(); 
  }  
        
}

SieveAccount.prototype.setProxy
    = function (type)
{
  if (type == null)
    throw "Proxy type is null";
  if ((type < 0) || (type > 3))
    throw "Invalid proxy type";

  gPref.setIntPref(this.sieveKey+".proxy.type",type);
}

//****************************************************************************//

function SieveAccounts()
{  
  this.accounts = null;  
}

/**
 * Returns all SieveAccounts of the currently active Thunderbrid profile.  
 * @return {SieveAccount[]}
 *   Array containing SieveAccounts
 */
SieveAccounts.prototype.getAccounts
    = function () 
{
  // as cache the array containting the account information...
  // ... we check if we already enumerated the accounts.
  if (this.accounts)
    return this.accounts
    
  var accountManager = Components.classes['@mozilla.org/messenger/account-manager;1']
                           .getService(Components.interfaces.nsIMsgAccountManager);
                          
  this.accounts = new Array();
  
  for (var i = 0; i < accountManager.allServers.Count(); i++)
  {
    var account = accountManager.allServers.GetElementAt(i)
                    .QueryInterface(Components.interfaces.nsIMsgIncomingServer);
          
    if ((account.type != "imap") && (account.type != "pop3"))
      continue;

    this.accounts.push(new SieveAccount(account));        
  }
      
  return this.accounts;
}

/**
 * Loads a Sieve Account by its associated nsIMsgIncomingServer Account
 * @param {String} key
 *   The Unique Identifier of the associated nsIMsgIncomingServer Account
 * @return {SieveAccount}
 *   A corresponding SieveAccount
 */
SieveAccounts.prototype.getAccount
    = function (key)
{
  var accountManager = Components.classes['@mozilla.org/messenger/account-manager;1']
                         .getService(Components.interfaces.nsIMsgAccountManager);

  return new SieveAccount(accountManager.getIncomingServer(key));                       
}