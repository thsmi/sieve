/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

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
      function(token) {
        return (token.substr(0,7).toLowerCase().indexOf("require") == 0); },
      function(id) {return new SieveRequire(id)});               
}