/******************************************************************************/
SieveWhiteSpace.isWhiteSpace
  = function (data, index)
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

SieveWhiteSpace.prototype.init
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

SieveBracketComment.prototype.toXUL
    = function ()
{
  return ""; 
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



SieveDeadCode.isDeadCode
    = function (data, index)
{
  return SieveLexer.probeByClass(["deadcode/"],data); 
}

function SieveDeadCode(id) 
{
  this.id = id;
  this.elements = [];
}

SieveDeadCode.prototype.init
    = function (data)
{
  // After the import section only deadcode and actions are valid
  while (SieveLexer.probeByClass(["deadcode/"],data))
  {
    var elm = SieveLexer.createByClass(["deadcode/"],data,this.id+"_"+this.elements.length);
      
    data = elm.init(data);
    
    this.elements.push(elm);
  }

  return data
}

SieveDeadCode.prototype.getID
    = function ()
{
  return this.id;
}

SieveDeadCode.prototype.toString
    = function ()
{
  var result = "";
  for (var key in this.elements)
    result += this.elements[key].toString();
    
  return result;
}

SieveDeadCode.prototype.toXUL
    = function ()
{
  // this element is invisible in XUL
  return "";
}  
  

if (!SieveLexer)
  throw "Could not register DeadCode Elements";

with (SieveLexer)
{   
  register("deadcode/","deadcode/whitespace",
      function(token) {return SieveWhiteSpace.isWhiteSpace(token)}, 
      function(id) {return new SieveWhiteSpace(id)});
      
  register("deadcode/","deadcode/bracketcomment",
      function(token) {return SieveBracketComment.isBracketComment(token)}, 
      function(id) {return new SieveBracketComment(id)});  
      
  register("deadcode/","deadcode/hashcomment",
      function(token) {return SieveHashComment.isHashComment(token)},
      function(id) {return new SieveHashComment(id)});

  register("deadcode","deadcode",
      function(token) {return SieveDeadCode.isDeadCode(token)},
      function(id) {return new SieveDeadCode(id)});         
}