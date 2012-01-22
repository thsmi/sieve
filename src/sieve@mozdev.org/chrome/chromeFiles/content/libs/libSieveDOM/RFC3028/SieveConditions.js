/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

//TODO  rename if to conditional action...


 
function SieveCondition(id)
{  
  SieveAbstractElement.call(this,id); 
  this.test = null;
  
  this.block = SieveLexer.createByName("block/body");
  
  this.ws = [];
  this.ws[0] = SieveLexer.createByName("whitespace");
  this.ws[1] = SieveLexer.createByName("whitespace");
  this.ws[2] = SieveLexer.createByName("whitespace");
  
  
}

SieveCondition.prototype.__proto__ = SieveAbstractElement.prototype;

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
  if ( SieveLexer.probeByName("operator",data))
  {
    this.test = SieveLexer.createByName("operator");
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

SieveCondition.prototype.toScript
  = function ()
{
  var str = this.ws[0].toScript();
  
  if (this.test)  
    str += this.test.toScript() + this.ws[1].toScript();      
  
  str += "{"+this.block.toScript()+"}";
  
  str += this.ws[2].toScript();  
 
  return str;  
}

SieveCondition.prototype.toWidget
  = function ()
{              
  var elm = $(document.createElement("div"));
  
  if (this.test)
  {
    // TODO this.test should be some kind of an array...
    // ... allof anyof
    // droptarget -> insert allofanyof
    // test
    // droptarget -> insertallofanyof
    if (this.test.toWidget)
      elm.append(this.test.toWidget());
    else
      elm.text(this.test.toScript())
  }
    
  elm.append(this.block.toWidget());

  return elm;
}


SieveCondition.prototype.append
  = function (parentId,elm,childId)
{
  if (parentId == this.id)
    throw "Impelemnt me";
    
  // XXX: remove me append should always exist
  if (this.test.append)
    if (this.test.append(parentId,elm,childId))
      return true;
  
  return this.block.append(parentId,elm,childId)
}

SieveCondition.prototype.remove
  = function (childId)
{      
  // It's most likely one of our block elements..
  var elm = this.block.remove(childId);
  
  if (elm)
    return elm;
    
  // ... obviously not, so try the test...
  if (!this.test)
    return null;
    
   // XXX: remove me "remove" should always exist
  if (this.test.id == childId)
  {
    elm = this.test;
    this.test = null;
    return elm;    
  }
  
  if (this.test.remove)
    return this.test.remove(childId);
  
  return null;
}


function SieveIf(id) 
{
  SieveBlockBody.call(this,id);
  
  this.elms[0] = SieveLexer.createByName("conditions/condition"); 
  this.elms[0].init(" false {\r\n}\r\n")
}

SieveIf.prototype.__proto__ = SieveBlockBody.prototype;

SieveIf.prototype.init
    = function (data)
{
  // Syntax :
  // <"if"> <test> <block>
  // <"elsif"> <test> <block>  
  // <"else"> <block>

  this.elms = [];
  // remove the "if"...
  data = data.slice(2);
    
  var element = SieveLexer.createByName("conditions/condition");
  data = element.init(data);
  this.elms.push(element);
  
  // now read the elsif block...
  while (data.substr(0,5).toLowerCase().indexOf("elsif") == 0)
  {
    // remove the elsif...
    data = data.slice(5);
    
    element = SieveLexer.createByName("conditions/condition");
    data = element.init(data);
    this.elms.push(element);        
  }
   
  if (data.substr(0,5).toLowerCase().indexOf("else") == 0)
  {
    data = data.slice(4);
    
    element = SieveLexer.createByName("conditions/condition");
    data = element.init(data);
    this.elms.push(element); 
  }
  
  return data;
}

SieveIf.prototype.toScript
    = function ()
{  
  var str = "if"+this.elms[0].toScript();
   
  for (var i=1; i<this.elms.length;i++)
  {
    if (this.elms[i].hasCondition())
      str += "elsif"
    else 
      str += "else" 
      
    str += this.elms[i].toScript();
  }
  
  return str;     
}

SieveIf.prototype.toWidget
    = function ()
{
  return (new SieveIfUI(this)).getWidget();  
}

if (!SieveLexer)
  throw "Could not register Conditional Elements";

SieveLexer.register("conditions/","conditions/condition",
      function(token) {return true }, 
      function(id) {return new SieveCondition(id)});
      
SieveLexer.register("conditions","conditions/if",
      function(token) {
        return (token.substring(0,2).toLowerCase().indexOf("if") == 0)}, 
      function(id) {return new SieveIf(id)});
