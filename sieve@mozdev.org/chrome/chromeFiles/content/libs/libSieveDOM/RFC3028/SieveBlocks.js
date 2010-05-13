
// Blocks should handle Messages addChild / RemoveChild boubling...

 
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
  return SieveLexer.probeByClass(["import","deadcode"],data);
}

// PUBLIC:
SieveBlockImport.prototype.init
    = function (data)    
{
  // The import section consists of require and deadcode statments...
  while (SieveLexer.probeByClass(["import","deadcode"],data))
  {
    var elm = SieveLexer.createByClass(["import","deadcode"],data);    
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

/******************************************************************************/

function SieveBlockBody(id)
{
  this.id = id;
  this.elms = [];  
}

// PUBLIC STATIC:
SieveBlockBody.isBlockBody
    = function (data)
{
  return SieveLexer.probeByClass(["action","conditions","deadcode"],data);
}

// PUBLIC:
SieveBlockBody.prototype.init
    = function (data)    
{
  while (SieveLexer.probeByClass(["action","conditions","deadcode"],data))
  {
    var elm = SieveLexer.createByClass(["action","conditions","deadcode"],data);    
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
    = function (child,elm)
{
  if (!child)
  {
    this.elms[this.elms.length] = elm; 
    return [];
  }
 
  for (var i=0; i<this.elms.length; i++)
  {
    if (this.elms[i].id == child)
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
    return this.onInsertBefore(message.child,message.elm)
  
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

// //TODO move to ovn classfile...
//  with flavour -> sieve/action, sieve/test etc...
function createDropTarget(parentId,id)
{
      var dropTarget = document.createElement("vbox");
      dropTarget.className ="SieveDropTarget";
      dropTarget.addEventListener("dragenter", 
        function (event) {
          // TODO Create Real Drop indecator...
          if (event.dataTransfer.mozGetDataAt('sieve/action',0))
            event.target.style.backgroundColor="red"; 
        },
        true);
        
      dropTarget.addEventListener("dragexit",
        function (event) {
          if (event.dataTransfer.mozGetDataAt('sieve/action',0))
            event.target.style.backgroundColor= null;
        },
        true);
        
      dropTarget.addEventListener("dragover",
        function (event) { 
          if (! event.dataTransfer.mozGetDataAt('sieve/action',0))
            return

          event.stopPropagation(); 
          event.preventDefault();
        },
        true);
        
      dropTarget.addEventListener("dragdrop",
        function (event) {
          if (!event.dataTransfer.mozGetDataAt('sieve/action',0))
            return; 

          event.stopPropagation();
          
          event.target.style.backgroundColor= null;
          
          // use an type attribute instead of className...
          var node = event.target;
          while (node && (node.className != "SieveDropTarget"))
            node = node.parentNode;
          
          // user drops element the droptarget which contains to the draged element
          if (node == event.dataTransfer.mozGetDataAt('sieve/action',1))
            return;

          event.dataTransfer.mozGetDataAt('sieve/action',1).parentNode
              .removeChild(event.dataTransfer.mozGetDataAt('sieve/action',1));
             
          node.parentNode.insertBefore(
            createDropTarget(parentId,id)
            //event.dataTransfer.mozGetDataAt('sieve/action',1)
            ,node);
          // TODO recreate drop traeget as it caches the parent id
          node.parentNode.insertBefore(
            event.dataTransfer.mozGetDataAt('sieve/action',0)
            ,node);            
           
           // TODO ID should be an object which contains a namespace...
           // ... inorder to retrieve a SieveDom... 
           var elm = dom.removeElement(
             event.dataTransfer.mozGetDataAt('sieve/action',2));
             
           if (!elm)
             throw "No Element found";
           // -1 means append to end...
           dom.addElement(parentId,elm,id);
           
        },
        true);
        
      return dropTarget;
}

if (!SieveLexer)
  throw "Could not register Block Elements";

with (SieveLexer)
{
  register("block/","block/import",
      function(token) {return SieveBlockImport.isBlockImport(token)}, 
      function(id) {return new SieveBlockImport(id)});
      
  register("block/","block/body",
      function(token) {return SieveBlockBody.isBlockBody(token)}, 
      function(id) {return new SieveBlockBody(id)});      
}