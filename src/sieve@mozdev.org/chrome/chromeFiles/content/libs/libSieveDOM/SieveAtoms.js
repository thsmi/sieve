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

SieveComparator.prototype.toScript
    = function ()
{
  return ":comparator"
    +this.whiteSpace.toScript()
    +this.comparator.toScript();
}

SieveComparator.prototype.toWidget
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

SieveMatchType.prototype.toScript
    = function ()
{
  if (this.type == null)
    return "";
    
  return ":"+this.type;
}

SieveMatchType.prototype.toWidget
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

SieveAddressPart.prototype.toScript
    = function ()
{
  if (this.part == null)
    return "";
    
  return ":"+this.part;
}

SieveAddressPart.prototype.toWidget
    = function ()
{
  return "addresspart to be implemented"
}


 
// TODO Move To SieveNumbers

function SieveNumber(id)
{
  SieveAbstractElement.call(this,id);
  
  this._number = "1";
  this._unit = "";
}

SieveNumber.isElement
    = function (data,index)
{
  if (isNaN(index))
    index = 0;
    
  return isNaN(data.charAt(index));
}

SieveNumber.prototype.__proto__ = SieveAbstractElement.prototype;

SieveNumber.prototype.init
    = function(data)
{  
  for (var i=0; i<data.length; i++)
    if (isNaN(data.charAt(i)))
      break;

  this._number = data.slice(0,i)
  data = data.slice(i);
  
  var ch = data.charAt(0);

  if ((ch == 'K') ||  (ch == 'M') || (ch == 'G'))
  {
    this._unit = data.slice(0,1);
    data = data.slice(1);
  }
  
  return data;
}

SieveNumber.prototype.value
  = function (number)
{
  if (typeof(number) === "undefined")
    return this._number;

  number = parseInt(number,10);
  
  if (isNaN(number))
    throw "Invalid Number";
    
  // TODO Test if number is valid...
  this._number = number;   
  return this;
}

SieveNumber.prototype.unit
  = function (unit)
{
  if (typeof(unit) === "undefined")
    return this._unit;

  if ((unit != "") && (unit != "K") && (unit != "M") && (unit != "G"))
    throw "Invalid unit mut be either K, M or G";  

  this._unit = unit;
  return this;
}

SieveNumber.prototype.toScript
    = function ()
{
  return ""+this._number+""+this._unit;
}

/******************************************************************************/


function SieveSemicolon(id) 
{
  this.id = id;
  
  this.whiteSpace = [];
  this.whiteSpace[0] = SieveLexer.createByName("whitespace");
  this.whiteSpace[1] = SieveLexer.createByName("whitespace");
  
  // If this object is uninitalized it is better to return a "\r\n" after 
  // the semicolon. This generates a much more readable code.
  
  // In case init() is called, this default settings will be overwritten...
  this.whiteSpace[1].init("\r\n",true);
}

SieveSemicolon.prototype.init
    = function (data)
{
  // Syntax :
  // [whitespace] <";"> [whitespace]
  if (SieveLexer.probeByName("whitespace",data))
    data = this.whiteSpace[0].init(data,true);

  if (data.charAt(0) != ";")
    throw "Semicolon expected but found: \n"+data.substr(0,50)+"...";  
  
  data = data.slice(1);

  //if (SieveLexer.probeByName("whitespace",data))
  data = this.whiteSpace[1].init(data,true);  
      
  return data;
}

SieveSemicolon.prototype.toScript
    = function ()
{
  return this.whiteSpace[0].toScript()+ ";" + this.whiteSpace[1].toScript();
}

/******************************************************************************/

if (!SieveLexer)
  throw "Could not register Atoms";

SieveLexer.register2("atom/","atom/number",SieveNumber)
SieveLexer.register("atom/","atom/semicolon",
      function(token) {return true}, 
      function(id) {return new SieveSemicolon(id)});
