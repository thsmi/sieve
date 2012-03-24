/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

 "use strict";
  
//****************************************************************************//

//<envelope> [COMPARATOR] [ADDRESS-PART] [MATCH-TYPE] 
//  <envelope-part: string-list> <key-list: string-list>
   
function SieveEnvelope(docshell,id) 
{
  SieveAbstractElement.call(this,docshell,id);
  
  this.whiteSpace = [];
  this.whiteSpace[0] = this._createByName("whitespace"," ");
  this.whiteSpace[1] = this._createByName("whitespace"," ");
  this.whiteSpace[2] = this._createByName("whitespace"," ");
  this.whiteSpace[3] = this._createByName("whitespace"," ");
  this.whiteSpace[4] = this._createByName("whitespace"," ");
  this.whiteSpace[5] = this._createByName("whitespace"," ");
  
  this.addressPart = this._createByName("address-part");
  this.matchType = this._createByName("match-type");
  this.comparator = this._createByName("comparator")  
  
  this.envelopeList = this._createByName("stringlist");
  this.keyList = this._createByName("stringlist");
}

SieveEnvelope.prototype.__proto__ = SieveAbstractElement.prototype;

SieveEnvelope.isElement
  = function(parser)
{ 
  return parser.startsWith("envelope");
}

SieveEnvelope.prototype.init
    = function (parser)
{
  parser.extract("envelope");
  this.whiteSpace[0].init(parser);
  
  while (true)
  {
    if (this.addressPart.isOptional() && this._probeByName("address-part",parser))
    {
      this.addressPart.init(parser)
      this.whiteSpace[1].init(parser);
      
      continue;
    }
    
    if (this.comparator.isOptional() && this._probeByName("comparator",parser))
    {
      this.comparator.init(parser);
      this.whiteSpace[2].init(parser);
      
      continue;
    }
    
    if (this.matchType.isOptional() && this._probeByName("match-type",parser))
    {
      this.matchType.init(parser);      
      this.whiteSpace[3].init(parser);
      
      continue;
    }
    
    break;    
  }
  
  this.envelopeList.init(parser);
  
  this.whiteSpace[4].init(parser);
  
  this.keyList.init(parser);
    
  this.whiteSpace[5].init(parser);
  
  return this;
}    

SieveEnvelope.prototype.require
    = function (requires)
{
  requires["envelope"] = true;
}

SieveEnvelope.prototype.toScript
    = function ()
{
  return "envelope"
    + this.whiteSpace[0].toScript()
    + this.addressPart.toScript()
    + (!this.addressPart.isOptional() ? this.whiteSpace[1].toScript() : "" )
    + this.comparator.toScript()
    + (!this.comparator.isOptional() ? this.whiteSpace[2].toScript() : "" )
    + this.matchType.toScript()
    + (!this.matchType.isOptional() ? this.whiteSpace[3].toScript(): "" )
    + this.envelopeList.toScript()
    + this.whiteSpace[4].toScript()
    + this.keyList.toScript()
    + this.whiteSpace[5].toScript();
}

SieveEnvelope.prototype.toWidget
    = function ()
{
  return (new SieveEnvelopeUI(this));  
}

/******************************************************************************/


//address [ADDRESS-PART] [COMPARATOR] [MATCH-TYPE]
//             <header-list: string-list> <key-list: string-list>

             
/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */
 
function SieveAddress(docshell,id)
{
  SieveAbstractElement.call(this,docshell,id); 
  
  this.options = new Array(null,null,null);
  
  this.whiteSpace = []
  this.whiteSpace[0] = this._createByName("whitespace"," ");
  this.whiteSpace[1] = this._createByName("whitespace"," ");
  this.whiteSpace[2] = this._createByName("whitespace"," ");
  this.whiteSpace[3] = this._createByName("whitespace"," ");
  this.whiteSpace[4] = this._createByName("whitespace"," ");
  this.whiteSpace[5] = this._createByName("whitespace"," ");
                
  this.addressPart = this._createByName("address-part");
  this.matchType = this._createByName("match-type");
  this.comparator = this._createByName("comparator")
  
  this.headerList = this._createByName("stringlist","\"To\"");
  this.keyList = this._createByName("stringlist","\"me@example.com\"");
}

SieveAddress.prototype.__proto__ = SieveAbstractElement.prototype;

SieveAddress.isElement
    = function (parser)
{
  return parser.startsWith("address");
}

SieveAddress.prototype.init
    = function (parser)
{
  parser.extract("address");
  
  this.whiteSpace[0].init(parser);
  
  while (true)
  {
    if (this.addressPart.isOptional() && this._probeByName("address-part",parser))
    {
      this.addressPart.init(parser)
      this.whiteSpace[1].init(parser);
      
      continue;
    }
    
    if (this.comparator.isOptional() && this._probeByName("comparator",parser))
    {
      this.comparator.init(parser);
      this.whiteSpace[2].init(parser);
      
      continue;
    }
    
    if (this.matchType.isOptional() && this._probeByName("match-type",parser))
    {
      this.matchType.init(parser);      
      this.whiteSpace[3].init(parser);
      
      continue;
    }
    
    break;    
  }
  
  this.headerList.init(parser);
  
  this.whiteSpace[4].init(parser);
  
  this.keyList.init(parser);
    
  this.whiteSpace[5].init(parser);
  
  return this;
}    

SieveAddress.prototype.toScript
    = function ()
{
 
  return "address"
    + this.whiteSpace[0].toScript()
    + this.addressPart.toScript()
    + ((!this.addressPart.isOptional()) ? this.whiteSpace[1].toScript() : "" )
    + this.comparator.toScript()
    + ((!this.comparator.isOptional()) ? this.whiteSpace[2].toScript() : "" )
    + this.matchType.toScript()
    + ((!this.matchType.isOptional()) ? this.whiteSpace[3].toScript(): "" )
    + this.headerList.toScript()
    + this.whiteSpace[4].toScript()
    + this.keyList.toScript()
    + this.whiteSpace[5].toScript();
}

SieveAddress.prototype.toWidget
    = function ()
{
  return (new SieveAddressUI(this));
}

/******************************************************************************/

function SieveBoolean(docshell,id) 
{
  SieveAbstractElement.call(this,docshell,id);
  
  // first line with deadcode
  this.whiteSpace = this._createByName("whitespace");  
  
  this.value = false;
}

SieveBoolean.prototype.__proto__ = SieveAbstractElement.prototype;

SieveBoolean.isElement
 = function(parser)
{  
  if (parser.startsWith("true"))
    return true;
  if (parser.startsWith("false"))
    return true;
  
  return false;
}

SieveBoolean.prototype.init
    = function (parser)
{
  
  if (parser.startsWith("true"))
  {
    parser.extract("true");
    this.value = true
  }
  
  if (parser.startsWith("false"))
  {
    parser.extract("false");
    this.value = false;
  }
  
  this.whiteSpace.init(parser);
    
  return this;    
}    


SieveBoolean.prototype.toScript
    = function ()
{
  if (this.value)
    return "true"+this.whiteSpace.toScript();

  return "false"+this.whiteSpace.toScript();    
}

SieveBoolean.prototype.toWidget
    = function ()
{
  return (new SieveBooleanTestUI(this));
}

/******************************************************************************/    
function SieveSize(docshell,id) 
{
  SieveAbstractElement.call(this,docshell,id); 
  
  this.whiteSpace = [];
  this.whiteSpace[0] = this._createByName("whitespace", " ");
  this.whiteSpace[1] = this._createByName("whitespace", " ");
  this.whiteSpace[2] = this._createByName("whitespace", " ");
  
  this.over = false;
  this.size = this._createByName("number");
}

SieveSize.prototype.__proto__ = SieveAbstractElement.prototype;

SieveSize.isElement
  = function(parser)
{ 
  return parser.startsWith("size");
}

SieveSize.prototype.init
    = function (parser)
{
  // Syntax :
  // <"size"> <":over" / ":under"> <limit: number>
  
  parser.extract("size");
  
  this.whiteSpace[0].init(parser);
  
  if (parser.startsWith(":over")) 
  {
    parser.extract(":over")
    this.isOver(true);
  }
  else if (parser.startsWith(":under"))
  {
    parser.extract(":under")
    this.isOver(false);
  }
  else 
    throw "Syntaxerror, :under or :over expected";
    
  this.whiteSpace[1].init(parser);
  this.size.init(parser);
  this.whiteSpace[2].init(parser);
  
  return this;
}    

/**
 * Gets and Sets the over operator
 * @param @optional {BOOL} value
 * @return {}
 */
SieveSize.prototype.isOver
    = function (value)
{
  if (typeof(value) === "undefined")
    return this.over;
  
  if (typeof(value) === "string")
    value = ((""+value).toLowerCase() == "true")?  true: false;
  
  this.over = value;
  
  return this;
}

SieveSize.prototype.getSize
    = function ()
{
  return this.size;  
} 

SieveSize.prototype.toScript
    = function ()
{
  return "size"
    + this.whiteSpace[0].toScript()
    + ((this.isOver())?":over":":under")
    + this.whiteSpace[1].toScript()
    + this.getSize().toScript()
    + this.whiteSpace[2].toScript();
}

SieveSize.prototype.toWidget
    = function ()
{
  return (new SieveSizeTestUI(this));      
}

/******************************************************************************/
  
function SieveExists(docshell,id)
{
  SieveAbstractElement.call(this,docshell,id); 
  
  this.whiteSpace = [];
  this.whiteSpace[0] = this._createByName("whitespace",' ' );
  this.whiteSpace[1] = this._createByName("whitespace",' ');
  
  this.headerNames = this._createByName("stringlist",'"From"');
}

SieveExists.prototype.__proto__ = SieveAbstractElement.prototype;

SieveExists.isElement
  = function(parser)
{ 
  return parser.startsWith("exists");
}

SieveExists.prototype.init
    = function (parser)
{
  // Syntax :
  // <"exists"> <header-names: string-list>
  parser.extract("exists");
  
  this.whiteSpace[0].init(parser);
  
  this.headerNames.init(parser);
    
  this.whiteSpace[1].init(parser);
  
  return this;
    
}    

SieveExists.prototype.toScript
    = function ()
{
  return "exists"
    + this.whiteSpace[0].toScript()
    + this.headerNames.toScript()
    + this.whiteSpace[1].toScript();
}

SieveExists.prototype.toWidget
    = function ()
{
  return (new SieveExistsUI(this));  
}

/******************************************************************************/
    
function SieveHeader(docshell,id) 
{
  SieveAbstractElement.call(this,docshell,id); 
  
  this.whiteSpace = [];
  this.whiteSpace[0] = this._createByName("whitespace"," ");
  this.whiteSpace[1] = this._createByName("whitespace"," ");  
  this.whiteSpace[2] = this._createByName("whitespace"," ");
  this.whiteSpace[3] = this._createByName("whitespace"," ");
  this.whiteSpace[4] = this._createByName("whitespace"," ");
  
  this.headerNames = this._createByName("stringlist",'"Subject"');
  this.keyList = this._createByName("stringlist",'"Example"');
 
  this.matchType = this._createByName("match-type");
  this.comparator = this._createByName("comparator");  
  
}

SieveHeader.prototype.__proto__ = SieveAbstractElement.prototype;

SieveHeader.isElement
    = function (parser)
{
  return parser.startsWith("header");
} 

SieveHeader.prototype.init
    = function (parser)
{
  // Syntax :
  // <"header"> [COMPARATOR] [MATCH-TYPE] <header-names: string-list> <key-list: string-list>         
  parser.extract("header");
  
  this.whiteSpace[0].init(parser);
  
  // It can be [Comparator] [MATCH-TYPE] or [MATCH-TYPE] [COMPARATOR]  
  while (true)
  {
    if (this.comparator.isOptional() && this._probeByName("comparator",parser))
    {
      this.comparator.init(parser);
      this.whiteSpace[1].init(parser);
      
      continue;
    }
    
    if (this.matchType.isOptional() && this._probeByName("match-type",parser))
    {
      this.matchType.init(parser);      
      this.whiteSpace[2].init(parser);
      
      continue;
    }
    
    break;    
  }
  
  this.headerNames.init(parser);
  
  this.whiteSpace[3].init(parser);
  
  this.keyList.init(parser);
  
  this.whiteSpace[4].init(parser);
  
  return this;    
}

SieveHeader.prototype.keys
    = function(idx)
{
  if (typeof(idx) === "undefined")
    return this.keyList;  
    
  return this.keyList.item(idx);
}

SieveHeader.prototype.headers
    = function(idx)
{
  if (typeof(idx) === "undefined")
    return this.headerNames;    
    
  return this.headerNames.item(idx);
}

SieveHeader.prototype.toScript
    = function ()
{
  
  // Yes, we normalize match types...
  // ... sorry about that 
  return "header"
    + this.whiteSpace[0].toScript()
    + this.comparator.toScript()
    + (!this.comparator.isOptional() ? this.whiteSpace[1].toScript() : "" ) 
    + this.matchType.toScript()
    + (!this.matchType.isOptional() ? this.whiteSpace[2].toScript(): "" )
    + this.headerNames.toScript()    
    + this.whiteSpace[3].toScript()
    + this.keyList.toScript()
    + this.whiteSpace[4].toScript()
}

SieveHeader.prototype.toWidget
    = function ()
{  
  return (new SieveHeaderUI(this));
}


// TODO Stringlist and testslist are quite simmilar
function SieveTestList(docshell,id)
{
  SieveAbstractElement.call(this,docshell,id);
  this.tests = [];
}

SieveTestList.prototype.__proto__ = SieveAbstractElement.prototype;

SieveTestList.isElement
   = function (parser)
{
  return parser.isChar("(");
}

SieveTestList.prototype.init
    = function (parser)
{   
  this.tests = [];
  
  parser.extractChar("(");
  
  while ( ! parser.isChar(")"))
  {
    if (this.tests.length > 0)
     parser.extractChar(",");
            
    var element = [];
    
    element[0] = this._createByName("whitespace");  
    if (this._probeByName("whitespace",parser))
      element[0].init(parser);
    
    element[1] = this._createByClass(["test","operator"],parser)

    element[2] = this._createByName("whitespace");
    if (this._probeByName("whitespace",parser))
      element[2].init(parser);
        
    this.tests.push(element);
  }
  
  parser.extractChar(")");
   
  return this;
}

SieveTestList.prototype.append
    = function (elm, sibling)
{      
  var element = [];

  switch ([].concat(elm).length)
  {
    case 1 :
      element[0] = this._createByName("whitespace","\r\n");
      element[1] = elm;
      element[2] = this._createByName("whitespace");
      break;
      
    case 3 :
      element = elm;
      break;
      
    default:
      throw "Can not append element to list";
  }
        
  // we have to do this fist as there is a good chance the the index
  // might change after deleting...
  if(elm.parent())
    elm.remove();
  
  var idx = this.tests.length;
  
  if (sibling && (sibling.id() >= 0)) 
    for (var idx = 0; idx<this.tests.length; idx++)
      if (this.tests[idx][1].id() == sibling.id())
        break;
  
  this.tests.splice(idx,0,element);
  elm.parent(this);
    
  return this;
}

SieveTestList.prototype.empty
    = function ()
{
  // The direct descendants of our root node are always considered as
  // not empty. Otherwise cascaded remove would wipe them away.
  if (this.document().root() == this.parent())
    return false;
  
  for (var i=0; i<this.tests.length; i++)
    if (this.tests[i][1].widget())
      return false;
      
  return true;
}

SieveTestList.prototype.removeChild
    = function (childId,cascade,stop)
{
  // should we remove the whole node
  if (typeof (childId) === "undefined")
     throw "Child ID Missing";
    //return SieveAbstractElement.prototype.remove.call(this);
  
  // ... or just a child item
  var elm = null;
  // Is it a direct match?
  for (var i=0; i<this.tests.length; i++)
  {
    if (this.tests[i][1].id() != childId)
      continue;
    
    elm = this.tests[i][1];
    elm.parent(null);
    
    this.tests.splice(i,1);
    
    break;
  }

  if (cascade && this.empty())
    if ((!stop) || (stop.id() != this.id()))
      return this.remove(cascade,stop);
    
  if (cascade)
    return this;
    
  return elm;
}


SieveTestList.prototype.toScript
    = function()
{
  var result = "("
    
  for (var i = 0;i<this.tests.length; i++)
  {
    result = result
             + ((i>0)?",":"")
             + this.tests[i][0].toScript()
             + this.tests[i][1].toScript()
             + this.tests[i][2].toScript();    
  }
  
  result += ")";
  
  return result;  
}

SieveTestList.prototype.require
    = function (imports)
{
  for (var i=0; i<this.tests.length; i++)
    this.tests[i][1].require(imports)
}


if (!SieveLexer)
  throw "Could not register Conditional Elements";

SieveLexer.register("test","test/address",SieveAddress);
SieveLexer.register("test","test/boolean",SieveBoolean);
SieveLexer.register("test","test/envelope",SieveEnvelope);
SieveLexer.register("test","test/exists",SieveExists);  
SieveLexer.register("test","test/header",SieveHeader);
SieveLexer.register("test","test/size",SieveSize);

SieveLexer.register("test/","test/testlist",SieveTestList);
