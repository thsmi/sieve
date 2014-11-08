/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 *   
 * Contibutors:
 *   Max Dittrich
 */
 
 // Enable Strict Mode
"use strict";

var EXPORTED_SYMBOLS = [ "SieveSimpleResponse", "SieveCapabilitiesResponse", 
        "SieveListScriptResponse", "SieveSaslLoginResponse", 
        "SieveSaslCramMd5Response", "SieveGetScriptResponse",
        "SieveSaslScramSha1Response"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;        

Cu.import("chrome://sieve/content/modules/sieve/SieveResponseCodes.js");        
        
/**
 * This class implements a generic response handler for simple sieve requests.
 * 
 * Simple requests just indicate, wether the command succeded or not. They 
 * return only status information, and do not contain any data relevant for 
 * the user.
 *  
 * @see SieveResponseParser
 *  
 * @param {SieveResponseParser} parser
 *  a SieveResponseParser object containing the response sent by the server
 */

function SieveSimpleResponse(parser)
{
  /*
   * Examples for simple responses
   * 
   * 'NO (0000) "Message"\r\n'
   * 'BYE (0000) {4+}\r\n1234\r\n'
   * 'NO \"Message\"\r\n'
   * 'BYE {4+}\r\n1234\r\n'
   * 'NO (0000)\r\n'
   */

  this.message = "";
  this.responseCode = [];
    
  // OK
  if (parser.startsWith([[79,111],[75,107]]))
  {
    this.response = 0;
    parser.extract(2);
  }
  // BYE
  else if (parser.startsWith([[66,98],[89,121],[69,101]]))
  {
    this.response = 1;
    parser.extract(3);
  }
  // NO
  else if (parser.startsWith([[78,110],[79,111]]))
  {
    this.response = 2;
    parser.extract(2);
  }
  else
    throw "NO, OK or BYE expected in "+parser.getData();

  // is there a Message?
  if (parser.isLineBreak())
  {
    parser.extractLineBreak();
    return;
  }

  // remove the space
  parser.extractSpace();

  // we found "(" so we got an responseCode, they are extremely ugly...    
  if (parser.startsWith([[40]]))
  {
    // remove the opening bracket...
    parser.extract(1);
    // ... but remember it 
    var nesting = 0;
  
    // According to the RFC the first tag must be always an atom, but in...
    // ... reality this is not true. Cyrus servers send it as a string
    if (parser.isString())
      this.responseCode.push(parser.extractString());
    else
      this.responseCode.push(parser.extractToken([32,41]));
          
    while (parser.isSpace())
    {
      parser.extractSpace();
    
      // We might stumbe upon opening brackets...
      if (parser.startsWith([[40]]))
      {
        // ... oh we did, so increase our nesting counter.
        parser.extract(1);
        nesting++;
      }
    
      // ok, more tokens, more fun...
      // ... it could be either a string, a number, an atom or even a backet
      if (parser.isString())
        this.responseCode.push(parser.extractString());
      else
        this.responseCode.push(parser.extractToken([32,41]))

      // is it a closing bracket
      if (parser.startsWith([[41]]) && nesting)
      {
        parser.extract(1);
        nesting--;
      }
    }
    
    if (!parser.startsWith([[41]]))
      throw "Closing Backets expected in "+parser.getData();
      
    parser.extract(1);    
        
    if (parser.isLineBreak())
    {
      parser.extractLineBreak();
      return
    }
             
    parser.extractSpace();
  }  
    
  this.message = parser.extractString();
    
  parser.extractLineBreak();
}

SieveSimpleResponse.prototype.message = null;
SieveSimpleResponse.prototype.responseCode = null;
SieveSimpleResponse.prototype.response = null;

SieveSimpleResponse.prototype.getMessage
    = function () 
{ 
  if (this.message == null)
    throw "Message not Initialized";
    
  return this.message; 
}

SieveSimpleResponse.prototype.hasError
    = function ()
{
  if (this.response == null)
    throw "response not Initialized";
    
  if (this.response == 0)
    return false;

  return true;
}

SieveSimpleResponse.prototype.getResponse
    = function () { return this.response; }

SieveSimpleResponse.prototype.getResponseCode
    = function ()
{
  if (this.responseCode == null)
    throw "Response Code not Initialized";
    
  var code = "";  
  if (this.responseCode.length)
    code = this.responseCode[0].toUpperCase()
    
  switch (code)
  {
    case "REFERRAL":
      return new SieveResponseCodeReferral(this.responseCode);
      
    case "SASL":
      return new SieveResponseCodeSasl(this.responseCode);          
  }

  // TODO Implement these Response codes:
  //"ACTIVE" / "NONEXISTENT" / "ALREADYEXISTS" / "WARNINGS"
  return new SieveResponseCode(this.responseCode);
}

/**
 * Parses the capabilites posted by the ManageSieve server upon a client 
 * connection, after successful STARTTLS and AUTHENTICATE or by issuing the 
 * CAPABILITY command. 
 * 
 * @see {SieveCapabilitiesRequest}
 * 
 * @param {SieveResponseParser} parser
 *   a parser containing the response sent by the server 
 */
function SieveCapabilitiesResponse(parser)
{    
  this.implementation = null;
  this.version = 0;
  
  this.extensions = {};
  this.tls = false;
  this.sasl = {};
  
  this.maxredirects = -1;
  this.owner = ""
  this.notify = {};
  this.language = "";
  
  this.capabilities = {};
  
  while (parser.isString() )
  {
    var tag = parser.extractString();
    
    var value = "";
    if ( parser.isLineBreak() == false)
    {
      parser.extractSpace();      
      value = parser.extractString();       
    };
     
    parser.extractLineBreak();
    
    switch (tag.toUpperCase())
    {
      case "STARTTLS":
        this.tls = true;
        break;
      case "IMPLEMENTATION":
        this.implementation = value;
        break;
      case "SASL":
        this.sasl = value.split(" ");
        break;
      case "SIEVE":
        var extensions = value.split(" ");
        this.extensions = {} ;
        
        for (var i = 0; i < extensions.length; ++i)
          this.extensions[""+extensions[i]] = true;

        break;
      case "VERSION":
        this.version = parseFloat(value);
        if (this.version < 1.0)
          break;
        
        // Version 1.0 introduced rename, noop and checkscript
        this.capabilities.renamescript = true;
        this.capabilities.noop = true;
        this.capabilities.checkscript = true;
        
        break;
      case "MAXREDIRECTS":
        this.maxredirects = parseInt(value,10);
        break;
      case "LANGUAGE":
        this.language = value;
        break;
      case "NOTIFY": 
        this.notify = value.split(" ");
        break;
      case "OWNER":
        this.owner = value;
        break;
      case "RENAME":
        this.capabilities.renamescript = true;
        break;
      case "NOOP":
        this.capabilities.noop = true;
        break;
    }
  } 

  if (this.implementation === null)
    throw "Implementation expected";
    
  // invoke inheritted Object constructor...
  SieveSimpleResponse.call(this,parser);  
}

// Inherrit properties from SieveSimpleResponse
SieveCapabilitiesResponse.prototype = Object.create(SieveSimpleResponse.prototype);
SieveCapabilitiesResponse.prototype.constructor = SieveCapabilitiesResponse;

SieveCapabilitiesResponse.prototype.getImplementation
    = function () { return this.implementation; }

SieveCapabilitiesResponse.prototype.getSasl
    = function () { return this.sasl; }
    
SieveCapabilitiesResponse.prototype.getExtensions
    = function (asString)
{
  if (!asString)
    return this.extensions;
    
  var result = "";
  
  for (var item in this.extensions)
    result += item+" ";
  
  return result; 

}

/**
 * Indicates wether or not TLS is supported by this implementation.
 * 
 * Note: After the command STARTTLS or AUTHENTICATE completes successfully, this 
 * value is always false.
 * 
 * @return {Boolean}
 *   true if TLS is supported, false if not.  
 */
SieveCapabilitiesResponse.prototype.getTLS
    = function () { return this.tls; }
    
/**
 * Inorder to maintain compatibility to older implementations, the servers 
 * should state their compatibility level upon login. 
 *
 * A value of "0" indicates, minimal ManageSieve support. This means the server 
 * implements the commands AUTHENTICATE, STARTTLS, LOGOUT, CAPABILITY, HAVESPACE,
 * PUTSCRIPT, LISTSCRIPTS, SETACTIVE, GETSCRIPT and DELETESCRIPT
 * 
 * A value of "1.0" adds to the minimal ManageSieve Support the commands 
 * RENAMESCRIPT, CHECKSCRIPT and NOOP.
 * 
 * @return {float}
 *   Positive Floating describing the compatibility level of the ManageSieve server.
 */
SieveCapabilitiesResponse.prototype.getVersion
    = function () { return this.version; }  

/**
 * Returns the limit on the number of Sieve "redirect" actions a script can 
 * perform during a single evaluation.
 * 
 * Note, that this is different from the total number of "redirect" actions a 
 * script can contain. 
 * 
 * @return {int}
 *   a non-negative number of redirects, or -1 for infinite redirects 
 */
SieveCapabilitiesResponse.prototype.getMaxRedirects
    = function () { return this.maxredirects; } 

/**
 * Returns a string array of URI schema parts for supported notification
 * methods. This capability is be specified, if the Sieve implementation 
 * supports the "enotify" extension.
 * 
 *  @return {String[]}
 *    The schema parts as string array
 */    
SieveCapabilitiesResponse.prototype.getNotify
    = function () { return this.notify; }

/**
 * Returns the language currently used for human readable error messages.  
 * If this capability is not returned, the "i-default" [RFC2277] language is 
 * assumed.  
 * 
 * Note that the current language might be per-user configurable (i.e. it 
 * might change after authentication)
 * 
 * @return {String}
 *   a [RFC4646] conform language tag as string 
 */    
SieveCapabilitiesResponse.prototype.getLanguage
    = function () { return this.language; }

/**
 * Returns a list with sieve commands which are supported by this implementation
 * and are not part of the absolute minimal ManageSieve support.
 * 
 * The server advertises such additional commands either by explicitely
 * naming the command or by using the compatiblility level capability. 
 * 
 * Examples are RENAME, NOOP and CHECKSCRIPT.     
 *  
 * @return {Object}
 *   an associative array containing additional sieve commands
 */
SieveCapabilitiesResponse.prototype.getCapabilities
    = function () { return this.capabilities; }        
    
/**
 * Gets the name of the logged in user.
 * 
 * Note: This value is only avaiable after AUTHENTICATE command succeeds
 * 
 * @return {String}
 *   a String containing the username
 */    
SieveCapabilitiesResponse.prototype.getOwner
    = function () { return this.owner; }    


//***************************************************************************//
    
function SieveListScriptResponse(parser)
{
  //    sieve-name    = string
  //    string        = quoted / literal
  //    (sieve-name [SP "ACTIVE"] CRLF) response-oknobye
  
  this.scripts = new Array();
  var i = -1;
    
  while ( parser.isString() )
  {   
        i++;

        this.scripts[i] = new Object();        
        this.scripts[i].script = parser.extractString();
        
        if ( parser.isLineBreak() )
        {        
            this.scripts[i].active = false;
            parser.extractLineBreak();
            
            continue;
        }
        
        parser.extractSpace();
        
        if (parser.extractToken([13]).toUpperCase() != "ACTIVE")
            throw "Error \"ACTIVE\" expected";   

        this.scripts[i].active = true;        
        parser.extractLineBreak();
        
    }

  // invoke inheritted Object constructor...
  SieveSimpleResponse.call(this,parser);  
}

// Inherrit properties from SieveSimpleResponse
SieveListScriptResponse.prototype = Object.create(SieveSimpleResponse.prototype);    
SieveListScriptResponse.prototype.constructor = SieveListScriptResponse;

SieveListScriptResponse.prototype.getScripts
    = function () { return this.scripts; }


//*************************************
function SieveSaslLoginResponse()
{
  this.state = 0;
}

SieveSaslLoginResponse.prototype = Object.create(SieveSimpleResponse.prototype);
SieveSaslLoginResponse.prototype.constructor = SieveSaslLoginResponse;

SieveSaslLoginResponse.prototype.add
  = function (parser) 
{
  
  if ((this.state == 0) && (parser.isString()))
  {
    // String should be 'Username:' or something similar
    parser.extractString();
    parser.extractLineBreak();

    this.state++;
    return;
  }
  
  if ((this.state == 1) && (parser.isString()))
  {
    // String should be equivalten to 'Password:'
    parser.extractString();
    parser.extractLineBreak();    

    this.state++;
    return;
  }
  
  if (this.state == 2)
  {
    // Should be either a NO, BYE or OK
    this.state = 4;
    SieveSimpleResponse.call(this,parser);
    return;
  }
  
  // is it an error message? 
  try
  {
    SieveSimpleResponse.call(this,parser);
    this.state = 4;
    return;
  }
  catch (ex) 
  {
    throw 'Illegal State:'+this.state+' / '+parser.getData(0)+'\n'+ex;    
  }
    
  throw 'Illegal State:'+this.state+' / '+parser.getData(0);
}

SieveSaslLoginResponse.prototype.getState
  = function () { return this.state; }

//*************************************
/**
 * @author Thomas Schmid
 * @author Max Dittrich 
 */
function SieveSaslCramMd5Response()
{
  this.state = 0;
}

SieveSaslCramMd5Response.prototype = Object.create(SieveSimpleResponse.prototype);
SieveSaslCramMd5Response.prototype.constructor = SieveSaslCramMd5Response;

SieveSaslCramMd5Response.prototype.add
  = function (parser) 
{
  
  if ((this.state == 0) && (parser.isString()))
  {
    // The challenge is contained within a string
    this.challenge = parser.extractString();
    parser.extractLineBreak();
    
    this.state++;
    
    return;
  }
  
  if (this.state == 1)
  {
    // Should be either a NO, BYE or OK
    this.state = 4;
    
    // Invoke the interited constructor to parse the rest of the message
    SieveSimpleResponse.call(this,parser);
    return;
  }
    
  throw 'Illegal State:'+this.state+' / '+parser.getData();
}

SieveSaslCramMd5Response.prototype.getState
  = function () { return this.state; }

SieveSaslCramMd5Response.prototype.getChallenge
  = function ()
{
  if (this.state < 1)
    throw "Illegal State, request not completed";
      
  return this.challenge; 
}

/*********************************************************
    literal               = "{" number  "+}" CRLF *OCTET
    quoted                = <"> *1024QUOTED-CHAR <">
    response-getscript    = [string CRLF] response-oknobye
    string                = quoted / literal
**********************************************************/

function SieveGetScriptResponse(scriptName,parser)
{
  /** @private, @type {String} */ this.scriptName = scriptName;
  /** @private, @type {String} */ this.scriptBody = "";
  
  if (parser.isString())
  {
    this.scriptBody = parser.extractString();
    parser.extractLineBreak();
  }
	
  // invoke inheritted Object constructor...
  SieveSimpleResponse.call(this,parser);  
}

// Inherrit properties from SieveSimpleResponse
SieveGetScriptResponse.prototype = Object.create(SieveSimpleResponse.prototype);    
SieveGetScriptResponse.prototype.constructor = SieveGetScriptResponse;

/**
 * Contains the requested sieve script. 
 * Keep in mind scripts can't be locked, so several clients may manipulate 
 * a script at the same time.
 * 
 * @return {String} returns the requested script's content
 */    
SieveGetScriptResponse.prototype.getScriptBody
    = function () { return this.scriptBody; }

/**
 * @return {String} Containing the script's Name.
 */
SieveGetScriptResponse.prototype.getScriptName
    = function () { return this.scriptName; }
 
/**
 * Parses responses for SCRAM-SHA-1 authentication.
 * 
 * SCRAM is a secure client first authentication mechanism. The client
 * callanges the server and descides if the connection is trustworthy.
 * 
 * This requires a way mor logic on the client than with simple authentication
 * mechanisms. It also requires more communication, in total two roundtrips. 
 */
 
function SieveSaslScramSha1Response()
{
  this.state = 0;
}

SieveSaslScramSha1Response.prototype = Object.create(SieveSimpleResponse.prototype);
SieveSaslScramSha1Response.prototype.constructor = SieveSaslScramSha1Response;

/**
 * @private
 * 
 * Parses the server-first-message it is defined to be:
 *   [reserved-mext ","] nonce "," salt "," iteration-count ["," extensions]
 * 
 * Where 
 *  reserved-mext   : "m=" 1*(value-char)
 *  nonce           : "r=" c-nonce
 *  salt            : "s=" base64(salt)
 *  iteration-count : "i=" posit-number
 * 
 * Extensions are optional and for future use.
 * Neithe c-nonce nor salt can contain a "," character 
 * 
 * @param {} string
 */
SieveSaslScramSha1Response.prototype._parseFirstMessage
  = function (string)
{
  this._serverFirstMessage = atob(string);
  
  var tokens = this._serverFirstMessage.split(',');
  
  // Test for the reserved-mext token. If it is existant, we just skip it
  if ((tokens[0].length <=2) || tokens[0][0] == "m")
    tokens.shift();
  
  // Extract the nonce
  if ((tokens[0].length <=2) || (tokens[0][0] != "r"))
    throw "Nonce missing";
    
  this._nonce = tokens[0].substr(2);
  
  
  if ((tokens[1].length <= 2) ||(tokens[1][0] != "s"))
    throw "Salt missing";
    
  this._salt = atob(tokens[1].substr(2));
  
  
  if ((tokens[2].length <= 2) || (tokens[2][0] != "i"))
    throw "Iteration Count missing";
    
  this._iter = parseInt(tokens[2].substr(2),10);
}

/**
 * Parses the server-final-message. It is defined to be:
 *   (server-error / verifier) ["," extensions]
 * 
 * Where 
 *  server-error    : "e=" server-error-value
 *  verifier        : "v=" base64(ServerSignature)
 * 
 * Extensions are optional and for future use.
 * As suggested by the RFC they will be ignored 
 * 
 * @param {} string
 */
SieveSaslScramSha1Response.prototype._parseFinalMessage
  = function (string)
{ 
  // server-final-message = (server-error / verifier) ["," extensions]
  var token = atob(string).split(",");
  
  if (token[0].length <= 2)
    throw "Response expected but got : "+ string;
    
  // server-error = "e="
  if (token[0][0] == "e")
  {
    this._serverError = token[0].substr(2);
    return;
  }

  // verifier = "v=" base64
  if (token[0][0] == "v")
  {
    this._verifier = atob(token[0].substr(2));
    return
  }
   
  throw "Invalid Final message";
}

SieveSaslScramSha1Response.prototype.add
  = function (parser) 
{
  
  if ((this.state == 0) && (parser.isString()))
  {
    this._parseFirstMessage(parser.extractString());
    parser.extractLineBreak();
            
    this.state++;
    
    return;
  }


  // There are two valid responses...  
  // ... either the Server sends us something like that:
  //
  //   S: cnNwYXV0aD1lYTQwZjYwMzM1YzQyN2I1NTI3Yjg0ZGJhYmNkZmZmZA==
  //   C: ""
  //   S: OK
  
  if ((this.state == 1) && (parser.isString()))
  {

    this._parseFinalMessage(parser.extractString());
    parser.extractLineBreak();
      
    this.state++;
      
    return;
  }
  
  // Or the response is wrapped into the ResponseCode in order to save...
  // ... roundtip time so we endup with the following
  //
  // S: OK (SASL "cnNwYXV0aD1lYTQwZjYwMzM1YzQyN2I1NTI3Yjg0ZGJhYmNkZmZmZA==")
  
  if (this.state == 1)
  {
    SieveSimpleResponse.call(this,parser);
    
    this._parseFinalMessage(this.getResponseCode().getSasl())
    
    this.state = 4;
     
    return;
  }
    
  if (this.state == 2)
  {
    SieveSimpleResponse.call(this,parser);
    this.state = 4;
    return;
  }
     
  throw 'Illegal State:'+this.state+' / '+parser.getData();
}

SieveSaslScramSha1Response.prototype.getState
  = function () { return this.state; }

SieveSaslScramSha1Response.prototype.getSalt
  = function ()
{
  if (this.state < 1)
    throw "Illegal State, request not completed";
      
  return this._salt; 
}

SieveSaslScramSha1Response.prototype.getIterationCounter
  = function ()
{
  if (this.state < 1)
    throw "Illegal State, request not completed";
      
  return this._iter; 
}

SieveSaslScramSha1Response.prototype.getNonce
  = function ()
{
  if (this.state < 1)
    throw "Illegal State, request not completed";
      
  return this._nonce; 
}

SieveSaslScramSha1Response.prototype.getServerFirstMessage
  = function ()
{
  if (this.state < 1)
    throw "Illegal State, request not completed";
      
  return this._serverFirstMessage;     
}

SieveSaslScramSha1Response.prototype.getServerError
  = function ()
{
  if (this.state < 2)
    throw "Illegal State, request not completed";
      
  return this._serverError;     
}

SieveSaslScramSha1Response.prototype.getVerifier
  = function ()
{
  if (this.state < 2)
    throw "Illegal State, request not completed";
      
  return this._verifier;     
}