/*
 * The contents of this file are licenced. You may obtain a copy of 
 * the license at https://github.com/thsmi/sieve/ or request it via 
 * email from the author.
 *
 * Do not remove or change this comment.
 * 
 * The initial author of the code is:
 *   Rainer Müller <raimue@codingfarm.de>
 */

/* global window */

"use strict";

(function(exports) {

  /* global SieveLexer */
  /* global SieveAbstractElement */

  // fileinto [:copy] <mailbox: string>
  function SieveCopyArgument(docshell,id) 
  {
    SieveAbstractElement.call(this,docshell,id);    
    this.whitespace = this._createByName("whitespace"," ");
  }

  SieveCopyArgument.prototype = Object.create(SieveAbstractElement.prototype);
  SieveCopyArgument.prototype.constructor = SieveCopyArgument;
    
  SieveCopyArgument.isElement
    = function(parser, lexer)
  { 
    return parser.startsWith(":copy");
  };
  
  SieveCopyArgument.nodeName = function () {
    return "argument/copy";
  };
  
  SieveCopyArgument.nodeType  = function () {
    return "argument/copy";
  };
  
  SieveCopyArgument.isCapable
      = function (capabilities)
  {
    return (capabilities["copy"] === true);      
  };
  
  SieveCopyArgument.prototype.require
      = function (imports)
  {
    imports["copy"] = true;
  };  
  
  SieveCopyArgument.prototype.init
      = function (parser)
  {
    parser.extract(":copy");
    this.whitespace.init(parser);
    
    return this;
  };

  SieveCopyArgument.prototype.toScript
      = function ()
  {
    return ":copy"
      + this.whitespace.toScript();
  };
  
  /******************************************************************************/
  
  if (!SieveLexer)
    throw "Could not register :copy argument";

  SieveLexer.register(SieveCopyArgument);

})(window);
