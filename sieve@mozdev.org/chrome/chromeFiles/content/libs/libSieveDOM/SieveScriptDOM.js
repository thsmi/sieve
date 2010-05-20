/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

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