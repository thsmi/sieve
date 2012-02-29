/******************************************************************************/

// Unary operators
SieveOperatorSingle.isElement
  = function(token)
{ 
  if (token.substring(0,3).toLowerCase().indexOf("not") == 0)
    return true;

  return false;
}

function SieveOperatorSingle(docshell,id) 
{
  // first line with deadcode
  SieveAbstractElement.call(this,docshell,id);
  
  this.whiteSpace = []
  this.whiteSpace[0] = this._createByName("whitespace");
  this.whiteSpace[1] = this._createByName("whitespace");
 // this.test = this._createByName("operator");
}

SieveOperatorSingle.prototype.__proto__ = SieveAbstractElement.prototype;

SieveOperatorSingle.prototype.init
    = function (data)
{
  // Syntax :
  // <"not"> <tests: test-list>
  
  data = data.slice("not".length);  
  data = this.whiteSpace[0].init(data);  
    
  if (this._probeByClass(["test"],data) == false) 
    throw "Test command expected but found:\n'"+data.substr(0,50)+"'...";                 

  this.test = this._createByClass(["test"],data)
  data = this.test.init(data);
    
  if (this._probeByName("whitespace",data))
    data = this.whiteSpace[1].init(data);  
  
  return data;
    
}    

SieveOperatorSingle.prototype.toScript
    = function ()
{
  return "not"
    + this.whiteSpace[0].toScript()
    + this.test.toScript()
    + this.whiteSpace[1].toScript();
}

SieveOperatorSingle.prototype.toWidget
    = function()
{
  var elm = $("<div/>");
  
  elm.text("does not match:");
          
  elm.append(
    (new SieveDropBoxUI(this,this.test))/*.flavours("sieve/test")*/.html());
    

  elm.append(this.test.html())
  
  elm.append(
    (new SieveDropBoxUI(this))/*.flavours("sieve/test")*/.html());
  
  return elm;   
}


//****************************************************************************//

if (!SieveLexer)
  throw "Could not register Conditional Elements";


SieveLexer.register("test","test/not",SieveOperatorSingle);
            
