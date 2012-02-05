function SieveUnaryTest()
{
  
}

// It might be better to rename it to testlist
function SieveMultaryTest(id)
{
  SieveAbstractElement.call(this,id);
  this.tests = [];  
}

SieveMultaryTest.prototype.__proto__ = SieveAbstractElement.prototype;

SieveMultaryTest.prototype.init
    = function (data)
{    
  if (data.charAt(0) != "(")
    throw "Test list expected but found:\n'"+data.substr(0,50)+"'...";
    
  data = data.slice(1);
    
  while (data.charAt(0) != ")")
  {
    if (data.charAt(0) == ",")
      data = data.slice(1);
            
    var element = [];
    
    element[0] = SieveLexer.createByName("whitespace");  
    if (SieveLexer.probeByName("whitespace",data))
      data = element[0].init(data);
    
    if (SieveLexer.probeByClass(["test"],data))
      element[1] = SieveLexer.createByClass(["test"],data)
    else
      throw "Test command expected but found:\n'"+data.substr(0,50)+"'...";        

    data = element[1].init(data);
    
    element[2] = SieveLexer.createByName("whitespace");
    if (SieveLexer.probeByName("whitespace",data))
      data = element[2].init(data);
        
    this.tests.push(element);
  }
  
  data = data.slice(1);
   
  return data;
}

//****************************************************************************/
function SieveAnyOfAllOfTest(id)
{
  SieveMultaryTest.call(this,id);  
  this.whiteSpace = SieveLexer.createByName("whitespace");
}

SieveAnyOfAllOfTest.prototype.__proto__ = SieveMultaryTest.prototype;

SieveAnyOfAllOfTest.isElement
   = function (token)
{
  if ( token.substring(0,5).toLowerCase().indexOf("allof") == 0)
    return true;
    
  if ( token.substring(0,5).toLowerCase().indexOf("anyof") == 0)
    return true;
    
  return false;
}

SieveAnyOfAllOfTest.prototype.init
    = function (data)
{
  // TODO move the operator to own class...
  if ("allof" != data.substring(0,5).toLowerCase())
    this.isAllOf = true;
  else if ("anyof" != data.substring(0,5).toLowerCase())
    this.isAllOf = false;
  else
    throw "allof expected but found: \n"+data.substr(0,50)+"...";
    
  data = data.slice(5);  
  data = this.whiteSpace.init(data);
  
  data = SieveMultaryTest.prototype.init.call(this,data);
  
  return data;
}

SieveAnyOfAllOfTest.prototype.toScript
    = function()
{
  var result = (this.isAllOf?"allof":"anyof");
  
  result += this.whiteSpace.toScript();
  
  var separator = "(";
    
  for (var i = 0;i<this.tests.length; i++)
  {
    result = result
             + separator
             + this.tests[i][0].toScript()
             + this.tests[i][1].toScript()
             + this.tests[i][2].toScript();
             
    separator = ",";
  }
  
  result += ")";
  
  return result;  
}

SieveAnyOfAllOfTest.prototype.toWidget
    = function ()
{
  return $("<div/>").text(this.toScript());
}
    

/******************************************************************************/

// Unary operators
SieveOperatorSingle.isElement
  = function(token)
{ 
  if (token.substring(0,3).toLowerCase().indexOf("not") == 0)
    return true;

  return false;
}

function SieveOperatorSingle(id) 
{
  // first line with deadcode
  this.id = id;
  
  this.whiteSpace = []
  this.whiteSpace[0] = SieveLexer.createByName("whitespace");
  this.whiteSpace[1] = SieveLexer.createByName("whitespace");
 // this.test = SieveLexer.createByName("operator");
}

SieveOperatorSingle.prototype.init
    = function (data)
{
  // Syntax :
  // <"not"> <tests: test-list>
  
  data = data.slice("not".length);  
  data = this.whiteSpace[0].init(data);  
    
  if (SieveLexer.probeByClass(["test"],data) == false) 
    throw "Test command expected but found:\n'"+data.substr(0,50)+"'...";                 

  this.test = SieveLexer.createByClass(["test"],data)
  data = this.test.init(data);
    
  if (SieveLexer.probeByName("whitespace",data))
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
  var elm = document.createElement("vbox");
  elm.setAttribute("flex","1");
  elm.className = "SivElementBlock";
  
  elm.appendChild(document.createElement("description"))
        .setAttribute("value"," the following Argument does not match");
          
  elm.appendChild(
    (new SivDropTarget(this.id,this.test))/*.flavours("sieve/test")*/.getWidget());
    
  if (this.test.toWidget)
    elm.appendChild(this.test.toWidget())
  else
    elm.appendChild(document.createElement("description"))
        .setAttribute("value","Simple Arguments:"+this.test.toScript());
  
  elm.appendChild(
    (new SivDropTarget(this.id))/*.flavours("sieve/test")*/.getWidget());
  
  return elm;   
}

//****************************************************************************//

if (!SieveLexer)
  throw "Could not register Conditional Elements";

SieveLexer.register2("test","test/anyof",SieveAnyOfAllOfTest);
SieveLexer.register2("test","test/not",SieveOperatorSingle);
            
/*SieveLexer.register("operator/single","operator/single",
      function(token) {return SieveOperatorSingle.isOperatorSingle(token)}, 
      function(id) {return new SieveOperatorSingle(id)}); */
      
/*SieveLexer.register("operator","operator",
      function(token) { return SieveOperator.isOperator(token)},
      function(id) {return new SieveOperator(id)});*/