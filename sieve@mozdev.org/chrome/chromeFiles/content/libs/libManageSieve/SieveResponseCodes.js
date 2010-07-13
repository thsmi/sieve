/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

/**
 * 
 * @param {String} code
 */
function SieveResponseCode(code)
{
  this.code = code;  
  
}

SieveResponseCode.prototype.code = "";

/**
 * Responsecodes should not encapulsted in quotes according to the RFC.
 * Never the less Cyrus Servers sometimes do encapsulate the response codes.  
 * 
 * This method is aware of this behaviour, and should be always when comparing
 * ResponseCodes  
 * 
 * @param {String} code
 *   the response code which should be testet for equality
 */
SieveResponseCode.prototype.equalsCode
    = function (code)
{
  // If the Response Code starts with a quote skip we run into the cyrus bug. 
  // This means we need an offset of 1 first character...  
  var offset = this.code[0] == '"'?1:0;
  
  if (this.code.toUpperCase().indexOf(code.toUpperCase()) == offset)
    return true;
    
  return false;   
}

/**
 * 
 * @param {String} code
 */
function SieveResponseCodeSasl(code)
{
  SieveResponseCode.call(this,code);
}

// Inherrit prototypes from SieveResponseCode...
SieveResponseCodeSasl.prototype.__proto__ = SieveResponseCode.prototype;


SieveResponseCodeSasl.prototype.getSasl
    = function ()
{
  return this.code.slice("SASL ".length);
}

/**
 * 
 * @param {String} code
 */
function SieveResponseCodeReferral(code)
{
  SieveResponseCode.call(this,code.split(' ')[0]);
  
  var hostname = code;
  
  //REFERRAL "sieve://c3.mail.example.com"
  // extract the quotet text
  hostname = hostname.slice(hostname.indexOf("\"")+1,hostname.lastIndexOf("\""))
  // remove the sieve:// prefix
  hostname = hostname.slice("sieve://".length);
  
  this.hostname = hostname;  
}

// Inherrit prototypes from SieveResponseCode...
SieveResponseCodeReferral.prototype.__proto__ = SieveResponseCode.prototype;

SieveResponseCodeReferral.prototype.getHostname
    = function ()
{   
  return this.hostname;
}