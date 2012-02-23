/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */
 
 "use strict";

function SieveRequire(docshell,id) 
{
  SieveAbstractElement.call(this,docshell,id);
  
  this.whiteSpace = this._createByName("whitespace");
  this.semicolon = this._createByName("atom/semicolon");
  
  this.strings = this._createByName("stringlist");    
}

SieveRequire.prototype.__proto__ = SieveAbstractElement.prototype;

SieveRequire.isElement
  = function (token)
{
  return (token.substr(0,7).toLowerCase().indexOf("require") == 0); 
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

SieveRequire.prototype.toScript
    = function ()
{
  return "require"
    + this.whiteSpace.toScript()
    + this.strings.toScript()
    + this.semicolon.toScript();
}


// CONSTRUCTOR:
function SieveBlockImport(docshell,id)
{
  SieveBlockBody.call(this,docshell,id);
  this.elms = [];  
}

SieveBlockImport.prototype.__proto__ = SieveBlockBody.prototype;

// PUBLIC STATIC:
SieveBlockImport.isElement
    = function (data)
{
  return SieveLexer.probeByClass(["import/","whitespace"],data);  
}

// PUBLIC:
SieveBlockImport.prototype.init
    = function (data)    
{  
  // The import section consists of require and deadcode statments...
  while (this._probeByClass(["import/","whitespace"],data))
  {
    var elm = this._createByClass(["import/","whitespace"],data);    
    data = elm.init(data);
    
    this.elms.push(elm);    
  }
 
  return data;
}

SieveBlockImport.prototype.toWidget
    = function ()
{
  // override the inherited toWidget function...
  return null;
}

if (!SieveLexer)
  throw "Could not register Import Elements";


SieveLexer.register("import","import",SieveBlockImport);
SieveLexer.register("import/","import/require",SieveRequire);
      