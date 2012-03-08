 /* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */
 
 "use strict";
 
 function SieveNumber(docshell,id)
{
  SieveAbstractElement.call(this,docshell,id);
  
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

if (!SieveLexer)
  throw "Could not register Atoms";

SieveLexer.register("number/","number",SieveNumber)