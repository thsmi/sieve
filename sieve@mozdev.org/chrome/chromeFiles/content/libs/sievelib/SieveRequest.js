//******************************************************************
//******************************************************************


function SieveGetScriptRequest(script, listener) 
{
	this.listener = listener;
	this.script = script;
}

SieveGetScriptRequest.prototype.getCommand
    = function ()
{

  return "GETSCRIPT \""+this.script+"\"\r\n";
}

SieveGetScriptRequest.prototype.setResponse
    = function (data)
{
    this.listener.onGetScriptResponse(
        new SieveGetScriptResponse(this.script,data));
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

function SievePutScriptRequest(script, body, listener) 
{
	this.listener = listener;
	this.script = script;
	this.body = body;
}

SievePutScriptRequest.prototype.getCommand
    = function ()
{
    //"PUTSCRIPT \"xxxx\" {4+}\r\n1234\r\n"
    //"PUTSCRIPT \"xxxx\" \"TEST MAX 1024 Zeichen\"\r\n"
    
    return "PUTSCRIPT \""+this.script+"\" {"+this.body.length+"+}\r\n"
        +this.body+"\r\n"
}

SievePutScriptRequest.prototype.setResponse
    = function (data)
{   
    this.listener.onPutScriptResponse(
        new SievePutScriptResponse(data));
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
function SieveSetActiveRequest(script, listener) 
{
	this.listener = listener;
	this.script = script;
}

SieveSetActiveRequest.prototype.getCommand
    = function ()
{
  return "SETACTIVE \""+this.script+"\"\r\n";
}

SieveSetActiveRequest.prototype.setResponse
    = function (data)
{
    this.listener.onSetActiveResponse(
        new SieveSetActiveResponse(data));
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

function SieveCapabilitiesRequest(listener)
{
	this.listener = listener;
}

SieveCapabilitiesRequest.prototype.getCommand = function ()
{
    return "CAPABILITY\r\n";
}

SieveCapabilitiesRequest.prototype.setResponse = function (data)
{
    this.listener.onCapabilitiesResponse(
            new SieveCapabilitiesResponse(data));
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

function SieveDeleteScriptRequest(script, listener) 
{
	this.listener = listener;
	this.script = script;
}

SieveDeleteScriptRequest.prototype.getCommand
    = function ()
{
  return "DELETESCRIPT \""+this.script+"\"\r\n";
}

SieveDeleteScriptRequest.prototype.setResponse
    = function (data)
{
    this.listener.onDeleteScriptResponse(
        new SieveDeleteScriptResponse(data));
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

function SieveListScriptRequest(listener) 
{
	this.listener = listener;
}

SieveListScriptRequest.prototype.getCommand
    = function ()
{
    return "LISTSCRIPTS\r\n";
}

SieveListScriptRequest.prototype.setResponse 
    = function (data)
{	
	this.listener.onListScriptResponse(
	    new SieveListScriptResponse(data));	
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

function SieveStartTLSRequest(listener) 
{
	this.listener = listener;
}

SieveStartTLSRequest.prototype.getCommand
    = function ()
{
    return "STARTTLS\r\n";
}

SieveStartTLSRequest.prototype.setResponse 
    = function (data)
{	
	this.listener.onStartTLSResponse(
	    new SieveStartTLSResponse(data));
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

function SieveLogoutRequest(listener) 
{
	this.listener = listener;
}

SieveLogoutRequest.prototype.getCommand 
    = function ()
{
  return "LOGOUT\r\n";
}

SieveLogoutRequest.prototype.setResponse 
    = function (data)
{
	this.listener.onLogoutResponse(
	    new SieveLogoutResponse(data));
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

function SieveInitRequest(listener)
{
	this.listener = listener;
}

SieveInitRequest.prototype.getCommand 
    = function ()
{
    return "";
}

SieveInitRequest.prototype.setResponse
    = function (data)
{
	this.listener.onInitResponse(
	    new SieveInitResponse(data));
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

function SievePlainLoginRequest(username, password, listener) 
{
	this.username = username;
	this.password = password;
	this.listener = listener;
}

SievePlainLoginRequest.prototype.getCommand 
    = function ()
{
  var logon = btoa("\0"+this.username+"\0"+this.password);  
  return "AUTHENTICATE \"PLAIN\" \""+logon+"\"\r\n";
}

SievePlainLoginRequest.prototype.setResponse 
    = function (data)
{
	this.listener.onPlainLoginResponse(
	    new SievePlainLoginResponse(data));
}