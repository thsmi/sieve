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

(function(exports) {
 
 /*   MATCH-TYPE =/ COUNT / VALUE

   relational-match = DQUOTE
           ("gt" / "ge" / "lt" / "le" / "eq" / "ne") DQUOTE
           ; "gt" means "greater than", the C operator ">".
           ; "ge" means "greater than or equal", the C operator ">=".
           ; "lt" means "less than", the C operator "<".
           ; "le" means "less than or equal", the C operator "<=".
           ; "eq" means "equal to", the C operator "==".
           ; "ne" means "not equal to", the C operator "!=".
  */
  
  function SieveRelationalMatch(docshell, id) {
    SieveAbstractElement.call(this, docshell, id);	
    
    this._whitespace = this._createByName("whitespace"," ");
    this._operator = this._createByName("string/quoted",'"eq"');
  }
  
  SieveRelationalMatch.prototype = Object.create(SieveAbstractElement.prototype);
  SieveRelationalMatch.prototype.constructor = SieveRelationalMatch;
  
  
  SieveRelationalMatch.prototype.require
      = function (imports)
  {
    imports["relational"] = true;
  }
  
  SieveRelationalMatch.prototype.init
      = function (parser)
  {  
  	this._whitespace.init(parser);
  	this._operator.init(parser);
  	 

  	if (["gt","ge","lt","le","eq","ne"].indexOf(this._operator.value()) == -1 )
  	  throw "Relational operator expected";
  	  	 	
    return this;
  }
  
  SieveRelationalMatch.prototype.toScript
      = function ()
  {    
    return ""+this._whitespace.toScript()+this._operator.toScript();
  }
  	
 ///////////////////

  
  /* VALUE = ":value" relational-match */
  
  /**
   * The value match type does a relational comparison between strings
   */
  function SieveValueMatch(docshell, id) {
    SieveRelationalMatch.call(this, docshell, id);	
  }
  
  SieveValueMatch.prototype = Object.create(SieveRelationalMatch.prototype);
  SieveValueMatch.prototype.constructor = SieveValueMatch;
  
  SieveValueMatch.nodeName = function () {
    return "match-type/value";
  }
  
  SieveValueMatch.nodeType  = function () {
    return "match-type/";
  }
  
  SieveValueMatch.isElement
      = function (parser, lexer)
  {    
    if (parser.startsWith(":value"))
      return true;
    
    return false;
  }
  
  SieveValueMatch.isCapable
      = function (capabilities)
  {
    return (capabilities["relational"] == true);      
  }  
  
  SieveValueMatch.prototype.init
      = function (parser)
  {  
    parser.extract(":value");
    
    SieveRelationalMatch.prototype.init.call(this, parser);
    
    return this;
  }

  SieveValueMatch.prototype.toScript
      = function ()
  {    
    return ":value"
      + SieveRelationalMatch.prototype.toScript.call(this);
  }  
	

  /**
   * The count match type determins the number of the specified entities in the 
   * message and then does a relational comparison of numbers of entities 
   * 
   * Count should only be used with a numeric comparator.
   */
  function SieveCountMatch(docshell, id) {
    SieveRelationalMatch.call(this, docshell, id);	
  }
  
  SieveCountMatch.prototype = Object.create(SieveRelationalMatch.prototype);
  SieveCountMatch.prototype.constructor = SieveCountMatch;
  
  SieveCountMatch.nodeName = function () {
    return "match-type/count";
  }
  
  SieveCountMatch.nodeType  = function () {
    return "match-type/";
  }
  
  SieveCountMatch.isElement
      = function (parser, lexer)
  {    
    if (parser.startsWith(":count"))
      return true;
    
    return false;
  }
  
  SieveCountMatch.isCapable
      = function (capabilities)
  {
    return (capabilities["relational"] == true);      
  }
  
  SieveCountMatch.prototype.init
      = function (parser)
  {  
    parser.extract(":count");
    
    SieveRelationalMatch.prototype.init.call(this, parser);
    
    return this;
  }
  
  SieveCountMatch.prototype.toScript
      = function ()
  {    
    return ":count"
      + SieveRelationalMatch.prototype.toScript.call(this);
  }  


  // extends RelationalMatch

  if (!SieveLexer)
    throw "Could not register MatchTypes";

  SieveLexer.register(SieveCountMatch);
  SieveLexer.register(SieveValueMatch);

})(window);
