/*
 * This file OOP aproach to parse the Sieve Script Language.
 */


function isSieveSemicolon(data)
{
  if (data.charAt(0) != ";")
    return false;
  
  return true;
}

/******************************************************************************/

function isSieveNumber(data,index)
{
  if (index == null)
    index = 0;
    
  if (isNaN(data.charAt(index)))
    return false;
  
  return true;
}

function SieveNumber(id)
{
  this.id = id
  this.number = "1";
  this.unit = null;
}

SieveNumber.prototype.parse
    = function(data)
{
  var i
  
  for (i=0; i<data.length; i++)
  {
    if (isSieveNumber(data,i))
      continue;
    
    break;
  }

  this.number = data.slice(0,i);  
  data = data.slice(i); 
  
  var ch = data.charAt(0).toUpperCase();

  if ((ch == 'K') ||  (ch == 'M') || (ch == 'G'))
  {
    this.unit = data.slice(0,1);
    data = data.slice(1);
  }
  
  return data;
}

SieveNumber.prototype.getID
    = function ()
{
  return this.id;
}

SieveNumber.prototype.toString
    = function ()
{
  return this.number
    +((this.unit==null)?"":this.unit);
}

SieveNumber.prototype.toXUL
    = function ()
{
  return "<html:div class='SieveNumber'>"
    + "  <html:input type='text' value='"+this.number+"' />"
    + "  <html:select>"
    + "    <html:option "+((this.unit.toUpperCase()=="K")?"selected='true'":"")+">"
    + "      Kilobytes"
    + "    </html:option>"
    + "    <html:option "+((this.unit.toUpperCase()=="M")?"selected='true'":"")+">"
    + "      Megabytes"
    + "    </html:option>"
    + "    <html:option "+((this.unit.toUpperCase()=="G")?"selected='true'":"")+">"
    + "      Gigabytes" 
    + "    </html:option>"
    + "  </html:select>"
    + "</html:div>";
}
/******************************************************************************/
function isSieveMultiLineString(data)
{
  var token = data.substr(0,5).toLowerCase();
  if (token == "text:")
    return true;
  
  return false;
}

function SieveMultiLineString()
{
  this.text = "";
  this.whiteSpace = "";
  this.hashComment = null;
  
}

SieveMultiLineString.prototype.parse
    = function (data)    
{
  //<"text:"> <hashcomment / CRLF>
  
  // remove the "text:"
  data = data.slice(5);

  // remove whitespaces if any
  var i;
  for (i=0; i<data.length; i++)
  {
    var ch = data.charAt(i);
    if (ch == " ")
      continue;
    if (ch == "\t")
      continue;
    
    break;
  }

  this.whiteSpace = data.slice(0,i);
  
  if (isSieveHashComment(data))
  {
    this.hashComment = new SieveHashComment();
    data = this.hashComment.parse(data);
  }
  
  var end = data.indexOf("\n.\n");

  if (end == -1)
    throw "Syntaxerror: Multiline String not closed, \".\\r\\n missing" ;
  
  this.text = data.slice(0,end+1);
       
  data = data.slice(end+3);
  
  //remove the \r\n
  return data;
}

SieveMultiLineString.prototype.getValue
    = function ()
{
  return this.text;
} 


SieveMultiLineString.prototype.toString
    = function ()
{
  return "text:"
    +this.whiteSpace
    +((this.hashComment == null)?"\n":this.hashComment.toString())
    +this.text
    +".\n";
}

SieveMultiLineString.prototype.toXUL
    = function ()
{
  return "MultilineString - to be implemented";
}

/******************************************************************************/

function isSieveQuotedString(data)
{
  if (data.charAt(0) == "\"")
    return true;
      
  return false;
}

function SieveQuotedString()
{
  this.text = "";
}

SieveQuotedString.prototype.parse
    = function (data)    
{
  
   // remove the "
   data = data.slice(1);
   
   // TODO: Handle escaped characters...
   
   var size = data.indexOf("\"");

   this.text = data.slice(0,size);
      
   return data = data.slice(size+1); 
}

SieveQuotedString.prototype.getValue
    = function ()
{
  return this.text;
} 

SieveQuotedString.prototype.toString
    = function ()
{
  return "\""+this.text+"\"";
}

SieveQuotedString.prototype.toXUL
    = function ()
{
  return "QuotedString - to be implemented";
}
/******************************************************************************/

function isSieveString(data)
{
  if (isSieveQuotedString(data))
    return true;
  if (isSieveMultiLineString(data))
    return true;
    
  return false;
}

function SieveString()
{
  this.string = null;
}

SieveString.prototype.parse
    = function (data)    
{
  if (isSieveQuotedString(data))
    this.string = new SieveQuotedString();
  else if (isSieveMultiLineString(data))
    this.string = new SieveMultiLineString();
  else
    throw "Syntaxerror: String expected";
    
  return this.string.parse(data);    
}

SieveString.prototype.getValue
    = function ()
{
  return this.string.getValue();
} 
   
SieveString.prototype.toString
    = function ()
{
  return this.string.toString();
}

SieveString.prototype.toXUL
    = function ()
{
  return "SieveString.toXul - Not Implemented";
}



/******************************************************************************/

// the [ is not necessary if the list contains only one enty!

function isSieveStringList(data)
{
  if (data.charAt(0) == "[")
    return true;
  if (isSieveQuotedString(data))
    return true;  

  return false;
}


function SieveStringList(size)
{  
  this.elements = new Array();
  
  // if the list contains only one entry...
  // ... use the comact syntac, this means ...
  // ... don't use the "[...]" to encapsulate the string
  this.compact = true;
}

SieveStringList.prototype.parse
    = function (data)
{
  if (isSieveQuotedString(data))
  {
    this.compact = true;
    
    this.elements[0] = new SieveQuotedString();
    return this.elements[0].parse(data);
  }
  
  this.compact = false;
  // remove the [
  data = data.slice(1);
		
  while (true)
  {
    if (data.charAt(0) == "]")
      return data.slice(1);
      
    if (data.charAt(0) == ",")
    {      
      data = data.slice(1);
      continue;
    }
        
    var element = null;
    
    if (isSieveDeadCode(data))
      element = new SieveDeadCode();
    else if (isSieveQuotedString(data))
      element = new SieveQuotedString();
    else
      throw "unexpected Command";
    
    data = element.parse(data);
    this.elements.push(element);
  }
  
}
SieveStringList.prototype.toString
    = function ()
{
  if (this.compact)
    return this.elements[0].toString();
    
  var cmd = "[";
  var sep = "";
  
  for (var i = 0;i<this.elements.length; i++)
  {
    // ugly hack ...
    if (this.elements[i] instanceof SieveQuotedString)
    {
      cmd  += sep;
      sep = ",";
    }
    
    cmd += this.elements[i].toString();
  }
  cmd += "]";
  
  return cmd;    
}

SieveStringList.prototype.toXUL
    = function ()
{
  return "Stringlist";
}

/******************************************************************************/

function isSieveCondition(data)
{
  if (data.toLowerCase().indexOf("if") == 0)
    return true;
  
  return false;
}

function SieveCondition(id) 
{ 
  this.id = id;
  this.elements = new Array();
}

/*
 if header :contains "from" "coyote" {
    discard;
 } elsif header :contains ["subject"] ["$$$"] {
    discard;
 } else {
    fileinto "INBOX";
 }
 */

SieveCondition.prototype.parse
    = function (data)
{  
  var element = new SieveIf(this.id+"_0")
  data = element.parse(data);
  this.elements.push(element);
  
  while (true)
  {  
    var id = this.id+"_"+this.elements.length;
    
    if (isSieveDeadCode(data))
      element = new SieveDeadCode(id)
    else if (isSieveElsIf(data))
      element = new SieveElsIf(id);
    else if (isSieveElse(data))
      element = new SieveElse(id);
    else
      return data;

    data = element.parse(data);
    this.elements.push(element);
  }
}

SieveCondition.prototype.getID
    = function ()
{
  return this.id;
}

SieveCondition.prototype.toString
    = function ()
{
  var str = "";
  for (var i=0; i<this.elements.length;i++)
  {
    str += this.elements[i].toString();
  }
  return str;
}

SieveCondition.prototype.toXUL
    = function ()
{
  var xul = "";
  for (var i=0; i<this.elements.length;i++)
  {
    xul += this.elements[i].toXUL();
  }
  return xul;  
}


/******************************************************************************/

function isSieveIf(data)
{
  if (data.toLowerCase().indexOf("if") == 0)
    return true;
  
  return false;
}

function SieveIf(id) 
{
  this.id = id;
  this.test = null;
  this.block = new SieveBlock(this.id+"_3");
  this.whiteSpace 
    = new Array(new SieveDeadCode(this.id+"_0"),
                new SieveDeadCode(this.id+"_2"));
}

/*
 if header :contains "from" "coyote" {
    discard;
 } elsif header :contains ["subject"] ["$$$"] {
    discard;
 } else {
    fileinto "INBOX";
 }
 */

SieveIf.prototype.parse
    = function (data)
{
  // Syntax :
  // <"if"> <test> <block>
  
  // remove the "if"...
  data = data.slice(2);

  // ... remove the deadcode ...
  data = this.whiteSpace[0].parse(data);
              
  // ...then extract the test...
  var parser = new SieveTestParser(data,this.id+"_1");
  this.test = parser.extract();  
  data = parser.getData();
  
  // ... eat again the deadcode ...
  data = this.whiteSpace[1].parse(data);
    
  // ... finally read the block.
  data = this.block.parse(data);
   
  return data;
}

SieveIf.prototype.getID
    = function ()
{
  return this.id;
}

SieveIf.prototype.toString
    = function ()
{
  return "if"
    + this.whiteSpace[0].toString()
    + this.test.toString()
    + this.whiteSpace[1].toString()
    + this.block.toString();
}

SieveIf.prototype.toXUL
    = function ()
{
  return "if "
    + this.test.toXUL()
    + "then execute "
    + this.block.toXUL();  
}

/******************************************************************************/

function isSieveElsIf(data)
{
  if (data.toLowerCase().indexOf("elsif") == 0)
    return true;
  
  return false;
}

function SieveElsIf(id) 
{
  this.id = id
  this.test = null;
  this.block = new SieveBlock(this.id+"_3");
  this.whiteSpace 
    = new Array(new SieveDeadCode(this.id+"_0"),
                new SieveDeadCode(this.id+"_2"));
}

/*
 if header :contains "from" "coyote" {
    discard;
 } elsif header :contains ["subject"] ["$$$"] {
    discard;
 } else {
    fileinto "INBOX";
 }
 */

SieveElsIf.prototype.parse
    = function (data)
{
  // Syntax:
  // <"elsif"> <test> <block>
  
  // remove the elsif...
  data = data.slice(5);

  // ... remove the deadcode ...
  data = this.whiteSpace[0].parse(data);
              
  // ...then extract the test...
  var parser = new SieveTestParser(data,this.id+"_1");
  this.test = parser.extract();  
  data = parser.getData();
  
  // ... eat again the deadcode ...
  data = this.whiteSpace[1].parse(data);
    
  // ... finally read the block.
  data = this.block.parse(data);
   
  return data;
}

SieveElsIf.prototype.getID
    = function ()
{
  return this.id; 
}

SieveElsIf.prototype.toString
    = function ()
{
  return "elsif"
    + this.whiteSpace[0].toString()
    + this.test.toString()
    + this.whiteSpace[1].toString()
    + this.block.toString();
}

SieveElsIf.prototype.toXUL
    = function ()
{
  return "else if"
    + this.test.toXUL()
    + this.block.toXUL();   
}

/******************************************************************************/


function isSieveElse(data)
{
  if (data.toLowerCase().indexOf("else") == 0)
    return true;
  
  return false;
}

function SieveElse(id) 
{
  this.id = id;
  this.block = new SieveBlock(this.id+"_1");
  this.whiteSpace = new SieveDeadCode(this.id+"_0");

}

/*
 if header :contains "from" "coyote" {
    discard;
 } elsif header :contains ["subject"] ["$$$"] {
    discard;
 } else {
    fileinto "INBOX";
 }
 */

SieveElse.prototype.parse
    = function (data)
{
  // remove the else...
  data = data.slice(4);
                
  // ... eat the deadcode between the else and the block...
  data = this.whiteSpace.parse(data);
    
  // ... finally read the block.
  data = this.block.parse(data);
  
  return data;
}

SieveElse.prototype.getID
    = function ()
{
  return this.id;
}

SieveElse.prototype.toString
    = function ()
{
  return "else"
    + this.whiteSpace.toString()
    + this.block.toString();
}

SieveElse.prototype.toXUL
    = function ()
{
  return "else"
    + this.block.toXUL(); 
}

/******************************************************************************/

function isSieveBracketComment(data)
{
  if (data.charAt(0) != "/")
    return false;
    
  if (data.charAt(1) != "*")
    return false;
  
  return true;
}

function SieveBracketComment() 
{
  this.text = "";
}

SieveBracketComment.prototype.parse
    = function (data)
{
  if (data.indexOf("/*") != 0)
    throw "/* expected";
    
  // remove the "/*"
  data = data.slice(2);

  var end = data.indexOf("*/"); 
  if (end == -1)
    throw "*/ expected";
    
    
  this.text = data.slice(0,end);
  
  // remove the "*/"    
  return data = data.slice(end+2);
}

SieveBracketComment.prototype.toString
    = function ()
{
  return "/*"+this.text+"*/";
}

SieveBracketComment.prototype.toXUL
    = function ()
{
  return ""; 
}

/******************************************************************************/

function isSieveHashComment(data, index)
{
  if (index == null)
    index = 0;
    
  if (data.charAt(index) != "#")
    return false;

  return true;
}

function SieveHashComment(id) 
{
  this.id = id;
  this.text = "";
}

SieveHashComment.prototype.parse
    = function (data)
{  
  // is this a valid HashComment...
  if (data.charAt(0) != "#")
    throw "# expected";
  
  // ... then remove the Hash # ...
  data = data.slice(1);
    
  // ... and find the end of the comment
  var end = data.indexOf("\n");
  if (end == -1)
    end = data.length;
  
  this.text = data.slice(0,end);
       
  //remove the \r\n
  return data = data.slice(end+1);
}

SieveHashComment.prototype.getID
    = function ()
{
  return this.id;
}

SieveHashComment.prototype.toString
    = function ()
{
  return "#"+this.text+"\r\n";
}

SieveHashComment.prototype.toXUL
    = function ()
{
  // this element is invisible in XUL
  return "";
}


/******************************************************************************/


function isSieveRequire(data, index)
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

/*function isSieveFileInto(data)
{
  if (data.toLowerCase().indexOf("fileinto") == 0)
    return true;

  return false;
}*/

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
    = "  Copy the incomming message into:"
    + "  <html:br />"
    + "  <html:select>"
    + "    <html:option>"
    + "      INBOX" 
    + "    </html:option>"
    + "  </html:select>";
    
  return SieveOptionsDiv(
            this.id, "SieveRedirect",xulBody);
}

/******************************************************************************/

function isSieveWhiteSpace(data, index)
{
  if (index == null)
    index = 0;
  var ch = data.charAt(index);
  
  if (ch == " ")
    return true;
  if (ch == "\t")
    return true;
  if (ch == "\r")
    return true;
  if (ch == "\n")
    return true;
    
  return false;
}

function SieveWhiteSpace(id)
{
  this.id = id;
  this.whiteSpace = "";
}

SieveWhiteSpace.prototype.parse
    = function (data)
{
  var i;
  
  for (i=0; i<data.length; i++)
  {
    var ch = data.charAt(i);
    if (ch == " ")
      continue;
    if (ch == "\t")
      continue;
    if (ch == "\r")
      continue;
    if (ch == "\n")
      continue;
    
    break;
  }

  this.whiteSpace = data.slice(0,i);
  
  return data.slice(i);  
}

SieveWhiteSpace.prototype.getID
    = function ()
{
  return this.id;
}

SieveWhiteSpace.prototype.toString
    = function ()
{
  return this.whiteSpace;
}

SieveWhiteSpace.prototype.toXUL
    = function ()
{
  // whitespaces do nothing in xul 
  return "";
}

/******************************************************************************/

/*function isSieveDiscard(data)
{
  if (data.toLowerCase().indexOf("discard") == 0)
    return true;
  
  return false;
}*/

function SieveDiscard(id) 
{
  this.id = id;
  this.whiteSpace = new SieveDeadCode();
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
    + "  <html:input type='text' value='"+this.address.getValue()+"' />";
    
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
    + "  <html:input type='text' value='"+this.reason.getValue()+"' />";
    
  return SieveOptionsDiv(
            this.id, "SieveReject",xulBody)
}


//****************************************

function SieveVacation(data) 
{

}

SieveVacation.prototype.toString
    = function ()
{
  // TODO
}

SieveVacation.prototype.toXUL
    = function ()
{
  
}

/******************************************************************************/

function SieveStop(id) 
{
  this.id = id;
  this.whiteSpace = new SieveDeadCode(this.id+"_0");
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
  return "<html:div class='SieveKeep'>" 
    + "Move the message into the main inbox"
    + "</html:div>";      
}
/******************************************************************************/

  // Comparators define the charset. All Sieve implementation have to support
  // "i;octet which" is case sensitive and "i;ascii-codemap" which is case
  // insensitive.

function isSieveComparator(data,index)
{
  if (index == null)
    index = 0;
    
  var token = data.substr(index,11).toLowerCase();
  if (token.indexOf(":comparator") == 0)
    return true;
  
  return false;
}

function SieveComparator(id)
{
  this.id = id;
  this.whiteSpace = new SieveDeadCode(this.id+"_0");
  this.comparator = new SieveQuotedString(this.id+"_1");
}

SieveComparator.prototype.parse
    = function (data)
{
  // Syntax :
  // <":comparator"> <comparator-name: string>
  
  data = data.slice(":comparator".length);
  
  data = this.whiteSpace.parse(data);
  
  data = this.comparator.parse(data);
  
  return data;
}

SieveComparator.prototype.getID
    = function ()
{
  return this.id;
}    

SieveComparator.prototype.toString
    = function ()
{
  return ":comparator"
    +this.whiteSpace.toString()
    +this.comparator.toString();
}

SieveComparator.prototype.toXUL
    = function ()
{
  return "Comparator - to be implemented";
}
/******************************************************************************/

function isSieveMatchType(data,index)
{
  if (index == null)
    index = 0;
    
  var token = data.substr(index,9).toLowerCase();
  if (token.indexOf(":is") == 0)
    return true;
  if (token.indexOf(":matches") == 0)
    return true;
  if (token.indexOf(":contains") == 0)
    return true;
  
  return false;
}

function SieveMatchType(id)
{
  this.id = id;
  this.type = null;
}

SieveMatchType.prototype.parse
    = function (data)
{
  var token = data.substr(0,9).toLowerCase();
  if (token.indexOf(":is") == 0)
    this.type = "is";
  else if (token.indexOf(":matches") == 0)
    this.type = "matches";
  else if (token.indexOf(":contains") == 0)
    this.type = "contains"
  else 
    throw "Syntaxerror, unknown match type";
  
  return data.slice(this.type.length+1);
}

SieveMatchType.prototype.getID
    = function ()
{
  return this.id;
}

SieveMatchType.prototype.toString
    = function ()
{
  if (this.type == null)
    return "";
    
  return ":"+this.type;
}

SieveMatchType.prototype.toXUL
    = function ()
{
  return "<html:div class='SieveMatchType'>"
    + "<html:option "+((this.type=="is")?"selected":"")+">is</html:option>" 
    + "<html:option "+((this.type=="matches")?"selected":"")+">matches</html:option>" 
    + "<html:option "+((this.type=="contains")?"selected":"")+">contains</html:option>"
    + "</html:div>"
}

/******************************************************************************/

//":localpart" / ":domain" / ":all"

function isSieveAddressPart(data,index)
{
  if (index == null)
    index = 0;
    
  var token = data.substr(index,11).toLowerCase();
  if (token.indexOf(":localpart") == 0)
    return true;
  if (token.indexOf(":domain") == 0)
    return true;
  if (token.indexOf(":all") == 0)
    return true;
  
  return false;
}

function SieveAddressPart(id)
{
  this.id = id;
  this.part = null;
}

SieveAddressPart.prototype.parse
    = function (data)
{
  var token = data.substr(0,11).toLowerCase();
  if (token.indexOf(":localpart") == 0)
    this.part = "localpart";
  else if (token.indexOf(":domain") == 0)
    this.part = "domain";
  else if (token.indexOf(":all") == 0)
    this.part = "all"
  else 
    throw "Syntaxerror, unknown address part";
  
  return data.slice(this.part.length+1);
}

SieveAddressPart.prototype.getID
    = function ()
{
  return this.id;
}

SieveAddressPart.prototype.toString
    = function ()
{
  if (this.part == null)
    return "";
    
  return ":"+this.part;
}

SieveAddressPart.prototype.toXUL
    = function ()
{
  return "addresspart to be implemented"
}
/******************************************************************************/

function SieveHeaderTest(id) 
{
  this.id = id;
  this.whiteSpace 
    = new Array(new SieveDeadCode(this.id+"_0"),
                new SieveDeadCode(this.id+"_1"),
                new SieveDeadCode(this.id+"_2"),
                new SieveDeadCode(this.id+"_3"),                
                new SieveDeadCode(this.id+"_4"));
  this.options = new Array(null,null);
  this.headerNames = new SieveStringList(this.id+"_5");
  this.keyList = new SieveStringList(this.id+"_6");
}

SieveHeaderTest.prototype.parse
    = function (data)
{
  // Syntax :
  // <"header"> [COMPARATOR] [MATCH-TYPE] <header-names: string-list> <key-list: string-list>             
  
  data = data.slice("header".length);
  
  data = this.whiteSpace[0].parse(data);
  
  if (isSieveComparator(data))
  {
    var element = new SieveComparator(this.id+"_7");
    data = element.parse(data);
    this.options[0] = element;
    
    data = this.whiteSpace[1].parse(data)
    
    if (isSieveMatchType(data))
    {
      element = new SieveMatchType(this.id+"_8");
      data = element.parse(data);
      this.options[1] = element;
    }
  }  
  else if (isSieveMatchType(data))
  {
    var element = new SieveMatchType(this.id+"_7");
    data = element.parse(data);
    this.options[0] = element;
    
    data = this.whiteSpace[1].parse(data)

    if (isSieveComparator(data))
    {
      element = new SieveComparator(this.id+"_8");
      data = element.parse(data);
      this.options[1] = element;
    }
  }
  data = this.whiteSpace[2].parse(data);  
  data = this.headerNames.parse(data);
  
  data = this.whiteSpace[3].parse(data);
  
  data = this.keyList.parse(data);
  
  data = this.whiteSpace[4].parse(data);
  
  return data;    
}

SieveHeaderTest.prototype.toString
    = function ()
{
  return "header"
    + this.whiteSpace[0].toString()
    + ((this.options[0] != null)?this.options[0].toString():"")
    + ((this.options[0] != null)?this.whiteSpace[1].toString():"")    
    + ((this.options[1] != null)?this.options[1].toString():"")
    + this.whiteSpace[2].toString()
    + this.headerNames.toString()
    + this.whiteSpace[3].toString()
    + this.keyList.toString()
    + this.whiteSpace[4].toString()
}

SieveHeaderTest.prototype.toXUL
    = function ()
{
  return "message header, that contains a [casesensitive]  [match to be Implemented";
}

/******************************************************************************/

function isSieveBooleanTest(data)
{   
  data = data.toLowerCase();
  if (data.indexOf("true") == 0)
    return true;
  if (data.indexOf("false") == 0)
    return true;
  
  return false;
}

function SieveBooleanTest(id) 
{
  // first line with deadcode
  this.id = id;
  this.whiteSpace = new SieveDeadCode(this.id+"_0");
  
  this.value = false;
}

SieveBooleanTest.prototype.parse
    = function (data)
{
  var token = data.substr(0,5).toLowerCase();
  
  if (token.indexOf("true") == null)
  {
    this.value = true
    data = data.slice("true".length);
  }
  
  if (token.indexOf("false") == null)
  {
    this.value = false;
    data = data.slice("false".length);
  }
  
  data = this.whiteSpace.parse(data);
    
  return data;
    
}    

SieveBooleanTest.prototype.getID
    = function ()
{
  return this.id;
}

SieveBooleanTest.prototype.toString
    = function ()
{
  if (this.value)
    return "true"+this.whiteSpace.toString();

  return "false"+this.whiteSpace.toString();    
}

SieveBooleanTest.prototype.toXUL
    = function ()
{
  return "Headertest - to be Implemented";  
}

/******************************************************************************/

function SieveSizeTest(id) 
{
  this.id = id;
  this.whiteSpace 
    = new Array(new SieveDeadCode(this.id+"_0"),
                new SieveDeadCode(this.id+"_1"),
                new SieveDeadCode(this.id+"_3"));
  
  this.over = false;
  this.size = new SieveNumber(this.id+"_2");
}

SieveSizeTest.prototype.parse
    = function (data)
{
  // Syntax :
  // <"size"> <":over" / ":under"> <limit: number>
  
  data = data.slice("size".length);
  
  data = this.whiteSpace[0].parse(data);
  
  var token = data.substr(0,6).toLowerCase();
  if (token.indexOf(":over") == 0)
  {
    data=data.slice(":over".length)
    this.over = true;
  }
  else if (token.indexOf(":under") == 0)
  {
    data=data.slice(":under".length)    
    this.over = false;
  }
  else 
    throw "Syntaxerror, :under or :over expected";
    
  data = this.whiteSpace[1].parse(data);
  data = this.size.parse(data);
  data = this.whiteSpace[2].parse(data);
  
  return data;
    
}    

SieveSizeTest.prototype.getID
    = function ()
{
  return this.id;
}

SieveSizeTest.prototype.toString
    = function ()
{
  return "size"
    + this.whiteSpace[0].toString()
    + ((this.over)?":over":":under")
    + this.whiteSpace[1].toString()
    + this.size.toString()
    + this.whiteSpace[2].toString();
}

SieveSizeTest.prototype.toXUL
    = function ()
{
  return "<html:div class='SieveSizeTest'>"
    + " message is "
    + "<html:select>"
    + "<html:option "+((this.over)?"selected='true'":"")+" >bigger</html:option>" 
    + "<html:option "+((this.over)?"":"selected'true'")+" >smaler</html:option>" 
    + "</html:select>"
    + " than "
    + this.size.toXUL()
    + "</html:div>"
}

/******************************************************************************/

function SieveExistsTest(id)
{
  this.id = id;
  this.whiteSpace 
    = new Array(new SieveDeadCode(this.id+"_0"),
                new SieveDeadCode(this.id+"_2"));
  
  this.headerNames = new SieveStringList(this.id+"_1");
}

SieveExistsTest.prototype.parse
    = function (data)
{
  // Syntax :
  // <"exists"> <header-names: string-list>
  
  data = data.slice("exists".length);
  
  data = this.whiteSpace[0].parse(data);
  
  data = this.headerNames.parse(data);
    
  data = this.whiteSpace[1].parse(data);
  
  return data;
    
}    

SieveExistsTest.prototype.getID
    = function ()
{
 return this.id; 
}

SieveExistsTest.prototype.toString
    = function ()
{
  return "exists"
    + this.whiteSpace[0].toString()
    + this.headerNames.toString()
    + this.whiteSpace[1].toString();
}

SieveExistsTest.prototype.toXUL
    = function ()
{
  return "exists to be implemented";
}

/******************************************************************************/

function SieveAnyOfTest(id)
{
  this.id = id;
  this.whiteSpace
    = new Array(new SieveDeadCode(this.id+"_0"),
                new SieveDeadCode(this.id+"_2"));
  
  this.testList = new SieveTestList(this.id+"_1");
}

SieveAnyOfTest.prototype.parse
    = function (data)
{
  // Syntax :
  // <"anyof"> <tests: test-list>
  
  data = data.slice("anyof".length);
  
  data = this.whiteSpace[0].parse(data);
  
  data = this.testList.parse(data);
    
  data = this.whiteSpace[1].parse(data);
  
  return data;
    
}    

SieveAnyOfTest.prototype.getID
    = function ()
{
  return this.id;
}

SieveAnyOfTest.prototype.toString
    = function ()
{
  return "anyof"
    + this.whiteSpace[0].toString()
    + this.testList.toString()
    + this.whiteSpace[1].toString();
}

SieveAnyOfTest.prototype.toXUL
    = function ()
{
  return "any of the following conditions match"
    + this.testList.toXUL();
}
/*****************************************************************************/

function SieveAllOfTest(id) 
{
  this.id = id;
  this.whiteSpace 
    = new Array(new SieveDeadCode(this.id+"_0"),
                new SieveDeadCode(this.id+"_2"));
  
  this.testList = new SieveTestList(this.id+"_1");
}

SieveAllOfTest.prototype.parse
    = function (data)
{
  // Syntax :
  // <"allof"> <tests: test-list>
  
  data = data.slice("allof".length);
  
  data = this.whiteSpace[0].parse(data);
  
  data = this.testList.parse(data);
    
  data = this.whiteSpace[1].parse(data);
  
  return data;
    
}    

SieveAllOfTest.prototype.toString
    = function ()
{
  return "allof"
    + this.whiteSpace[0].toString()
    + this.testList.toString()
    + this.whiteSpace[1].toString();
}

SieveAllOfTest.prototype.toXUL
    = function ()
{
  return "all of the following conditions match"
    + this.testList.toXUL();
}
/******************************************************************************/

function SieveNotTest() 
{
  // first line with deadcode
  this.whiteSpace 
    = new Array(new SieveDeadCode(),
                new SieveDeadCode());
  
  this.test = null;
}

SieveNotTest.prototype.parse
    = function (data)
{
  // Syntax :
  // <"allof"> <tests: test-list>
  
  data = data.slice("not".length);
  
  data = this.whiteSpace[0].parse(data);
  
  var parser = new SieveTestParser(data);
  this.test = parser.extract()
  data = parser.getData();
  
  // TODO implement to all tests an setNot
  // this.test.invertLogic(true);
    
  data = this.whiteSpace[1].parse(data);
  
  return data;
    
}    

SieveNotTest.prototype.toString
    = function ()
{
  return "not"
    + this.whiteSpace[0].toString()
    + this.test.toString()
    + this.whiteSpace[1].toString();
}

SieveNotTest.prototype.toXUL
    = function ()
{
  return "not"+test.toXUL();
}

/******************************************************************************/

//<envelope> [COMPARATOR] [ADDRESS-PART] [MATCH-TYPE] 
//  <envelope-part: string-list> <key-list: string-list>
function SieveEnvelopeTest() 
{
  // first line with deadcode
  this.options = new Array(null,null,null);
  this.whiteSpace 
    = new Array(new SieveDeadCode(),
                new SieveDeadCode(),
                new SieveDeadCode(),
                new SieveDeadCode(),
                new SieveDeadCode(),
                new SieveDeadCode());
  this.envelopeList = new SieveStringList();
  this.keyList = new SieveStringList();
}

SieveEnvelopeTest.prototype.parse
    = function (data)
{
  data = data.slice("envelope".length);
  data = this.whiteSpace[0].parse(data);
  
  for (var i=0; i< 3; i++)
  {
    if (isSieveAddressPart(data))
      this.options[i] = new SieveAddressPart();
    else if (isSieveComparator(data))
      this.options[i] = new SieveComparator();
    else if (isSieveMatchType(data))
      this.options[i] = new SieveMatchType();
    else
      break;
    
    data = this.options[i].parse(data);
    data = this.whiteSpace[i+1].parse(data);
  }
  
  data = this.envelopeList.parse(data);
  
  data = this.whiteSpace[4].parse(data);
  
  data = this.keyList.parse(data);
    
  data = this.whiteSpace[5].parse(data);
  
  return data;
}    

SieveEnvelopeTest.prototype.toString
    = function ()
{
  return "envelope"
    + this.whiteSpace[0].toString()
    + ((this.options[0] != null)?this.options[0].toString():"")
    + ((this.options[0] != null)?this.whiteSpace[1].toString():"")
    + ((this.options[1] != null)?this.options[1].toString():"")
    + ((this.options[1] != null)?this.whiteSpace[2].toString():"")
    + ((this.options[2] != null)?this.options[2].toString():"")
    + ((this.options[2] != null)?this.whiteSpace[3].toString():"")
    + this.envelopeList.toString()
    + this.whiteSpace[4].toString()
    + this.keyList.toString()
    + this.whiteSpace[5].toString();
}

SieveEnvelopeTest.prototype.toXUL
    = function ()
{
  return "envelope - to be implented";
}

/******************************************************************************/


//address [ADDRESS-PART] [COMPARATOR] [MATCH-TYPE]
//             <header-list: string-list> <key-list: string-list>
             
function SieveAddressTest(id)
{
  this.id = id;  
  this.options = new Array(null,null,null);
  this.whiteSpace 
    = new Array(new SieveDeadCode(this.id+"_3"),
                new SieveDeadCode(this.id+"_4"),
                new SieveDeadCode(this.id+"_5"),
                new SieveDeadCode(this.id+"_6"),
                new SieveDeadCode(this.id+"_7"),
                new SieveDeadCode(this.id+"_8"));
  this.headerList = new SieveStringList(this.id+"_9");
  this.keyList = new SieveStringList(this.id+"_10");
}

SieveAddressTest.prototype.parse
    = function (data)
{
  data = data.slice("address".length);
  data = this.whiteSpace[0].parse(data);
  
  for (var i=0; i< 3; i++)
  {
    if (isSieveAddressPart(data))
      this.options[i] = new SieveAddressPart(this.id+"_"+i);
    else if (isSieveComparator(data))
      this.options[i] = new SieveComparator(this.id+"_"+i);
    else if (isSieveMatchType(data))
      this.options[i] = new SieveMatchType(this.id+"_"+i);
    else
      break;
    
    data = this.options[i].parse(data);
    data = this.whiteSpace[i+1].parse(data);
  }
  
  data = this.headerList.parse(data);
  
  data = this.whiteSpace[4].parse(data);
  
  data = this.keyList.parse(data);
    
  data = this.whiteSpace[5].parse(data);
  
  return data;
}    

SieveAddressTest.prototype.getID
    = function ()
{
  return this.id;
}

SieveAddressTest.prototype.toString
    = function ()
{
  return "address"
    + this.whiteSpace[0].toString()
    + ((this.options[0] != null)?this.options[0].toString():"")
    + ((this.options[0] != null)?this.whiteSpace[1].toString():"")
    + ((this.options[1] != null)?this.options[1].toString():"")
    + ((this.options[1] != null)?this.whiteSpace[2].toString():"")
    + ((this.options[2] != null)?this.options[2].toString():"")
    + ((this.options[2] != null)?this.whiteSpace[3].toString():"")
    + this.headerList.toString()
    + this.whiteSpace[4].toString()
    + this.keyList.toString()
    + this.whiteSpace[5].toString();
}

SieveAddressTest.prototype.toXUL
    = function ()
{
  return "address - to be implemented";
}

/******************************************************************************/

// anyof (not exists ["From", "Date"],
//                   header :contains "from" "fool@example.edu")
//  test-list = "(" test *("," test) ")"

function isSieveTestList(data)
{
  if (data.charAt(0) == "(")
    return true;
    
  return false;
}


function SieveTestList(size)
{  
  this.elements = new Array();
}

SieveTestList.prototype.parse
    = function (data)
{  
  // remove the (
  data = data.slice(1);
		
  while (true)
  {
    if (data.charAt(0) == ")")
      return data.slice(1);
      
    if (data.charAt(0) == ",")
    {      
      data = data.slice(1);
      continue;
    }
        
    var element = null;
    
    if (isSieveDeadCode(data))
    {
      element = new SieveDeadCode();
      data = element.parse(data);
    }
    else if (isSieveTest(data))
    {
      var parser = new SieveTestParser(data);
      element = parser.extract();
      data = parser.getData();
    }
    else
      throw "unexpected Command";
    

    this.elements.push(element);
  }
  
}

SieveTestList.prototype.toString
    = function ()
{
  if (this.compact)
    return this.elements[0].toString();
    
  var cmd = "(";
  var sep = "";
  
  for (var i = 0;i<this.elements.length; i++)
  {
    // ugly hack ...
    if (this.elements[i] instanceof SieveQuotedString)
    {
      cmd  += sep;
      sep = ",";
    }
    
    cmd += this.elements[i].toString();
  }
  cmd += ")";
  
  return cmd;    
}

SieveTestList.prototype.toXUL
    = function ()
{
  var result = "";
  for (var i = 0; i<this.elements.length; i++)
  {
    if (this.elements[i] instanceof SieveDeadCode)
     continue;
    
    result += this.elements[i].toXUL();
    result += "<html:br />";
  }
  return result;
}

/******************************************************************************/
function isSieveTest (data, index)
{  
  if (index == null)
    index = 0;
    
  var token = data.substr(index,10).toLowerCase();

  if (token.indexOf("not") == 0)
    return true;
  else if (isSieveBooleanTest(token))
    return true;
  else if (token.indexOf("address") == 0)
    return true;
  else if (token.indexOf("anyof") == 0)
    return true;
  else if (token.indexOf("envelope") == 0)
    return true;
  else if (token.indexOf("exists") == 0)
    return true;
  else if (token.indexOf("header") == 0)
    return true;
  else if (token.indexOf("size") == 0)
    return true;
    
  return false
}

function SieveTestParser(data)
{
  this.data = data;
}

SieveTestParser.prototype.extract
    = function ()
{
  var element = null;
  var token = this.data.substr(0,10).toLowerCase();
  
  
  if (token.indexOf("not") == 0)
    element = new SieveNotTest();
  else if (isSieveBooleanTest(token))
    element = new SieveBooleanTest();
  else if (token.indexOf("address") == 0)
    element = new SieveAddressTest();
  else if (token.indexOf("anyof") == 0)
    element = new SieveAnyOfTest();
  else if (token.indexOf("envelope") == 0)
    element = new SieveEnvelopeTest();
  else if (token.indexOf("exists") == 0)
    element = new SieveExistsTest();
  else if (token.indexOf("header") == 0)
    element = new SieveHeaderTest();
  else if (token.indexOf("size") == 0)
    element = new SieveSizeTest();
  else
    throw " :... - Sieve Test expected";
          
  this.data = element.parse(this.data);
  
  return element;
}    

SieveTestParser.prototype.getData
   = function()
{
  return this.data; 
}

/******************************************************************************/

// a block can only follow after an if, elsif, or else

function isSieveBlock(data,index)
{
  if (index == null)
    index = 0;
    
  if (data.charAt(index) == "{")
    return true;
    
  return false;
}

function SieveBlock(id)
{
  this.id = id;
  this.element = new SieveElement(this.id+"_0");  
}

SieveBlock.prototype.parse
    = function (data)
{
  if (isSieveBlock(data) == false)
    throw " \"{\" expected";
    
  // remove the "/*"
  data = data.slice(1);
  
  data = this.element.parse(data);
  
  if (data.charAt(0) != "}")
    throw " \"}\" expected";

  // remove the }
  data = data.slice(1);
  return data;
}

SieveBlock.prototype.getID
    = function ()
{
  return this.id;
}

SieveBlock.prototype.toString
    = function ()
{
  return "{"
    + this.element.toString()
    + "}";
}

SieveBlock.prototype.toXUL
    = function ()
{
  return this.element.toXUL();
}

SieveBlock.prototype.onMessage
    = function (id,message)
{
  if (this.element.getID() != id[0])
    return ;
  
  id.shift();  
  this.element.onMessage(id,data);
}

SieveBlock.prototype.onBouble  
    = function (message)
{
  this.element.onBouble(message);
}

/******************************************************************************/

function isSieveAction(data, index)
{  
  if (index == null)
    index = 0;
    
  var token = data.substr(index,10).toLowerCase();
  
  if (token.indexOf("discard") == 0)
    return true;
  if (token.indexOf("keep") == 0)
    return true;  
  if (token.indexOf("stop") == 0)
    return true;  
  if (token.indexOf("redirect") == 0)    
    return true;  
  if (token.indexOf("vacation") == 0)
    return true;  
  if (token.indexOf("fileinto") == 0)
    return true;  
  if (token.indexOf("reject") == 0)
    return true;   
    
  return false;
}

function SieveActionParser(data,id)
{
  this.data = data;
  this.id = id;
}


SieveActionParser.prototype.extract
    = function()
{
  var element = null;
  // in order to speed up the comparison ...
  // ... we extract the first 10 characters...
  // ... and compare only that token.  
  var token = this.data.substr(0,10).toLowerCase()

  if (token.indexOf("discard") == 0)
    element = new SieveDiscard(this.id+"_0"); 
  else if (token.indexOf("require") == 0)
    element = new SieveRequire(this.id+"_0");
  else if (token.indexOf("keep") == 0)
    element = new SieveKeep(this.id+"_0");
  else if (token.indexOf("stop") == 0)
    element = new SieveStop(this.id+"_0");
  else if (token.indexOf("redirect") == 0)    
    element = new SieveRedirect(this.id+"_0");
  else if (token.indexOf("vacation") == 0)
    element = new SieveVaction(this.id+"_0");
  else if (token.indexOf("fileinto") == 0)
    element = new SieveFileInto(this.id+"_0");
  else if (token.indexOf("reject") == 0)
    element = new SieveReject(this.id+"_0");

  if (element == null)
    throw "Syntax error, Sieve Action Statement expected";
        
  this.data = element.parse(this.data);    

  return element;
}

SieveActionParser.prototype.getData
    = function()
{
  return this.data;
}
/******************************************************************************/

function isSieveDeadCode(data, index)
{
  if (index == null)
    index = 0;
  
  if (isSieveWhiteSpace(data,index))
    return true;
  if (isSieveBracketComment(data,index))
    return true;
  if (isSieveHashComment(data,index))
    return true;
  
  return false;  
}

function SieveDeadCode(id)
{
  this.id = id;
  this.elements = new Array();
}

SieveDeadCode.prototype.parse
    = function(data)
{
  while(true)
  {
    var id = this.id+"_"+this.elements.length;
    var element = null;
    
    if (isSieveWhiteSpace(data))
      element = new SieveWhiteSpace(id);
    else if (isSieveBracketComment(data))
      element = new SieveBracketComment(id);
    else if (isSieveHashComment(data))
      element = new SieveHashComment(id);
    else
      return data;
    
    data = element.parse(data);
    this.elements.push(element);
  }
}

SieveDeadCode.prototype.getID
    = function ()
{
  return this.id;
}

SieveDeadCode.prototype.toString
    = function()
{
  var str = "";
  for (var i=0; i<this.elements.length; i++)
  {
    str += this.elements[i].toString();
  }
  return str;
}
    
SieveDeadCode.prototype.toXUL
    = function()
{
  return "";
}

SieveDeadCode.prototype.onMessage
    = function (id,message)
{
  // do nothing, because deadcode can't receive messages
}

SieveDeadCode.prototype.onBouble  
    = function (message)
{
  // do nothing, because deadcode can't receive messages
}

/******************************************************************************/

function isSieveElement(data, index)
{  
  if (index == null)
    index = 0;
    
  if (isSieveAction(data,index))
    return true;
  if  (isSieveCondition(data,index))
    return true;
        
  return false;
}


function SieveElement(id)
{
  this.id = id;  
  this.elements = new Array();
}

SieveElement.prototype.parse
    = function (data)
{
  while (true)
  {
    var id = this.id+"_"+this.elements.length;
    var element = null;
    
    if (isSieveAction(data))
    {
      var parser = new SieveActionParser(data,id);
      element = parser.extract();
      data = parser.getData();
    }
    else if (isSieveDeadCode(data))
    {
      element = new SieveDeadCode(id);
      data = element.parse(data);
    }
    else if (isSieveCondition(data))
    {
      element = new SieveCondition(id);
      data = element.parse(data);
    }
    else
      break;
      
    this.elements.push(element);
  }
  
  return data;
}

SieveElement.prototype.getID
    = function ()
{
  return this.id;
}

SieveElement.prototype.toString
    = function ()
{  
  var str ="";
  for (var i=0; i<this.elements.length;i++)
  {
    str += this.elements[i].toString();
  }  
  return str;
}

SieveElement.prototype.toXUL
    = function ()
{  
  var xul ="";
  for (var i=0; i<this.elements.length;i++)
  {
    xul += this.elements[i].toXUL();
  }  
  return xul;  
//  return ""
//    + "<html:a href='javascript:alert(\"test\")'>"
//    + blubb
//    + "<html:input type='image' src='chrome://sieve/content/images/add.png' onclick='blubb();' />"
//    + "<html:img src='chrome://sieve/content/images/delete.png' />"
//    + "</html:a>";
}

SieveElement.prototype.onMessage
    = function (id,message)
{
  for (var i=0; i<this.elements.length; i++)
  {
    if (this.elements[i].getID() != id[0])
      continue;
      
    // remove the first id ...
    id.shift();
    
    this.elements[i].onMessage(id,data);
  } 
}

SieveElement.prototype.onBouble  
    = function (message)
{
  for (var i=0; i<this.elements.length; i++)
  {    
    this.elements[i].onBouble(message);
  }  
}
/******************************************************************************/

function SieveDom()
{
  this.elements = new Array();
  this.id = 0;
}

SieveDom.prototype.setScript
    = function (data)
{
  // requires are only valid if they are
  // before any other sieve command!
  
  var isImportSection = true;
  
  while (true)
  {
    var id = this.id+"_"+this.elements.length;
    var element = null;

    if (isSieveDeadCode(data))
    {
      element = new SieveDeadCode(id);
    }
    else if (isSieveElement(data))
    {
      element = new SieveElement(id);
      isImportSection = false;
    }
    else if (isSieveRequire(data))
    {
      if (isImportSection == false)
        throw "Syntaxerror - misplaced require";
        
      element = new SieveRequire(id);
    }
    else
      break;

    data = element.parse(data);      
    this.elements.push(element);
  }
  
  return data;
}

SieveDom.prototype.toString
    = function ()
{  
  var str ="";
  for (var i=0; i<this.elements.length;i++)
  {
    str += this.elements[i].toString();
  }  
  return str;
}

SieveDom.prototype.toXUL
    = function ()
{  
  var xul ="";
  for (var i=0; i<this.elements.length;i++)
  {
    xul += this.elements[i].toXUL();
  }  
  return xul;  
}

SieveDom.prototype.sendMessage
    = function (id,message)
{
  // convert the id into an array...
  var id = id.split("_");

  for (var i=0; i<this.elements.length; i++)
  {
    if (this.elements[i].getID() != id[0])
      continue;
      
    // remove the first id ...
    id.shift(); 
    this.elements[i].onMessage(id,data);
  } 
}

SieveDom.prototype.boubleMessage
    = function (message)
{
  // drop the first id
 // id.shift();
  
  for (var i=0; i<this.elements.length; i++)
  {    
    this.elements[i].onBouble(message);
  }  
}