var gPref = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

// Sieve No Auth Class
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

SieveNoAuth.prototype.hasPassword
    = function ()
{
	return false;
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
// Sieve Imap Auth Class
// This class uses the Settings from the IMAP account
function SieveImapAuth(account)
{
    if (account == null)
        throw "SieveImapHost: Account can't be null"; 

	this.account = account;
}

SieveImapAuth.prototype.getPassword
    = function ()
{
	return this.account.password;
}

SieveImapAuth.prototype.getUsername
    = function ()
{
	return this.account.username;
}

SieveImapAuth.prototype.hasPassword
    = function ()
{
    // passwordPromptRequired liefert zurück, ob wir uns um ein 
    // gültiges Passwort kümmern müssen, oder nicht. Bei einem false 
    // ist es Thunderbirds Aufgabe ein gültiges Passwort zu beschaffen.
    // Ein True bedeutet hingegen, dass es unsere Aufgabe ist...
    	
	// Somit ist der Rückgabewert genau Spiegelverkehrt...
	// ... und muss negiert werden!
	return ! this.account.passwordPromptRequired;
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

SieveCustomAuth.prototype.setLogin
    = function (username,password)
{   
    if ((username == null) || (username == ""))
    	throw "SieveCustomAuth: Username is empty or null";
    	
    // remove the existing user    
    var pwMgr = Components.classes["@mozilla.org/passwordmanager;1"]
                    .getService(Components.interfaces.nsIPasswordManager);
    try
    {
	    pwMgr.removeUser(new String("sieve://"+this.uri) , this.getUsername());    
	}
	catch (e)
	{
		// do nothing 
	}    
    
    if ((password == null) || (password == ""))
    {
        gPref.setCharPref(this.prefURI+".login.username",username);    
	    gPref.setBoolPref(this.prefURI+".login.hasPassword",false);
    	return;
    }
	
    pwMgr.addUser(new String("sieve://"+this.uri),username, password);    
    gPref.setBoolPref(this.prefURI+".login.hasPassword",true);   
}    

SieveCustomAuth.prototype.getPassword
    = function ()
{
	if (this.hasPassword() == false)
		return null;
		
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
    
    return null;
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

// Dies läd die Imap einstellungen direkt vom Account
function SieveImapHost(account)
{
    if (account == null)
        throw "SieveImapHost: Account can't be null"; 
    this.account = account;
}

SieveImapHost.prototype.getHostname
    = function ()
{
	return this.account.hostName;
}

SieveImapHost.prototype.getPort
    = function ()
{
	return 2000;
}

SieveImapHost.prototype.isTLS
    = function ()
{
	if ( this.account.socketType == 0)
		return false;
		
	return true;
}

SieveImapHost.prototype.getType
    = function ()
{
	return 0;
}

// Diese klasse verwaltet die benutzerdefinierten hosteinstellungen eines Sieve Accounts
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

SieveAccountSettings.prototype.isKeepAlive
    = function () 
{
    if (gPref.prefHasUserValue(this.prefURI+".keepalive"))
        return gPref.getBoolPref(this.prefURI+".keepalive");
        
    return true;
}

SieveAccountSettings.prototype.setKeepAlive
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

SieveAccountSettings.prototype.isCompile
    = function ()
{
    if (gPref.prefHasUserValue(this.prefURI+".compile"))
        return gPref.getBoolPref(this.prefURI+".compile");
        
    return true;
}

SieveAccountSettings.prototype.setCompile
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

SieveAccountSettings.prototype.isDebugFlag
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



//*******************

function SieveAccount(account)
{
    if (account == null)
        throw "SieveAccount: Account can't be null"; 

    this.URI = account.rootMsgFolder.baseMessageURI.slice(15);
    this.prefURI = "extensions.sieve.account."+this.URI;
    
    this.description = account.prettyName;    
	// initalize the host settings
	this.host = new Array(new SieveImapHost(account),new SieveCustomHost(this.URI));
	// Initalize Logins setings
	this.login = new Array(new SieveNoAuth(),new SieveImapAuth(account),new SieveCustomAuth(this.URI))
	// Initalize the general settings
	this.settings = new SieveAccountSettings(this.URI);
}

SieveAccount.prototype.getDescription
    = function () { return this.description; }

SieveAccount.prototype.getLogin
    = function (type) 
{
	// wenn kein bestimmter Logintyp angegeben ist ...
	// ... nehmen wir die Standardeinstellung
	if (type == null)
	{
	    // Login Related Prefs
        if (gPref.prefHasUserValue(this.prefURI+".activeLogin"))
            return this.getLogin(gPref.getIntPref(this.prefURI+".activeLogin"));
        
    	return this.login[1]; 	
	}

	if ((type < 0) || (type > 2))
		throw "invalid login type";
	
	return this.login[type];
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

	if (type == null)
	{
	    // Login Related Prefs
	    if (gPref.prefHasUserValue(this.prefURI+".activeHost"))
            return this.getHost(gPref.getIntPref(this.prefURI+".activeHost"));
        
    	return this.host[0]; 
    }

	if ((type < 0) || (type > 1))
		throw "invalid host type";
	
	return this.host[type];
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
  return this.settings;
}

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

SieveAccounts.prototype.getAccounts
    = function () 
{   
    return this.accounts;
}    