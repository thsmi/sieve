/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

// TODO rename to SieveContentSection

 // Inherrit from DragBox
function SieveBlockBody(id)
{
  SieveAbstractElement.call(this,id);
  
  // Initialize Block Elements
  this.elms = [];
}

SieveBlockBody.prototype.__proto__ = SieveAbstractElement.prototype;

SieveBlockBody.isElement
    = function (data)
{
  return SieveLexer.probeByClass(["action","conditions","whitespace"],data);  
}

SieveBlockBody.prototype.init
    = function (data)    
{
  while (SieveLexer.probeByClass(["action","conditions","whitespace"],data))
  {
    var elm = SieveLexer.createByClass(["action","conditions","whitespace"],data);    
    data = elm.init(data);
    
    this.elms.push(elm);    
  }
 
  return data;
}

SieveBlockBody.prototype.children
    = function (idx)
{
  if (typeof(idx) === "undefined")
    return this.elms;  
    
  return this.elms[idx];
}

SieveBlockBody.prototype.toScript
    = function ()
{
  var str ="";

  for (var key in this.elms)
    str += this.elms[key].toScript();
    
  return str;
}

SieveBlockBody.prototype.toWidget
    = function ()
{
  return (new SieveBlockUI(this)).getWidget();
}

SieveBlockBody.prototype.append
    = function (parentId, elm, siblingId)
{
  // crawl throug all child elements
  if (parentId != this.id)
  {
    for (var i=0; i<this.elms.length; i++)
      if (this.elms[i].append(parentId,elm,siblingId))
        return true;

    return false;
  }
  
  // the id matches, so we have to do the work
  if ((!siblingId) || (siblingId < 0))
  {
    this.elms[this.elms.length] = elm; 
    return true;
  }
 
  for (var i=0; i<this.elms.length; i++)
  {
    if (this.elms[i].id != siblingId)
      continue;
    
    this.elms.splice(i,0,elm);
    return true;
  }
  
  // we did not manage to add the element...
  return false;
}

SieveBlockBody.prototype.remove
    = function (childId)
{
  var elm = null;
  // Is it a direct match?
  for (var i=0; i<this.elms.length; i++)
  {
    if (this.elms[i].id != childId)
      continue;
    
    elm = this.elms[i];
    this.elms.splice(i,1);
    
    return elm;
  }
    
  // ... ok we have to crawl through all child nodes.
  elm = null;
  
  for (var i=0; i<this.elms.length; i++)
  {
    elm = this.elms[i].remove(childId);
    
    if (elm)
      break;
  }

  return elm;
}

if (!SieveLexer)
  throw "Could not register Block Elements";

SieveLexer.register2("block/","block/body",SieveBlockBody);
