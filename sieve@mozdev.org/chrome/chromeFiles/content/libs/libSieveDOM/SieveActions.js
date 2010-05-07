/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

/******************************************************************************/

function SieveDiscard(id) 
{
  this.id = id;
  this.whiteSpace = SieveLexer.createByName("deadcode");
}

SieveDiscard.isDiscard
  = function(token)
{ 
  if (token.indexOf("discard") == 0)
    return true;
  
  return false;
}

SieveDiscard.prototype.init
    = function (data)
{
  // Syntax :
  // <"discard"> <";">
  
  data = data.slice("discard".length);
  
  // ... eat the deadcode before the string...
  if (SieveLexer.probeByName("deadcode",data))      
    data = this.whiteSpace.init(data);
  
  // ... and finally remove the semicolon;
  if (isSieveSemicolon(data) == false)
    throw "Syntaxerror: Semicolon expected";
    
  return data.slice(1);  
}


SieveDiscard.prototype.toString
    = function ()
{
  return "discard"
    + this.whiteSpace.toString()
    + ";";  
}

SieveDiscard.prototype.getID
    = function ()
{
  return this.id;
}    

SieveDiscard.prototype.toXUL
    = function ()
{
  return SieveOptionsDiv(
            this.id, "SieveDiscard",
            "Discard incomming message silently")
}

//***************************************

function SieveRedirect(id)
{
  this.id = id;
  
  this.whiteSpace = [];
  this.whiteSpace[0] = SieveLexer.createByName("deadcode");
  this.whiteSpace[1] = SieveLexer.createByName("deadcode");
  
  this.address = SieveLexer.createByName("string");  
}

SieveRedirect.isRedirect
  = function(token)
{ 
  if (token.indexOf("redirect") == 0)
    return true;
  
  return false;
}

SieveRedirect.prototype.init
    = function (data)
{
  
  // Syntax :
  // <"redirect"> <address: string> <";">
  
  // remove the "redirect" identifier ...
  data = data.slice("redirect".length);
  
  // ... eat the deadcode before the stringlist...
  data = this.whiteSpace[0].init(data);
  
  // ... extract the redirect address...
  data = this.address.init(data);
    
  // ... eat again deadcode
  data = this.whiteSpace[1].init(data);
  
  // ... and finally remove the semicolon;
  if (isSieveSemicolon(data) == false)
    throw "Syntaxerror: Semicolon expected";
    
  return data.slice(1);    
}

SieveRedirect.prototype.getID
    = function ()
{
  return this.id;
}

SieveRedirect.prototype.toString
    = function ()
{
  return "redirect"
    + this.whiteSpace[0].toString()
    + this.address.toString()
    + this.whiteSpace[1].toString()
    + ";";
}

SieveRedirect.prototype.toXUL
    = function ()
{
  var xulBody 
    = "  Redirect messages to the following email address:"
    + "  <html:br />"
    + this.address.toXUL();
    
  return SieveOptionsDiv(
            this.id, "SieveRedirect",xulBody)
}

/******************************************************************************/

function SieveReject(id)
{
  this.id = id;
  this.whiteSpace = [];
  this.whiteSpace[0] = SieveLexer.createByName("deadcode");
  this.whiteSpace[1] = SieveLexer.createByName("deadcode");
    
  this.reason = new SieveString(this.id+"_1");
}

SieveReject.isReject
  = function(token)
{ 
  if (token.indexOf("reject") == 0)
    return true;
  
  return false;
}

SieveReject.prototype.init
    = function (data)
{ 
  // Syntax :
  // <"reject"> <reason: string> <";">
  
  // remove the "redirect" identifier ...
  data = data.slice("reject".length);
  
  // ... eat the deadcode before the stringlist...
  data = this.whiteSpace[0].init(data);
  
  // ... extract the reject reason...
  data = this.reason.init(data);
    
  // ... eat again deadcode
  data = this.whiteSpace[1].init(data);
  
  // ... and finally remove the semicolon;
  if (isSieveSemicolon(data) == false)
    throw "Syntaxerror: Semicolon expected";
    
  return data.slice(1); 
}

SieveReject.prototype.getID
    = function ()
{
  return this.id;
}

SieveReject.prototype.toString
    = function ()
{ 
  return "reject"
    + this.whiteSpace[0].toString()
    + this.reason
    + this.whiteSpace[1].toString()
    + ";"; 
}

SieveReject.prototype.toXUL
    = function ()
{
  var xulBody 
    = "  Reject incomming messages and reply the following reason:"
    + "  <html:br />"
    + this.reason.toXUL();
    
  return SieveOptionsDiv(
            this.id, "SieveReject",xulBody)
}




/******************************************************************************/

function SieveStop(id) 
{
  this.id = id;
  this.whiteSpace = SieveLexer.createByName("deadcode");  
}

SieveStop.isStop
  = function(token)
{ 
  if (token.indexOf("stop") == 0)
    return true;
  
  return false;
}

SieveStop.prototype.init
    = function (data)
{
  data = data.slice("stop".length);
  
  data = this.whiteSpace.init(data);

  // ... and finally remove the semicolon;
  if (isSieveSemicolon(data) == false)
    throw "Syntaxerror: Semicolon expected";
    
  return data.slice(1); 
}    

SieveStop.prototype.getID
    = function ()
{
  return this.id;
}

SieveStop.prototype.toString
    = function ()
{
  return "stop"
    + this.whiteSpace.toString()+";";
}

SieveStop.prototype.toXUL
    = function ()
{   
  return SieveOptionsDiv(
            this.id, "SieveStop","Stop script execution");
}

/******************************************************************************/

function SieveKeep(id)
{
  this.id = id;
  this.whiteSpace = SieveLexer.createByName("deadcode");
}

SieveKeep.isKeep
  = function(token)
{ 
  if (token.indexOf("keep") == 0)
    return true;
  
  return false;
}

SieveKeep.prototype.init
    = function (data)
{
  data = data.slice("keep".length);
  
  data = this.whiteSpace.init(data);

  // ... and finally remove the semicolon;
  if (isSieveSemicolon(data) == false)
    throw "Syntaxerror: Semicolon expected";
    
  return data.slice(1);
}    

SieveKeep.prototype.getID
    = function ()
{
  return this.id;
}

SieveKeep.prototype.toString
    = function ()
{
  return "keep"
    + this.whiteSpace.toString()+";";
}

SieveKeep.prototype.toXUL
    = function ()
{
  return SieveOptionsDiv(
            this.id, "SieveKeep","Move the message into the main inbox");
}

/******************************************************************************/


SieveRequire.isRequire
  = function (data, index)
{  
  if (index == null)
    index = 0;
    
  var token = data.substr(index,7).toLowerCase();
  
  if (token.indexOf("require") == 0)
    return true;  
    
  return false
}

function SieveRequire(id) 
{
  this.id = id;
  
  this.whiteSpace = [];
  this.whiteSpace[0] = SieveLexer.createByName("deadcode");
  this.whiteSpace[1] = SieveLexer.createByName("deadcode");
  
  this.strings = SieveLexer.createByName("stringlist");    
}

SieveRequire.prototype.init
    = function (data)
{
  // Syntax :
  // <"require"> <stringlist> <";">
  
  // remove the "require" identifier ...
  data = data.slice("require".length);

  // ... eat the deadcode before the stringlist...
  if (SieveLexer.probeByName("deadcode",data))
    data = this.whiteSpace[0].init(data);
    
  // ... extract the stringlist...
  data = this.strings.init(data);
  
  // ... eat again deadcode  
  if (SieveLexer.probeByName("deadcode",data))
    data = this.whiteSpace[1].init(data);
 
  // ... and finally remove the semicolon;
  if (data.charAt(0) != ";")
    throw "Syntaxerror: Semicolon expected";
    
  return data.slice(1);  
}

SieveRequire.prototype.getID
    = function ()
{
  return this.id;
}

SieveRequire.prototype.toString
    = function ()
{
  return "require"
    + this.whiteSpace[0].toString()
    + this.strings.toString()
    + this.whiteSpace[1].toString()
    + ";";
}

SieveRequire.prototype.toXUL
    = function ()
{
  // we hide requires from the user
  return "";  
}

/******************************************************************************/


SieveFileInto.isFileInto
  = function(token)
{ 
  if (token.indexOf("fileinto") == 0)
    return true;

  return false;
}

function SieveFileInto(id) 
{
  this.id = id;
  
  this.whiteSpace = [];
  this.whiteSpace[0] = SieveLexer.createByName("deadcode");
  this.whiteSpace[1] = SieveLexer.createByName("deadcode");
    
  this.string = new SieveString(this.id+"_1");
}

SieveFileInto.prototype.init
    = function (data)
{
  // Syntax :
  // <"fileinto"> <string> <";">
  
  data = data.slice("fileinto".length);
  
  // ... eat the deadcode before the string...
  data = this.whiteSpace[0].init(data);
  
  // read the string
  data = this.string.init(data);
  
  // ... eat again deadcode
  data = this.whiteSpace[1].init(data);
  
  // ... and finally remove the semicolon;
  if (isSieveSemicolon(data) == false)
    throw "Syntaxerror: Semicolon expected";
    
  return data.slice(1);
}

SieveFileInto.prototype.getID
    = function ()
{
  return this.id;
}

SieveFileInto.prototype.toString
    = function ()
{
  return "fileinto"
    + this.whiteSpace[0].toString()
    + this.string.toString()
    + this.whiteSpace[1].toString()
    + ";";  
}

SieveFileInto.prototype.toXUL
    = function ()
{
    var xulBody 
    = "  Copy the incomming message into:  <html:br />"
    + this.string.toXUL();
    
  return SieveOptionsDiv(
            this.id, "SieveFileInto",xulBody);
}

/******************************************************************************/

if (!SieveLexer)
  throw "Could not register Actions";

with (SieveLexer)
{
  register("action","action/discard",
      function(token) {return SieveDiscard.isDiscard(token)}, 
      function(id) {return new SieveDiscard(id)});
      
  register("action","action/fileinto",
      function(token) {return SieveFileInto.isFileInto(token)}, 
      function(id) {return new SieveFileInto(id)});  
      
  register("action","action/keep",
      function(token) {return SieveKeep.isKeep(token)},
      function(id) {return new SieveKeep(id)});
      
  register("action","action/redirect",
      function(token) {return SieveRedirect.isRedirect(token)},
      function(id) {return new SieveRedirect(id)});
      
  register("action","action/reject",
      function(token) {return SieveReject.isReject(token)},
      function(id) {return new SieveReject(id)});
      
  register("action","action/stop",
      function(token) {return SieveStop.isStop(token)},
      function(id) {return new SieveStop(id)});
      
  register("import","action/require",
      function(token) {return SieveRequire.isRequire(token)},
      function(id) {return new SieveRequire(id)});      
}
