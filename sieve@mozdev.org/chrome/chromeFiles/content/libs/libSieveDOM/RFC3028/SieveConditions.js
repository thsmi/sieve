SieveCondition.isCondition
  = function(data)
{ 
  return true;
}


function SieveCondition(id)
{
  //this.predicate
  
  //this.alternative // condition+statements -> test+block  
  
  this.id = id;
  this.tests = [];
  this.elms = [];
  this.ws = "";
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
  var elm = SieveLexer.createByName("deadcode",data);
  data = elm.init(data);  
  this.elms.push(elm);
    
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
  
  while (SieveLexer.probeByClass(["action","conditions","deadcode"],data))
  {
    var elm = SieveLexer.createByClass(["action","conditions","deadcode"],data);
    data = elm.init(data);
    
    this.elms.push(elm);
  }

  if (data.charAt(0) != "}")  
    throw "} expected...";

  data = data.slice(1);

  if (SieveLexer.probeByName("deadcode",data))
  {
    this.ws = SieveLexer.createByName("deadcode");
    data = this.ws.init(data);  
  } 
    
  return data;  
}

SieveCondition.prototype.toString
  = function ()
{
  var str = this.elms[0].toString(); 
  
  for (var i=0; i<this.tests.length;i++)
    str += this.tests[i].toString();  
  
  str+="{";
  
  for (var i=1; i<this.elms.length;i++)
    str += this.elms[i].toString();

  str+="}"+this.ws.toString();  
 
  return str;  
}

SieveCondition.prototype.toXUL
  = function ()
{  
  var str = "<html:div class='SieveCon'>"
  
  for (var i=1; i<this.tests.length;i++)
    str += this.tests[i].toXUL();
  
  str += "</html:div>";
  
  str += "<html:div class='SieveCon2'>";
  for (var i=1; i<this.elms.length;i++)
    str += this.elms[i].toXUL();

  str += "</html:div>";
  return str; 
    /*+ this.element[1].toXUL()
    + " then"
    + this.element[3].toXUL();*/ 
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

SieveIf.prototype.toXUL
    = function ()
{
  var str = "<html:div class='SieveCondition'>";
  
 
  str +="<html:div class='SieveIf'>If Message"+this.elements[0].toXUL()+"</html:div>";
  
  for (var i=1; i<this.elements.length;i++)
  {
    
    if (this.elements[i].hasCondition())
      str +="<html:div class='SieveElseIf'> Else If "+this.elements[i].toXUL()+"</html:div>";
    else 
      str +="<html:div class='SieveElse'> Else"+this.elements[i].toXUL()+"</html:div>";
  }
  
  str +="</html:div>";
  
  return str;    
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