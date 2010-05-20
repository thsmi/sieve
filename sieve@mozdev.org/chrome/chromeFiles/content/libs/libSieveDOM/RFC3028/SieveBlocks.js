/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */


/******************************************************************************/

function SieveBlockBody(id)
{
  this.id = id;
  this.elms = [];
}

// PUBLIC:
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

SieveBlockBody.prototype.toString
    = function ()
{
  var str ="";

  for (var key in this.elms)
    if (this.elms[key])
      str += this.elms[key].toString();
    
  return str;
}

SieveBlockBody.prototype.toElement
    = function ()
{
  var elm = document.createElement("vbox");
  elm.setAttribute("flex","1");
  elm.className = "SivElementBlock";
   
  for (var i=0; i<this.elms.length;i++)
    if (this.elms[i].toElement)
    {    
      elm.appendChild(createDropTarget(this.id,this.elms[i].id)); 
      elm.appendChild(this.elms[i].toElement());
    }
      
  elm.appendChild(createDropTarget(this.id));
   
  return elm; 
}

SieveBlockBody.prototype.onInsertBefore
    = function (elm,child)
{
  // append to end;
  if (!child)
  {
    this.elms[this.elms.length] = elm; 
    return [];
  }
 
  for (var i=0; i<this.elms.length; i++)
  {
    if (this.elms[i].id != child)
      continue;
   
    this.elms.splice(i,0,elm);
    
    return [];
  }
  
  return [];
}

SieveBlockBody.prototype.removeChild
    = function (idx)
{
  var rv = [this.elms[idx]];
  this.elms.splice(idx,1);
  
  return rv;
}

SieveBlockBody.prototype.onBouble
    = function (type,message)
{  
  if ((type == "addElement") && (message.parent == this.id))
    return this.onInsertBefore(message.elm,message.child)
  
  
  if (type == "removeElement")
    for (var i=0; i<this.elms.length; i++)
      if (this.elms[i].id == message.child)
        return this.removeChild(i);
 
  var rv = [];      
  // bouble message...        
  for (var i=0; i<this.elms.length; i++) 
    if (this.elms[i].onBouble)
      rv = rv.concat(this.elms[i].onBouble(type,message));
      
  return rv;
}



if (!SieveLexer)
  throw "Could not register Block Elements";

with (SieveLexer)
{     
  register("block/","block/body",
      function(token) {
        return SieveLexer.probeByClass(["action","conditions","whitespace"],token); }, 
      function(id) {return new SieveBlockBody(id)});      
}