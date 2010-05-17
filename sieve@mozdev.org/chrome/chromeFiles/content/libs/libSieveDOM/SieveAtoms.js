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


 


function SieveNumber(id)
{
  this.id = id
  this.number = "1";
  this.unit = null;
}

SieveNumber.isNumber
  = function (data,index)
{
  if (index == null)
    index = 0;
    
  if (isNaN(data.charAt(index)))
    return false;
  
  return true;
}

SieveNumber.prototype.init
    = function(data)
{
  var i
  
  for (i=0; i<data.length; i++)
  {
    if (SieveNumber.isNumber(data,i))
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


function SieveSemicolon(id) 
{
  this.id = id;
  
  this.whiteSpace = [];
  this.whiteSpace[0] = SieveLexer.createByName("whitespace");
  this.whiteSpace[1] = SieveLexer.createByName("whitespace");
}

SieveSemicolon.prototype.init
    = function (data)
{
  // Syntax :
  // [whitespace] <";"> [whitespace]
  if (SieveLexer.probeByName("whitespace",data))
    data = this.whiteSpace[0].init(data,true);

  if (data.charAt(0) != ";")
    throw "Syntaxerror: Semicolon expected";  
  data = data.slice(1);

  if (SieveLexer.probeByName("whitespace",data))
    data = this.whiteSpace[1].init(data,true);  
      
  return data;
}

SieveSemicolon.prototype.toString
    = function ()
{
  return this.whiteSpace[0].toString()+ ";" + this.whiteSpace[1].toString();
}

/******************************************************************************/

if (!SieveLexer)
  throw "Could not register Atoms";

with (SieveLexer)
{
  register("atom/","atom/semicolon",
      function(token) {return true}, 
      function(id) {return new SieveSemicolon(id)});      
}
