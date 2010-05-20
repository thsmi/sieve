/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */
 
 
function SieveCondition(id)
{  
  this.id = id;
  this.test = null;
  
  this.block = SieveLexer.createByName("block/body");
  
  this.ws = [];
  this.ws[0] = SieveLexer.createByName("whitespace");
  this.ws[1] = SieveLexer.createByName("whitespace");
  this.ws[2] = SieveLexer.createByName("whitespace");
}

SieveCondition.prototype.hasCondition
  = function (data)
{
  if (this.test)
    return true;
    
  return false;
}

SieveCondition.prototype.init
  = function (data)
{
  // ... remove the deadcode ...
  data = this.ws[0].init(data);  

  // else blocks don't have a test...
  if ( SieveLexer.probeByClass(["test"],data))
  {
    this.test = SieveLexer.createByClass(["test"],data);
    data = this.test.init(data);
    
    // ... eat again the deadcode ...
    if (SieveLexer.probeByName("whitespace",data))
      data = this.ws[1].init(data);
  }
  
  if (data.charAt(0) != "{")
    throw "{ expected but found: \n"+data.substr(0,50)+"...";  
  
  data = data.slice(1);
  
  data = this.block.init(data);

  if (data.charAt(0) != "}")
    throw "} expected but found: \n"+data.substr(0,50)+"...";  

  data = data.slice(1);

  if (SieveLexer.probeByName("whitespace",data))
    data = this.ws[2].init(data);  
    
  return data;  
}

SieveCondition.prototype.toString
  = function ()
{
  var str = this.ws[0].toString();
  
  if (this.test)  
    str += this.test.toString() + this.ws[1].toString();      
  
  str += "{"+this.block+"}";
  
  str += this.ws[2].toString();  
 
  return str;  
}

SieveCondition.prototype.toElement
  = function ()
{  
    
  var elm = document.createElement("vbox");
  
  if (this.test)
  {
    var desc = document.createElement("description");
    desc.setAttribute("value","Test:"+this.test.toString());
    elm.appendChild(desc);
  }
    
  elm.appendChild(this.block.toElement());

  return elm;
}

SieveCondition.prototype.onBouble
    = function (type,message)
{
  var rv = [];
  
  rv = rv.concat(this.block.onBouble(type,message));
  
  /*for (var i=0; i<this.tests.length; i++) 
    if (this.tests[i].onBouble)
      rv = rv.concat(this.tests[i].onBouble(type,message));*/
      
  return rv;
}


function SieveIf(id) 
{
  this.id = id;
  this.elements = new Array();
  
  this.elements[0] = SieveLexer.createByName("conditions/condition"); 
  this.elements[0].init(" false {\r\n}\r\n")
}

SieveIf.prototype.init
    = function (data)
{
  // Syntax :
  // <"if"> <test> <block>
  // <"elsif"> <test> <block>  
  // <"else"> <block>

  this.elements = [];
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
  elm.setAttribute("flex","1");
  
  var desc = document.createElement("description");
  desc.setAttribute("value",">>>If<<<");
  elm.appendChild(desc);
  
  /*var box = document.createElement("vbox");
  box.appendChild(document.createTextNode(" >> If <<"));
  elm.appendChild(box);*/
  
  elm.appendChild(this.elements[0].toElement());
  
  for (var i=1; i<this.elements.length;i++)
  {
    if (this.elements[i].hasCondition())
    {
      var desc = document.createElement("description");
      desc.setAttribute("value",">>>ELSE IF<<<");
      elm.appendChild(desc);      
      /*var box = document.createElement("vbox");
      box.appendChild(document.createTextNode(" >> ELSE IF <<"));
      elm.appendChild(box);*/
    }
    else
    {
      var desc = document.createElement("description");
      desc.setAttribute("value",">>>ELSE<<<");
      elm.appendChild(desc);
      
      /*var box = document.createElement("vbox");
      box.appendChild(document.createTextNode(" >> ELSE <<"));
      elm.appendChild(box);*/
    }    

    elm.appendChild(this.elements[i].toElement());
  }
  
  var box = createDragBox(this.id);
  box.appendChild(elm);
  
  return box;    
}

SieveIf.prototype.onBouble
    = function (type,message)
{
  var rv = [];
  
  for (var i=0; i<this.elements.length; i++) 
    if (this.elements[i].onBouble)
      rv = rv.concat(this.elements[i].onBouble(type,message));
      
  return rv;
}

if (!SieveLexer)
  throw "Could not register Conditional Elements";

with (SieveLexer)
{  
  register("conditions/","conditions/condition",
      function(token) {return true }, 
      function(id) {return new SieveCondition(id)});
      
  register("conditions","conditions/if",
      function(token) {
        return (token.substring(0,2).toLowerCase().indexOf("if") == 0)}, 
      function(id) {return new SieveIf(id)});
}
