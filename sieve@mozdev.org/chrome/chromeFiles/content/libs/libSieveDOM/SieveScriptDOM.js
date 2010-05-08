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

SieveComparator.prototype.init
    = function (data)
{
  // Syntax :
  // <":comparator"> <comparator-name: string>
  
  data = data.slice(":comparator".length);
  
  data = this.whiteSpace.init(data);
  
  data = this.comparator.init(data);
  
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

SieveMatchType.prototype.init
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

SieveAddressPart.prototype.init
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
  
  // action, deadcode, import, body
 
  // The import section consists of require and deadcode statments...
  while (SieveLexer.probeByClass(["import","deadcode"],data))
  {
    var elm = SieveLexer.createByClass(["import","deadcode"],data,this.id+"_"+this.elements.length);    
    data = elm.init(data);
    
    this.elements.push(elm);    
  }
  
  // After the import section only deadcode and actions are valid
  while (SieveLexer.probeByClass(["action","conditions","deadcode"],data))
  {
    var elm = SieveLexer.createByClass(["action","conditions","deadcode"],data,this.id+"_"+this.elements.length);
    data = elm.init(data);
    
    this.elements.push(elm);
  }
  
  if (data.length != 0)
    alert("Parser error!"+data);
  // data should be empty right here...
  return data;
}

SieveDom.prototype.toString
    = function ()
{  
  var str ="";
  
  for (var key in this.elements)
    str += this.elements[key].toString();
    
  return str;
}

SieveDom.prototype.toXUL
    = function ()
{  
  var elm = document.createElement("div");
  
  for (var i=0; i<this.elements.length;i++)
    if (this.elements[i].toElement)
      elm.appendChild(this.elements[i].toElement());

  return elm;  
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