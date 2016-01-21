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
	/* global SieveBlockBody */
  
  function SieveRequire(docshell,id) 
  {
    SieveAbstractElement.call(this,docshell,id);
    
    this.whiteSpace = this._createByName("whitespace", " ");
    this.semicolon = this._createByName("atom/semicolon");
    
    this.strings = this._createByName("stringlist");	  
  }
  
  SieveRequire.prototype = Object.create(SieveAbstractElement.prototype);
  SieveRequire.prototype.constructor = SieveRequire;
  
  SieveRequire.isElement
    = function (parser, lexer)
  {
    return parser.startsWith("require", lexer); 
  };
  
  SieveRequire.nodeName = function () {
    return "import/require";
  };
  
  SieveRequire.nodeType  = function () {
    return "import/";
  };
  
  
  SieveRequire.prototype.init
      = function (parser)
  {
    // Syntax :
    // <"require"> <stringlist> <";">
    
    // remove the "require" identifier ...
    parser.extract("require");
  
    // ... eat the deadcode before the stringlist...
    this.whiteSpace.init(parser);
      
    // ... extract the stringlist...
    this.strings.init(parser);
    
    // Test if the 
    var capabilities = this._docshell.capabilities();
        
    for (var idx = 0; idx < this.strings.size(); idx++) {
    
      var item = this.strings.item(idx);
      
      if (!capabilities[item])
        throw new Error('Unknown capability string "'+item+'"');
      
    }
    
    this.semicolon.init(parser);
      
    return this;
  };
  
  SieveRequire.prototype.capability
      = function (require)
  {
    if (typeof(require) === "undefined")
      return this.strings;
      
    if (!this.strings.contains(require))
      this.strings.append(require);
      
    return this;
  };
  
  SieveRequire.prototype.toScript
      = function ()
  {
    return "require"
      + this.whiteSpace.toScript()
      + this.strings.toScript()
      + this.semicolon.toScript();
  };
  
  
  // CONSTRUCTOR:
  function SieveBlockImport(docshell,id)
  {
    SieveBlockBody.call(this,docshell,id); 
  }
  
  SieveBlockImport.prototype = Object.create(SieveBlockBody.prototype);
  SieveBlockImport.prototype.constructor = SieveBlockImport;
  
  // PUBLIC STATIC:
  SieveBlockImport.isElement
      = function (parser, lexer)
  {
    return lexer.probeByClass(["import/","whitespace"],parser);  
  };
  
  SieveBlockImport.nodeName = function () {
    return "import";
  };
  
  SieveBlockImport.nodeType  = function () {
    return "import";
  };
  
  SieveBlockImport.prototype.init
      = function (parser)    
  {  
    // The import section consists of require and deadcode statments...
    while (this._probeByClass(["import/","whitespace"],parser))    
      this.elms.push(
        this._createByClass(["import/","whitespace"],parser));
   
    return this;
  };
  
  
  SieveBlockImport.prototype.capability
      = function (require)
  {
   
    // We should try to insert new requires directly aftr the previous one...
    // ... otherwise it looks strange.
    var item = null;
    
    for (var i=0; i<this.elms.length; i++)
    {
      if (!this.elms[i].capability)
        continue;
      
      item = this.elms[i];
       
      if (this.elms[i].capability().contains(require))
        return this;
    }
        
    
    this.append(
      this.document().createByName("import/require").capability(require), item);
          
    return this;
  };
  
  
  if (!SieveLexer)
    throw "Could not register Import Elements";
  
  
  SieveLexer.register(SieveBlockImport);
  SieveLexer.register(SieveRequire);

})(window);