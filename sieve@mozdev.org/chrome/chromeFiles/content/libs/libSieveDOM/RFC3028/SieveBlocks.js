// TODO Implement Blocks

// Block with require no actions -> imports

// Block with actions no require -> content

// Blocks should handle Messages addChild / RemoveChild boubling...

// Block implement Drop Targets... -> Blocks position child elements

// Blocks do not implement ondragstart/ondraggesture

// blocks do not support  { } ! -> { can only be used after an condition (if/elsif/else)

 
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
  for (var i=0; i<this.elms.length; i++) 
    if (this.elms[i].onBouble)
      this.elms[i].onBouble(type,message);
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
    str += this.elms[key].toString();
    
  return str;
}

SieveBlockBody.prototype.toElement
    = function ()
{
  var elm = document.createElement("vbox");
   
  for (var i=0; i<this.elms.length;i++)
    if (this.elms[i].toElement)
    {    
      elm.appendChild(createDropTarget()); 
      elm.appendChild(this.elms[i].toElement());
    }
      
  elm.appendChild(createDropTarget());
  return elm; 
}

SieveBlockBody.prototype.onBouble
    = function (type,message)
{   
  for (var i=0; i<this.elms.length; i++) 
    if (this.elms[i].onBouble)
      this.elms[i].onBouble(type,message);
}


// //TODO move to ovn classfile...
//  with flavour -> sieve/action, sieve/test etc...
function createDropTarget()
{
      var dropTarget = document.createElement("vbox");
      dropTarget.className ="SieveDropTarget";
      dropTarget.addEventListener("dragenter", 
        function (event) {
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
          
          node.parentNode.insertBefore(
            event.dataTransfer.mozGetDataAt('sieve/action',1)
            ,node);
          node.parentNode.insertBefore(
            event.dataTransfer.mozGetDataAt('sieve/action',0)
            ,node);            
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