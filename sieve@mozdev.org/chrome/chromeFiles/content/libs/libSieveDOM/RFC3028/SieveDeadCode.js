// TODO rename deadcode to whitespace

// 1. Deadcode should be renamed to whitespace
//     it handles HTAB, SP, comment and CRLF

// 2. Whitespace should be renamed to deadcode
//     it handles HTABs and SP

// 3. WhiteSpaceLine
//      WhiteSpaceLine should handle HTAB, SP comments and CRLF
//      it should stop after parsing the first CRLF...


SieveLineBreak.isLineBreak
  = function (data)
{
  if (data.charAt(0) != "\r")
    return false;
    
  if (data.charAt(1) != "\n")
    return false;
  
  return true;
}

function SieveLineBreak(id)
{
  this.id = id;
}

SieveLineBreak.prototype.init
    = function (data)
{
  if (data.charAt(0) != "\r")
    throw "Linebreak expected \\r";
    
  if (data.charAt(1) != "\n")
    throw "Linebreak expected \\n";
      
  return data.slice(2);  
}

SieveLineBreak.prototype.toString
    = function ()
{
  return "\r\n";
}

/******************************************************************************/


SieveDeadCode.isDeadCode
  = function (data, index)
{
  var ch = data.charAt(0);
  
  if ((ch == " ") || (ch == "\t")) 
    return true;    
    
  return false;
}

function SieveDeadCode(id)
{
  this.id = id;
  this.whiteSpace = "";
}

SieveDeadCode.prototype.init
    = function (data)
{
  var i;
  
  for (i=0; i<data.length; i++)
  {
    var ch = data.charAt(i);
    
    if (ch == "\t")
      continue;
      
    if (ch == " ")
      continue;
      
    break;   
  }

  this.whiteSpace = data.slice(0,i);
  
  return data.slice(i);  
}

SieveDeadCode.prototype.toString
    = function ()
{
  return this.whiteSpace;
}

/******************************************************************************/

SieveBracketComment.isBracketComment
    = function (data)
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

SieveBracketComment.prototype.init
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

/******************************************************************************/

SieveHashComment.isHashComment
    = function (data, index)
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

SieveHashComment.prototype.init
    = function (data)
{  
  // is this a valid HashComment...
  if (data.charAt(0) != "#")
    throw "# expected";
  
  // ... then remove the Hash # ...
  data = data.slice(1);
    
  // ... and find the end of the comment
  var end = data.indexOf("\r\n");
  if (end == -1)
    end = data.length;
  
  this.text = data.slice(0,end);
  
  //remove the \r\n
  return data = data.slice(end+2);
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



SieveWhiteSpace.isWhiteSpace
    = function (data, index)
{
  return SieveLexer.probeByClass(["whitespace/"],data); 
}

function SieveWhiteSpace(id) 
{
  this.id = id;
  this.elements = [];
}

SieveWhiteSpace.prototype.init
    = function (data,crlf)
{

  //TODO deadcode should end at an CR/LF
  
  var isCrlf = false;
  // After the import section only deadcode and actions are valid
  while (SieveLexer.probeByClass(["whitespace/"],data))
  {
    // Check for CRLF...
    if (crlf && SieveLexer.probeByName("whitespace/linebreak",data))
      isCrlf = true;
      
    var elm = SieveLexer.createByClass(["whitespace/"],data);
      
    data = elm.init(data);
    
    this.elements.push(elm);
    
    // break if we found a CRLF
    if (isCrlf)
      break;
  }

  return data
}

SieveWhiteSpace.prototype.toString
    = function ()
{
  var result = "";
  for (var key in this.elements)
    result += this.elements[key].toString();
    
  return result;
}

if (!SieveLexer)
  throw "Could not register DeadCode Elements";

with (SieveLexer)
{
  register("whitespace/","whitespace/linebreak",
      function(token) {return SieveLineBreak.isLineBreak(token)}, 
      function(id) {return new SieveLineBreak(id)});
      
  register("whitespace/","whitespace/deadcode",
      function(token) {return SieveDeadCode.isDeadCode(token)}, 
      function(id) {return new SieveDeadCode(id)});
      
  register("whitespace/","whitespace/bracketcomment",
      function(token) {return SieveBracketComment.isBracketComment(token)}, 
      function(id) {return new SieveBracketComment(id)});  
      
  register("whitespace/","whitespace/hashcomment",
      function(token) {return SieveHashComment.isHashComment(token)},
      function(id) {return new SieveHashComment(id)});

  register("whitespace","whitespace",
      function(token) {return SieveWhiteSpace.isWhiteSpace(token)},
      function(id) {return new SieveWhiteSpace(id)});         
}