/*******************************************************************************
 
  FACTSHEET: 
  ==========
    CLASS NAME          : SieveAbstractResponse
    USES CLASSES        : SieveResponseParser
        
    CONSCTURCTOR        : SieveAbstractResponse(SieveResponseParser parser)
    DECLARED FUNCTIONS  : String getMessage()
                          String getResponse()
                          int getResponseCode()                          
                          boolean hasError()
    EXCEPTIONS          : 
    AUTHOR              : Thomas Schmid        
    
  DESCRIPTION:
  ============
    Every Sieve Response is tailed bei eithern an OK, BYE or NO followed by 
    optional messages and/or error codes.
    This class is capable of parsing this part of the sieve response, therefore
    it should be implemented by and SieveResponse.

  PROTOCOL SNIPLET EXAMPLES: 
  ==========================
    'NO (0000) "Meldung"\r\n'
    'BYE (0000) {4+}\r\n1234\r\n'
    'NO \"Meldung\"\r\n'
    'BYE {4+}\r\n1234\r\n'
    'NO (0000)\r\n'
    
********************************************************************************/
function SieveAbstractResponse(parser)
{
    this.message = "";
    this.responseCode = "";
    
    if (parser.startsWith("OK"))
    {
        this.response = 0;
        parser.extract(2);
    }
    else if (parser.startsWith("BYE"))
    {
        this.response = 1;
        parser.extract(3);
    }
    else if (parser.startsWith("NO"))
    {
        this.response = 2;
        parser.extract(2);
    }
    else
        throw "NO, OK or BYE expected";

    // is there a Message?
    if (parser.isLineBreak())
        return;

    // remove the space
    parser.extractSpace();
    
    // we got an responseCode
    if (parser.startsWith("("))
    {
        // remove the opening bracket
        parser.extract(1);
        
        this.responseCode = parser.extractToken(")");
        
        // remove the closing bracket
        parser.extract(1);        
        
        if (parser.isLineBreak())
            return;
             
        parser.extractSpace();
    }
    
    this.message = parser.extractString();
    
    parser.extractLineBreak();
}

SieveAbstractResponse.prototype.getMessage
    = function () { return this.message; }

SieveAbstractResponse.prototype.hasError
    = function ()
{
  if (this.response == 0)
    return false;

  return true;
}

SieveAbstractResponse.prototype.getResponse
    = function () { return this.response; }

SieveAbstractResponse.prototype.getResponseCode
    = function ()
{
  if (this.responseCode.indexOf("AUTH-TOO-WEAK") == 0)
    return new SieveRespCodeAuthTooWeak();
  else if (this.responseCode.indexOf("ENCRYPT-NEEDED") == 0)
    return new SieveRespCodeEncryptNeeded();
  else if (this.responseCode.indexOf("QUOTA") == 0)
    return new SieveRespCodeQuota();
  else if (this.responseCode.indexOf("SASL") == 0)
    return new SieveRespCodeSasl(this.responseCode);    
  else if (this.responseCode.indexOf("REFERRAL") == 0)
    return new SieveRespCodeReferral(this.responseCode);
  else if (this.responseCode.indexOf("TRANSITION-NEEDED") == 0)
    return new SieveRespCodeTransitionNeeded();
  else if (this.responseCode.indexOf("TRYLATER") == 0)
    return new SieveRespCodeTryLater();    

  return new SieveRespCodeUnknown(this.responseCode);
}

/*******************************************************************************
 
  FACTSHEET: 
  ==========
    CLASS NAME          : SievePutScriptResponse
    USES CLASSES        : SieveResponseParser
                          SieveAbstractResponse
        
    CONSCTURCTOR        : SievePutScriptResponse(String data)
    DECLARED FUNCTIONS  : String getMessage()
                          String getResponse()
                          int getResponseCode()                          
                          boolean hasError()
    EXCEPTIONS          : 
    AUTHOR              : Thomas Schmid        
    
  DESCRIPTION:
  ============
    Encapsulates a SieveAbstractResponse object in order to parse 
    SievePutScriptResponses
      ( see SieveAbstracResponse for more details )
     
********************************************************************************/

function SievePutScriptResponse(data)
{
    this.superior = new SieveAbstractResponse(
                        new SieveResponseParser(data));
}

SievePutScriptResponse.prototype.getMessage
    = function () { return this.superior.getMessage(); }
    
SievePutScriptResponse.prototype.hasError 
    = function () { return this.superior.hasError(); }

SievePutScriptResponse.prototype.getResponse
    = function () { return this.superior.getResponse(); }

SievePutScriptResponse.prototype.getResponseCode
    = function () { return this.superior.getResponseCode(); }

//*************************************

// encapsulates SieveAbstractScripResponse...
function SieveSetActiveResponse(data)
{
    this.superior = new SieveAbstractResponse(
                        new SieveResponseParser(data));
}

SieveSetActiveResponse.prototype.getMessage
    = function (){ return this.superior.getMessage(); }
    
SieveSetActiveResponse.prototype.hasError 
    = function () { return this.superior.hasError(); }

SieveSetActiveResponse.prototype.getResponse
    = function () { return this.superior.getResponse(); }

SieveSetActiveResponse.prototype.getResponseCode
    = function () { return this.superior.getResponseCode(); }


//*************************************
function SieveCapabilitiesResponse(data)
{
    //*(string [SP string] CRLF) response-oknobye    
    this.implementation = "";
    this.sasl = "";
    this.extensions = "";
    
    var parser = new SieveResponseParser(data);
    while (parser.isString() )
    {
        var tag = parser.extractString();
        
        if ( parser.isLineBreak() )
        {
            parser.extractLineBreak();
            continue;            
        }
        
        parser.extractSpace();
        
        var value = parser.extractString();
        
        parser.extractLineBreak();

        if (tag.toUpperCase() == "IMPLEMENTATION")
            this.implementation = value;
        if (tag.toUpperCase() == "SASL")
            this.sasl = value;
        if (tag.toUpperCase() == "SIEVE")
            this.extensions = value;
    }
        
    this.superior = new SieveAbstractResponse(parser);
}

SieveCapabilitiesResponse.prototype.getMessage
    = function (){ return this.superior.getMessage(); }
    
SieveCapabilitiesResponse.prototype.hasError
    = function () { return this.superior.hasError(); }

SieveCapabilitiesResponse.prototype.getResponse
    = function () { return this.superior.getResponse(); }

SieveCapabilitiesResponse.prototype.getResponseCode
    = function () { return this.superior.getResponseCode(); }

SieveCapabilitiesResponse.prototype.getImplementation
    = function () { return this.implementation; }

SieveCapabilitiesResponse.prototype.getSasl
    = function () { return this.sasl.split(" "); }
    
SieveCapabilitiesResponse.prototype.getExtensions
    = function () { return this.extensions; }

//*************************************

// encapsulates SieveAbstractScripResponse...
function SieveDeleteScriptResponse(data)
{
    this.superior = new SieveAbstractResponse(
                        new SieveResponseParser(data));
}

SieveDeleteScriptResponse.prototype.getMessage
    = function (){ return this.superior.getMessage(); }

SieveDeleteScriptResponse.prototype.hasError
    = function () { return this.superior.hasError(); }

SieveDeleteScriptResponse.prototype.getResponse
    = function () { return this.superior.getResponse(); }

SieveDeleteScriptResponse.prototype.getResponseCode
    = function () { return this.superior.getResponseCode(); }

//*************************************
function SieveListScriptResponse(data)
{
    //    sieve-name    = string
    //    string        = quoted / literal
    //    (sieve-name [SP "ACTIVE"] CRLF) response-oknobye

    var parser = new SieveResponseParser(data);
        
    this.scripts = new Array();
    var i = -1;
    
    while ( parser.isString() )
    {
        i++;

        this.scripts[i] = new Array();        
        this.scripts[i][0] = parser.extractString();
        
        if ( parser.isLineBreak() )
        {        
            this.scripts[i][1] = false;
            parser.extractLineBreak();
            
            continue;
        }
        
        parser.extractSpace();
        
        if (parser.extractToken("\r\n").toUpperCase() != "ACTIVE")
            throw "Error \"ACTIVE\" expected";

        this.scripts[i][1] = true;        
        parser.extractLineBreak();
        
    }

	// War die Anfrage erfolgreich?
    this.superior = new SieveAbstractResponse(parser);
}

SieveListScriptResponse.prototype.getMessage
    = function (){ return this.superior.getMessage(); }

SieveListScriptResponse.prototype.hasError
    = function () { return this.superior.hasError(); }

SieveListScriptResponse.prototype.getResponse
    = function () { return this.superior.getResponse(); }

SieveListScriptResponse.prototype.getResponseCode
    = function () { return this.superior.getResponseCode(); }
    
SieveListScriptResponse.prototype.getScripts
    = function () { return this.scripts; }

//*************************************
function SieveStartTLSResponse(data)
{
    this.superior = new SieveAbstractResponse(
                        new SieveResponseParser(data));
}

SieveStartTLSResponse.prototype.getMessage
    = function (){ return this.superior.getMessage(); }

SieveStartTLSResponse.prototype.hasError
    = function () { return this.superior.hasError(); }

SieveStartTLSResponse.prototype.getResponse
    = function () { return this.superior.getResponse(); }

SieveStartTLSResponse.prototype.getResponseCode
    = function () { return this.superior.getResponseCode(); }

//*************************************
function SieveLogoutResponse(data)
{
    this.superior = new SieveAbstractResponse(
                        new SieveResponseParser(data));
}

SieveLogoutResponse.prototype.getMessage
    = function (){ return this.superior.getMessage(); }

SieveLogoutResponse.prototype.hasError
    = function () { return this.superior.hasError(); }

SieveLogoutResponse.prototype.getResponse
    = function () { return this.superior.getResponse(); }

SieveLogoutResponse.prototype.getResponseCode
    = function () { return this.superior.getResponseCode(); }

//*************************************
function SieveSaslLoginResponse()
{
  this.superior = null;
  this.state = 0;
}

SieveSaslLoginResponse.prototype.add
  = function (data) 
{
  
  var parser = new SieveResponseParser(data);
  
  if ((this.state == 0) && (parser.isString()))
  {
    // String should be 'Username:' or something similar
    this.state++;
    return;
  }
  
  if ((this.state == 1) && (parser.isString()))
  {
    // Sting should be equivalten to 'Password:'
    this.state++;
    return;
  }
  
  if (this.state == 2)
  {
    // Should be either a NO, BYE or OK
    this.state = 4;
    this.superior = new SieveAbstractResponse(data);
    return;
  }
    
  throw 'Illegal State:'+this.state+' / '+data;
}

SieveSaslLoginResponse.prototype.getState
  = function () { return this.state; }

SieveSaslLoginResponse.prototype.getMessage
  = function ()
{
  if (this.state != 4)
    throw "Illegal State, request not completed";
      
  return this.superior.getMessage(); 
}

SieveSaslLoginResponse.prototype.hasError
  = function () 
{
  if (this.state != 4)
    throw "Illegal State, request not completed";
    
  return this.superior.hasError(); 
}

SieveSaslLoginResponse.prototype.getResponse
  = function () 
{
  if (this.state != 4)
    throw "Illegal State, request not completed";
      
  return this.superior.getResponse(); 
}

SieveSaslLoginResponse.prototype.getResponseCode
  = function () 
{
  if (this.state != 4)
    throw "Illegal State, request not completed";
    
  return this.superior.getResponseCode(); 
}

//*************************************
function SieveSaslCramMd5Response()
{
  this.superior = null;
  this.state = 0;
}

SieveSaslCramMd5Response.prototype.add
  = function (data) 
{
  
  var parser = new SieveResponseParser(data);
  
  if ((this.state == 0) && (parser.isString()))
  {
    // The challange is contained within a string
    this.challange = parser.extractString();
    this.state++;
    
    return;
  }
  
  if (this.state == 1)
  {
    // Should be either a NO, BYE or OK
    this.state = 4;
    this.superior = new SieveAbstractResponse(data);
    return;
  }
    
  throw 'Illegal State:'+this.state+' / '+data;
}

SieveSaslCramMd5Response.prototype.getState
  = function () { return this.state; }

SieveSaslCramMd5Response.prototype.getChallange
  = function ()
{
  if (this.state < 1)
    throw "Illegal State, request not completed";
      
  return this.challange; 
}

SieveSaslCramMd5Response.prototype.getMessage
  = function ()
{
  if (this.state != 4)
    throw "Illegal State, request not completed";
      
  return this.superior.getMessage(); 
}

SieveSaslCramMd5Response.prototype.hasError
  = function () 
{
  if (this.state != 4)
    throw "Illegal State, request not completed";
    
  return this.superior.hasError(); 
}

SieveSaslCramMd5Response.prototype.getResponse
  = function () 
{
  if (this.state != 4)
    throw "Illegal State, request not completed";
      
  return this.superior.getResponse(); 
}

SieveSaslCramMd5Response.prototype.getResponseCode
  = function () 
{
  if (this.state != 4)
    throw "Illegal State, request not completed";
    
  return this.superior.getResponseCode(); 
}


//*************************************
function SieveSaslPlainResponse(data)
{
    this.superior = new SieveAbstractResponse(
                        new SieveResponseParser(data));
}

SieveSaslPlainResponse.prototype.getMessage
    = function (){ return this.superior.getMessage(); }

SieveSaslPlainResponse.prototype.hasError
    = function () { return this.superior.hasError(); }

SieveSaslPlainResponse.prototype.getResponse
    = function () { return this.superior.getResponse(); }

SieveSaslPlainResponse.prototype.getResponseCode
    = function () { return this.superior.getResponseCode(); }



/*******************************************************************************
    CLASS NAME         : SieveInitResponse
    USES CLASSES       : SieveAbstractResponse
                         SieveResposeParser
        
    CONSCTURCTOR       : SieveInitResponse(String data)
    DECLARED FUNCTIONS : String getMessage()
                       : boolean hasError()
                       : getResponse()
                       : int getResponseCode()
                       : String getImplementation()
                       : String getSasl()
                       : String getExtensions()
                       : boolean prototype.getTLS()                         
    EXCEPTIONS         : 


    AUTHOR             : Thomas Schmid        
    DESCRIPTION        : 
    ...

    EXAMPLE            :
    ...

********************************************************************************/

function SieveInitResponse(data)
{
    //*(string [SP string] CRLF) response-oknobye
    this.implementation = "";
    this.tls = false;
    this.sasl = "";
    this.extensions = "";

    var parser = new SieveResponseParser(data);
    
    while (parser.isString() )
    {
        var tag = parser.extractString();
        
        if ( parser.isLineBreak() )
        {
            parser.extractLineBreak();
            
            if (tag.toUpperCase() == "STARTTLS")
                this.tls = true; 
                
            continue;            
        }
        
        parser.extractSpace();
        
        var value = parser.extractString();
        
        parser.extractLineBreak();

        if (tag.toUpperCase() == "IMPLEMENTATION")
            this.implementation = value;
        if (tag.toUpperCase() == "SASL")
            this.sasl = value;
        if (tag.toUpperCase() == "SIEVE")
            this.extensions = value;
    }
        
    this.superior = new SieveAbstractResponse(parser);
}

SieveInitResponse.prototype.getMessage
    = function (){ return this.superior.getMessage(); }
    
SieveInitResponse.prototype.hasError
    = function () { return this.superior.hasError(); }

SieveInitResponse.prototype.getResponse
    = function () { return this.superior.getResponse(); }

SieveInitResponse.prototype.getResponseCode
    = function () { return this.superior.getResponseCode(); }

SieveInitResponse.prototype.getImplementation
    = function () { return this.implementation; }

SieveInitResponse.prototype.getSasl
    = function () { return this.sasl.split(" "); }
    
SieveInitResponse.prototype.getExtensions
    = function () { return this.extensions; }
    
SieveInitResponse.prototype.getTLS
    = function () { return this.tls; }    
    

/*********************************************************
    literal               = "{" number  "+}" CRLF *OCTET
    quoted                = <"> *1024QUOTED-CHAR <">
    response-getscript    = [string CRLF] response-oknobye
    string                = quoted / literal
**********************************************************/

function SieveGetScriptResponse(scriptName,data)
{
	this.scriptName = scriptName;

    var parser = new SieveResponseParser(data);
    
    if (parser.isString())
    {
        this.scriptBody = parser.extractString();
        parser.extractLineBreak();
    }
	
    this.superior = new SieveAbstractResponse(parser);
}

SieveGetScriptResponse.prototype.getMessage
    = function (){ return this.superior.getMessage(); }
    
SieveGetScriptResponse.prototype.hasError
    = function () { return this.superior.hasError(); }

SieveGetScriptResponse.prototype.getResponse
    = function () { return this.superior.getResponse(); }

SieveGetScriptResponse.prototype.getResponseCode
    = function () { return this.superior.getResponseCode(); }
    
SieveGetScriptResponse.prototype.getScriptBody
    = function () { return this.scriptBody; }
    
SieveGetScriptResponse.prototype.getScriptName
    = function () { return this.scriptName; }        