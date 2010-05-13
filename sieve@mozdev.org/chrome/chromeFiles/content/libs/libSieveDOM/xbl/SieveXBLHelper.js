// TODO add listeners for callsbacks...
// ... convert to xbl

// Add button to show selection source...

// add logic to dragbox for switching between editing and not editing...

function createDragBox(id,listener)
{
  // TODO use atrribute instead of className to distinguish elements...
  var elm = document.createElement("vbox");
  elm.className ="SivElement";
  
  elm.addEventListener("draggesture", 
    function (event) {
      
      var node = event.target;
      
      while (node && (node.className != "SivElement"))
        node = node.parentNode;
        
      var dt = event.dataTransfer;
      
      // dragbox and action are an atomic pair...
      dt.mozSetDataAt('sieve/action',node,0);
      dt.mozSetDataAt('sieve/action',node.previousSibling,1);
      dt.mozSetDataAt('sieve/action',id,2);

      event.stopPropagation();
    },
    false);  
  
  return elm;
}

// //TODO move to ovn classfile...
//  with flavour -> sieve/action, sieve/test etc...
// TODO Implement "accepts" list
function createDropTarget(parentId,id)
{
      var dropTarget = document.createElement("vbox");   
      dropTarget.appendChild(document.createTextNode("Blubber "+id));
      
      dropTarget.className ="SieveDropTarget";
      dropTarget.addEventListener("dragenter", 
        function (event) {
          if ( ! event.dataTransfer.mozGetDataAt('sieve/action',0))
            return;
            
          var node = event.target;
          while (node && (node.className != "SieveDropTarget"))
            node = node.parentNode;
          
          node.style.backgroundColor="red";             
        },
        false);
        
      dropTarget.addEventListener("dragexit",
        function (event) {
          if ( ! event.dataTransfer.mozGetDataAt('sieve/action',0))
            return;

          var node = event.target;
          while (node && (node.className != "SieveDropTarget"))
            node = node.parentNode;
            
          node.style.backgroundColor= null;
        },
        false);
        
      dropTarget.addEventListener("dragover",
        function (event) { 
          if (! event.dataTransfer.mozGetDataAt('sieve/action',0))
            return

          event.stopPropagation(); 
          event.preventDefault();
        },
        false);
        
      dropTarget.addEventListener("dragdrop",
        function (event) {
          if (!event.dataTransfer.mozGetDataAt('sieve/action',0))
            return;          
          
          // use an type attribute instead of className...
          var node = event.target;
          while (node && (node.className != "SieveDropTarget"))
            node = node.parentNode;
            
          node.style.backgroundColor = null;
          
          // user drops element the droptarget which contains to the draged element
          if (node == event.dataTransfer.mozGetDataAt('sieve/action',1))
            return;

          /*event.dataTransfer.mozGetDataAt('sieve/action',1).parentNode
              .removeChild(event.dataTransfer.mozGetDataAt('sieve/action',1));*/
             
          node.parentNode.insertBefore(
            //createDropTarget(parentId,id)
            event.dataTransfer.mozGetDataAt('sieve/action',1)
            ,node);
          // TODO recreate drop traeget as it caches the parent id
          node.parentNode.insertBefore(
            event.dataTransfer.mozGetDataAt('sieve/action',0)
            ,node);            
           
           // TODO ID should be an object which contains a namespace...
           // ... inorder to retrieve a SieveDom... 
            
            // TODO hookup listener ...
           var elm = dom.removeElement(
             event.dataTransfer.mozGetDataAt('sieve/action',2));
           
           if (!elm)
             throw "No Element found";
           // -1 means append to end...
           dom.addElement(parentId,elm,id);
           
           event.stopPropagation();
           
        },
        false);
        
      return dropTarget;
}