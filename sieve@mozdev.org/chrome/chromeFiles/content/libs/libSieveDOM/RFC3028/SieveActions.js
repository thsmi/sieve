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
  this.semicolon = SieveLexer.createByName("atom/semicolon");
}

SieveDiscard.prototype.init
    = function (data)
{
  // Syntax :
  // <"discard"> <";">
  
  data = data.slice("discard".length);  
  data = this.semicolon.init(data);
    
  return data;  
}


SieveDiscard.prototype.toString
    = function ()
{
  return "discard"
    + this.semicolon.toString();  
}

SieveDiscard.prototype.toElement
    = function ()
{
  var elm = createDragBox(this.id);
  
  var desc = document.createElement("description");
  desc.setAttribute("value","Discard incomming message silently");
  elm.appendChild(desc);
  
  return elm;
}

//***************************************

function SieveRedirect(id)
{
  this.id = id;
  
  this.whiteSpace = SieveLexer.createByName("whitespace");
  this.whiteSpace.init(" ");
  
  this.address = SieveLexer.createByName("string"); 
  this.address.init("\"username@example.com\"");
  
  this.semicolon = SieveLexer.createByName("atom/semicolon");
}

SieveRedirect.prototype.init
    = function (data)
{
  // Syntax :
  // <"redirect"> <address: string> <";">
  
  // remove the "redirect" identifier ...
  data = data.slice("redirect".length);
  
  // ... eat the deadcode before the stringlist...
  data = this.whiteSpace.init(data);
  
  // ... extract the redirect address...
  data = this.address.init(data);
  
  // ... drop the semicolon
  data = this.semicolon.init(data);
    
  return data;        
}

SieveRedirect.prototype.onValidate
   = function ()
{
  this.address.setValue(this.domInput.value);  
  this.domDescription.setAttribute("value",this.address.getValue());

  return true;
}

SieveRedirect.prototype.toString
    = function ()
{
  return "redirect"
    + this.whiteSpace.toString()
    + this.address.toString()
    + this.semicolon.toString();
}

SieveRedirect.prototype.toElement
    = function ()
{
  // create read only box...
  var roBox = document.createElement("vbox");
  
  roBox.appendChild(document.createElement("description"))
     .setAttribute("value","Redirect message to: ");
        
  this.domDescription = roBox.appendChild(document.createElement("description"));
  this.domDescription.setAttribute("value",""+this.address.getValue());
        
  // create edit box...
  var rwBox = document.createElement("vbox");
    
  rwBox.appendChild(document.createElement("description"))
     .setAttribute("value","Redirect message to: ");

  //TODO change to: <textbox type="autocomplete" autocompletesearch="mydomain addrbook"/>
  this.domInput = rwBox.appendChild(document.createElement("textbox"));
  this.domInput.setAttribute("type","autocomplete");
  this.domInput.setAttribute("autocompletesearch","mydomain addrbook");
  this.domInput.setAttribute("value",""+this.address.getValue());
      
  return createEditableDragBox(this.id,roBox,rwBox,this);  
}
 
/******************************************************************************/

function SieveReject(id)
{
  this.id = id;
  
  this.reason = SieveLexer.createByName("string");
  this.reason.init("text:\r\n.\r\n");
  
  this.whiteSpace = SieveLexer.createByName("whitespace");
  this.whiteSpace.init(" ");
  
  this.semicolon = SieveLexer.createByName("atom/semicolon");    
  
}
SieveReject.prototype.init
    = function (data)
{ 
  // Syntax :
  // <"reject"> <reason: string> <";">
  
  // remove the "redirect" identifier ...
  data = data.slice("reject".length);
  
  // ... eat the deadcode before the stringlist...
  data = this.whiteSpace.init(data);
  
  // ... extract the reject reason...
  data = this.reason.init(data);
    
  // ... drop the semicolon
  data = this.semicolon.init(data);
  
  return data;
}

SieveReject.prototype.toString
    = function ()
{ 
  return "reject"
    + this.whiteSpace.toString()
    + this.reason.toString()
    + this.semicolon.toString();
}

SieveReject.prototype.onValidate
   = function ()
{
  this.reason.setValue(this.domInput.value);  
  this.domReason.setAttribute("value",this.reason.getValue());

  return true;
}

SieveReject.prototype.toElement
    = function ()
{
  // create read only box...
  var roBox = document.createElement("vbox");
  
  roBox.appendChild(document.createElement("description"))
     .setAttribute("value",
        "Reject incomming messages and reply the following reason:");
        
  this.domReason = roBox.appendChild(document.createElement("description"));
  this.domReason.setAttribute("value",this.reason.getValue());
        
  // create edit box...
  var rwBox = document.createElement("vbox");
    
  rwBox.appendChild(document.createElement("description"))
     .setAttribute("value",
        "Reject incomming messages and reply the following reason:");

  this.domInput = rwBox.appendChild(document.createElement("textbox")); 
  this.domInput.setAttribute("multiline", "true");
  this.domInput.setAttribute("value",""+this.reason.getValue());
      
  return createEditableDragBox(this.id,roBox,rwBox,this);
}


/******************************************************************************/

function SieveStop(id) 
{
  this.id = id;
  this.semicolon = SieveLexer.createByName("atom/semicolon");
}

SieveStop.prototype.init
    = function (data)
{
  data = data.slice("stop".length);
  
  data = this.semicolon.init(data);
    
  return data; 
}    

SieveStop.prototype.toString
    = function ()
{
  return "stop"
    + this.semicolon.toString();
}

SieveStop.prototype.toElement
    = function ()
{
  var elm = createDragBox(this.id);
  
  var desc = document.createElement("description");
  desc.setAttribute("value",
    "End Script (Stop processing)");
  elm.appendChild(desc); 
  
  return elm;
}

/******************************************************************************/

function SieveKeep(id)
{
  this.id = id;
  this.semicolon = SieveLexer.createByName("atom/semicolon");
}

SieveKeep.prototype.init
    = function (data)
{
  data = data.slice("keep".length);
  
  data = this.semicolon.init(data);
    
  return data;
}    

SieveKeep.prototype.toString
    = function ()
{
  return "keep"
    + this.semicolon.toString();
}

SieveKeep.prototype.toElement
    = function ()
{
  var elm = createDragBox(this.id);

  var desc = document.createElement("description");
  desc.setAttribute("value",
    "Keep a message's copy in the main inbox");
  elm.appendChild(desc);
  
  return elm;
}


/******************************************************************************/

function SieveFileInto(id) 
{
  this.id = id;

  this.whiteSpace = SieveLexer.createByName("whitespace");
  this.whiteSpace.init(" ");
  
  this.semicolon = SieveLexer.createByName("atom/semicolon");
      
  this.string = SieveLexer.createByName("string");
  this.string.init("\"INBOX\"");
}

SieveFileInto.prototype.init
    = function (data)
{
  // Syntax :
  // <"fileinto"> <string> <";">
  
  data = data.slice("fileinto".length);
  
  // ... eat the deadcode before the string...
  data = this.whiteSpace.init(data);
  
  // read the string
  data = this.string.init(data);
  
  // ... and finally remove the semicolon;
  data = this.semicolon.init(data);
      
  return data;
}

SieveFileInto.prototype.toString
    = function ()
{
  return "fileinto"  
    + this.whiteSpace.toString()
    + this.string.toString()
    + this.semicolon.toString();
}

SieveFileInto.prototype.onValidate
    = function ()
{
  this.string.setValue(this.domInput.value);  
  this.domDescription.setAttribute("value",this.string.getValue());

  return true;
}

SieveFileInto.prototype.toElement
    = function ()
{
  // create read only box...
  var roBox = document.createElement("vbox");
  
  roBox.appendChild(document.createElement("description"))
     .setAttribute("value",
        "Copy the incomming message into: ");
        
  this.domDescription = roBox.appendChild(document.createElement("description"));
  this.domDescription.setAttribute("value",this.string.getValue());
        
  // create edit box...
  var rwBox = document.createElement("vbox");
    
  rwBox.appendChild(document.createElement("description"))
     .setAttribute("value",
        "Copy the incomming message into: ");

  this.domInput = rwBox.appendChild(document.createElement("textbox")); 
  this.domInput.setAttribute("value",""+this.string.getValue());
      
  return createEditableDragBox(this.id,roBox,rwBox,this);  
}

/******************************************************************************/

if (!SieveLexer)
  throw "Could not register Actions";

with (SieveLexer)
{
  register("action","action/discard",
      function(token) {
        return (token.substring(0,7).toLowerCase().indexOf("discard") == 0); }, 
      function(id) {return new SieveDiscard(id)});
  
  register("action","action/fileinto",
      function(token) {
        return (token.substring(0,8).toLowerCase().indexOf("fileinto") == 0); }, 
      function(id) {return new SieveFileInto(id)});  
        
  register("action","action/keep",
      function(token) {
        return (token.substring(0,4).toLowerCase().indexOf("keep") == 0); },
      function(id) {return new SieveKeep(id)});
      
  register("action","action/redirect",
      function(token) {
        return (token.substring(0,8).toLowerCase().indexOf("redirect") == 0); },
      function(id) {return new SieveRedirect(id)});
      
  register("action","action/reject",
      function(token) {
        return (token.substring(0,6).toLowerCase().indexOf("reject") == 0); },
      function(id) {return new SieveReject(id)});
      
  register("action","action/stop",
      function(token) {
        return (token.substring(0,4).toLowerCase().indexOf("stop") == 0); },
      function(id) {return new SieveStop(id)});   
}
