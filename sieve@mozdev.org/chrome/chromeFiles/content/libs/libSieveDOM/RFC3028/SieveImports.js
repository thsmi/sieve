/******************************************************************************/

SieveRequire.isRequire
  = function (data, index)
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
  
  this.whiteSpace = SieveLexer.createByName("whitespace");
  this.semicolon = SieveLexer.createByName("atom/semicolon");
  
  this.strings = SieveLexer.createByName("stringlist");    
}

SieveRequire.prototype.init
    = function (data)
{
  // Syntax :
  // <"require"> <stringlist> <";">
  
  // remove the "require" identifier ...
  data = data.slice("require".length);

  // ... eat the deadcode before the stringlist...
  data = this.whiteSpace.init(data);
    
  // ... extract the stringlist...
  data = this.strings.init(data);
  
  data = this.semicolon.init(data);
    
  return data;
}

SieveRequire.prototype.toString
    = function ()
{
  return "require"
    + this.whiteSpace.toString()
    + this.strings.toString()
    + this.semicolon.toString();
}


// CONSTRUCTOR:
function SieveBlockImport(id)
{
  this.id = id
  this.elms = [];  
}

// PUBLIC STATIC:
SieveBlockImport.isBlockImport
    = function (data)
{
  return SieveLexer.probeByClass(["import/","whitespace"],data);
}

// PUBLIC:
SieveBlockImport.prototype.init
    = function (data)    
{  
  // The import section consists of require and deadcode statments...
  while (SieveLexer.probeByClass(["import/","whitespace"],data))
  {
    var elm = SieveLexer.createByClass(["import/","whitespace"],data);    
    data = elm.init(data);
    
    this.elms.push(elm);    
  }
 
  return data;
}

SieveBlockImport.prototype.toString
    = function ()
{
  var str ="";
  
  for (var key in this.elms)
    str += this.elms[key].toString();
    
  return str;
}

SieveBlockImport.prototype.onBouble
    = function (type,message)
{   
  var rv = []
  for (var i=0; i<this.elms.length; i++) 
    if (this.elms[i].onBouble)
      rv=rv.concat(this.elms[i].onBouble(type,message));
      
  return rv;
}

if (!SieveLexer)
  throw "Could not register Import Elements";

with (SieveLexer)
{
  register("import","import",
      function(token) {return SieveBlockImport.isBlockImport(token)}, 
      function(id) {return new SieveBlockImport(id)});
      
  register("import/","import/require",
      function(token) {return SieveRequire.isRequire(token)},
      function(id) {return new SieveRequire(id)});               
}