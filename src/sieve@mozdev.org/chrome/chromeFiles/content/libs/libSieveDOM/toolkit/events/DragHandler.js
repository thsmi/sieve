function SieveDragHandler(flavour)
{
  if (typeof(flavour) != "undefined")
    this._flavour = flavour;
}

SieveDragHandler.prototype._owner = null;
SieveDragHandler.prototype._flavour = "sieve/action";

SieveDragHandler.prototype.flavour
    = function (flavour)
{
  if (typeof(flavour) === 'undefined' )
    return this._flavour;
  
  this._flavour = flavour;
  
  return this;
}

SieveDragHandler.prototype.onDragGesture
    = function(event)
{    
  
  if (!this.onDrag)
    return false;
    
  if (!this.onDrag(event.originalEvent))
    return false;
                        
  event = event.originalEvent;
  
  event.dataTransfer.setDragImage(this.owner().html().get(0),
    event.pageX-this.owner().html().offset().left,
    event.pageY-this.owner().html().offset().top);
  //event.preventDefault();
  event.stopPropagation();

  return true;   
}

SieveDragHandler.prototype.document
    = function()
{
  if (!this._owner)
    throw "Owner for this Drop Handler";
    
  return this._owner.document();
}

SieveDragHandler.prototype.bind
    = function (owner)
{
  this._owner = owner;
}

SieveDragHandler.prototype.owner
   = function (owner)
{
  return this._owner;    
}

SieveDragHandler.prototype.attach
    = function (html)
{
  var _this = this;
     
  html.attr("sivtype",this.flavour())
    .attr("draggable","true")
    .bind("dragstart",function(e) { _this.onDragGesture(e); return true;})
    .bind("dragend", function (e) {  return false; });    
}

//****************************************************************************//

function SieveMoveDragHandler(flavour)
{ 
  SieveDragHandler.call(this,flavour);
}

SieveMoveDragHandler.prototype.__proto__ = SieveDragHandler.prototype;

SieveMoveDragHandler.prototype.onDrag
    = function(event)
{  
  // FIXME: test/plain is interpreted as link if an exception occures during drag an drop
  //event.dataTransfer.mozSetDataAt("text/plain",""+this.getSieve().toScript(),0);
  event.dataTransfer.mozSetDataAt("application/sieve",""+this.owner().getSieve().toScript(),0);
  event.dataTransfer.mozSetDataAt(this.flavour(), 
    { id: this.owner().id(), action:"move"},0);
    
  return true;
}

//****************************************************************************//

function SieveCreateDragHandler(flavour)
{
  SieveDragHandler.call(this,flavour);
}

SieveCreateDragHandler.prototype.__proto__ = SieveDragHandler.prototype;

SieveCreateDragHandler.prototype.onDrag
    = function(event)
{
  // TODO: Fix me
  //event.dataTransfer.mozSetDataAt("text/plain",""+this.getSieve().toScript(),0)
  event.dataTransfer.mozSetDataAt("application/sieve",this.owner().toScript(),0);
  event.dataTransfer.mozSetDataAt(this.flavour(), 
    { type: this.owner()._elmType, action:"create"} ,0);
    
  return true;
}



