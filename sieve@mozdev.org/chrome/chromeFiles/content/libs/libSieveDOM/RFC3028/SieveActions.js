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
  
  var that = this;
  
  var elm =  createDragBox(this.id);
  elm.className = null;
  
  elm.appendChild(document.createElement("vbox"));
  elm.appendChild(document.createElement("vbox"));
    
  // create read only box...
  var box = elm.firstChild;
  box.className ="SivElement";
  box.appendChild(
        document.createElement("description"))
     .setAttribute("value",
        "Redirect message to: "+this.address.getValue()); 
  
  // create edit box...
  var box = elm.firstChild.nextSibling;
  
  box.className = "SivFocusedElement";
  box.style.display = "none";
  box.appendChild(
        document.createElement("description"))
     .setAttribute("value",
        "Redirect message to:");

        //TODO change to: <textbox type="autocomplete" autocompletesearch="mydomain addrbook"/>
  var input = box.appendChild(document.createElement("textbox")); 
  input.setAttribute("type","autocomplete");
  input.setAttribute("autocompletesearch","mydomain addrbook");
  input.setAttribute("value", ""+this.address.getValue());
  
  box = box.appendChild(document.createElement("hbox"));
  box.appendChild(
        document.createElement("spacer"))
     .setAttribute("flex","1");
     
  var btn = box.appendChild(document.createElement("button"));
  btn.setAttribute("label","Apply");
  btn.addEventListener("click",
    function(e){ 
      alert("apply changes");
      // TODO that.string.setValue(Textbox.value)
      
      elm.firstChild.style.display = null;
      elm.firstChild.nextSibling.style.display = "none";
    },true );
    
  btn = box.appendChild(document.createElement("button"));
  btn.setAttribute("label","Discard");
  btn.addEventListener("click",
    function(e){ 
      alert("discard changes");
      
      elm.firstChild.style.display = null;
      elm.firstChild.nextSibling.style.display = "none";
    },true );       
     
  elm.firstChild.addEventListener("click",
    function(e){ 
      elm.firstChild.style.display = "none";
      elm.firstChild.nextSibling.style.display = null;
    }, true );
      
  return elm;
}

SieveRedirect.prototype.onBouble
    = function (message)
{
  if ((message == 'blur') && (this.elm != null))
  {
    // read input value and update string...
    this.address.setValue(this.elm.getElementsByTagName('input')[0].value);
    // recreate element...
    this.elm.parentNode.replaceChild(this.toElement(),this.elm);
    this.elm = null;
  }
  
  return [];
}  
/******************************************************************************/

function SieveReject(id)
{
  this.id = id;
  
  this.reason = SieveLexer.createByName("string");
  
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

SieveReject.prototype.onEdit
    = function (e)
{
  e.stopPropagation();
  
  var elm = document.createElement("vbox");
  elm.className = "SivFocusedElement";
  
  elm.appendChild(
        document.createTextNode("Reject incomming messages and reply the following reason:"));
        
  var input = document.createElement("textbox");  
  input.setAttribute( "value", ""+this.reason.getValue());
  input.addEventListener("click",function(e){alert('input click');/*e.stopPropagation()*/;}, true);
  
  elm.appendChild(input);

  // prevent default event listeners...
  elm.addEventListener("click",function(e){e.stopPropagation();}, false);
  
  e.target.parentNode.replaceChild(elm,e.target);
 
  // cache edit dialog...
  this.elm = elm;  
}

SieveReject.prototype.toElement
    = function ()
{ 
  var elm = createDragBox(this.id);
 
  var desc = document.createElement("description");
  desc.setAttribute("value","Reject incomming messages and reply the following reason:");
  elm.appendChild(desc);

  desc = document.createElement("description");
  desc.setAttribute("value",this.reason.getValue());
  elm.appendChild(desc);
  
  var that = this;
  elm.addEventListener("click",function(e){ that.onEdit(e);},true );
  
  return elm;
}

SieveReject.prototype.onBouble
    = function (message)
{
  if ((message == 'blur') && (this.elm != null))
  {
    // read input value and update string...
    //this.address.setValue(this.elm.getElementsByTagName('input')[0].value);
    // recreate element...
    this.elm.parentNode.replaceChild(this.toElement(),this.elm);
    this.elm = null;
    
    // return false on error and true if blur is ok...
  }
  
  return [];
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

SieveFileInto.prototype.toElement
    = function ()
{
  
  var that = this;
  
  var elm =  createDragBox(this.id);
  elm.className = null;
  
  elm.appendChild(document.createElement("vbox"));
  elm.appendChild(document.createElement("vbox"));
    
  // create read only box...
  var box = elm.firstChild;
  box.className ="SivElement";
  box.appendChild(
        document.createElement("description"))
     .setAttribute("value",
        "Copy the incomming message into: "+this.string.getValue()); 
  
  // create edit box...
  var box = elm.firstChild.nextSibling;
  
  box.className = "SivFocusedElement";
  box.style.display = "none";
  box.appendChild(
        document.createElement("description"))
     .setAttribute("value",
        "Copy the incomming message into:");  
  box.appendChild(
        document.createElement("textbox"))
     .setAttribute("value",""+this.string.getValue());
  
  box = box.appendChild(document.createElement("hbox"));
  box.appendChild(
        document.createElement("spacer"))
     .setAttribute("flex","1");
     
  var btn = box.appendChild(document.createElement("button"));
  btn.setAttribute("label","Apply");
  btn.addEventListener("click",
    function(e){ 
      alert("apply changes");
      // TODO that.string.setValue(Textbox.value)
      
      elm.firstChild.style.display = null;
      elm.firstChild.nextSibling.style.display = "none";
    },true );
    
  btn = box.appendChild(document.createElement("button"));
  btn.setAttribute("label","Discard");
  btn.addEventListener("click",
    function(e){ 
      alert("discard changes");
      
      elm.firstChild.style.display = null;
      elm.firstChild.nextSibling.style.display = "none";
    },true );       
     
  elm.firstChild.addEventListener("click",
    function(e){ 
      elm.firstChild.style.display = "none";
      elm.firstChild.nextSibling.style.display = null;
    }, true );
      
  return elm;
}

SieveFileInto.prototype.onBouble
    = function (message)
{
  if ((message == 'blur') && (this.elm != null))
  {
    // read input value and update string...
    this.string.setValue(this.elm.getElementsByTagName('input')[0].value);
    // recreate element...
    this.elm.parentNode.replaceChild(this.toElement(),this.elm);
    this.elm = null;
  }
  
  return [];
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
