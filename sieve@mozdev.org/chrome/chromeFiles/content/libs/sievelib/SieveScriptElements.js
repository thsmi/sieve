/*
 * This file OOP aproach to parse the Sieve Script Language.
 */


// Tests to be implemented
// "address"
// "not"
// "true"
// "false"
// "envelope"
// TODO: clean up code


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

function SieveNumber()
{
  this.number = "1";
  this.unit = null;
}

SieveNumber.prototype.parse
    = function(data)
{
  var i;
  
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

SieveNumber.prototype.toString
    = function ()
{
  return this.number
    +((this.unit==null)?"":this.unit);
}

SieveNumber.prototype.toXUL
    = function ()
{
  
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

SieveQuotedString.prototype.toString
    = function ()
{
  return "\""+this.text+"\"";
}

SieveQuotedString.prototype.toXUL
    = function ()
{
  
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

SieveString.prototype.toString
    = function ()
{
  return this.string.toString();
}

SieveString.prototype.toXUL
    = function ()
{
  
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
  
}

/******************************************************************************/

function isSieveCondition(data)
{
  if (data.toLowerCase().indexOf("if") == 0)
    return true;
  
  return false;
}

function SieveCondition(data) 
{  
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
  var element = new SieveIf()
  data = element.parse(data);
  this.elements.push(element);
  
  while (true)
  {  
      
    if (isSieveDeadCode(data))
      element = new SieveDeadCode()
    else if (isSieveElsIf(data))
      element = new SieveElsIf();
    else if (isSieveElse(data))
      element = new SieveElse();
    else
      return data;
      
    data = element.parse(data);
    this.elements.push(element);
  }
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
  
}


/******************************************************************************/

function isSieveIf(data)
{
  if (data.toLowerCase().indexOf("if") == 0)
    return true;
  
  return false;
}

function SieveIf() 
{
  this.test = null;
  this.block = new SieveBlock();
  this.whiteSpace 
    = new Array(new SieveDeadCode(),
                new SieveDeadCode());
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
  var parser = new SieveTestParser(data)
  this.test = parser.extract();  
  data = parser.getData();
  
  // ... eat again the deadcode ...
  data = this.whiteSpace[1].parse(data);
    
  // ... finally read the block.
  data = this.block.parse(data);
   
  return data;
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
  
}

/******************************************************************************/

function isSieveElsIf(data)
{
  if (data.toLowerCase().indexOf("elsif") == 0)
    return true;
  
  return false;
}

function SieveElsIf() 
{
  this.test = null;
  this.block = new SieveBlock();
  this.whiteSpace 
    = new Array(new SieveDeadCode(),
                new SieveDeadCode());
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
  var parser = new SieveTestParser(data)
  this.test = parser.extract();  
  data = parser.getData();
  
  // ... eat again the deadcode ...
  data = this.whiteSpace[1].parse(data);
    
  // ... finally read the block.
  data = this.block.parse(data);
   
  return data;
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
  
}

/******************************************************************************/


function isSieveElse(data)
{
  if (data.toLowerCase().indexOf("else") == 0)
    return true;
  
  return false;
}

function SieveElse() 
{
  this.block = new SieveBlock();
  this.whiteSpace = new SieveDeadCode();

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

function SieveHashComment() 
{
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

SieveHashComment.prototype.toString
    = function ()
{
  return "#"+this.text+"\r\n";
}

SieveHashComment.prototype.toXUL
    = function ()
{
  
}


/******************************************************************************/


function SieveRequire() 
{
  this.whiteSpace 
    = new Array(new SieveDeadCode(),
                new SieveDeadCode());  
  this.strings = new SieveStringList();
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
  
}

/******************************************************************************/

/*function isSieveFileInto(data)
{
  if (data.toLowerCase().indexOf("fileinto") == 0)
    return true;

  return false;
}*/

function SieveFileInto() 
{
  this.whiteSpace 
    = new Array(new SieveDeadCode(),
                new SieveDeadCode());  
  this.string = new SieveString();
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

function SieveWhiteSpace() 
{
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

SieveWhiteSpace.prototype.toString
    = function ()
{
  return this.whiteSpace;
}

SieveWhiteSpace.prototype.toXUL
    = function ()
{
  // whitespaces do nothing in xul 
}

/******************************************************************************/

/*function isSieveDiscard(data)
{
  if (data.toLowerCase().indexOf("discard") == 0)
    return true;
  
  return false;
}*/

function SieveDiscard() 
{
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

SieveDiscard.prototype.toXUL
    = function ()
{
  
}

//***************************************

function SieveRedirect(data) 
{
  this.whiteSpace 
    = new Array(new SieveDeadCode(),
                new SieveDeadCode());  
  this.address = new SieveString();  
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
  
}

/******************************************************************************/

function SieveReject() 
{
  this.whiteSpace 
    = new Array(new SieveDeadCode(),
                new SieveDeadCode());  
  this.reason = new SieveString();
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

function SieveStop() 
{
  this.whiteSpace = new SieveDeadCode();
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

SieveStop.prototype.toString
    = function ()
{
  return stop
    + this.whiteSpace.toString()+";";
}

SieveStop.prototype.toXUL
    = function ()
{
  
}

//********************************************

function SieveKeep() 
{
  this.whiteSpace = new SieveDeadCode();
}

SieveKeep.prototype.parse
    = function (data)
{
  data = data.slice("keep".length);
  
  data = this.whiteSpace.parse(data);

  // ... and finally remove the semicolon;
  if (isSieveSemicolon(data) == false)
    throw "Syntaxerror: keep - Semicolon expected";
    
  return data.slice(1);
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
  
}
/******************************************************************************/

  // compatators legen den zeichensatz fest, z.B. nur kleinschreibung
  // oder nur großbuchstaben etc ...  
  // sieve untsersützt i;octet and i;ascii-casemap
  // Header comparisons are always done with the "i;ascii-casemap" operator, i.e., case-insensitive
  // -> i;octet ~> case  sensitive...

function isSieveComparator(data,index)
{
  if (index == null)
    index = 0;
    
  var token = data.substr(index,11).toLowerCase();
  if (token.indexOf(":comparator") == 0)
    return true;
  
  return false;
}

function SieveComparator()
{
  this.whiteSpace = new SieveDeadCode();
  this.comparator = new SieveQuotedString();
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

SieveComparator.prototype.toString
    = function ()
{
  return ":comparator"
    +this.whiteSpace.toString()
    +this.comparator.toString();
}

SieveComparator.prototype.toXul
    = function ()
{
  
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

function SieveMatchType()
{
  this.type = "";
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

SieveMatchType.prototype.toString
    = function ()
{
  if (this.type == null)
    return "";
    
  return ":"+this.type;
}

SieveMatchType.prototype.toXul
    = function ()
{
  
}
/******************************************************************************/

function SieveHeaderTest() 
{
  this.whiteSpace 
    = new Array(new SieveDeadCode(),
                new SieveDeadCode(),
                new SieveDeadCode(),
                new SieveDeadCode(),                
                new SieveDeadCode());
  this.options = new Array(null,null);
  this.headerNames = new SieveStringList();
  this.keyList = new SieveStringList();
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
    var element = new SieveComparator();
    data = element.parse(data);
    this.options[0] = element;
    
    data = this.whiteSpace[1].parse(data)
    
    if (isSieveMatchType(data))
    {
      element = new SieveMatchType();
      data = element.parse(data);
      this.options[1] = element;
    }
  }  
  else if (isSieveMatchType(data))
  {
    var element = new SieveMatchType();
    data = element.parse(data);
    this.options[0] = element;
    
    data = this.whiteSpace[1].parse(data)

    if (isSieveComparator(data))
    {
      element = new SieveComparator();
      data = element.parse(data);
      this.options[1] = element;
    }
  }
  data = this.whiteSpace[2].parse(data);  
  data = this.headerNames.parse(data);
  
  data = this.whiteSpace[3].parse(data);
  
  data = this.keyList.parse(data)
  
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

SieveHeaderTest.prototype.toXul
    = function ()
{
  
}
/******************************************************************************/

function SieveSizeTest() 
{
  // first line with deadcode
  this.whiteSpace 
    = new Array(new SieveDeadCode(),
                new SieveDeadCode(),
                new SieveDeadCode());
  
  this.over = false;
  this.size = new SieveNumber();
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
  
}

/******************************************************************************/

function SieveExistsTest() 
{
  // first line with deadcode
  this.whiteSpace 
    = new Array(new SieveDeadCode(),
                new SieveDeadCode());
  
  this.headerNames = new SieveStringList();
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
  
}

/******************************************************************************/

function SieveAnyOfTest() 
{
  // first line with deadcode
  this.whiteSpace 
    = new Array(new SieveDeadCode(),
                new SieveDeadCode());
  
  this.testList = new SieveTestList();
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
  
}
/******************************************************************************/

function SieveAllOfTest() 
{
  // first line with deadcode
  this.whiteSpace 
    = new Array(new SieveDeadCode(),
                new SieveDeadCode());
  
  this.testList = new SieveTestList();
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
  
}






/******************************************************************************/
function isSieveTest (data, index)
{  
  if (index == null)
    index = 0;
    
  var token = data.substr(index,10).toLowerCase();

  if (token.indexOf("not") == 0)
    return true;  
  if (token.indexOf("address") == 0)
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

// a block can only follow afer an if, elsif, or else

function isSieveBlock(data,index)
{
  if (index == null)
    index = 0;
    
  if (data.charAt(index) == "{")
    return true;
    
  return false;
}

function SieveBlock()
{
  this.elements = new Array();
}

SieveBlock.prototype.parse
    = function (data)
{
  if (isSieveBlock(data) == false)
    throw " \"{\" expected";
    
  // remove the "/*"
  data = data.slice(1);
  
  var parser = new SieveElementParser(data);
  
  while (parser.hasMoreElements())
  {
    this.elements.push(parser.extract())
  }
  
  data = parser.getData();    
  
  if (data.charAt(0) != "}")
    throw " \"}\" expected";

  // remove the }
  data = data.slice(1);  
  return data;
}

SieveBlock.prototype.toString
    = function ()
{    
  var cmd = "{";
  
  for (var i = 0;i<this.elements.length; i++)
  {    
    cmd += this.elements[i].toString();
  }
  cmd += "}";
  
  return cmd;
}

SieveBlock.prototype.toXUL
    = function ()
{
  
}

/******************************************************************************/

function isSieveAction(data, index)
{  
  if (index == null)
    index = 0;
    
  var token = data.substr(index,10).toLowerCase();
  
  if (token.indexOf("discard") == 0)
    return true;    
  if (token.indexOf("require") == 0)
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
    
  return false
}

function SieveActionParser(data)
{
  this.data = data;
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
    element = new SieveDiscard(); 
  else if (token.indexOf("require") == 0)
    element = new SieveRequire();
  else if (token.indexOf("keep") == 0)
    element = new SieveKeep();
  else if (token.indexOf("stop") == 0)
    element = new SieveStop();
  else if (token.indexOf("redirect") == 0)    
    element = new SieveRedirect();
  else if (token.indexOf("vacation") == 0)
    element = new SieveVaction();
  else if (token.indexOf("fileinto") == 0)
    element = new SieveFileInto();
  else if (token.indexOf("reject") == 0)
    element = new SieveReject();

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

function SieveDeadCode()
{
  this.elements = new Array();
}

SieveDeadCode.prototype.parse
    = function(data)
{
  while(true)
  {
    var element = null;
    
    if (isSieveWhiteSpace(data))
      element = new SieveWhiteSpace();
    else if (isSieveBracketComment(data))
      element = new SieveBracketComment();
    else if (isSieveHashComment(data))
      element = new SieveHashComment();
    else
      return data;
    
    data = element.parse(data);
    this.elements.push(element);
  }
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
    
SieveDeadCode.prototype.toXul
    = function()
{
      
}

/******************************************************************************/

function isSieveElement(data,index)
{
  if (index == null)
    index = 0;
    
  if (isSieveAction(data,index))
    return true;
  if (isSieveDeadCode(data,index))
    return true;
  if (isSieveCondition(data,index))
    return true;
  
  return false;
}

function SieveElementParser(data)
{
  this.data = data;
}

SieveElementParser.prototype.hasMoreElements
   = function()
{
  return isSieveElement(this.data);
}

SieveElementParser.prototype.extract
    = function()
{
  var element = null;
  
  if (isSieveAction(this.data))
  {
    var parser = new SieveActionParser(this.data);
    element = parser.extract();
    this.data = parser.getData();
  }
  else if (isSieveDeadCode(this.data))
  {
    element = new SieveDeadCode();
    this.data = element.parse(this.data);
  }
  else if (isSieveCondition(this.data))
  {
    element = new SieveCondition();
    this.data = element.parse(this.data);
  }
  else
    throw "Syntax error, unknown command"    

  return element;
}

SieveElementParser.prototype.getData
    = function()
{
  return this.data;
}