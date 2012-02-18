

/******************************************************************************/


 
// TODO Move To SieveNumbers

function SieveNumber(id)
{
  SieveAbstractElement.call(this,id);
  
  this._number = "1";
  this._unit = "";
}

SieveNumber.isElement
    = function (data,index)
{
  if (isNaN(index))
    index = 0;
    
  return isNaN(data.charAt(index));
}

SieveNumber.prototype.__proto__ = SieveAbstractElement.prototype;

SieveNumber.prototype.init
    = function(data)
{  
  for (var i=0; i<data.length; i++)
    if (isNaN(data.charAt(i)))
      break;

  this._number = data.slice(0,i)
  data = data.slice(i);
  
  var ch = data.charAt(0);

  if ((ch == 'K') ||  (ch == 'M') || (ch == 'G'))
  {
    this._unit = data.slice(0,1);
    data = data.slice(1);
  }
  
  return data;
}

SieveNumber.prototype.value
  = function (number)
{
  if (typeof(number) === "undefined")
    return this._number;

  number = parseInt(number,10);
  
  if (isNaN(number))
    throw "Invalid Number";
    
  // TODO Test if number is valid...
  this._number = number;   
  return this;
}

SieveNumber.prototype.unit
  = function (unit)
{
  if (typeof(unit) === "undefined")
    return this._unit;

  if ((unit != "") && (unit != "K") && (unit != "M") && (unit != "G"))
    throw "Invalid unit mut be either K, M or G";  

  this._unit = unit;
  return this;
}

SieveNumber.prototype.toScript
    = function ()
{
  return ""+this._number+""+this._unit;
}

/******************************************************************************/


function SieveSemicolon(id) 
{
  this.id = id;
  
  this.whiteSpace = [];
  this.whiteSpace[0] = SieveLexer.createByName("whitespace");
  this.whiteSpace[1] = SieveLexer.createByName("whitespace");
  
  // If this object is uninitalized it is better to return a "\r\n" after 
  // the semicolon. This generates a much more readable code.
  
  // In case init() is called, this default settings will be overwritten...
  this.whiteSpace[1].init("\r\n",true);
}

SieveSemicolon.prototype.init
    = function (data)
{
  // Syntax :
  // [whitespace] <";"> [whitespace]
  if (SieveLexer.probeByName("whitespace",data))
    data = this.whiteSpace[0].init(data,true);

  if (data.charAt(0) != ";")
    throw "Semicolon expected but found: \n"+data.substr(0,50)+"...";  
  
  data = data.slice(1);

  //if (SieveLexer.probeByName("whitespace",data))
  data = this.whiteSpace[1].init(data,true);  
      
  return data;
}

SieveSemicolon.prototype.toScript
    = function ()
{
  return this.whiteSpace[0].toScript()+ ";" + this.whiteSpace[1].toScript();
}

/******************************************************************************/

if (!SieveLexer)
  throw "Could not register Atoms";

SieveLexer.register2("atom/","atom/number",SieveNumber)
SieveLexer.register("atom/","atom/semicolon",
      function(token) {return true}, 
      function(id) {return new SieveSemicolon(id)});
