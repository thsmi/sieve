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
 
/* global window */
 
"use strict";
 
(function(exports) {
  
  /* global SieveLexer */
  /* global SieveAbstractElement */
	
  function SieveDiscard(docshell,id) 
  {
    SieveAbstractElement.call(this,docshell,id);
    this.semicolon = this._createByName("atom/semicolon");
  }
  
  SieveDiscard.prototype = Object.create(SieveAbstractElement.prototype);
  SieveDiscard.prototype.constructor = SieveDiscard;
  
  SieveDiscard.isElement = function (parser, lexer) {
    return parser.startsWith("discard");  
  };
  
  SieveDiscard.nodeName = function () {
    return "action/discard";
  };
  
  SieveDiscard.nodeType  = function () {
    return "action";
  };
  
  SieveDiscard.prototype.init
      = function (parser)
  {
    // Syntax :
    // <"discard"> <";">
    parser.extract("discard");  
    this.semicolon.init(parser);
      
    return this;  
  };
  
  SieveDiscard.prototype.toScript
      = function ()
  {
    return "discard"
      + this.semicolon.toScript();  
  };
  
  //***************************************
  
  function SieveRedirect(docshell,id)
  {
    SieveAbstractElement.call(this,docshell,id);
    
    this.whiteSpace = this._createByName("whitespace"," ");
    this.address = this._createByName("string","\"username@example.com\""); 
    this.semicolon = this._createByName("atom/semicolon");  
  }
  
  SieveRedirect.prototype = Object.create(SieveAbstractElement.prototype);
  SieveRedirect.prototype.constructor = SieveRedirect;
  
  SieveRedirect.isElement
      = function (parser, lexer)
  {
    return parser.startsWith("redirect");
  };
  
  SieveRedirect.nodeName
      = function ()
  {
    return "action/redirect";
  };
  
  SieveRedirect.nodeType
      = function ()
  {
    return "action";
  };
  
  
  SieveRedirect.prototype.init
      = function (parser)
  {
    // Syntax :
    // <"redirect"> <address: string> <";">
    
    // remove the "redirect" identifier ...
    parser.extract("redirect");
    
    // ... eat the deadcode before the stringlist...
    this.whiteSpace.init(parser);
    
    // ... extract the redirect address...
    this.address.init(parser);
    
    // ... drop the semicolon
    this.semicolon.init(parser);
      
    return this;        
  };
  
  SieveRedirect.prototype.setAddress
     = function (address)
  {
    this.address.value(address);  
  };
  
  SieveRedirect.prototype.getAddress
     = function()
  {
    return this.address.value();    
  };
  
  SieveRedirect.prototype.toScript
      = function ()
  {
    return "redirect"
      + this.whiteSpace.toScript()
      + this.address.toScript()
      + this.semicolon.toScript();
  };
  
  /******************************************************************************/
  
  function SieveStop(docshell,id) 
  {
    SieveAbstractElement.call(this,docshell,id);
    
    this.semicolon = this._createByName("atom/semicolon");	
  }
  
  SieveStop.prototype = Object.create(SieveAbstractElement.prototype);
  SieveStop.prototype.constructor = SieveStop;
  
  SieveStop.isElement = function(parser, lexer) {
    return parser.startsWith("stop"); 
  };
  
  SieveStop.nodeName = function () {
    return "action/stop";     
  };
  
  SieveStop.nodeType = function () {
    return "action";
  };
  
  
  SieveStop.prototype.init
      = function (parser)
  {
    parser.extract("stop");
    
    this.semicolon.init(parser);
      
    return this; 
  };   
  
  SieveStop.prototype.toScript
      = function ()
  {
    return "stop"
      + this.semicolon.toScript();
  };
  
  
  /******************************************************************************/
  
  function SieveKeep(docshell,id)
  {
    SieveAbstractElement.call(this,docshell,id);
    
    this.semicolon = this._createByName("atom/semicolon");
  }
  
  SieveKeep.prototype = Object.create(SieveAbstractElement.prototype);
  SieveKeep.prototype.constructor = SieveKeep;
  
  SieveKeep.isElement = function(parser, lexer) {
    return parser.startsWith("keep");
  };
  
  SieveKeep.nodeName = function () {
    return "action/keep";
  };
  
  SieveKeep.nodeType  = function () {
    return "action";
  };
  
  
  SieveKeep.prototype.init
      = function (parser)
  {
    parser.extract("keep");
    
    this.semicolon.init(parser);
      
    return parser;
  };   
  
  SieveKeep.prototype.toScript
      = function ()
  {
    return "keep"
      + this.semicolon.toScript();
  };
  
  
  /******************************************************************************/
  
  function SieveFileInto(docshell,id) 
  {
    SieveAbstractElement.call(this,docshell,id);
  
    this._whiteSpace = [];
    this._whiteSpace[0] = this._createByName("whitespace", " ");
    this._whiteSpace[1] = this._createByName("whitespace", " ");
    
    this.semicolon = this._createByName("atom/semicolon");
        
    this._path = this._createByName("string","\"INBOX\"");
  
    this._state = {};
    this._create = null; 
    
    if (this.document().supportsByName("argument/create"))
      this._create  = this.document().createByName("argument/create");
  
  }
  
  SieveFileInto.prototype = Object.create(SieveAbstractElement.prototype);
  SieveFileInto.prototype.constructor = SieveFileInto;
  
  // Static methods needed for registration
  SieveFileInto.isElement = function (parser, lexer) {
    return parser.startsWith("fileinto");
  };
  
  SieveFileInto.isCapable = function (capabilities) {
    return !!(capabilities.fileinto);
  };
  
  SieveFileInto.nodeName = function () {
    return "action/fileinto";
  };
  
  SieveFileInto.nodeType  = function () {
    return "action";
  };
  
  
  // Dynamic methods...
  SieveFileInto.prototype.init
      = function (parser)
  {
    // Syntax :
    // <"fileinto"> <string> <";">
    parser.extract("fileinto");
  
    // ... eat the deadcode before the string...
    this._whiteSpace[0].init(parser);
    
    
    this._state = {};
    
    if ( this.document().supportsByName("argument/create") ) {
    	if (this._probeByName("argument/create", parser)) {
        this._create.init(parser);
        this._whiteSpace[1].init(parser);
      
        this._state["create"] = true;
      } 
    }
    
    // read the string
    this._path.init(parser);
    
    // ... and finally remove the semicolon;
    this.semicolon.init(parser);
        
    return this;
  };
  
  SieveFileInto.prototype.require
      = function (requires)
  {
    requires["fileinto"] = true;
    
    if (this._state["create"] && this.document().supportsByName("argument/create"))
      this._create.require(requires);
  };
  
  /**
   * Gets or sets the mailbox into which the message should be saved.
   * 
   * @optional @param {String} path
   *   the path as string in case it should be changed.
   *   
   * @return {String} the current path.
   */
  SieveFileInto.prototype.path
      = function (path)
  {
    return this._path.value(path);
  };
  
  SieveFileInto.prototype.state
      = function(state)
  {
    if (typeof(state) !== "undefined")
      this._state = state;
      
    return this._state;
  };
  
  SieveFileInto.prototype.toScript
      = function ()
  {
    return "fileinto" 
      + this._whiteSpace[0].toScript()
      + ((this._state["create"] && this.document().supportsByName("argument/create")) ? 
           "" + this._create.toScript() + this._whiteSpace[1].toScript() : "" )
      + this._path.toScript()
      + this.semicolon.toScript();
  };
  
  /******************************************************************************/
  
  if (!SieveLexer)
    throw "Could not register Actions";
  
  SieveLexer.register(SieveDiscard);
  SieveLexer.register(SieveKeep);
  SieveLexer.register(SieveStop);
  SieveLexer.register(SieveFileInto);
  SieveLexer.register(SieveRedirect);

})(window);