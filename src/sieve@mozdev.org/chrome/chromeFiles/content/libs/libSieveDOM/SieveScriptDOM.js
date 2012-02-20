/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

"use strict";

function SieveDom()
{
  SieveBlockBody.call(this,-1);
  
  this.elms[0] = this._createByName("import");
  this.elms[1] = this._createByName("block/body");
}

SieveDom.prototype.__proto__ = SieveBlockBody.prototype;

SieveDom.prototype.init
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
  if (this._probeByName("import",data))
    data = this.elms[0].init(data);

  // After the import section only deadcode and actions are valid    
  if (this._probeByName("block/body",data))
    data = this.elms[1].init(data);      
  
  if (data.length != 0)
    alert("Parser error!"+data);
  // data should be empty right here...
  return data;
}

SieveDom.prototype.toScript
    = function ()
{
  return ""+this.elms[0].toScript() + this.elms[1].toScript();
}

SieveDom.prototype.getWidget
    = function ()
{  
  return $(document.createElement("div"))
            .append(this.elms[1].widget());  
}

SieveDom.prototype.getRequires
    = function ()
{
  var requires = {};
  
  this.require(requires);
  
  for (var i in requires)
    alert(i);  
}
    


