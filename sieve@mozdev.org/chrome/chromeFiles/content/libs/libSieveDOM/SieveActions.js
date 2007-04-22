

/******************************************************************************/

function SieveDiscard(id) 
{
  this.id = id;
  this.whiteSpace = new SieveDeadCode();
}

SieveDiscard.isDiscard
  = function(token)
{ 
  if (token.indexOf("discard") == 0)
    return true;
  
  return false;
}

SieveDiscard.prototype.parse
    = function (data)
{
  // Syntax :
  // <"discard"> <";">
  
  data = data.slice("discard".length);
  
  // ... eat the deadcode before the string...
  data = this.whiteSpace.parse(data);
  
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
  this.whiteSpace 
    = new Array(new SieveDeadCode(this.id+"_0"),
                new SieveDeadCode(this.id+"_2"));  
  this.address = new SieveString(this.id+"_1");  
}

SieveRedirect.isRedirect
  = function(token)
{ 
  if (token.indexOf("redirect") == 0)
    return true;
  
  return false;
}

SieveRedirect.prototype.parse
    = function (data)
{
  
  // Syntax :
  // <"redirect"> <address: string> <";">
  
  // remove the "redirect" identifier ...
  data = data.slice("redirect".length);
  
  // ... eat the deadcode before the stringlist...
  data = this.whiteSpace[0].parse(data);
  
  // ... extract the redirect address...
  data = this.address.parse(data);
    
  // ... eat again deadcode
  data = this.whiteSpace[1].parse(data);
  
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
  this.whiteSpace 
    = new Array(new SieveDeadCode(this.id+"_0"),
                new SieveDeadCode(this.id+"_2"));  
  this.reason = new SieveString(this.id+"_1");
}

SieveReject.isReject
  = function(token)
{ 
  if (token.indexOf("reject") == 0)
    return true;
  
  return false;
}

SieveReject.prototype.parse
    = function (data)
{ 
  // Syntax :
  // <"reject"> <reason: string> <";">
  
  // remove the "redirect" identifier ...
  data = data.slice("reject".length);
  
  // ... eat the deadcode before the stringlist...
  data = this.whiteSpace[0].parse(data);
  
  // ... extract the reject reason...
  data = this.reason.parse(data);
    
  // ... eat again deadcode
  data = this.whiteSpace[1].parse(data);
  
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
  this.whiteSpace = new SieveDeadCode(this.id+"_0");
}

SieveStop.isStop
  = function(token)
{ 
  if (token.indexOf("stop") == 0)
    return true;
  
  return false;
}

SieveStop.prototype.parse
    = function (data)
{
  data = data.slice("stop".length);
  
  data = this.whiteSpace.parse(data);

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
  this.whiteSpace = new SieveDeadCode(this.id+"_0");
}

SieveKeep.isKeep
  = function(token)
{ 
  if (token.indexOf("keep") == 0)
    return true;
  
  return false;
}

SieveKeep.prototype.parse
    = function (data)
{
  data = data.slice("keep".length);
  
  data = this.whiteSpace.parse(data);

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
  this.whiteSpace 
    = new Array(new SieveDeadCode(this.id+"_0"),
                new SieveDeadCode(this.id+"_2"));  
  this.strings = new SieveStringList(this.id+"_1");
}

SieveRequire.prototype.parse
    = function (data)
{
  // Syntax :
  // <"require"> <stringlist> <";">
  
  // remove the "require" identifier ...
  data = data.slice("require".length);
  
  // ... eat the deadcode before the stringlist...
  data = this.whiteSpace[0].parse(data);
  
  // ... extract the stringlist...
  data = this.strings.parse(data);
    
  // ... eat again deadcode
  data = this.whiteSpace[1].parse(data);
  
  // ... and finally remove the semicolon;
  if (isSieveSemicolon(data) == false)
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
  this.whiteSpace 
    = new Array(new SieveDeadCode(this.id+"_0"),
                new SieveDeadCode(this.id+"_2"));  
  this.string = new SieveString(this.id+"_1");
}

SieveFileInto.prototype.parse
    = function (data)
{
  // Syntax :
  // <"fileinto"> <string> <";">
  
  data = data.slice("fileinto".length);
  
  // ... eat the deadcode before the string...
  data = this.whiteSpace[0].parse(data);
  
  // read the string
  data = this.string.parse(data);
  
  // ... eat again deadcode
  data = this.whiteSpace[1].parse(data);
  
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

with (SieveAction)
{
  register("discard","SieveDiscard",SieveDiscard.isDiscard);  
  register("fileinto","SieveFileInto",SieveFileInto.isFileInto);  
  register("keep","SieveKeep",SieveKeep.isKeep);
  register("redirect","SieveRedirect",SieveRedirect.isRedirect);  
  register("reject","SieveReject",SieveReject.isReject);
  register("stop","SieveStop",SieveStop.isStop);
}

//SieveDom.register("require","SieveRequire",SieveRequire.isRequire);  
