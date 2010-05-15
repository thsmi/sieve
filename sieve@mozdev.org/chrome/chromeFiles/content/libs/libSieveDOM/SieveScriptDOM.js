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
  this.whiteSpace = SieveLexer.createByName("whitespace");
  this.comparator = new SieveQuotedString();
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
  this.blkRequire = SieveLexer.createByName("import");
  this.blkBody = SieveLexer.createByName("block/body");
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
  if (SieveLexer.probeByName("import",data))
    data = this.blkRequire.init(data);

  // After the import section only deadcode and actions are valid    
  if (SieveLexer.probeByName("block/body",data))
    data = this.blkBody.init(data);      
  
  if (data.length != 0)
    alert("Parser error!"+data);
  // data should be empty right here...
  return data;
}

SieveDom.prototype.toString
    = function ()
{  
  return ""+this.blkRequire.toString() + this.blkBody.toString();
}

SieveDom.prototype.toXUL
    = function ()
{  
  var elm = document.createElement("vbox");
  
  // Imports are not rendered...
  //elm.appendChild(this.blkRequire);
  
  elm.appendChild(this.blkBody.toElement());

  var that = this;
  //elm.addEventListener("click",function(e){ that.boubleMessage('blur');},false );

  return elm;  
}

/**
 * 
 * @param {} parentId
 * @param {} elm
 * @param {} id
 *   insert before element with id, pass null to append at end.
 */
SieveDom.prototype.addElement
    = function (parentId,elm,id)
{
  this.boubleMessage("addElement",{parent:parentId, elm:elm, child:id})
}

SieveDom.prototype.removeElement
    = function (id)
{
  return this.boubleMessage("removeElement",{child:id})[0];  
}

/*SieveDom.prototype.sendMessage
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
}*/

// messages: 'blur', null;
// messages: 'removeElement', id : element
// messages: 'addElement', id : element
SieveDom.prototype.boubleMessage
    = function (type,message)
{
  var rv = [];
 
  rv = rv.concat(this.blkRequire.onBouble(type,message));
  rv = rv.concat(this.blkBody.onBouble(type,message));

  return rv;
}