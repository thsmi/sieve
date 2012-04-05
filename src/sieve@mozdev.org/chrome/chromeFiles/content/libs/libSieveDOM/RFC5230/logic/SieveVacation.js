/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */
 
 "use strict";

function SieveVacation(docshell,id) 
{
  SieveAbstractElement.call(this,docshell,id); 
  this.semicolon = this._createByName("atom/semicolon");
  
  // Optional Parameters
}

SieveVacation.prototype.__proto__ = SieveAbstractElement.prototype;

SieveVacation.isElement
     = function (token)
{
  return (token.substring(0,8).toLowerCase().indexOf("vacation") == 0);  
}

SieveVacation.prototype.initTags
    = function (data)
{
    
  while (data[0] == ":")
  {
    if (data.substring(":days".length).toLowerCase() == ":days")
    {
      data = data.slice(":days".length);
    
      this._days[0] = this._createByName("whitespace");    
      this._days[1] = this._createByName("number");
      this._days[2] = this._createByName("whitespace");
    
      data = this._days[0].init(data);
      data = this._days[1].init(data);
      data = this._days[2].init(data);
    
      continue;
    }
    
    if (data.substring(":subject".length).toLowerCase() == ":subject")
    {
      data = data.slice(":subject".length);
    
      this._subject[0] = this._createByName("whitespace");    
      this._subject[1] = this._createByName("subject");
      this._subject[2] = this._createByName("whitespace");
    
      data = this._subject[0].init(data);
      data = this._subject[1].init(data);
      data = this._subject[2].init(data);
    
      continue;
    }  
  
  switch (data)
  {
      
    case ":from" :
      this._from = []
      this._from[0] = this._createByName("whitespace");
      this._from[1] = this._createByName("string");
      this._from[2] = this._createByName("whitespace");
      
      continue;
    
    case ":address":
      this._address = []
      this._address[0] = this._createByName("whitespace");
      this._address[1] = this._createByName("string");
      this._address[2] = this._createByName("whitespace");
      
      continue;
      
    case ":mime":
      this._mime = this._createByName("whitespace");
      
      continue
      
    case ":handle":
      this._handle = []
      this._handle[0] = this._createByName("whitespace");
      this._handle[1] = this._createByName("string");
      this._handle[2] = this._createByName("whitespace");
      
      continue;
  }
}

SieveVacation.prototype.init
    = function (data)
{
  // Syntax :
  // <"discard"> <";">
  
  data = data.slice("vacation".length);
  
  
 
  // parse whitespace
  data = initTags(data);    

  
  data = this.semicolon.init(data);
  
  
    
  return data;  
}

SieveVacation.prototype.toScript
    = function ()
{
  return "vacation"
    + this.semicolon.toScript();  
}
