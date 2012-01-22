/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */


function SieveAbstractElement(id)
{
  if (!id)
    throw new "Invalid id";
    
  this.id = id;
}

SieveAbstractElement.prototype.init 
    = function (data)
{
  throw "Implement init() for "+this.id;      
}

SieveAbstractElement.prototype.toScript
    = function ()
{
  throw "Implement toScript() for "+this.id;
}

SieveAbstractElement.prototype.toWidget
    = function ()
{
  return null;     
}

SieveAbstractElement.prototype.append
    = function (parentId,elm,childId)
{
  return false;
}

SieveAbstractElement.prototype.remove
    = function (childId)
{
  return null;
}


try {
  

  
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

SieveDom.prototype.toScript
    = function ()
{
  return ""+this.blkRequire.toScript() + this.blkBody.toScript();
}

SieveDom.prototype.getWidget
    = function ()
{  
  return $(document.createElement("div"))
            .append(this.blkBody.toWidget());  
}

SieveDom.prototype.move
    = function (id,parentId,siblingId)
{
  return this.append(parentId,this.remove(id),siblingId);
}

/**
 * 
 * @param {} parentId
 * @param {} elm
 * @param {} id
 *   insert before element with id, pass null to append at end.
 */
SieveDom.prototype.append
    = function (parentId,elm,siblingId)
{
  if (!elm)
    throw "invalid element";
    
  if (this.blkBody.append(parentId,elm,siblingId))
    return true;
    
  return this.blkRequire.append(parentId,elm,siblingId);
}

SieveDom.prototype.remove
    = function (id)
{
  var elm = this.blkBody.remove(id);
  
  if (elm)
    return elm;
      
  return this.blkRequire.remove(id);  
}


}
catch (ex)
{
  alert(""+ex)
}
