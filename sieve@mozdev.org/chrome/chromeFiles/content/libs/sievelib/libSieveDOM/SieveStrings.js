/*
 * This file defines all atomar sieve elements
 */
 
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
  // TODO a single ' crashes in html -> convert it into &...; syntax
  return "<html:input type='text' value='"+this.string.getValue()+"' />";  
}

// TODO descide on update message weather it is a Multiline oder Quoted...
 
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
  
  var end = data.indexOf("\r\n.\r\n");

  if (end == -1)
    throw "Syntaxerror: Multiline String not closed, \".\\r\\n missing" ;
  
  this.text = data.slice(0,end+2);
       
  data = data.slice(end+5);
  
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
    +((this.hashComment == null)?"\r\n":this.hashComment.toString())
    +this.text
    +".\r\n";
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
        
    var element = new Array("","","");
        
    if (isSieveDeadCode(data))
    {
      element[0] = new SieveDeadCode();
      data = element[0].parse(data);
    }
      
    if (isSieveQuotedString(data) == false)
      throw "Quoted String expected";
    
    element[1] = new SieveQuotedString();
    data = element[1].parse(data);
         
      
    if (isSieveDeadCode(data))
    {
      element[2] = new SieveDeadCode();
      data = element[0].parse(data);
    }
    
    this.elements.push(element);
  }
  
}
SieveStringList.prototype.toString
    = function ()
{
  if (this.compact)
    return this.elements[0].toString();
    
  var result = "[";
  var separator = "";
  
  for (var i = 0;i<this.elements.length; i++)
  {
    result = result
             + separator
             + this.elements[i][0].toString()
             + this.elements[i][1].toString()
             + this.elements[i][2].toString();
             
    separator = ",";
  }
  result += "]";
  
  return result;    
}

SieveStringList.prototype.toXUL
    = function ()
{
  if (this.compact)
    return this.elements[0].getValue();
   
  var result = "";   
  for (var i = 0;i<this.elements.length; i++)
  {
    result += this.elements[i][1].getValue()+" | ";
  }
  
  return result; 
}
 