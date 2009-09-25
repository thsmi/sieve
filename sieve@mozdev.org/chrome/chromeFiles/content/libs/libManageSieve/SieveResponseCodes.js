/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */


// TODO Simplify response codes...
function SieveRespCodeAuthTooWeak(code) 
{
  this.code = code
}

SieveRespCodeAuthTooWeak.prototype.getCode
    = function ()
{
  return this.code;
} 


function SieveRespCodeEncryptNeeded(code) 
{
  this.code = code;
}

SieveRespCodeEncryptNeeded.prototype.getCode
    = function ()
{
  return this.code;
}


function SieveRespCodeQuota(code) 
{
  this.code = code;
}

SieveRespCodeQuota.prototype.getCode
    = function ()
{
  return this.code;
}


function SieveRespCodeSasl(code)
{
  this.code = code
}

SieveRespCodeSasl.prototype.getCode
    = function ()
{
  return this.code;
}

SieveRespCodeSasl.prototype.getSasl
    = function ()
{
  return this.code.slice("SASL ".length);
}


function SieveRespCodeReferral(code)
{
  this.code = code
}

SieveRespCodeReferral.prototype.getCode
    = function ()
{
  return this.code;
}

SieveRespCodeReferral.prototype.getHostname
    = function ()
{
  
  var hostname = this.code;
  
  //REFERRAL "sieve://c3.mail.example.com"
  // extract the quotet text
  hostname = hostname.slice(hostname.indexOf("\"")+1,hostname.lastIndexOf("\""))
  // remove the sieve:// prefix
  hostname = hostname.slice("sieve://".length);
  
  return hostname;
}

function SieveRespCodeTransitionNeeded(code) 
{
  this.code = code;
}

SieveRespCodeTransitionNeeded.prototype.getCode
    = function ()
{
  return this.code;
}

function SieveRespCodeTryLater(code) 
{
  this.code = code;
}

SieveRespCodeTryLater.prototype.getCode
    = function ()
{
  return this.code;
}


function SieveRespCodeUnknown(code) 
{
  this.code = code;
}

SieveRespCodeUnknown.prototype.getCode
    = function ()
{
  return this.code;
}