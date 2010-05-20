// TODO add listeners for callsbacks...
// ... convert to xbl

// TODO add logic to dragbox for switching between editing and not editing...
// XLB should work like an "deck"...
// .. deck[0] is default view
// ... stack [1] is edit view...


// TODO Add button to show selection source...

function createDragBox(id,listener)
{
  var elm = document.createElement("sivDragBox");
  elm.className ="SivElement";
  elm.setAttribute("sivOwnerId",id);
  
  return elm;
  
  
  // TODO use atrribute instead of className to distinguish elements...
/*  var elm = document.createElement("vbox");
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
  
  return elm;*/
}

// //TODO move to own classfile...
//  with flavour -> sieve/action, sieve/test etc...
// TODO Implement "accepts" list
function createDropTarget(parentId,id)
{
  var dropTarget = document.createElement("sivDropBox");
  
  if (id)
    dropTarget.setAttribute("sivSiblingId",id);
    
  dropTarget.setAttribute("sivParentId",parentId);
          
  return dropTarget;
}

// TODO create an editableBox with on apply interface ...
// it should build buttons and the box it.