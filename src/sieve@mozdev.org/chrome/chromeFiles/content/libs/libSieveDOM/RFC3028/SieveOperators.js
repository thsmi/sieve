function SieveOperator(id)
{
  this.id = id;
  // Do we realy need to destinguish between test and operator?
  this.tests = null;
  this.operator = null;
}

SieveOperator.isOperator
    = function (data)
{
  if (SieveLexer.probeByClass(["operator/multi"],data))
    return true;
    
  if (SieveLexer.probeByClass(["operator/single"],data))
    return true;    
    
  if (SieveLexer.probeByClass(["test"],data))
    return true;
    
  return false;  
}

SieveOperator.prototype.init
    = function (data)
{
 
  if (SieveLexer.probeByClass(["operator/multi"],data))
  {
    this.operator = SieveLexer.createByName("operator/multi",data);
    return this.operator.init(data)    
  }
  
  if (SieveLexer.probeByClass(["operator/single"],data))
  {
    this.operator = SieveLexer.createByName("operator/single",data)
    return this.operator.init(data);
  }
  
  this.test = SieveLexer.createByClass(["test"],data);
  data = this.test.init(data);
  
  return data 
}

SieveOperator.prototype.toScript
    = function ()
{
  var result = "";
  
  if (this.operator)
    result += this.operator.toScript();
  
  if (this.test)
    result += this.test.toScript();
  
  return result;   
}

SieveOperator.prototype.toWidget
    = function()
{
  
  var elm = document.createElement("vbox");
  
  if (this.operator)
  {
    elm.appendChild(
      (new SivDropTarget(this.id,this.operator)).flavours("sieve/test").getWidget());
      
    if (this.operator.toWidget)
      elm.appendChild(this.operator.toWidget())
    else
      elm.appendChild(document.createElement("description"))
          .setAttribute("value","Operator:"+this.operator.toScript());
  }
  
  if (this.test)
  {
    elm.appendChild(
      (new SivDropTarget(this.id,this.test)).flavours("sieve/test").getWidget());
      
    if ((this.test) && (this.test.toWidget))
      elm.appendChild(this.test.toWidget())
    else
      elm.appendChild(document.createElement("description"))
          .setAttribute("value","TEST:"+this.test.toScript());  
  }
  
  
  elm.appendChild(
    (new SivDropTarget(this.id)).flavours("sieve/test").getWidget());
     
  return elm;
}

/******************************************************************************/


SieveOperatorMulti.isOperatorMulti
  = function(token)
{
  if ( token.substring(0,5).toLowerCase().indexOf("allof") == 0)
    return true;
    
  if ( token.substring(0,5).toLowerCase().indexOf("anyof") == 0)
    return true;
    
  return false;
}

function SieveOperatorMulti(id) 
{
  this.id = id;  
  this.whiteSpace = SieveLexer.createByName("whitespace");    
}

SieveOperatorMulti.prototype.init
    = function (data)
{
  // Syntax :
  // <"allof"> <tests: test-list>
  this.tests = [];
  
  // TODO move the operator to own class...
  if ("allof" != data.substring(0,5).toLowerCase())
    this.isAllOf = true;
  else if ("anyof" != data.substring(0,5).toLowerCase())
    this.isAllOf = false;
  else
    throw "allof expected but found: \n"+data.substr(0,50)+"...";   
  
  data = data.slice(5);  
  data = this.whiteSpace.init(data);
   
  // Parse Testlist    
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
    
    if (SieveLexer.probeByName("operator",data))
      element[1] = SieveLexer.createByName("operator",data)
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

SieveOperatorMulti.prototype.toScript
    = function ()
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

SieveOperatorMulti.prototype.toWidget
    = function ()
{
  var elm = document.createElement("vbox");
  elm.setAttribute("flex","1");
  elm.className = "SivElementBlock";
  
  elm.appendChild(document.createElement("description"))
        .setAttribute("value",(this.isAll)?"all":"any"+" of the following Arguments:");
          
  for (var i=0;i<this.tests.length;i++)
  {
    elm.appendChild(
      (new SivDropTarget(this.id,this.tests[i][1])).flavours("sieve/test").getWidget());
    
    if (this.tests[i][1].toWidget)
      elm.appendChild(this.tests[i][1].toWidget())
    else
      elm.appendChild(document.createElement("description"))
        .setAttribute("value","Multi Arguments:"+this.tests[i][1].toScript());
  }
  
  elm.appendChild((new SivDropTarget(this.id)).flavours("sieve/test").getWidget());
  
  return elm; 
}
/******************************************************************************/

SieveOperatorSingle.isOperatorSingle
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
  this.test = SieveLexer.createByName("operator");
}

SieveOperatorSingle.prototype.init
    = function (data)
{
  // Syntax :
  // <"not"> <tests: test-list>
  
  data = data.slice("not".length);  
  data = this.whiteSpace[0].init(data);  
    
  if (SieveLexer.probeByName("operator",data) == false) 
    throw "Test command expected but found:\n'"+data.substr(0,50)+"'...";                 

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
    (new SivDropTarget(this.id,this.test)).flavours("sieve/test").getWidget());
    
  if (this.test.toWidget)
    elm.appendChild(this.test.toWidget())
  else
    elm.appendChild(document.createElement("description"))
        .setAttribute("value","Simple Arguments:"+this.test.toScript());
  
  elm.appendChild(
    (new SivDropTarget(this.id)).flavours("sieve/test").getWidget());
  
  return elm;   
}

//****************************************************************************//

if (!SieveLexer)
  throw "Could not register Conditional Elements";

SieveLexer.register("operator/multi","operator/multi",
      function(token) {return SieveOperatorMulti.isOperatorMulti(token)}, 
      function(id) {return new SieveOperatorMulti(id)});
            
SieveLexer.register("operator/single","operator/single",
      function(token) {return SieveOperatorSingle.isOperatorSingle(token)}, 
      function(id) {return new SieveOperatorSingle(id)}); 
      
SieveLexer.register("operator","operator",
      function(token) { return SieveOperator.isOperator(token)},
      function(id) {return new SieveOperator(id)});