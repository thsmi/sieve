/*******************************************************************************
 
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
   
  The addResponse(), getNextRequest(), hasNextRequest() Methods are used by the 
  Sieve object, and should not be invoked manually.  
  
  When the sieve object receives a response, it is passed to the addResponse() 
  Method of the requesting object. A timeout is singaled by passing null to 
  the addResponse() Method.  
  
    
********************************************************************************/

/*******************************************************************************
  Sieve literals are encoded in UTF-8 and transmitted as Octets (Bytes).
  Hence the literal length does not reflect the number of characters within the
  literal. It is equivalent to the effective length in bytes. 
   
  This method retrieve this effective length in bytes for an UTF-8 encoded String
  
********************************************************************************/ 

function UTF8ByteLen(str)
{
  //UTF-8 is uses Huffman enconding...
  //  ... http://de.wikipedia.org/wiki/UTF-8
  var len = 0;

  for (var i = 0; i< str.length; i++)
  {  
    if (str.charCodeAt(i) > 0x007F)    
      len++
    if (str.charCodeAt(i) > 0x07FF)  
      len++
    if (str.charCodeAt(i) > 0xFFFF)  
      len++

    len++
  }
  
  return len;
}

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

SieveGetScriptRequest.prototype.hasNextRequest
    = function ()
{
  return false;
}

SieveGetScriptRequest.prototype.getNextRequest
    = function ()
{
  return "GETSCRIPT \""+this.script+"\"\r\n";
}

SieveGetScriptRequest.prototype.addResponse
    = function (data)
{
  if (data == null)
  {
    if (this.errorListener != null)
      this.errorListener.onTimeout();
      
    return;
  }
  
  var response = new SieveGetScriptResponse(this.script,data); 
		
  if ((response.getResponse() == 0) && (this.responseListener != null))
    this.responseListener.onGetScriptResponse(response);
  else if ((response.getResponse() != 0) && (this.errorListener != null))
    this.errorListener.onError(response);
}

// vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv

/*******************************************************************************
    CLASS NAME         : SievePutRequest
    USES CLASSES       : SievePutResponse
        
    CONSCTURCTOR       : SievePutRequest(listener)
    DECLARED FUNCTIONS : String getCommand()
                         void setResponse(String data)
    EXCEPTIONS         : 


    AUTHOR             : Thomas Schmid        
    DESCRIPTION        : 
    ...

    EXAMPLE            :
    ...

********************************************************************************/

function SievePutScriptRequest(script, body) 
{
  this.script = script;
  this.body = body;
}

SievePutScriptRequest.prototype.hasNextRequest
    = function ()
{
  return false;
}

SievePutScriptRequest.prototype.getNextRequest
    = function ()
{
  //"PUTSCRIPT \"xxxx\" {4+}\r\n1234\r\n"
  //"PUTSCRIPT \"xxxx\" \"TEST MAX 1024 Zeichen\"\r\n"
  
  //  We have to convert all linebreaks thus Mozilla uses 
  //  \n as linebreak but sieve wants \r\n. For some reason 
  //  it happens, that we end up with mixed linebreaks...
     
  // convert all \r\n to \r ...
  this.body = this.body.replace(/\r\n/g,"\r");
  // ... now convert all \n to \r ...
  this.body = this.body.replace(/\n/g,"\r");  
  // ... finally convert all \r to \r\n
  this.body = this.body.replace(/\r/g,"\r\n");

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
//  alert("n:"+n+"/r:"+r);
      
  return "PUTSCRIPT \""+this.script+"\" {"+UTF8ByteLen(this.body)+"+}\r\n"
        +this.body+"\r\n"
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

SievePutScriptRequest.prototype.addResponse
    = function (data)
{
  if (data == null)
  {
    if (this.errorListener != null)
      this.errorListener.onTimeout();
      
    return;
  }
  
  var response = new SievePutScriptResponse(data);

  if ((response.getResponse() == 0) && (this.responseListener != null))
    this.responseListener.onPutScriptResponse(response);
  else if ((response.getResponse() != 0) && (this.errorListener != null))
    this.errorListener.onError(response);
    
  return;
}

/*******************************************************************************
    CLASS NAME         : SieveSetActiveRequest
    USES CLASSES       : SieveSetActiveResponse
        
    CONSCTURCTOR       : SieveSetActiveRequest(script, listener)
    DECLARED FUNCTIONS : getCommand()
                         setResponse(data)
    EXCEPTIONS         : 


    AUTHOR             : Thomas Schmid        
    DESCRIPTION        : This class encapulates a Sieve SETACTIVE request. 
                         Either none or one serverscripts can be active,
                         this means you can't have more than one active scripts
                         
                         You activate a Script by calling SETACTIVE and the 
                         sciptname. At activation the previous active Script
                         will become inactive.
                         The Scriptname "" is reserved. It means deactivate the
                         active Script.

    EXAMPLE            :
    ...

********************************************************************************/
//******************************************************************
// es kann immer nur ein Script aktiv sein! 
// -> wenn kein Script angegeben wird werden alle inaktiv
// -> sonst wird das aktuelle ative deaktiviert und das neue aktiv
function SieveSetActiveRequest(script) 
{
  if (script == null)
    this.script = "";
  else
    this.script = script;
}

SieveSetActiveRequest.prototype.hasNextRequest
    = function ()
{
  return false;
}

SieveSetActiveRequest.prototype.getNextRequest
    = function ()
{
  return "SETACTIVE \""+this.script+"\"\r\n";
}

SieveSetActiveRequest.prototype.addSetScriptListener
    = function (listener)
{
  this.responseListener = listener;
} 
   
SieveSetActiveRequest.prototype.addErrorListener
    = function (listener)
{
  this.errorListener = listener;
}

SieveSetActiveRequest.prototype.addResponse
    = function (data)
{
  if (data == null)
  {
    if (this.errorListener != null)
      this.errorListener.onTimeout();
      
    return;
  }
  
  var response = new SieveSetActiveResponse(data);

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

function SieveCapabilitiesRequest()
{
}

SieveCapabilitiesRequest.prototype.hasNextRequest
    = function ()
{
  return false;
}


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

SieveCapabilitiesRequest.prototype.addResponse
    = function (data)
{
  if (data == null)
  {
    if (this.errorListener != null)
      this.errorListener.onTimeout();
      
    return;
  }
  
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

function SieveDeleteScriptRequest(script) 
{
  this.script = script;
}

SieveDeleteScriptRequest.prototype.getNextRequest
    = function ()
{
  return "DELETESCRIPT \""+this.script+"\"\r\n";
}

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

SieveDeleteScriptRequest.prototype.addResponse
    = function (data)
{
  if (data == null)
  {
    if (this.errorListener != null)
      this.errorListener.onTimeout();
      
    return;
  }
  
        
  var response = new SieveDeleteScriptResponse(data);
			
  if ((response.getResponse() == 0) && (this.responseListener != null))
    this.responseListener.onDeleteScriptResponse(response);			
  else if ((response.getResponse() != 0) && (this.errorListener != null))
    this.errorListener.onError(response);
}

/*******************************************************************************
    CLASS NAME         : SieveListScriptRequest
    USES CLASSES       : SieveListScriptResponse
        
    CONSCTURCTOR       : SieveListScriptRequest(String script, listener)
    DECLARED FUNCTIONS : String getCommand()
                         void setResponse(String data)
    EXCEPTIONS         : 


    AUTHOR             : Thomas Schmid        
    DESCRIPTION        : 
    ...

    EXAMPLE            :
    ...

********************************************************************************/

function SieveListScriptRequest() 
{
}

SieveListScriptRequest.prototype.hasNextRequest
    = function ()
{
  return false;
}

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

SieveListScriptRequest.prototype.addResponse 
    = function (data)
{
  if (data == null)
  {
    if (this.errorListener != null)
      this.errorListener.onTimeout();
      
    return;
  }
	
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

SieveStartTLSRequest.prototype.hasNextRequest
    = function ()
{
  return false;
}

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

SieveStartTLSRequest.prototype.addResponse 
    = function (data)
{		    
  if (data == null)
  {
    if (this.errorListener != null)
      this.errorListener.onTimeout();
      
    return;
  }
  
  var response = new SieveStartTLSResponse(data);
			
  if ((response.getResponse() == 0) && (this.responseListener != null))
    this.responseListener.onStartTLSResponse(response);			
  else if ((response.getResponse() != 0) && (this.errorListener != null))
    this.errorListener.onError(response);		    
}

/*******************************************************************************
    CLASS NAME         : SieveLogoutRequest
    USES CLASSES       : SieveLogoutResponse
        
    CONSCTURCTOR       : SieveLogoutRequest(listener)
    DECLARED FUNCTIONS : String getCommand()
                         void setResponse(String data)
    EXCEPTIONS         : 


    AUTHOR             : Thomas Schmid        
    DESCRIPTION        : 
    ...

    EXAMPLE            :
    ...

********************************************************************************/

/*******************************************************************************
 
  FACTSHEET: 
  ==========
   
    CLASS NAME          : SieveLogoutRequest
    USES CLASSES        : SieveLogoutResponse
        
    CONSCTURCTOR        : SieveLogoutRequest()
    DECLARED FUNCTIONS  : void addLogoutListener(...)
                          void addErrorListener(...)
                          void addResponse(String data)                          
                          String getNextRequest()
                          Boolean hasNextRequest()
    EXCEPTIONS          : 
    AUTHOR              : Thomas Schmid
    
  DESCRIPTION:
  ============
    A logout request signals the server that the client wishes to terminate
    the current session.       

  EXAMPLE:
  ========
     
    var event = {
      onLogoutResponse: function(response) 
      {
        alert("Logout successfull");
      }
      ,                          
      onError: function(response) 
      {
        alert("SERVER ERROR:"+response.getMessage());
      }
    } 
                          
    var request = new SieveLogoutRequest();
    request.addErrorListener(event);
    request.addSaslPlainListener(event);
                        
    sieve.addRequest(request);

  PROTOCOL INTERACTION: 
  =====================

    Client > LOGOUT                               
    Server < OK "Logout Complete"
    < connection terminated >

*******************************************************************************/

function SieveLogoutRequest() 
{
}

SieveLogoutRequest.prototype.getNextRequest
    = function ()
{
  return "LOGOUT\r\n";
}

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

SieveLogoutRequest.prototype.addResponse 
    = function (data)
{
  if (data == null)
  {
    if (this.errorListener != null)
      this.errorListener.onTimeout();
      
    return;
  }
  
  var response = new SieveLogoutResponse(data);
			
  // a "BYE" or "OK" is in this case a good answer...
  if (((response.getResponse() == 0) || (response.getResponse() == 1))
       && (this.responseListener != null))
    this.responseListener.onLogoutResponse(response);			
  else if ((response.getResponse() != 0) && (response.getResponse() != 1) 
	        && (this.errorListener != null))
    this.errorListener.onError(response);
    
  return;		    
}

/*******************************************************************************
 
  FACTSHEET: 
  ==========
   
    CLASS NAME          : SieveInitRequest
    USES CLASSES        : SieveInitResponse
        
    CONSCTURCTOR        : SieveInitRequest()
    DECLARED FUNCTIONS  : void addInitListener(...)
                          void addErrorListener(...)
                          void addResponse(String data)                          
                          String getNextRequest()
                          Boolean hasNextRequest()
    EXCEPTIONS          : 
    AUTHOR              : Thomas Schmid
    
  DESCRIPTION:
  ============
     A sieve server will automatically post his capabilities as soon as the 
     connection is established or a secure channel is successfully started 
     (STARTTLS command). In order to capture this information a dummy request 
     has to be used. It won't send a real request, but it parses the initial 
     response of the sieve server. Therefore it is important to add the request 
     before the connection is established. Otherwise the message queue will be 
     jammed.

  EXAMPLE:
  ========

    var sieve = new Sieve("example.com",2000,false,3)
    
    var request = new SieveInitRequest();    
    sieve.addRequest(request);
     
    sieve.connect();
          
  PROTOCOL INTERACTION: 
  =====================

    Server < "IMPLEMENTATION" "Cyrus timsieved v2.1.18-IPv6-Debian-2.1.18-1+sarge2"
           < "SASL" "PLAIN"
           < "SIEVE" "fileinto reject envelope vacation imapflags notify subaddress relational regex"
           < "STARTTLS"
           < OK

*******************************************************************************/

function SieveInitRequest()
{
}

SieveInitRequest.prototype.getNextRequest
    = function ()
{
  return "";
}

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

SieveInitRequest.prototype.addResponse
    = function (data)
{
  if (data == null)
  {
    if (this.errorListener != null)
      this.errorListener.onTimeout();
      
    return;
  }
  
  var response = new SieveInitResponse(data);
			
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

function SieveSaslPlainRequest() 
{
  this.authorization = "";
  this.username = "";
  this.password = "";
  
}

// TODO obsolete
SieveSaslPlainRequest.prototype.setUsername
    = function (username)
{
  this.username = username;  
}

SieveSaslPlainRequest.prototype.setPassword
    = function (password)
{
  this.password = password;  
}

SieveSaslPlainRequest.prototype.isAuthorizable
    = function () 
{
  return true;
}

SieveSaslPlainRequest.prototype.setAuthorization
    = function (authorization)
{
  this.authorization = authorization;
}

SieveSaslPlainRequest.prototype.hasNextRequest
    = function ()
{
  return false;
}

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

SieveSaslPlainRequest.prototype.addResponse
    = function (data)
{
  var response = new SieveSaslPlainResponse(data);
			
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

function SieveSaslLoginRequest() 
{
  this.response = new SieveSaslLoginResponse();
}

SieveSaslLoginRequest.prototype.setUsername
    = function (username)
{
  this.username = username;
}

// checks if authorization is implemented...
SieveSaslLoginRequest.prototype.isAuthorizable
    = function () 
{
  return false;
}

SieveSaslLoginRequest.prototype.setAuthorization
    = function (authorization)
{
  // login can't handle authorization...
}

SieveSaslLoginRequest.prototype.setPassword
    = function (password)
{
  this.password = password;
}

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