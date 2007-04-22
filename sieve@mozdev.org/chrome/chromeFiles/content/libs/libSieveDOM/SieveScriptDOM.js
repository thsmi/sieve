/*
 * This file OOP aproach to parse the Sieve Script Language.
 */



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

function isSieveElement(data, index)
{  
  if (index == null)
    index = 0;
    
  if (SieveAction.isAction(data,index))
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
    
    if (SieveAction.isAction(data))
    {
      var parser = new SieveAction(data,id);
      element = parser.extract();

      data = parser.getData();

    }
    else if (SieveDeadCode.isDeadCode(data))
    {
      element = new SieveDeadCode(id);
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
  // the sieve syntax prohibits single \n and \r
  // they have to be converted to \r\n
  
  // convert all \r\n to \r ...
  data = data.replace(/\r\n/g,"\r");
  // ... now convert all \n to \r ...
  data = data.replace(/\n/g,"\r");  
  // ... finally convert all \r to \r\n
  data = data.replace(/\r/g,"\r\n");

  var r = 0;
  var n = 0;
  for (var i=0; i< data.length; i++)
  {
    if (data.charCodeAt(i) == "\r".charCodeAt(0))
      r++;
    if (data.charCodeAt(i) == "\n".charCodeAt(0))
      n++;
  }
  if (n != r)
   alert("Something went terribly wrong. The linebreaks are mixed up...\n");
  
  // requires are only valid if they are
  // before any other sieve command!
  
  
  var isImportSection = true;
  
  while (true)
  {
    var id = this.id+"_"+this.elements.length;
    var element = null;

    if (SieveDeadCode.isDeadCode(data))
    {
      element = new SieveDeadCode(id);
    }
    else if (isSieveElement(data))
    {
      element = new SieveElement(id);
      isImportSection = false;
    }
    else if (SieveRequire.isRequire(data))
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
  id = id.split("_");

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