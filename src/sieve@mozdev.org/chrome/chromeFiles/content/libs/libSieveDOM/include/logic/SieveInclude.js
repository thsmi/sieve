/*
 * The contents of this file are licenced. You may obtain a copy of 
 * the license at https://github.com/thsmi/sieve/ or request it via 
 * email from the author.
 *
 * Do not remove or change this comment.
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 *      
 */
 
"use strict";
 
/**
 * The return action is similar to a stop action.
 * It stops processing the current script and returns to the parent 
 * script. In case there is no parent script it is equivalent to stop.
 *  
 * @param {} docshell
 * @param {} id
 */
function SieveReturn(docshell,id) 
{
  SieveAbstractElement.call(this,docshell,id);
  
  this.semicolon = this._createByName("atom/semicolon");  
}

SieveReturn.prototype = Object.create(SieveAbstractElement.prototype);
SieveReturn.prototype.constructor = SieveReturn;

SieveReturn.isElement = function(parser, lexer) {
  return parser.startsWith("return"); 
}

SieveReturn.nodeName = function () {
  return "action/return";     
}

SieveReturn.nodeType = function () {
  return "action";
}

SieveReturn.isCapable
    = function (capabilities)
{
  return (capabilities["include"] == true);      
}

SieveReturn.prototype.require
    = function (imports)
{
  imports["include"] = true;
}

SieveReturn.prototype.init
    = function (parser)
{
  parser.extract("return");
  
  this.semicolon.init(parser);
    
  return this; 
}    

SieveReturn.prototype.toScript
    = function ()
{
  return "return"
    + this.semicolon.toScript();
}
 
//-----------------------------------------------------------------------------

/**
 * The global keyword declares global <value: string-list>
 * 
 * @param {} docshell
 * @param {} id
 */
function SieveGlobal(docshell,id) 
{
  SieveAbstractElement.call(this,docshell,id);
  
  this._whitespace = this._createByName("whitespace"," ");
  this._values = this._createByName("stringlist", '"Example"');
  
  this._semicolon = this._createByName("atom/semicolon");  
}
 
SieveGlobal.prototype = Object.create(SieveAbstractElement.prototype);
SieveGlobal.prototype.constructor = SieveGlobal;

SieveGlobal.isElement = function(parser, lexer) {
  return parser.startsWith("global"); 
}

SieveGlobal.nodeName = function () {
  return "action/global";     
}

SieveGlobal.nodeType = function () {
  return "action";
}

SieveGlobal.isCapable
    = function (capabilities)
{
  return ((capabilities["include"] == true) && (capabilities["variables"] == true));      
}

SieveGlobal.prototype.require
    = function (imports)
{
  imports["include"] = true;
  imports["variables"] = true;
}

SieveGlobal.prototype.init
    = function (parser)
{
  parser.extract("global");
  
  this._whitespace.init(parser);  
  this._values.init(parser);  
  this._semicolon.init(parser);
    
  return this; 
}    

SieveGlobal.prototype.values
    = function () 
{
  return this._values;  
}

SieveGlobal.prototype.toScript
    = function ()
{
  return "global"
    + this._whitespace.toScript()
    + this._values.toScript()
    + this._semicolon.toScript();
}

//-----------------------------------------------------------------------------

/**
 * //  include [LOCATION] [":once"] [":optional"] <value: string>
 * //  LOCATION = ":personal" / ":global"
 * @param {} docshell
 * @param {} id
 */
function SieveInclude(docshell,id) 
{
  SieveAbstractElement.call(this,docshell,id);
  
  this._whiteSpace = [];
  this._whiteSpace[0] = this._createByName("whitespace"," ");
  this._whiteSpace[1] = this._createByName("whitespace"," ");
  this._whiteSpace[2] = this._createByName("whitespace"," ");
  this._whiteSpace[3] = this._createByName("whitespace"," ");
  
  // Optional parameters
  this._personal = true;
  this._once = false;
  
  // This is not the rfc default. But we need it as a workaround.
  // The initial sript name is hard coded to 'Example'. Without
  // the optional flag it would  most likely cause an error.
  this._optional = true;
  
  // Required
  this._script = this._createByName("string", '"Example"');
  
  this._semicolon = this._createByName("atom/semicolon"); 
  
  this._state = {};
}
 
SieveInclude.prototype = Object.create(SieveAbstractElement.prototype);
SieveInclude.prototype.constructor = SieveInclude;

SieveInclude.isElement = function(parser, lexer) {
  return parser.startsWith("include"); 
}

SieveInclude.nodeName = function () {
  return "action/include";     
}

SieveInclude.nodeType = function () {
  return "action";
}

SieveInclude.isCapable
    = function (capabilities)
{
  return (capabilities["include"] == true) ;      
}

SieveInclude.prototype.require
    = function (imports)
{
  imports["include"] = true;
}

SieveInclude.prototype.init
    = function (parser)
{
	
 //  include [LOCATION] [":once"] [":optional"] <value: string>
 //  LOCATION = ":personal" / ":global"	
	
  parser.extract("include");
  this._whiteSpace[0].init(parser);
  
  this._state = {};
  
  while (true) {
  	
  	// The location can be either personal...
  	if (parser.startsWith(":personal")) {
  		if (this._state["location"])
        throw "Location can be either personal or global but not both";
        
  		parser.extract(":personal")
  		this._personal = true;
  		
  		this._whiteSpace[1].init(parser);  		
  		this._state["location"] = true;
  		
  		continue;
  	}
  	
  	// ... or global
  	if (parser.startsWith(":global")) {
  		
  		if (this._state["location"])
  		  throw "Location can be either personal or global but not both";
  		  
  		parser.extract(":global");
  		this._personal = false;
  		
  		this._whiteSpace[1].init(parser);        		
      this._state["location"] = true;
      
      continue;  	
  	}
  	
  	if (parser.startsWith(":once")) {  	
  		  
  		parser.extract(":once");
  		this._once = true;
  		
  		this._whiteSpace[2].init(parser); 
  		this._state["once"] = true;  	
  		
  		continue;
  	}
  	
    if (parser.startsWith(":optional")) {
        
      parser.extract(":optional");
      this._optional = true;
      
      this._whiteSpace[3].init(parser); 
      this._state["optional"] = true;     
      
      continue;
    }  	
  	    
    // no more optional elements skip loop
    break;       
  }
   
  this._script.init(parser);  
  this._semicolon.init(parser);
    
  return this; 
}    

/**
 * The script name which should be included
 * @optional @param {String} script
 *   changes the current value.
 * @return {String}
 *   the currently set script name
 */
SieveInclude.prototype.script
    = function (script) 
{	
  return this._script.value(script);  
}

/**
 * Gets and/or sets if the script is personal or not
 * @optional @param {boolean} value
 *   if passed it will replace the existing state.
 *   
 * @return {boolean}
 *   true in case it's a personal script. False incase it is a global script
 */
SieveInclude.prototype.personal
    = function (value)
{
	if (typeof(value) !== "undefined")
	  this._personal = !!value;
	  
	return this._personal;    	
}

/**
 * The once flag guarantees that the script is atmost included once.
 * Subsequent include calls to the same script are silently discarded. 
 * 
 * @optional @param {boolean} value
 *   changes the current value.
 * @return {}
 *   true if the script should be included at most once, otherwise false.
 */
SieveInclude.prototype.once
    = function (value)
{
  if (typeof(value) !== "undefined")
    this._once = !!value;
    
  return this._once;
}

/**
 * By default a include throws an error if the script is not found.
 * The optional flag changes this behaviour. In case the script 
 * is missing it will be silently skipped.
 * 
 * @optional @param {boolean} value
 *   changes the current value.
 * @return {}
 *   true in case the script is optional. Otherwise false.
 */
SieveInclude.prototype.optional
    = function (value)
{
  if (typeof(value) !== "undefined")
    this._optional = !!value;
    
  return this._optional;	
}

SieveInclude.prototype.toScript
    = function ()
{
	
	// Location is special it 
		
  return "include"
    + this._whiteSpace[0].toScript()
    
    // location is a bit tricky, in case no location is specified
    // the default : personal is used.
    + ((!this._personal)? 
        ":global"+this._whiteSpace[1].toScript() : "")
    +  ((this._personal && this._state["location"])?
        ":personal"+this._whiteSpace[1].toScript() : "" )
        
    // once
    + (this._once ? 
        ":once"  + this._whiteSpace[2].toScript() : "" )
        
    // Optional
    + (this._optional ?
        ":optional" + this._whiteSpace[3].toScript() : "" )
        
    + this._script.toScript()
    + this._semicolon.toScript();
}



if (!SieveLexer)
  throw "Could not register Actions";

SieveLexer.register(SieveReturn);
SieveLexer.register(SieveGlobal);
SieveLexer.register(SieveInclude);

