SieveCondition.isCondition
  = function(data)
{ 
  return true;
}


function SieveCondition(id)
{  
  this.id = id;
  this.tests = [];
  
  this.block = SieveLexer.createByName("block/body");
  
  this.ws = [];
  this.ws[0] = SieveLexer.createByName("deadcode");
}

SieveCondition.prototype.hasCondition
  = function (data)
{
  if (this.tests.length > 0)
    return true;
    
  return false;
}

SieveCondition.prototype.init
  = function (data)
{
  // ... remove the deadcode ...
  data = this.ws[0].init(data);  
    
  if (SieveLexer.probeByClass(["test"],data))
  {
    var elm = SieveLexer.createByClass(["test"],data)
    data = elm.init(data);
    this.tests.push(elm);
  
    // ... eat again the deadcode ...
    if (SieveLexer.probeByName("deadcode",data))
    {
      var elm = SieveLexer.createByName("deadcode");
      data = elm.init(data);  
      this.tests.push(elm);
    }
  }
  
  if (data.charAt(0) != "{")  
    throw "{ expected... before:"+data;
  
  data = data.slice(1);
  
  data = this.block.init(data);

  if (data.charAt(0) != "}")  
    throw "} expected...";

  data = data.slice(1);

  if (SieveLexer.probeByName("deadcode",data))
  {
    this.ws[1] = SieveLexer.createByName("deadcode");
    data = this.ws[1].init(data);  
  } 
    
  return data;  
}

SieveCondition.prototype.toString
  = function ()
{
  var str = this.ws[0].toString(); 
  
  for (var i=0; i<this.tests.length;i++)
    str += this.tests[i].toString();  
  
  str+="{"+this.block+"}";
  
  if (this.ws[1])
    str+=this.ws[1].toString();  
 
  return str;  
}

SieveCondition.prototype.toElement
  = function ()
{  
    
  var elm = document.createElement("vbox");

  for (var i=1; i<this.tests.length;i++)
    elm.appendChild(document.createTextNode(this.tests[i].toString()));
    
  elm.appendChild(this.block.toElement());

  return elm;
}

SieveIf.isIf
  = function(data)
{
  if (data.toLowerCase().indexOf("if") == 0)
    return true;
  
  return false;
}

function SieveIf(id) 
{
  this.id = id;
  this.elements = new Array();
}

/*
 if header :contains "from" "coyote" {
    discard;
 } elsif header :contains ["subject"] ["$$$"] {
    discard;
 } else {
    fileinto "INBOX";
 }
 */

SieveIf.prototype.init
    = function (data)
{
  // Syntax :
  // <"if"> <test> <block>
  // <"elsif"> <test> <block>  
  // <"else"> <block>

  // remove the "if"...
  data = data.slice(2);
    
  var element = SieveLexer.createByName("conditions/condition");
  data = element.init(data);
  this.elements.push(element);
  
  // now read the elsif block...
  while (data.substr(0,5).toLowerCase().indexOf("elsif") == 0)
  {
    // remove the elsif...
    data = data.slice(5);
    
    element = SieveLexer.createByName("conditions/condition");
    data = element.init(data);
    this.elements.push(element);        
  }
   
  if (data.substr(0,5).toLowerCase().indexOf("else") == 0)
  {
    data = data.slice(4);
    
    element = SieveLexer.createByName("conditions/condition");
    data = element.init(data);
    this.elements.push(element); 
  }
  
  return data;
}

SieveIf.prototype.getID
    = function ()
{
  return this.id;
}

SieveIf.prototype.toString
    = function ()
{  
  var str = "if"+this.elements[0].toString();
   
  for (var i=1; i<this.elements.length;i++)
  {
    if (this.elements[i].hasCondition())
      str += "elsif"
    else 
      str += "else" 
      
    str += this.elements[i].toString();
  }
  
  return str;     
}

SieveIf.prototype.toElement
    = function ()
{  
  var elm = document.createElement("vbox");
  
  var box = document.createElement("vbox");
  box.appendChild(document.createTextNode(" >> If <<"));
  elm.appendChild(box);
  
  elm.appendChild(this.elements[0].toElement());
  
  for (var i=1; i<this.elements.length;i++)
  {
    if (this.elements[i].hasCondition())
    {
      var box = document.createElement("vbox");
      box.appendChild(document.createTextNode(" >> ELSE IF <<"));
      elm.appendChild(box);
    }
    else
    {
      var box = document.createElement("vbox");
      box.appendChild(document.createTextNode(" >> ELSE <<"));
      elm.appendChild(box);
    }    

    elm.appendChild(this.elements[i].toElement());
  }
  
  return elm;    
}

if (!SieveLexer)
  throw "Could not register Conditional Elements";

with (SieveLexer)
{  
  register("conditions/","conditions/condition",
      function(token) {return SieveCondition.isCondition(token)}, 
      function(id) {return new SieveCondition(id)});
      
  register("conditions","conditions/if",
      function(token) {return SieveIf.isIf(token)}, 
      function(id) {return new SieveIf(id)});
}