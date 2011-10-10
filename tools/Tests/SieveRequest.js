/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

/* 
  NOTES:
  ======
  
  The communication in this library is asynchonous! After sending a request,
  you will be notified by a listerner, as soon as a response arrives. 
  
  If a request caused an error or timeout, its error listener will be called 
  to resolve the issue. If a server rejects a request, the onError() function 
  of the error listener will be invoked. In case of a timeout situation, the 
  onTimeout() function is called.
   
  If a request succees, the corresponding response listener of the request 
  will be notified.
   
  The addResponse(), getNextRequest(), hasNextRequest(), cancel() Methods are 
  used by the Sieve object, and should not be invoked manually.  
  
  When the sieve object receives a response, it is passed to the addResponse() 
  Method of the requesting object. A timeout is singaled by passing invoking 
  the cancel() Method.  
  
*/

//****************************************************************************//

/**
 * Manage Sieve uses for literals UTF-8 as encoding, network sockets are usualy 
 * binary, and javascript is something inbetween. This means we have to convert
 * UTF-8 into a binary by our own...
 * 
 * @param {String} string The binary string which should be converted 
 * @return {String} The converted string in UTF8 
 * 
 * @author Thomas Schmid <schmid-thomas@gmx.net>
 * @author Max Dittrich
 */ 

function JSStringToByteArray(str,charset) 
{  
  // ... and convert to UTF-8
  var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"]
                    .createInstance(Components.interfaces.nsIScriptableUnicodeConverter); 
  
  if (charset == null)
    converter.charset = "UTF-8";
  else
    converter.charset = charset;
 
  return converter.convertToByteArray(str, {});
}

//****************************************************************************//

/**
 * An abstract class, it is the prototype for any requests 
 */
function SieveAbstractRequest()
{  
  throw "Abstract Constructor, do not Invoke";
}

SieveAbstractRequest.prototype.errorListener = null;
SieveAbstractRequest.prototype.byeListener = null;
SieveAbstractRequest.prototype.responseListener = null;

SieveAbstractRequest.prototype.addErrorListener
    = function (listener)
{
  this.errorListener = listener;
}

SieveAbstractRequest.prototype.addByeListener
    = function (listener)
{
  this.byeListener = listener;
}

SieveAbstractRequest.prototype.hasNextRequest
    = function ()
{
  return false;
}

SieveAbstractRequest.prototype.cancel
    = function ()
{
  if ((this.errorListener) && (this.errorListener.onTimeout))
    this.errorListener.onTimeout();  
}

/**
 * An abstract helper, which calls the default message handlers.
 * @param {SieveAbstractResponse} request
 */
SieveAbstractRequest.prototype.addResponse
    = function (response)
{
  if ((response.getResponse() == 1) && (this.byeListener != null))
    this.byeListener.onByeResponse(response);
  else if ((response.getResponse() != 0) && (this.errorListener != null))
    this.errorListener.onError(response);
}

//****************************************************************************//

/**
 * An abstract calls derived from AbstractRequest. It is the foundation for
 * any requests implementing a SASL compatible authentication.
 * 
 */
function SieveAbstractSaslRequest()
{
  throw "Abstract Constructor, do not Invoke";
}

SieveAbstractSaslRequest.prototype._username = "";
SieveAbstractSaslRequest.prototype._password = "";
SieveAbstractSaslRequest.prototype._authorizable = false;
SieveAbstractSaslRequest.prototype._authorization = "";

SieveAbstractSaslRequest.prototype.__proto__ = SieveAbstractRequest.prototype;


/** @param {String} username */
SieveAbstractSaslRequest.prototype.setUsername
    = function (username)
{
  this._username = username;  
}

/** @param {String} password */
SieveAbstractSaslRequest.prototype.setPassword
    = function (password)
{
  this._password = password;  
}

/** @return {Boolean} */
SieveAbstractSaslRequest.prototype.isAuthorizable
    = function () 
{
  return this._authorizable;
}

/** @param {String} authorization */
SieveAbstractSaslRequest.prototype.setAuthorization
    = function (authorization)
{
  if (this._authorizable)
    this._authorization = authorization;
}

//****************************************************************************//

/**
 * @param {String} script
 * @author Thomas Schmid
 */
function SieveGetScriptRequest(script) 
{
  this.script = script;
}

// Inherrit prototypes from SieveAbstractRequest...
SieveGetScriptRequest.prototype.__proto__ = SieveAbstractRequest.prototype;

SieveGetScriptRequest.prototype.addGetScriptListener
    = function (listener)
{
  this.responseListener = listener;
} 
   
/** @return {String} */
SieveGetScriptRequest.prototype.getNextRequest
    = function ()
{
  return "GETSCRIPT \""+this.script+"\"\r\n";
}

/** @param {SieveResponseParser} parser */
SieveGetScriptRequest.prototype.addResponse
    = function (parser)
{  
  var response = new SieveGetScriptResponse(this.script,parser); 
		
  if ((response.getResponse() == 0) && (this.responseListener != null))
    this.responseListener.onGetScriptResponse(response);
  else
    SieveAbstractRequest.prototype.addResponse.call(this,response);
}

//****************************************************************************//

/**
 * @param {String} script
 * @param {String} body
 * 
 * @author Thomas Schmid
 */
function SievePutScriptRequest(script, body) 
{
  this.script = script;
   
  // cleanup linebreaks...
  this.body = body.replace(/\r\n|\r|\n|\u0085|\u000C|\u2028|\u2029/g,"\r\n");
}

// Inherrit prototypes from SieveAbstractRequest...
SievePutScriptRequest.prototype.__proto__ = SieveAbstractRequest.prototype;

/** @return {String} */
SievePutScriptRequest.prototype.getNextRequest
    = function ()
{
  //"PUTSCRIPT \"xxxx\" {4+}\r\n1234\r\n"
  //"PUTSCRIPT \"xxxx\" \"TEST MAX 1024 Zeichen\"\r\n"
  
  //  We have to convert all linebreaks thus Mozilla uses 
  //  \n as linebreak but sieve wants \r\n. For some reason 
  //  it happens, that we end up with mixed linebreaks...
     
  // convert all \r\n to \r ...
  //this.body = this.body.replace(/\r\n/g,"\r");
  // ... now convert all \n to \r ...
  //this.body = this.body.replace(/\n/g,"\r");  
  // ... finally convert all \r to \r\n
  //this.body = this.body.replace(/\r/g,"\r\n");
  
  //this.body = this.body.replace(/\r\n|\r|\n/g, "\r\n")

  /*  
  //BEGIN DEBUG CODE
    var r = 0;
    var n = 0;
    for (var i=0; i< this.body.length; i++)
    {
      if (this.body.charCodeAt(i) == "\r".charCodeAt(0))
        r++;
      if (this.body.charCodeAt(i) == "\n".charCodeAt(0))
        n++;
    }
    
    if (n != r)
      alert("Something went terribly wrong. The linebreaks are mixed up...\n");
  // END DEBUG CODE
  */
//  var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"]
//                    .createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
//
//  converter.charset = "utf-8" ;
//
  //return converter.ConvertFromUnicode(aStr);}
  
  return "PUTSCRIPT \""+this.script+"\" {"+JSStringToByteArray(this.body).length+"+}\r\n"
        +this.body+"\r\n";
}

SievePutScriptRequest.prototype.addPutScriptListener
    = function (listener)
{
  this.responseListener = listener;
} 

/** @param {SieveResponseParser} parser */
SievePutScriptRequest.prototype.addResponse
    = function (parser)
{  
  var response = new SieveSimpleResponse(parser);

  if ((response.getResponse() == 0) && (this.responseListener != null))
    this.responseListener.onPutScriptResponse(response);
  else
    SieveAbstractRequest.prototype.addResponse.call(this,response);
    
  return;
}

//****************************************************************************//

/**
 * The CheckScriptRequest validates the Syntax of a Sieve script. The script
 * is not stored on the server.
 * 
 * If the script fails this test, the server replies with a NO response. The 
 * response contains one or more CRLF separated error messages.
 *
 * An OK response can contain Syntax Warnings. 
 * 
 * @example
 *   C: CheckScript {31+}
 *   C: #comment
 *   C: InvalidSieveCommand
 *   C:
 *   S: NO "line 2: Syntax error"
 * 
 * @param {String} body
 *   the script which should be check for syntactical validity 
 */
function SieveCheckScriptRequest(body) 
{
  // Strings in JavaScript should use the encoding of the xul document and...
  // ... sockets use binary strings. That means for us we have to convert...
  // ... the JavaScript string into a UTF8 String.
  
  // Further more Sieve expects line breaks to be \r\n. Mozilla uses \n ... 
  // ... according to the documentation. But for some unknown reason a ...
  // ... string sometimes  contains mixed line breaks. Thus we convert ...
  // ... any \r\n, \r and \n to \r\n.   
  this.body = body.replace(/\r\n|\r|\n|\u0085|\u000C|\u2028|\u2029/g,"\r\n");  
  //this.body = UTF8Encode(body).replace(/\r\n|\r|\n/g, "\r\n");
}

// Inherrit prototypes from SieveAbstractRequest...
SieveCheckScriptRequest.prototype.__proto__ = SieveAbstractRequest.prototype;

/** @return {String} */
SieveCheckScriptRequest.prototype.getNextRequest
    = function ()
{
  return "CHECKSCRIPT {"+JSStringToByteArray(this.body).length+"+}\r\n"
        +this.body+"\r\n"
}

SieveCheckScriptRequest.prototype.addCheckScriptListener
    = function (listener)
{
  this.responseListener = listener;
} 

/** @param {SieveResponseParser} parser */
SieveCheckScriptRequest.prototype.addResponse
    = function (parser)
{  
  var response = new SieveSimpleResponse(parser);

  if ((response.getResponse() == 0) && (this.responseListener != null))
    this.responseListener.onCheckScriptResponse(response);
  else
    SieveAbstractRequest.prototype.addResponse.call(this,response);
}

//****************************************************************************//

/**
 * This class encaspulates a Sieve SETACTIVE request.
 * <p>
 * Either none or one serverscripts can be active, this means you can't have 
 * more than one active scripts
 * <p>
 * You activate a Script by calling SETACTIVE and the scriptname. At activation 
 * the previous active Script will become inactive.
 * 
 * @param {String} script - The script name which should be activated. Passing 
 * an empty string deactivates the active script.
 * 
 * @author Thomas Schmid
 */
function SieveSetActiveRequest(script) 
{
  if (script == null)
    this.script = "";
  else
    this.script = script;
}

// Inherrit prototypes from SieveAbstractRequest...
SieveSetActiveRequest.prototype.__proto__ = SieveAbstractRequest.prototype;

/** @return {String} */
SieveSetActiveRequest.prototype.getNextRequest
    = function ()
{
  return "SETACTIVE \""+this.script+"\"\r\n";
}

SieveSetActiveRequest.prototype.addSetActiveListener
    = function (listener)
{
  this.responseListener = listener;
} 
   
/** @param {SieveResponseParser} parser */
SieveSetActiveRequest.prototype.addResponse
    = function (parser)
{  
  var response = new SieveSimpleResponse(parser);

  if ((response.getResponse() == 0) && (this.responseListener != null))
    this.responseListener.onSetActiveResponse(response);
  else
    SieveAbstractRequest.prototype.addResponse.call(this,response);
}

//****************************************************************************//

/**
 * 
 * @author Thomas Schmid
 */
function SieveCapabilitiesRequest()
{
}

// Inherrit prototypes from SieveAbstractRequest...
SieveCapabilitiesRequest.prototype.__proto__ = SieveAbstractRequest.prototype;

/** @return {String} */
SieveCapabilitiesRequest.prototype.getNextRequest
    = function ()
{
  return "CAPABILITY\r\n";
}

SieveCapabilitiesRequest.prototype.addCapabilitiesListener
    = function (listener)
{
  this.responseListener = listener;
} 
   
/** @param {SieveResponseParser} parser */
SieveCapabilitiesRequest.prototype.addResponse
    = function (parser)
{
  
  var response = new SieveCapabilitiesResponse(parser);
			
  if ((response.getResponse() == 0) && (this.responseListener != null))
    this.responseListener.onCapabilitiesResponse(response);			
  else
    SieveAbstractRequest.prototype.addResponse.call(this,response);
}

//****************************************************************************//

/**
 * @param {String} script
 * @author Thomas Schmid
 */
function SieveDeleteScriptRequest(script) 
{
  this.script = script;
}

// Inherrit prototypes from SieveAbstractRequest...
SieveDeleteScriptRequest.prototype.__proto__ = SieveAbstractRequest.prototype;

/** @return {String} */
SieveDeleteScriptRequest.prototype.getNextRequest
    = function ()
{
  return "DELETESCRIPT \""+this.script+"\"\r\n";
}

SieveDeleteScriptRequest.prototype.addDeleteScriptListener
    = function (listener)
{
  this.responseListener = listener;
} 
   
/** @param {SieveResponseParser} parser */
SieveDeleteScriptRequest.prototype.addResponse
    = function (parser)
{        
  var response = new SieveSimpleResponse(parser);
			
  if ((response.getResponse() == 0) && (this.responseListener != null))
    this.responseListener.onDeleteScriptResponse(response);			
  else
    SieveAbstractRequest.prototype.addResponse.call(this,response);
}

//****************************************************************************//

/**
 * The NOOP request does nothing, it is used for protocol re-synchronisation or
 * to reset any inactivity auto-logout timer on the server.
 * 
 * The response to the NOOP command is always OK. 
 * 
 * @author Thomas Schmid
 */
function SieveNoopRequest() 
{
}

// Inherrit prototypes from SieveAbstractRequest...
SieveNoopRequest.prototype.__proto__ = SieveAbstractRequest.prototype;

/** @return {String} */
SieveNoopRequest.prototype.getNextRequest
    = function ()
{
  return "NOOP\r\n";
}

SieveNoopRequest.prototype.addNoopListener
    = function (listener)
{
  this.responseListener = listener;
} 
   
/** @param {SieveResponseParser} parser */
SieveNoopRequest.prototype.addResponse
    = function (parser)
{        
  var response = new SieveSimpleResponse(parser);
      
  if ((response.getResponse() == 0) && (this.responseListener != null))
    this.responseListener.onNoopResponse(response);     
  else
    SieveAbstractRequest.prototype.addResponse.call(this,response);
}

//****************************************************************************//

/**
 * This command is used to rename a Sieve script's. The Server will reply with 
 * a NO response if the old script does not exist, or a script with the new 
 * name already exists.
 * 
 * Renaming the active script is allowed, the renamed script remains active.
 *  
 * @param {String} Name of the script, which should be renamed
 * @param {String} New name of the Script
 * 
 * @author Thomas Schmid
 */
function SieveRenameScriptRequest(oldScript, newScript) 
{
  this.oldScript = oldScript;
  this.newScript = newScript
}

// Inherrit prototypes from SieveAbstractRequest...
SieveRenameScriptRequest.prototype.__proto__ = SieveAbstractRequest.prototype;

/** @return {String} */
SieveRenameScriptRequest.prototype.getNextRequest
    = function ()
{
  return "RENAMESCRIPT \""+this.oldScript+"\" \""+this.newScript+"\"\r\n";
}

SieveRenameScriptRequest.prototype.addRenameScriptListener
    = function (listener)
{
  this.responseListener = listener;
} 
   
/** @param {SieveResponseParser} parser */
SieveRenameScriptRequest.prototype.addResponse
    = function (parser)
{        
  var response = new SieveSimpleResponse(parser);
      
  if ((response.getResponse() == 0) && (this.responseListener != null))
    this.responseListener.onRenameScriptResponse(response);     
  else
    SieveAbstractRequest.prototype.addResponse.call(this,response);
}

//****************************************************************************//

/**
 * @author Thomas Schmid
 */
function SieveListScriptRequest() 
{
}

// Inherrit prototypes from SieveAbstractRequest...
SieveListScriptRequest.prototype.__proto__ = SieveAbstractRequest.prototype;

/** @return {String} */
SieveListScriptRequest.prototype.getNextRequest
    = function ()
{
  return "LISTSCRIPTS\r\n";
}

SieveListScriptRequest.prototype.addListScriptListener
    = function (listener)
{
  this.responseListener = listener;
} 

/** @param {SieveResponseParser} parser */
SieveListScriptRequest.prototype.addResponse 
    = function (parser)
{	
  var response = new SieveListScriptResponse(parser);
			
  if ((response.getResponse() == 0) && (this.responseListener != null))
    this.responseListener.onListScriptResponse(response);			
  else
    SieveAbstractRequest.prototype.addResponse.call(this,response);
  
  return;
}

//****************************************************************************//

function SieveStartTLSRequest() 
{
}

// Inherrit prototypes from SieveAbstractRequest...
SieveStartTLSRequest.prototype.__proto__ = SieveAbstractRequest.prototype;

/** @return {String} */
SieveStartTLSRequest.prototype.getNextRequest
    = function ()
{
  return "STARTTLS\r\n";
  
  //
}

SieveStartTLSRequest.prototype.addStartTLSListener
    = function (listener)
{
  this.responseListener = listener;
} 
   
/** @param {SieveResponseParser} parser */
SieveStartTLSRequest.prototype.addResponse 
    = function (parser)
{
  var response = new SieveSimpleResponse(parser);
			
  if ((response.getResponse() == 0) && (this.responseListener != null))
    this.responseListener.onStartTLSResponse(response);			
  else
    SieveAbstractRequest.prototype.addResponse.call(this,response);
}

//****************************************************************************//

/**
 * A logout request signals the server that the client wishes to terminate
 * the current session.
 * <pre>
 * Client > LOGOUT                               
 * Server < OK "Logout Complete"
 * [ connection terminated ]
 * </pre>
 * <p>
 * The following example shows how to use a SieveLogoutRequest:
 * <pre>
 *  var event = {
 *    onLogoutResponse: function(response) 
 *    {
 *      alert("Logout successfull");
 *    }
 *    ,                          
 *    onError: function(response) 
 *    {
 *      alert("SERVER ERROR:"+response.getMessage());
 *    }
 *  } 
 *                 
 *  var request = new SieveLogoutRequest();
 *  request.addErrorListener(event);
 *  request.addSaslPlainListener(event);
 *                       
 *  sieve.addRequest(request);
 * </pre>
 * 
 * @author Thomas Schmid
 */
function SieveLogoutRequest() 
{
}

// Inherrit prototypes from SieveAbstractRequest...
SieveLogoutRequest.prototype.__proto__ = SieveAbstractRequest.prototype;

/** @return {String} */
SieveLogoutRequest.prototype.getNextRequest
    = function ()
{
  return "LOGOUT\r\n";
}

SieveLogoutRequest.prototype.addLogoutListener
    = function (listener)
{
  this.responseListener = listener;
} 
   
/** @param {SieveResponseParser} parser */
SieveLogoutRequest.prototype.addResponse 
    = function (parser)
{  
  var response = new SieveSimpleResponse(parser);
			
  // a "BYE" or "OK" is in this case a good answer...
  if (((response.getResponse() == 0) || (response.getResponse() == 1)))
  {
    if (this.responseListener != null)
      this.responseListener.onLogoutResponse(response);    
    
    return;
  }
  
  // The response is no, so the server has an error message which should be
  // processed before disconnecting
  SieveAbstractRequest.prototype.addResponse.call(this,response);    
}

//****************************************************************************//

/**
 * A ManageSieve server automatically post his capabilities as soon as the
 * connection is established or a secure channel is successfully started
 * (STARTTLS command). In order to capture this information a dummy request 
 * is used. It does not send a real request, but it parses the initial response 
 * of the sieve server. Therefore it is important to add the request before the 
 * connection is established. Otherwise the message queue will be jammed.
 * 
 * @example
 * Server < "IMPLEMENTATION" "Cyrus timsieved v2.1.18-IPv6-Debian-2.1.18-1+sarge2"
 *        < "SASL" "PLAIN"
 *        < "SIEVE" "fileinto reject envelope vacation imapflags notify subaddress relational regex"
 *        < "STARTTLS"
 *        < OK
 *
 * @example 
 *  var sieve = new Sieve("example.com",2000,false,3)
 *    
 *  var request = new SieveInitRequest();    
 *  sieve.addRequest(request);
 *    
 *  sieve.connect();
 *  
 * @author Thomas Schmid <schmid-thomas@gmx.net>
 *
 */
function SieveInitRequest() {}

// Inherrit prototypes from SieveAbstractRequest...
SieveInitRequest.prototype.__proto__ = SieveAbstractRequest.prototype;


SieveInitRequest.prototype.addInitListener
    = function (listener)
{
  this.responseListener = listener;
} 
   
/** @param {SieveResponseParser} parser */
SieveInitRequest.prototype.addResponse
    = function (parser)
{  
  var response = new SieveCapabilitiesResponse(parser);
			
  if ((response.getResponse() == 0) && (this.responseListener != null))
    this.responseListener.onInitResponse(response);			
  else
    SieveAbstractRequest.prototype.addResponse.call(this,response);
}
//****************************************************************************//

/*******************************************************************************
 
  FACTSHEET: 
  ==========
   
    CLASS NAME          : SievePlainRequest
    USES CLASSES        : SievePlainResponse
        
    CONSCTURCTOR        : SievePlainRequest(String username)
    DECLARED FUNCTIONS  : void addSaslPlainListener(...)
                          void addErrorListener(...)
                          void addResponse(parser)                          
                          String getNextRequest()
                          Boolean hasNextRequest()
                          void setPassword(String password)
    EXCEPTIONS          : 
    AUTHOR              : Thomas Schmid
    
  DESCRIPTION:
  ============
    This request implements the SALS Plain autentication method. 
    Please note, that the passwort is only base64 encoded. Therefore it can be 
    read or sniffed easily. A secure connection will solve this issue. So send 
    whenever possible, a SieveStartTLSRequest before calling this request.     

  EXAMPLE:
  ========
     
    var event = {
      onSaslPlainResponse: function(response) 
      {
        alert("Login successfull");
      }
      ,                          
      onError: function(response) 
      {
        alert("SERVER ERROR:"+response.getMessage());
      }
    } 

    var request = new SieveSaslPlainRequest('geek');
    request.setPassword('th3g33k1');
    request.addErrorListener(event);
    request.addSaslPlainListener(event);
                        
    sieve.addRequest(request);

  PROTOCOL INTERACTION:
  =====================

    Client > AUTHENTICATE "PLAIN" AHRlc3QAc2VjcmV0   | AUTHENTICATE "PLAIN" [UTF8NULL]test[UTF8NULL]secret
    Server < OK                                      | OK

*******************************************************************************/

/**
 * 
 */
function SieveSaslPlainRequest() 
{
  this._authorizable = true;
}

// Inherrit prototypes from SieveSASLAbstractRequest...
SieveSaslPlainRequest.prototype.__proto__ = SieveAbstractSaslRequest.prototype;

/** @return {String} */
SieveSaslPlainRequest.prototype.getNextRequest 
    = function ()
{
  var logon = btoa(this._authorization+"\0"+this._username+"\0"+this._password);  
  return "AUTHENTICATE \"PLAIN\" \""+logon+"\"\r\n";
}

SieveSaslPlainRequest.prototype.addSaslPlainListener
    = function (listener)
{
  this.responseListener = listener;
} 
   
SieveSaslPlainRequest.prototype.addResponse
    = function (parser)
{
  var response = new SieveSimpleResponse(parser);
			
  if ((response.getResponse() == 0) && (this.responseListener != null))
    this.responseListener.onSaslPlainResponse(response);			
  else
    SieveAbstractRequest.prototype.addResponse.call(this,response);
}


/*******************************************************************************
 
  FACTSHEET: 
  ==========
    CLASS NAME          : SieveSaslLoginRequest
    USES CLASSES        : SieveSaslLoginResponse
        
    CONSCTURCTOR        : SieveLoginRequest(String username)
    DECLARED FUNCTIONS  : void addSaslLoginListener(...)
                          void addErrorListener(...)
                          void addResponse(String parser)                          
                          String getNextRequest()
                          Boolean hasNextRequest()
                          void setPassword(String password)
    EXCEPTIONS          : 
    AUTHOR              : Thomas Schmid        
    
  DESCRIPTION:
  ============
    This request implements the SALS Login autentication method. It is similar 
    to the SASL Plain method. The main difference is that SASL Login is somekind
    of dialog driven. The server will request first the username and then the 
    password. With SASL Plain both, username and password are requested at the 
    sametime.
    Please note, that the passwort is only base64 encoded. Therefore it can be 
    read or sniffed easily. A secure connection will solve this issue. So send 
    whenever possible, a SieveStartTLSRequest before calling this request.     

  LINKS:
  ======
      * http://darwinsource.opendarwin.org/Current/CyrusIMAP-156.9/cyrus_imap/imap/AppleOD.c
      * http://www.opensource.apple.com/darwinsource/Current/CyrusIMAP-156.10/cyrus_imap/imap/AppleOD.c

  EXAMPLE:
  ========
     
    var event = {
      onSaslLoginResponse: function(response) 
      {
        alert("Login successfull");
      }
      ,                          
      onError: function(response) 
      {
        alert("SERVER ERROR:"+response.getMessage());
      }
    } 
                          
    var request = new SieveSaslLoginRequest();
    request.setUsername('geek');
    request.setPassword('th3g33k1');
    request.addErrorListener(event);
    request.addSaslLoginListener(event);
                        
    sieve.addRequest(request);

  PROTOCOL INTERACTION: 
  =====================
     
    Client > AUTHENTICATE "LOGIN"   | AUTHENTICATE "LOGIN"
    Server < {12}                   | {12}
           < VXNlcm5hbWU6           | Username:
    Client > {8+}                   | {8+}
           > Z2Vlaw==               | geek
    Server < {12}                   | {12}
           < UGFzc3dvcmQ6           | Password:
    Client > {12+}                  | {12+}
           > dGgzZzMzazE=           | th3g33k1
    Server < OK                     | OK

*******************************************************************************/

/** 
 * This request implements the SALS Login autentication method. It is deprecated
 * and has been superseeded by SASL Plain method. SASL Login uses a question and 
 * answer style communication. The server will request first the username and 
 * then the password. 
 * <p>
 * Please note, that the passwort is not encrypted it is only base64 encoded. 
 * Therefore it can be read or sniffed easily. A secure connection will solve 
 * this issue. So send whenever possible, a SieveStartTLSRequest before calling 
 * this request.
 * 
 * @author Thomas Schmid
 */
function SieveSaslLoginRequest() 
{
  this.response = new SieveSaslLoginResponse();
}

// Inherrit prototypes from SieveAbstractRequest...
SieveSaslLoginRequest.prototype.__proto__ = SieveAbstractSaslRequest.prototype;

/** @return {String} */
SieveSaslLoginRequest.prototype.getNextRequest
    = function ()
{
  switch (this.response.getState())
  {
    case 0:
      return "AUTHENTICATE \"LOGIN\"\r\n";    
    case 1: 
      return '"'+btoa(this._username)+"\"\r\n";
    case 2:
      return '"'+btoa(this._password)+"\"\r\n";       
  }
  
  throw "Unkown state in sasl login";
}

/** @return {Boolean} */
SieveSaslLoginRequest.prototype.hasNextRequest
    = function ()
{
  if (this.response.getState() == 4) 
    return false;
  
  return true;
}

SieveSaslLoginRequest.prototype.addSaslLoginListener
    = function (listener)
{
  this.responseListener = listener;
} 
   
/** @param {SieveResponseParser} parser */
SieveSaslLoginRequest.prototype.addResponse 
    = function (parser)
{
  this.response.add(parser);	
		
	if (this.response.getState() != 4)
	  return;
	
  if ((this.response.getResponse() == 0) && (this.responseListener != null))
    this.responseListener.onSaslLoginResponse(this.response);			
  else
    SieveAbstractRequest.prototype.addResponse.call(this,response);
}

//****************************************************************************//

/**
 * @author Thomas Schmid
 * @author Max Dittrich 
 */
function SieveSaslCramMd5Request() 
{
  this.response = new SieveSaslCramMd5Response();
}

// Inherrit prototypes from SieveAbstractRequest...
SieveSaslCramMd5Request.prototype.__proto__ = SieveAbstractSaslRequest.prototype;

SieveSaslCramMd5Request.prototype.getNextRequest
    = function ()
{
  switch (this.response.getState())
  {
    case 0: 
      return "AUTHENTICATE \"CRAM-MD5\"\r\n";    
    case 1:
      //decoding the base64-encoded challenge
      var challenge = atob(this.response.getChallenge());        
      var hmac = this.hmacMD5( challenge, this._password );
      
      return "\"" + btoa( this._username + " " + hmac ) + "\"\r\n";       
  }
  
  throw "Illegal state in SaslCram"; 
}

SieveSaslCramMd5Request.prototype.hasNextRequest
    = function ()
{
  if (this.response.getState() == 4) 
    return false;
  
  return true;
}

SieveSaslCramMd5Request.prototype.addSaslCramMd5Listener
    = function (listener)
{
  this.responseListener = listener;
} 
   
SieveSaslCramMd5Request.prototype.addResponse 
    = function (parser)
{
  this.response.add(parser);	
		
	if (this.response.getState() != 4)
	  return;

  if ((this.response.getResponse() == 0) && (this.responseListener != null))
    this.responseListener.onSaslCramMd5Response(this.response);      
  else
    SieveAbstractRequest.prototype.addResponse.call(this,response);
}


SieveSaslCramMd5Request.prototype.hmacMD5
    = function (challenge, secret)
{
  
  if ( !secret )
    secret = "";

  var challengeBytes = JSStringToByteArray(challenge);
  var crypto = Components.classes["@mozilla.org/security/hmac;1"]
                   .createInstance( Components.interfaces.nsICryptoHMAC );
  var keyObject = Components.classes["@mozilla.org/security/keyobjectfactory;1"]
                    .getService( Components.interfaces.nsIKeyObjectFactory )
                    .keyFromString( Components.interfaces.nsIKeyObject.HMAC, secret);

  crypto.init( Components.interfaces.nsICryptoHMAC.MD5, keyObject );
  crypto.update( challengeBytes, challengeBytes.length );
        
  return this.byteArrayToHexString(
           this.strToByteArray(crypto.finish(false)));
}

SieveSaslCramMd5Request.prototype.strToByteArray
     = function ( str )
{
  var bytes = new Array();

  for ( var i = 0; i < str.length; i++ ) 
    bytes[ i ] = str.charCodeAt( i );

  return bytes;
}

SieveSaslCramMd5Request.prototype.byteArrayToHexString
    = function (tmp)
{
  var str = ""; 
  for ( var i = 0; i < tmp.length; i++ ) 
    str += ("0"+tmp[i].toString(16)).slice(-2);
 
  return str;    
}

/**
 * @author Thomas Schmid
 */
function SieveSaslScramMd5Request() 
{
  this.response = new SieveSaslScramMd5Response();
}

// Inherrit prototypes from SieveAbstractRequest...
SieveSaslScramMd5Request.prototype.__proto__ = SieveAbstractSaslRequest.prototype;

SieveSaslScramMd5Request.prototype.getNextRequest
    = function ()
{
  /*
   if (do_sasl_scram_sha1)
   {
     var cnonce = MD5.hexdigest(Math.random() * 1234567890);
     var auth_str = "n=" + Strophe.getNodeFromJid(this.jid);
     auth_str += ",r="+cnonce;
     
     this._sasl_data["cnonce"] = cnonce;
     this._sasl_data["client-first-message-bare"] = auth_str;

     auth_str = "n,," + auth_str;
     this._changeConnectStatus(Strophe.Status.AUTHENTICATING, null);

     this._sasl_challenge_handler = this._addSysHandler(
       this._sasl_scram_challenge_cb.bind(this), null,
       "challenge", null, null);

     this.send($build("auth", {
       xmlns: Strophe.NS.SASL,
       mechanism: "SCRAM-SHA-1"
     }).t(Base64.encode(auth_str)).tree()); 
     
     
     if _sasl_success_cb {
       if (this._sasl_data["server-signature"]) {
         var serverSignature;
         var success = Base64.decode(Strophe.getText(elem));
         var attribMatch = /([a-z]+)=([^,]+)(,|$)/;

         matches = success.match(attribMatch);

         if (matches[1] == "v")
           serverSignature = matches[2];

         if (serverSignature != this._sasl_data["server-signature"])
         {          
           this._sasl_data = [];
           return this._sasl_failure_cb(null);
         }
       }
       Strophe.info("SASL authentication succeeded.");
     }     
   */
  
  switch (this.response.getState())
  {
    case 0: 
      return "AUTHENTICATE \"SCRAM-SHA-1\"\r\n";    
    case 1:
      //decoding the base64-encoded challenge
      var challenge = atob(this.response.getChallenge());        
      var hmac = this.hmacMD5( challenge, this._password );
      
      return "\"" + btoa( this._username + " " + hmac ) + "\"\r\n";       
  }
  
  throw "Illegal state in SaslCram"; 
}

SieveSaslScramMd5Request.prototype.hasNextRequest
    = function ()
{
  if (this.response.getState() == 4) 
    return false;
  
  return true;
}

SieveSaslScramMd5Request.prototype.addSaslScramMd5Listener
    = function (listener)
{
  this.responseListener = listener;
} 
   
SieveSaslScramMd5Request.prototype.addResponse 
    = function (parser)
{
  this.response.add(parser);  
    
  if (this.response.getState() != 4)
    return;

  if ((this.response.getResponse() == 0) && (this.responseListener != null))
    this.responseListener.onSaslScramMd5Response(this.response);      
  else
    SieveAbstractRequest.prototype.addResponse.call(this,response);
}

/*
 PrivateFunction: _sasl_scram_challenge_cb
  _Private_ handler for SCRAM-SHA-1 SASL authentication.

  (XMLElement) elem - The challenge stanza.

  Returns: false to remove the handler.


_sasl_scram_challenge_cb: function (elem)
{
  var nonce, salt, iter, Hi, U, U_old;
  var clientKey, serverKey, clientSignature;

  var responseText = "c=biws,";
  var challenge = Base64.decode(Strophe.getText(elem));

  var authMessage = this._sasl_data["client-first-message-bare"] + "," +
           challenge + ",";
  var cnonce = this._sasl_data["cnonce"]
  var attribMatch = /([a-z]+)=([^,]+)(,|$)/;

  while (challenge.match(attribMatch)) {
    matches = challenge.match(attribMatch);
    challenge = challenge.replace(matches[0], "");
    
    switch (matches[1]) {
      case "r":
        nonce = matches[2];
        break;

      case "s":
        salt = matches[2];
        break;

      case "i":
        iter = matches[2];
        break;
    }
  }

  if (!(nonce.substr(0, cnonce.length) === cnonce)) {
    this._sasl_data = [];
    return this._sasl_failure_cb(null);
  }

  responseText += "r=" + nonce;
  authMessage += responseText;

  salt = Base64.decode(salt);
  salt += "\0\0\0\1";

  Hi = U_old = core_hmac_sha1(this.pass, salt);
  
  for (i = 1; i < iter; i++) {
    U = core_hmac_sha1(this.pass, binb2str(U_old));

    for (k = 0; k < 5; k++)
      Hi[k] ^= U[k];   

    U_old = U;
  }

  Hi = binb2str(Hi);

  clientKey = core_hmac_sha1(Hi, "Client Key");
  serverKey = str_hmac_sha1(Hi, "Server Key");

  clientSignature = core_hmac_sha1(str_sha1(binb2str(clientKey)), authMessage);
  this._sasl_data["server-signature"] = b64_hmac_sha1(serverKey, authMessage);

  for (k = 0; k < 5; k++)
    clientKey[k] ^= clientSignature[k];

  responseText += ",p=" + Base64.encode(binb2str(clientKey));

  this.send($build('response', {
    xmlns: Strophe.NS.SASL
  }).t(Base64.encode(responseText)).tree());

  return false;
} */


SieveSaslScramMd5Request.prototype.hmacMD5
    = function (challenge, secret)
{
  
  if ( !secret )
    secret = "";

  var challengeBytes = JSStringToByteArray(challenge);
  var crypto = Components.classes["@mozilla.org/security/hmac;1"]
                   .createInstance( Components.interfaces.nsICryptoHMAC );
  var keyObject = Components.classes["@mozilla.org/security/keyobjectfactory;1"]
                    .getService( Components.interfaces.nsIKeyObjectFactory )
                    .keyFromString( Components.interfaces.nsIKeyObject.HMAC, secret);

  crypto.init( Components.interfaces.nsICryptoHMAC.MD5, keyObject );
  crypto.update( challengeBytes, challengeBytes.length );
        
  return this.byteArrayToHexString(
           this.strToByteArray(crypto.finish(false)));
}

SieveSaslScramMd5Request.prototype.strToByteArray
     = function ( str )
{
  var bytes = new Array();

  for ( var i = 0; i < str.length; i++ ) 
    bytes[ i ] = str.charCodeAt( i );

  return bytes;
}

SieveSaslScramMd5Request.prototype.byteArrayToHexString
    = function (tmp)
{
  var str = ""; 
  for ( var i = 0; i < tmp.length; i++ ) 
    str += ("0"+tmp[i].toString(16)).slice(-2);
 
  return str;    
}


///*
// * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
// * in FIPS PUB 180-1
// * Version 2.1a Copyright Paul Johnston 2000 - 2002.
// * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
// * Distributed under the BSD License
// * See http://pajhome.org.uk/crypt/md5 for details.
// */
//
///*
// * Configurable variables. You may need to tweak these to be compatible with
// * the server-side, but the defaults work in most cases.
// */
//var hexcase = 0;  /* hex output format. 0 - lowercase; 1 - uppercase        */
//var b64pad  = "="; /* base-64 pad character. "=" for strict RFC compliance   */
//var chrsz   = 8;  /* bits per input character. 8 - ASCII; 16 - Unicode      */
//
///*
// * These are the functions you'll usually want to call
// * They take string arguments and return either hex or base-64 encoded strings
// */
//function hex_sha1(s){return binb2hex(core_sha1(str2binb(s),s.length * chrsz));}
//function b64_sha1(s){return binb2b64(core_sha1(str2binb(s),s.length * chrsz));}
//function str_sha1(s){return binb2str(core_sha1(str2binb(s),s.length * chrsz));}
//function hex_hmac_sha1(key, data){ return binb2hex(core_hmac_sha1(key, data));}
//function b64_hmac_sha1(key, data){ return binb2b64(core_hmac_sha1(key, data));}
//function str_hmac_sha1(key, data){ return binb2str(core_hmac_sha1(key, data));}
//
///*
// * Perform a simple self-test to see if the VM is working
// */
//function sha1_vm_test()
//{
//  return hex_sha1("abc") == "a9993e364706816aba3e25717850c26c9cd0d89d";
//}
//
///*
// * Calculate the SHA-1 of an array of big-endian words, and a bit length
// */
//function core_sha1(x, len)
//{
//  /* append padding */
//  x[len >> 5] |= 0x80 << (24 - len % 32);
//  x[((len + 64 >> 9) << 4) + 15] = len;
//
//  var w = new Array(80);
//  var a =  1732584193;
//  var b = -271733879;
//  var c = -1732584194;
//  var d =  271733878;
//  var e = -1009589776;
//
//  var i, j, t, olda, oldb, oldc, oldd, olde;
//  for (i = 0; i < x.length; i += 16)
//  {
//    olda = a;
//    oldb = b;
//    oldc = c;
//    oldd = d;
//    olde = e;
//
//    for (j = 0; j < 80; j++)
//    {
//      if (j < 16) { w[j] = x[i + j]; }
//      else { w[j] = rol(w[j-3] ^ w[j-8] ^ w[j-14] ^ w[j-16], 1); }
//      t = safe_add(safe_add(rol(a, 5), sha1_ft(j, b, c, d)),
//                       safe_add(safe_add(e, w[j]), sha1_kt(j)));
//      e = d;
//      d = c;
//      c = rol(b, 30);
//      b = a;
//      a = t;
//    }
//
//    a = safe_add(a, olda);
//    b = safe_add(b, oldb);
//    c = safe_add(c, oldc);
//    d = safe_add(d, oldd);
//    e = safe_add(e, olde);
//  }
//  return [a, b, c, d, e];
//}
//
///*
// * Perform the appropriate triplet combination function for the current
// * iteration
// */
//function sha1_ft(t, b, c, d)
//{
//  if (t < 20) { return (b & c) | ((~b) & d); }
//  if (t < 40) { return b ^ c ^ d; }
//  if (t < 60) { return (b & c) | (b & d) | (c & d); }
//  return b ^ c ^ d;
//}
//
///*
// * Determine the appropriate additive constant for the current iteration
// */
//function sha1_kt(t)
//{
//  return (t < 20) ?  1518500249 : (t < 40) ?  1859775393 :
//         (t < 60) ? -1894007588 : -899497514;
//}
//
///*
// * Calculate the HMAC-SHA1 of a key and some data
// */
//function core_hmac_sha1(key, data)
//{
//  var bkey = str2binb(key);
//  if (bkey.length > 16) { bkey = core_sha1(bkey, key.length * chrsz); }
//
//  var ipad = new Array(16), opad = new Array(16);
//  for (var i = 0; i < 16; i++)
//  {
//    ipad[i] = bkey[i] ^ 0x36363636;
//    opad[i] = bkey[i] ^ 0x5C5C5C5C;
//  }
//
//  var hash = core_sha1(ipad.concat(str2binb(data)), 512 + data.length * chrsz);
//  return core_sha1(opad.concat(hash), 512 + 160);
//}
//
///*
// * Add integers, wrapping at 2^32. This uses 16-bit operations internally
// * to work around bugs in some JS interpreters.
// */
//function safe_add(x, y)
//{
//  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
//  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
//  return (msw << 16) | (lsw & 0xFFFF);
//}
//
///*
// * Bitwise rotate a 32-bit number to the left.
// */
//function rol(num, cnt)
//{
//  return (num << cnt) | (num >>> (32 - cnt));
//}
//
///*
// * Convert an 8-bit or 16-bit string to an array of big-endian words
// * In 8-bit function, characters >255 have their hi-byte silently ignored.
// */
//function str2binb(str)
//{
//  var bin = [];
//  var mask = (1 << chrsz) - 1;
//  for (var i = 0; i < str.length * chrsz; i += chrsz)
//  {
//    bin[i>>5] |= (str.charCodeAt(i / chrsz) & mask) << (32 - chrsz - i%32);
//  }
//  return bin;
//}
//
///*
// * Convert an array of big-endian words to a string
// */
//function binb2str(bin)
//{
//  var str = "";
//  var mask = (1 << chrsz) - 1;
//  for (var i = 0; i < bin.length * 32; i += chrsz)
//  {
//    str += String.fromCharCode((bin[i>>5] >>> (32 - chrsz - i%32)) & mask);
//  }
//  return str;
//}
//
///*
// * Convert an array of big-endian words to a hex string.
// */
//function binb2hex(binarray)
//{
//  var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
//  var str = "";
//  for (var i = 0; i < binarray.length * 4; i++)
//  {
//    str += hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8+4)) & 0xF) +
//           hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8  )) & 0xF);
//  }
//  return str;
//}
//
///*
// * Convert an array of big-endian words to a base-64 string
// */
//function binb2b64(binarray)
//{
//  var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
//  var str = "";
//  var triplet, j;
//  for (var i = 0; i < binarray.length * 4; i += 3)
//  {
//    triplet = (((binarray[i   >> 2] >> 8 * (3 -  i   %4)) & 0xFF) << 16) |
//              (((binarray[i+1 >> 2] >> 8 * (3 - (i+1)%4)) & 0xFF) << 8 ) |
//               ((binarray[i+2 >> 2] >> 8 * (3 - (i+2)%4)) & 0xFF);
//    for (j = 0; j < 4; j++)
//    {
//      if (i * 8 + j * 6 > binarray.length * 32) { str += b64pad; }
//      else { str += tab.charAt((triplet >> 6*(3-j)) & 0x3F); }
//    }
//  }
//  return str;
//}
