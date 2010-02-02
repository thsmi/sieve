/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */


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
  return "No Authentication";
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
    throw "SieveImapHost: IMAP account key can't be null"; 

  this.imapKey = imapKey;
}

SieveImapAuth.prototype.getDescription
    = function ()
{
  return "Use login from IMAP Account";
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

/**
 * Incase the Sieve Account requires a different login than the IMAP Account,
 * use this Class. It stores the username and the password if desired.
 * 
 * 
 * As the password manager in Thunderbird 3 broke compatibility with older
 * releases, it is our job to maintain compatibility. 
 * 
 * 
 * Therefore SieveCustomAuth2 is compatible with Thunderbird 3 and up, while
 * the class SieveCustomAuth supports legacy Thunderbird releases.
 * 
 * Entries in the new Login-Manager are identified and enumerated by their 
 * original hostname. Furthermore the username is stored in the prefs and 
 * is used to find a matching account, as the original hostname is not 
 * garanteed to be unique.
 * 
 *  and their username. The latter one is storedsaved in the 
 * preferences.
 * 
 * @see SieveCustomAuth
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
  return "Use a custom login";
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
  if ((username == null) || (username == ""))
    throw "SieveCustomAuth2: Username is empty or null";

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
 *   The username or an empty string in case of a failure
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
 * Incase the Sieve Account requires a different login than the IMAP Account,
 * use this Class. It stores the username and the password if desired.
 * 
 * As the password manager in Thunderbird 3 broke compatibility with older...
 * ... releases, it is our job to maintain compatibility. 
 * 
 * Therefore SieveCustomAuth2 is compatible with Thunderbird 3 and up, while...
 * ... the class SieveCustomAuth supports legacy Thunderbird releases
 * 
 * @see SieveCustomAuth
 * @deprecated since Thunderbird 3
 *  
 * @param {String} uri
 *   the unique URI of the associated sieve account
 */
function SieveCustomAuth(uri)
{
  if (("@mozilla.org/passwordmanager;1" in Components.classes) == false)
    throw "SieveCustomAuth: No Password Manager Component found";
  
  if (uri == null)
    throw "SieveCustomAuth: URI can't be null"; 
    
  this.uri = uri;
  this.prefURI = "extensions.sieve.account."+this.uri;
}

SieveCustomAuth.prototype.getDescription
    = function ()
{
  return "Use a custom login";
}

/**
 * Updates the username and deletes all passworts which are associated ...
 * ... with htis account. This strange is behaviour is normal for builds ...
 * ... prior to Thunderbird3.
 * 
 * @param {String} username
 *    the username as string, has to be neither empty nor null. 
 */
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
 * This maintains SOCKS proxy settings 
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

  return ""; 
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

  return ""; 
}

SieveSocks4Proxy.prototype.setPort
    = function(port)
{
  // TODO: Check If port is a valid integer
  gPref.setCharPref(this.prefURI+".port",port);
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
 * @param {} imapKey
 */
function SieveSocks5Proxy(sieveKey)
{
  this.prefURI = sieveKey+".proxy.socks5";
}

SieveSocks5Proxy.prototype.getType
    = function()
{
  return 3;
}

SieveSocks5Proxy.prototype.getHost
    = function()
{
  if (gPref.prefHasUserValue(this.prefURI+".host"))
    return gPref.getCharPref(this.prefURI+".host");

  return ""; 
}

SieveSocks5Proxy.prototype.setHost
    = function(host)
{
  gPref.setCharPref(this.prefURI+".host",host);
}

SieveSocks5Proxy.prototype.getPort
    = function()
{
  if (gPref.prefHasUserValue(this.prefURI+".port"))
    return gPref.getCharPref(this.prefURI+".port");

  return ""; 
}

SieveSocks5Proxy.prototype.setPort
    = function(port)
{
  // TODO: Check If port is a valid integer
  gPref.setCharPref(this.prefURI+".port",port);
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
  return [pps.newProxyInfo("socks",this.getHost(),this.getPort(),0,4294967295,null)];
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

  return "300000"; //5*60*1000 = 5 Minutes
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
    case 0:
      return new SieveNoAuth();
      
    case 2:
      if ("@mozilla.org/passwordmanager;1" in Components.classes)
        return new SieveCustomAuth(this.Uri);
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

