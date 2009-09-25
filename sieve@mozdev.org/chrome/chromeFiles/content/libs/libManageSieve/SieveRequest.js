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

/**
 * Manage Sieve uses for literals UTF-8 as encoding, network sockets are usualy 
 * binary, and javascript is something inbetween. This means we have to convert
 * UTF-8 into a binary by our own...
 * 
 * @param {String} string The binary string which should be converted 
 * @return {String} The converted string in UTF8 
 * 
 * @author Thomas Schmid <schmid-thomas@gmx.net>
 */ 

function bytesFromJSString(str) 
{
  // cleanup linebreaks...
  str = str.replace(/\r\n|\r|\n|\u0085|\u000C|\u2028|\u2029/g,"\r\n");
  
  // ... and convert to UTF-8
  var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"]
                    .createInstance(Components.interfaces.nsIScriptableUnicodeConverter); 
  converter.charset = "UTF-8"; 
 
  return converter.convertToByteArray(str, {});
}


/**
 * @param {String} script
 * @author Thomas Schmid
 */
function SieveGetScriptRequest(script) 
{
  this.script = script;
}

SieveGetScriptRequest.prototype.addGetScriptListener
    = function (listener)
{
  this.responseListener = listener;
} 
   
SieveGetScriptRequest.prototype.addErrorListener
    = function (listener)
{
	this.errorListener = listener;
}

/** @return {Boolean} */
SieveGetScriptRequest.prototype.hasNextRequest
    = function ()
{
  return false;
}

/** @return {String} */
SieveGetScriptRequest.prototype.getNextRequest
    = function ()
{
  return "GETSCRIPT \""+this.script+"\"\r\n";
}

/** */
SieveGetScriptRequest.prototype.cancel
    = function ()
{
  if (this.errorListener != null)
    this.errorListener.onTimeout();  
}

/** @param {String} data */
SieveGetScriptRequest.prototype.addResponse
    = function (data)
{  
  var response = new SieveGetScriptResponse(this.script,data); 
		
  if ((response.getResponse() == 0) && (this.responseListener != null))
    this.responseListener.onGetScriptResponse(response);
  else if ((response.getResponse() != 0) && (this.errorListener != null))
    this.errorListener.onError(response);
}

/**
 * @param {String} script
 * @param {String} body
 * 
 * @author Thomas Schmid
 */
function SievePutScriptRequest(script, body) 
{
  this.script = script;
   
  this.body = body.replace(/\r\n|\r|\n/g, "\r\n");
}

/** @return {Boolean} */
SievePutScriptRequest.prototype.hasNextRequest
    = function ()
{
  return false;
}

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



  // sieve -> outputstream to nsIBinaryOutputStream
  // 
  
  return "PUTSCRIPT \""+this.script+"\" {"+bytesFromJSString(this.body).length+"+}\r\n"
        +this.body+"\r\n";
}

SievePutScriptRequest.prototype.addPutScriptListener
    = function (listener)
{
  this.responseListener = listener;
} 
   
SievePutScriptRequest.prototype.addErrorListener
    = function (listener)
{
  this.errorListener = listener;
}

/** */
SievePutScriptRequest.prototype.cancel
    = function ()
{
  if (this.errorListener != null)
    this.errorListener.onTimeout();  
}    

/** @param {String} data */
SievePutScriptRequest.prototype.addResponse
    = function (data)
{  
  var response = new SieveSimpleResponse(data);

  if ((response.getResponse() == 0) && (this.responseListener != null))
    this.responseListener.onPutScriptResponse(response);
  else if ((response.getResponse() != 0) && (this.errorListener != null))
    this.errorListener.onError(response);
    
  return;
}

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
  this.body = body.replace(/\r\n|\r|\n/g, "\r\n");  
  //this.body = UTF8Encode(body).replace(/\r\n|\r|\n/g, "\r\n");
}

/** @return {Boolean} */
SieveCheckScriptRequest.prototype.hasNextRequest
    = function ()
{
  return false;
}

/** @return {String} */
SieveCheckScriptRequest.prototype.getNextRequest
    = function ()
{
  return "CHECKSCRIPT {"+bytesFromJSString(this.body).length+"+}\r\n"
        +this.body+"\r\n"
}

SieveCheckScriptRequest.prototype.addCheckScriptListener
    = function (listener)
{
  this.responseListener = listener;
} 
   
SieveCheckScriptRequest.prototype.addErrorListener
    = function (listener)
{
  this.errorListener = listener;
}

/** */
SieveCheckScriptRequest.prototype.cancel
    = function ()
{
  if (this.errorListener != null)
    this.errorListener.onTimeout();  
}    

/** @param {String} data */
SieveCheckScriptRequest.prototype.addResponse
    = function (data)
{  
  var response = new SieveSimpleResponse(data);

  if ((response.getResponse() == 0) && (this.responseListener != null))
    this.responseListener.onCheckScriptResponse(response);
  else if ((response.getResponse() != 0) && (this.errorListener != null))
    this.errorListener.onError(response);
    
  return;
}


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

/** @return {Boolean} */
SieveSetActiveRequest.prototype.hasNextRequest
    = function ()
{
  return false;
}

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
   
SieveSetActiveRequest.prototype.addErrorListener
    = function (listener)
{
  this.errorListener = listener;
}

/** */
SieveSetActiveRequest.prototype.cancel
    = function ()
{
  if (this.errorListener != null)
    this.errorListener.onTimeout();  
}

/** @param {String} data */
SieveSetActiveRequest.prototype.addResponse
    = function (data)
{  
  var response = new SieveSimpleResponse(data);

  if ((response.getResponse() == 0) && (this.responseListener != null))
    this.responseListener.onSetActiveResponse(response);
  else if ((response.getResponse() != 0) && (this.errorListener != null))
    this.errorListener.onError(response);
}

/*******************************************************************************
    CLASS NAME         : SieveCapabilitiesRequest
    USES CLASSES       : SieveCapabilitiesResponse
        
    CONSCTURCTOR       : SieveCapabilitiesRequest()
    DECLARED FUNCTIONS : String getCommand()
                         void setResponse(data)
    EXCEPTIONS         : 


    AUTHOR             : Thomas Schmid        
    DESCRIPTION        : 
    ...

    EXAMPLE            :
    ...

********************************************************************************/
/**
 * 
 * @author Thomas Schmid
 */
function SieveCapabilitiesRequest()
{
}

/** @return {Boolean} */
SieveCapabilitiesRequest.prototype.hasNextRequest
    = function ()
{
  return false;
}

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
   
SieveCapabilitiesRequest.prototype.addErrorListener
    = function (listener)
{
  this.errorListener = listener;
}

/** */
SieveCapabilitiesRequest.prototype.cancel
    = function ()
{
  if (this.errorListener != null)
    this.errorListener.onTimeout();  
}

/** @param {String} data */
SieveCapabilitiesRequest.prototype.addResponse
    = function (data)
{
  
  var response = new SieveCapabilitiesResponse(data);
			
  if ((response.getResponse() == 0) && (this.responseListener != null))
    this.responseListener.onCapabilitiesResponse(response);			
  else if ((response.getResponse() != 0) && (this.errorListener != null))
    this.errorListener.onError(response);
}

/*******************************************************************************
    CLASS NAME         : SieveDeleteScriptRequest
    USES CLASSES       : SieveDeleteScriptResponse
        
    CONSCTURCTOR       : SieveDeleteScriptRequest(String script)
    DECLARED FUNCTIONS : String getCommand()
                         void setResponse(data)
    EXCEPTIONS         : 


    AUTHOR             : Thomas Schmid        
    DESCRIPTION        : 
    ...

    EXAMPLE            :
    ...

********************************************************************************/

/**
 * @param {String} script
 * @author Thomas Schmid
 */
function SieveDeleteScriptRequest(script) 
{
  this.script = script;
}

/** @return {String} */
SieveDeleteScriptRequest.prototype.getNextRequest
    = function ()
{
  return "DELETESCRIPT \""+this.script+"\"\r\n";
}

/** @return {Boolean} */
SieveDeleteScriptRequest.prototype.hasNextRequest
    = function ()
{
  return false;
}

SieveDeleteScriptRequest.prototype.addDeleteScriptListener
    = function (listener)
{
  this.responseListener = listener;
} 
   
SieveDeleteScriptRequest.prototype.addErrorListener
    = function (listener)
{
  this.errorListener = listener;
}

/** */
SieveDeleteScriptRequest.prototype.cancel
    = function ()
{
  if (this.errorListener != null)
    this.errorListener.onTimeout();  
}

/** @param {String} data */
SieveDeleteScriptRequest.prototype.addResponse
    = function (data)
{        
  var response = new SieveSimpleResponse(data);
			
  if ((response.getResponse() == 0) && (this.responseListener != null))
    this.responseListener.onDeleteScriptResponse(response);			
  else if ((response.getResponse() != 0) && (this.errorListener != null))
    this.errorListener.onError(response);
}

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

/** @return {String} */
SieveNoopRequest.prototype.getNextRequest
    = function ()
{
  return "NOOP\r\n";
}

/** @return {Boolean} */
SieveNoopRequest.prototype.hasNextRequest
    = function ()
{
  return false;
}

SieveNoopRequest.prototype.addNoopScriptListener
    = function (listener)
{
  this.responseListener = listener;
} 
   
SieveNoopRequest.prototype.addErrorListener
    = function (listener)
{
  // yes even the request always returns Ok, we might need this...
  // ... error listener in case of a connection timeout.
  this.errorListener = listener;
}

/** */
SieveNoopRequest.prototype.cancel
    = function ()
{
  if (this.errorListener != null)
    this.errorListener.onTimeout();  
}

/** @param {String} data */
SieveNoopRequest.prototype.addResponse
    = function (data)
{        
  var response = new SieveSimpleResponse(data);
      
  if ((response.getResponse() == 0) && (this.responseListener != null))
    this.responseListener.onNoopResponse(response);     
  else if ((response.getResponse() != 0) && (this.errorListener != null))
    this.errorListener.onError(response);
}

/**
 * This command is used to rename a user's Sieve script. The Server will
 * reply with a NO response if the old script does not exist, or a script
 * with the new name already exists.
 * 
 * Renaming the active script is allowed, the renamed script remains active.
 *  
 * @param {String} Name of the script, which should be renamed
 * @param {String} new name of the Script
 * 
 * @author Thomas Schmid
 */
function SieveRenameScriptRequest(oldScript, newScript) 
{
  this.oldScript = oldScript;
  this.newScript = newScript
}

/** @return {String} */
SieveRenameScriptRequest.prototype.getNextRequest
    = function ()
{
  return "RENAMESCRIPT \""+this.oldScript+"\" \""+this.newScript+"\"\r\n";
}

/** @return {Boolean} */
SieveRenameScriptRequest.prototype.hasNextRequest
    = function ()
{
  return false;
}

SieveRenameScriptRequest.prototype.addRenameScriptListener
    = function (listener)
{
  this.responseListener = listener;
} 
   
SieveRenameScriptRequest.prototype.addErrorListener
    = function (listener)
{
  this.errorListener = listener;
}

/** */
SieveRenameScriptRequest.prototype.cancel
    = function ()
{
  if (this.errorListener != null)
    this.errorListener.onTimeout();  
}

/** @param {String} data */
SieveRenameScriptRequest.prototype.addResponse
    = function (data)
{        
  var response = new SieveSimpleResponse(data);
      
  if ((response.getResponse() == 0) && (this.responseListener != null))
    this.responseListener.onRenameScriptResponse(response);     
  else if ((response.getResponse() != 0) && (this.errorListener != null))
    this.errorListener.onError(response);
}


/**
 * @author Thomas Schmid
 */
function SieveListScriptRequest() 
{
}

/** @return {Boolean} */
SieveListScriptRequest.prototype.hasNextRequest
    = function ()
{
  return false;
}

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

SieveListScriptRequest.prototype.addErrorListener
    = function (listener)
{
  this.errorListener = listener;
}

SieveListScriptRequest.prototype.cancel
    = function ()
{
  if (this.errorListener != null)
    this.errorListener.onTimeout();  
}

/** @param {String} data */
SieveListScriptRequest.prototype.addResponse 
    = function (data)
{	
  var response = new SieveListScriptResponse(data);
			
  if ((response.getResponse() == 0) && (this.responseListener != null))
    this.responseListener.onListScriptResponse(response);			
  else if ((response.getResponse() != 0) && (this.errorListener != null))
    this.errorListener.onError(response);
  
  return;
}

/*******************************************************************************
    CLASS NAME         : SieveListScriptRequest
    USES CLASSES       : SieveListScriptResponse
        
    CONSCTURCTOR       : SieveListScriptRequest(script, listener)
    DECLARED FUNCTIONS : String getCommand()
                         void setResponse(String data)
    EXCEPTIONS         : 


    AUTHOR             : Thomas Schmid        
    DESCRIPTION        : 
    ...

    EXAMPLE            :
    ...

********************************************************************************/

function SieveStartTLSRequest() 
{
}

/** @return {Boolean} */
SieveStartTLSRequest.prototype.hasNextRequest
    = function ()
{
  return false;
}

/** @return {String} */
SieveStartTLSRequest.prototype.getNextRequest
    = function ()
{
  return "STARTTLS\r\n";
}

SieveStartTLSRequest.prototype.addStartTLSListener
    = function (listener)
{
  this.responseListener = listener;
} 
   
SieveStartTLSRequest.prototype.addErrorListener
    = function (listener)
{
  this.errorListener = listener;
}

SieveStartTLSRequest.prototype.cancel
    = function ()
{
  if (this.errorListener != null)
    this.errorListener.onTimeout();  
}

/** @param {String} data */
SieveStartTLSRequest.prototype.addResponse 
    = function (data)
{
  var response = new SieveSimpleResponse(data);
			
  if ((response.getResponse() == 0) && (this.responseListener != null))
    this.responseListener.onStartTLSResponse(response);			
  else if ((response.getResponse() != 0) && (this.errorListener != null))
    this.errorListener.onError(response);		    
}

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

/** @return {String} */
SieveLogoutRequest.prototype.getNextRequest
    = function ()
{
  return "LOGOUT\r\n";
}

/** @return {Boolean} */
SieveLogoutRequest.prototype.hasNextRequest
    = function ()
{
  return false;
}

SieveLogoutRequest.prototype.addLogoutListener
    = function (listener)
{
  this.responseListener = listener;
} 
   
SieveLogoutRequest.prototype.addErrorListener
    = function (listener)
{
  this.errorListener = listener;
}

SieveLogoutRequest.prototype.cancel
    = function ()
{
  if (this.errorListener != null)
    this.errorListener.onTimeout();  
}

/** @param {String} data */
SieveLogoutRequest.prototype.addResponse 
    = function (data)
{  
  var response = new SieveSimpleResponse(data);
			
  // a "BYE" or "OK" is in this case a good answer...
  if (((response.getResponse() == 0) || (response.getResponse() == 1))
       && (this.responseListener != null))
    this.responseListener.onLogoutResponse(response);			
  else if ((response.getResponse() != 0) && (response.getResponse() != 1) 
	        && (this.errorListener != null))
    this.errorListener.onError(response);
    
  return;		    
}

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

/** @return {String} */
SieveInitRequest.prototype.getNextRequest
    = function ()
{
  return "";
}

/** @return {Boolean} */
SieveInitRequest.prototype.hasNextRequest
    = function ()
{
  return false;
}

SieveInitRequest.prototype.addInitListener
    = function (listener)
{
  this.responseListener = listener;
} 
   
SieveInitRequest.prototype.addErrorListener
    = function (listener)
{
  this.errorListener = listener;
}

/** */
SieveInitRequest.prototype.cancel
    = function ()
{
  if (this.errorListener != null)
    this.errorListener.onTimeout();  
}

/** @param {String} data */
SieveInitRequest.prototype.addResponse
    = function (data)
{  
  var response = new SieveCapabilitiesResponse(data);
			
  if ((response.getResponse() == 0) && (this.responseListener != null))
    this.responseListener.onInitResponse(response);			
  else if ((response.getResponse() != 0) && (this.errorListener != null))
    this.errorListener.onError(response);
    
  return;
}

/*******************************************************************************
 
  FACTSHEET: 
  ==========
   
    CLASS NAME          : SievePlainRequest
    USES CLASSES        : SievePlainResponse
        
    CONSCTURCTOR        : SievePlainRequest(String username)
    DECLARED FUNCTIONS  : void addSaslPlainListener(...)
                          void addErrorListener(...)
                          void addResponse(String data)                          
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
  this.authorization = "";
  this.username = "";
  this.password = "";
  
}

/** @param {String} username */
SieveSaslPlainRequest.prototype.setUsername
    = function (username)
{
  this.username = username;  
}

/** @param {String} password */
SieveSaslPlainRequest.prototype.setPassword
    = function (password)
{
  this.password = password;  
}

/** @return {Boolean} */
SieveSaslPlainRequest.prototype.isAuthorizable
    = function () 
{
  return true;
}

/** @param {String} authorization */
SieveSaslPlainRequest.prototype.setAuthorization
    = function (authorization)
{
  this.authorization = authorization;
}

/** @return {Boolean} */
SieveSaslPlainRequest.prototype.hasNextRequest
    = function ()
{
  return false;
}

/** @return {String} */
SieveSaslPlainRequest.prototype.getNextRequest 
    = function ()
{
  var logon = btoa(this.authorization+"\0"+this.username+"\0"+this.password);  
  return "AUTHENTICATE \"PLAIN\" \""+logon+"\"\r\n";
}

SieveSaslPlainRequest.prototype.addSaslPlainListener
    = function (listener)
{
  this.responseListener = listener;
} 
   
SieveSaslPlainRequest.prototype.addErrorListener
    = function (listener)
{
  this.errorListener = listener;
}

SieveSaslPlainRequest.prototype.cancel
    = function ()
{
  if (this.errorListener != null)
    this.errorListener.onTimeout();  
}

SieveSaslPlainRequest.prototype.addResponse
    = function (data)
{
  var response = new SieveSimpleResponse(data);
			
  if ((response.getResponse() == 0) && (this.responseListener != null))
    this.responseListener.onSaslPlainResponse(response);			
  else if ((response.getResponse() != 0) && (this.errorListener != null))
    this.errorListener.onError(response);
}


/*******************************************************************************
 
  FACTSHEET: 
  ==========
    CLASS NAME          : SieveSaslLoginRequest
    USES CLASSES        : SieveSaslLoginResponse
        
    CONSCTURCTOR        : SieveLoginRequest(String username)
    DECLARED FUNCTIONS  : void addSaslLoginListener(...)
                          void addErrorListener(...)
                          void addResponse(String data)                          
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
                          
    var request = new SieveSaslLoginRequest('geek');
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

/** 
 * @param {String} username
 */
SieveSaslLoginRequest.prototype.setUsername
    = function (username)
{
  this.username = username;
}

/**
 * checks if authorization is implemented...
 * @return {Boolean}
 */
SieveSaslLoginRequest.prototype.isAuthorizable
    = function () 
{
  return false;
}

/**
 * @param {String} authorization
 */
SieveSaslLoginRequest.prototype.setAuthorization
    = function (authorization)
{
  // login can't handle authorization...
}

/**
 * 
 * @param {String} password
 */
SieveSaslLoginRequest.prototype.setPassword
    = function (password)
{
  this.password = password;
}

/** @return {String} */
SieveSaslLoginRequest.prototype.getNextRequest
    = function ()
{
  switch (this.response.getState())
  {
    case 0:
      return "AUTHENTICATE \"LOGIN\"\r\n";    
    case 1: 
      return "{"+btoa(this.username).length+"+}\r\n"+btoa(this.username);
    case 2:
      return "{"+btoa(this.password).length+"+}\r\n"+btoa(this.password); 
    default : 
      return ""; //it might be better to throw an Execption       
  }  
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
   
SieveSaslLoginRequest.prototype.addErrorListener
    = function (listener)
{
  this.errorListener = listener;
}

/** */
SieveSaslLoginRequest.prototype.cancel
    = function ()
{
  if (this.errorListener != null)
    this.errorListener.onTimeout();  
}

/** @param {String} data */
SieveSaslLoginRequest.prototype.addResponse 
    = function (data)
{
  this.response.add(data);	
		
	if (this.response.getState() != 4)
	  return;
	
  if ((this.response.getResponse() == 0) && (this.responseListener != null))
    this.responseListener.onSaslLoginResponse(this.response);			
  else if ((this.response.getResponse() != 0) && (this.errorListener != null))
    this.errorListener.onError(this.response);
}


/*******************************************************************************
 
  FACTSHEET: 
  ==========
    CLASS NAME          : SieveSaslCramMd5Request
    USES CLASSES        : SieveSaslCramMd5Response
        
    CONSCTURCTOR        : SieveCramMd5Request(String username)
    DECLARED FUNCTIONS  : void addSaslCramMd5Listener(...)
                          void addErrorListener(...)
                          void addResponse(String data)                          
                          String getNextRequest()
                          Boolean hasNextRequest()
                          void setPassword(String password)
    EXCEPTIONS          : 
    AUTHOR              : Thomas Schmid        
    
  DESCRIPTION:
  ============
    [...]

  EXAMPLE:
  ========

  PROTOCOL INTERACTION: 
  =====================

*******************************************************************************/

/*function SieveSaslCramMd5Request() 
{
  this.response = new SieveSaslLoginResponse();
}

SieveSaslCramMd5Request.prototype.setUsername
    = function (username)
{
  this.username = username;
}

SieveSaslCramMd5Request.prototype.setPassword
    = function (password)
{
  this.password = password;
}

SieveSaslCramMd5Request.prototype.getNextRequest
    = function ()
{
  switch (this.response.getState())
  {
    case 0: 
      return "AUTHENTICATE \"CRAM-MD5\" \r\n";    
    case 1: 
      this.response.getChallange();
      // TODO build the response for the challange
      var cryptoHash =
        Components.classes["@mozilla.org/security/hash;1"]
          .getService(Components.interfaces.nsICryptoHash);
 
      cryptoHash.initWithString("MD5");
      
      //TODO see http://developer.mozilla.org/en/docs/nsICryptoHash#Computing_the_Hash_of_a_String
      cryptoHash.update("test".split(''),4);
      alert(cryptoHash.finish(true));      
      
      var challange = "";
      return "{"+challange.length+"}\r\n"+challange;
    default : 
      return ""; //it might be better to throw an Execption       
  }  
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
   
SieveSaslCramMd5Request.prototype.addErrorListener
    = function (listener)
{
  this.errorListener = listener;
}

SieveSaslCramMd5Request.prototype.addResponse 
    = function (data)
{

  this.response.add(data);	
		
	if (this.response.getState() != 4)
	  return;
	
  if ((response.getResponse() == 0) && (this.responseListener != null))
    this.responseListener.onSaslCramMd5Response(response);			
  else if ((response.getResponse() != 0) && (this.errorListener != null))
    this.errorListener.onError(response);
}
*/