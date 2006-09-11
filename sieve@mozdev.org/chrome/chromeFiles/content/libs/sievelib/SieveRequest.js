//******************************************************************
//******************************************************************


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

SieveGetScriptRequest.prototype.getCommand
    = function ()
{
  return "GETSCRIPT \""+this.script+"\"\r\n";
}


SieveGetScriptRequest.prototype.setResponse
    = function (data)
{

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

SievePutScriptRequest.prototype.getCommand
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
      
      
  return "PUTSCRIPT \""+this.script+"\" {"+this.body.length+"+}\r\n"
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

SievePutScriptRequest.prototype.setResponse
    = function (data)
{
  var response = new SievePutScriptResponse(data);

  if ((response.getResponse() == 0) && (this.responseListener != null))
    this.responseListener.onPutScriptResponse(response);
  else if ((response.getResponse() != 0) && (this.errorListener != null))
    this.errorListener.onError(response);
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

SieveSetActiveRequest.prototype.getCommand
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

SieveSetActiveRequest.prototype.setResponse
    = function (data)
{
  var response = new SieveSetActiveResponse(data);

  if ((response.getResponse() == 0) && (this.responseListener != null))
    this.responseListener.onSetActiveResponse(response);
  else if ((response.getResponse() != 0) && (this.errorListener != null))
    this.errorListener.onError(response);
}

/*******************************************************************************
    CLASS NAME         : SieveCapabilitiesRequest
    USES CLASSES       : SieveCapabilitiesResponse
        
    CONSCTURCTOR       : SieveCapabilitiesRequest(listener)
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

SieveCapabilitiesRequest.prototype.getCommand = function ()
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

SieveCapabilitiesRequest.prototype.setResponse = function (data)
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
        
    CONSCTURCTOR       : SieveDeleteScriptRequest(String script, listener)
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

SieveDeleteScriptRequest.prototype.getCommand
    = function ()
{
  return "DELETESCRIPT \""+this.script+"\"\r\n";
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

SieveDeleteScriptRequest.prototype.setResponse
    = function (data)
{
        
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

SieveListScriptRequest.prototype.getCommand
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

SieveListScriptRequest.prototype.setResponse 
    = function (data)
{	
	
  var response = new SieveListScriptResponse(data);
			
  if ((response.getResponse() == 0) && (this.responseListener != null))
    this.responseListener.onListScriptResponse(response);			
  else if ((response.getResponse() != 0) && (this.errorListener != null))
    this.errorListener.onError(response);
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

SieveStartTLSRequest.prototype.getCommand
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

SieveStartTLSRequest.prototype.setResponse 
    = function (data)
{		    
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

function SieveLogoutRequest() 
{
}

SieveLogoutRequest.prototype.getCommand 
    = function ()
{
  return "LOGOUT\r\n";
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

SieveLogoutRequest.prototype.setResponse 
    = function (data)
{		    
  var response = new SieveLogoutResponse(data);
			
  // a "BYE" or "OK" is in this case a good answer...
  if (((response.getResponse() == 0) || (response.getResponse() == 1))
       && (this.responseListener != null))
    this.responseListener.onLogoutResponse(response);			
  else if ((response.getResponse() != 0) && (response.getResponse() != 1) 
	        && (this.errorListener != null))
    this.errorListener.onError(response);		    
}

/*******************************************************************************
    CLASS NAME         : SieveInitRequest
    USES CLASSES       : SieveInitResponse
        
    CONSCTURCTOR       : SieveInitRequest(listener)
    DECLARED FUNCTIONS : String getCommand()
                         void setResponse(String data)
    EXCEPTIONS         : 


    AUTHOR             : Thomas Schmid        
    DESCRIPTION        : 
    ...

    EXAMPLE            :
    ...

********************************************************************************/

function SieveInitRequest()
{
}

SieveInitRequest.prototype.getCommand 
    = function ()
{
  return "";
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

SieveInitRequest.prototype.setResponse
    = function (data)
{
  var response = new SieveInitResponse(data);
			
  if ((response.getResponse() == 0) && (this.responseListener != null))
    this.responseListener.onInitResponse(response);			
  else if ((response.getResponse() != 0) && (this.errorListener != null))
    this.errorListener.onError(response);
}

/*******************************************************************************
    CLASS NAME         : SievePlainRequest
    USES CLASSES       : SievePlainResponse
        
    CONSCTURCTOR       : SievePlainRequest(String username, String password, listener)
    DECLARED FUNCTIONS : String getCommand()
                         void setResponse(String data)
    EXCEPTIONS         : 


    AUTHOR             : Thomas Schmid        
    DESCRIPTION        : 
    ...

    EXAMPLE            :
    ...

********************************************************************************/

function SievePlainLoginRequest(username, password) 
{
  this.username = username;
  this.password = password;
}

SievePlainLoginRequest.prototype.getCommand 
    = function ()
{
  var logon = btoa("\0"+this.username+"\0"+this.password);  
  return "AUTHENTICATE \"PLAIN\" \""+logon+"\"\r\n";
}

SievePlainLoginRequest.prototype.addPlainLoginListener
    = function (listener)
{
  this.responseListener = listener;
} 
   
SievePlainLoginRequest.prototype.addErrorListener
    = function (listener)
{
  this.errorListener = listener;
}

SievePlainLoginRequest.prototype.setResponse 
    = function (data)
{
  var response = new SievePlainLoginResponse(data);
			
  if ((response.getResponse() == 0) && (this.responseListener != null))
    this.responseListener.onPlainLoginResponse(response);			
  else if ((response.getResponse() != 0) && (this.errorListener != null))
    this.errorListener.onError(response);
}