//

/**
 * 
 * @param {} id
 */
function SieveAbstractElement(id)
{
  if (!id)
    throw new "Invalid id";
    
  this.id = id;
}

/**
 * 
 * @param {} data
 */
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


SieveAbstractElement.prototype.findParent
    = function (id)
{
  return null;
}

SieveAbstractElement.prototype.find
    = function (id)
{   
  return (this.id == id) ? this : null; 
}