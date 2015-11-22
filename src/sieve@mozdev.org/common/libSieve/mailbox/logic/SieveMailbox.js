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

  
  // fileinto [:create] <mailbox: string>
  function SieveCreateArgument(docshell,id) 
  {
    SieveAbstractElement.call(this,docshell,id);    
    this.whitespace = this._createByName("whitespace"," ");
  }

  SieveCreateArgument.prototype = Object.create(SieveAbstractElement.prototype);
  SieveCreateArgument.prototype.constructor = SieveCreateArgument;
    
  SieveCreateArgument.isElement
    = function(parser, lexer)
  { 
    return parser.startsWith(":create");
  };
  
  SieveCreateArgument.nodeName = function () {
    return "argument/create";
  };
  
  SieveCreateArgument.nodeType  = function () {
    return "argument/create";
  };
  
  SieveCreateArgument.isCapable
      = function (capabilities)
  {
    return (capabilities["mailbox"] === true);      
  };
  
  SieveCreateArgument.prototype.require
      = function (imports)
  {
    imports["mailbox"] = true;
  };  
  
  SieveCreateArgument.prototype.init
      = function (parser)
  {
    parser.extract(":create");
    this.whitespace.init(parser);
    
    return this;
  };

  SieveCreateArgument.prototype.toScript
      = function ()
  {
    return ":create"
      + this.whitespace.toScript();
  };


////////////////////////////////////////////////////////////////////////////////
	
	//mailboxexists <mailbox-names: string-list>
	function SieveMailboxExistsTest(docshell,id) 
  {
    SieveAbstractElement.call(this,docshell,id);
    
    this._whitespace = this._createByName("whitespace"," ");
    this._names = this._createByName("stringlist",'""');
  }
  
  SieveMailboxExistsTest.prototype = Object.create(SieveAbstractElement.prototype);
  SieveMailboxExistsTest.prototype.constructor = SieveMailboxExistsTest;

  SieveMailboxExistsTest.isElement
    = function(parser, lexer)
  { 
    return parser.startsWith("mailboxexists");
  };
  
  SieveMailboxExistsTest.nodeName = function () {
    return "test/mailboxexists";
  };
  
  SieveMailboxExistsTest.nodeType  = function () {
    return "test";
  };
  
  SieveMailboxExistsTest.isCapable
      = function (capabilities)
  {
    return (capabilities["mailbox"] === true);      
  };
  
  SieveMailboxExistsTest.prototype.require
      = function (imports)
  {
    imports["mailbox"] = true;
  };  
  
  SieveMailboxExistsTest.prototype.init
      = function (parser)
  {
    parser.extract("mailboxexists");
    
    this._whitespace.init(parser);
    this._names.init(parser);
    
    return this;
  }; 

  SieveMailboxExistsTest.prototype.toScript
      = function ()
  {
    return "mailboxexists"
      + this._whitespace.toScript()
      + this._names.toScript();
  };

////////////////////////////////////////////////////////////////////////////////
  
	//metadata [MATCH-TYPE] [COMPARATOR]
  //         <mailbox: string>
  //         <annotation-name: string> <key-list: string-list>
  /**
   * Retrives the vlaue of the mailbox annotation "annotation-name" for mailbox
   * "mailbox#". The retrived value is compared against the key-list.
   * 
   * The test returns true if the annotation exits and its value matches and of
   * the keys.
   * 
   * The default matchtype is :is and the default comparator is "i;ascii-casemap"
   */
	function SieveMetaDataTest(docshell,id) 
  {
    SieveAbstractElement.call(this,docshell,id);
    
    this._whitespace = [];
    this._whitespace[0] = this._createByName("whitespace",' ');
    this._whitespace[1] = this._createByName("whitespace",' ');
    this._whitespace[2] = this._createByName("whitespace",' ');
    this._whitespace[3] = this._createByName("whitespace",' ');
    this._whitespace[4] = this._createByName("whitespace",' ');
    this._whitespace[5] = this._createByName("whitespace",' ');
     
    this._matchType = this._createByName("match-type");
    
    this._comparator = this._createByName("comparator");
  
    this._mailbox = this._createByName("string",'""');
    this._annotations = this._createByName("string",'""');
    this._keyList = this._createByName("stringlist",'""');
  }
  
  SieveMetaDataTest.prototype = Object.create(SieveAbstractElement.prototype);
  SieveMetaDataTest.prototype.constructor = SieveMetaDataTest;  

  SieveMetaDataTest.isElement
    = function(parser, lexer)
  { 
    return parser.startsWith("metadata");
  };
  
  SieveMetaDataTest.nodeName = function () {
    return "test/metadata";
  };
  
  SieveMetaDataTest.nodeType  = function () {
    return "test";
  };
  
  SieveMetaDataTest.isCapable
      = function (capabilities)
  {
    return (capabilities["mboxmetadata"] === true);      
  };
  
  SieveMetaDataTest.prototype.require
      = function (imports)
  {
    imports["mboxmetadata"] = true;
  };
  
  SieveMetaDataTest.prototype.init
      = function (parser)
  {
    parser.extract("metadata");
    this._whitespace[0].init(parser);
    
    // optional
    while (true) {

      if (this._comparator.isOptional() && this._probeByName("comparator",parser))
      {
        this._comparator.init(parser);  
        this._whitespace[1].init(parser);
      
        continue;
      }
    
      if (this._matchType.isOptional() && this._probeByName("match-type",parser))
      {
        this._matchType.init(parser);
        this._whitespace[2].init(parser);
        
        continue;
      }
      
      // no more optional elements
      break;
    }
      
    // mandatory    
    this._mailbox.init(parser);
    this._whitespace[3].init(parser);
    
    this._annotations.init(parser);
    this._whitespace[4].init(parser);
    
    this._keyList.init(parser);
    this._whitespace[5].init(parser);

    return this;
  }; 

  SieveMetaDataTest.prototype.toScript
      = function ()
  {
    return "metadata"
      + this._whitespace[0].toScript()
      + (!this._comparator.isOptional()? 
           this._comparator.toScript()+this._whitespace[1].toScript() : "")
      + (!this._matchType.isOptional()?
           this._matchType.toScript()+this._whitespace[2].toScript() : "")
      + this._mailbox.toScript()
      + this._whitespace[3].toScript()
      + this._annotations.toScript()
      + this._whitespace[4].toScript()
      + this._keyList.toScript()
      + this._whitespace[5].toScript();
  };
  
  
////////////////////////////////////////////////////////////////////////////////

	// metadataexists <mailbox: string> <annotation-names: string-list>
	function SieveMetaDataExistsTest(docshell,id) 
  {
    SieveAbstractElement.call(this,docshell,id);
    
    this._whitespace = [];
    this._whitespace[0] = this._createByName("whitespace",' ');
    this._whitespace[1] = this._createByName("whitespace",' ');
    
    this._mailbox = this._createByName("string",'""');
    this._annotations = this._createByName("stringlist",'""');
  }
  
  SieveMetaDataExistsTest.prototype = Object.create(SieveAbstractElement.prototype);
  SieveMetaDataExistsTest.prototype.constructor = SieveMetaDataExistsTest;  

  SieveMetaDataExistsTest.isElement
    = function(parser, lexer)
  { 
    return parser.startsWith("metadataexists");
  };
  
  SieveMetaDataExistsTest.nodeName = function () {
    return "test/metadataexists";
  };
  
  SieveMetaDataExistsTest.nodeType  = function () {
    return "test";
  };
  
  SieveMetaDataExistsTest.isCapable
      = function (capabilities)
  {
    return (capabilities["mboxmetadata"] === true);      
  };
  
  SieveMetaDataExistsTest.prototype.require
      = function (imports)
  {
    imports["mboxmetadata"] = true;
  };
  
  SieveMetaDataExistsTest.prototype.init
      = function (parser)
  {
    parser.extract("metadataexists");
    
    // optional
    this._whitespace[0].init(parser);
    this._mailbox.init(parser);
    
    this._whitespace[1].init(parser);
    this._annotations.init(parser);
    
    return this;
  };

  SieveMetaDataExistsTest.prototype.toScript
      = function ()
  {
    return "metadataexists"
      + this._whitespace[0].toScript()
      + this._mailbox.toScript()
      + this._whitespace[1].toScript()
      + this._annotations.toScript();
  };

////////////////////////////////////////////////////////////////////////////////
    
	// servermetadata [MATCH-TYPE] [COMPARATOR] <annotation-name: string> <key-list: string-list>
	function SieveServerMetaDataTest(docshell,id) 
  {
    SieveAbstractElement.call(this,docshell,id);
    
    this._whitespace = [];
    this._whitespace[0] = this._createByName("whitespace",' ');
    this._whitespace[1] = this._createByName("whitespace",' ');
    this._whitespace[2] = this._createByName("whitespace",' ');
    this._whitespace[3] = this._createByName("whitespace",' ');
    this._whitespace[4] = this._createByName("whitespace",' ');

    
    this._matchType = this._createByName("match-type");
    
    this._comparator = this._createByName("comparator");
  
    this._annotation = this._createByName("string",'""');
    this._keyList = this._createByName("stringlist",'""');
  }
  
  SieveServerMetaDataTest.prototype = Object.create(SieveAbstractElement.prototype);
  SieveServerMetaDataTest.prototype.constructor = SieveServerMetaDataTest;

  SieveServerMetaDataTest.isElement
    = function(parser, lexer)
  { 
    return parser.startsWith("servermetadata");
  };
  
  SieveServerMetaDataTest.nodeName = function () {
    return "test/servermetadata";
  };
  
  SieveServerMetaDataTest.nodeType  = function () {
    return "test";
  };
  
  SieveServerMetaDataTest.isCapable
      = function (capabilities)
  {
    return (capabilities["servermetadata"] === true);      
  };
  
  SieveServerMetaDataTest.prototype.require
      = function (imports)
  {
    imports["servermetadata"] = true;
  };
  
  SieveServerMetaDataTest.prototype.init
      = function (parser)
  {
    parser.extract("servermetadata");
    this._whitespace[0].init(parser);

    // optional
    while (true) {

      if (this._comparator.isOptional() && this._probeByName("comparator",parser))
      {
        this._comparator.init(parser);  
        this._whitespace[1].init(parser);
      
        continue;
      }
    
      if (this._matchType.isOptional() && this._probeByName("match-type",parser))
      {
        this._matchType.init(parser);
        this._whitespace[2].init(parser);
        
        continue;
      }
      
      // no more optional elements
      break;
    }
    
    // mandatory        
    this._annotation.init(parser);    
    this._whitespace[3].init(parser);
    
    this._keyList.init(parser);
    this._whitespace[4].init(parser);
    
    return this;
  };

  SieveServerMetaDataTest.prototype.toScript
      = function ()
  {
    return "servermetadata"
      + this._whitespace[0].toScript()
      + (!this._comparator.isOptional()? 
           this._comparator.toScript()+this._whitespace[1].toScript() : "")
      + (!this._matchType.isOptional()?
           this._matchType.toScript()+this._whitespace[2].toScript() : "")
      + this._annotation.toScript()
      + this._whitespace[3].toScript()
      + this._keyList.toScript()
      + this._whitespace[4].toScript();
  };
  
////////////////////////////////////////////////////////////////////////////////
  
	// servermetadataexists <annotation-names: string-list>
	function SieveServerMetaDataExitsTest(docshell,id) 
  {
    SieveAbstractElement.call(this,docshell,id);

    this._whitespace = this._createByName("whitespace",' ');
    this._annotations = this._createByName("stringlist",'""');
  }
  
  SieveServerMetaDataExitsTest.prototype = Object.create(SieveAbstractElement.prototype);
  SieveServerMetaDataExitsTest.prototype.constructor = SieveServerMetaDataExitsTest;

  SieveServerMetaDataExitsTest.isElement
    = function(parser, lexer)
  { 
    return parser.startsWith("servermetadataexists");
  };
  
  SieveServerMetaDataExitsTest.nodeName = function () {
    return "test/servermetadataexists";
  };
  
  SieveServerMetaDataExitsTest.nodeType  = function () {
    return "test";
  };
  
  SieveServerMetaDataExitsTest.isCapable
      = function (capabilities)
  {
    return (capabilities["servermetadata"] === true);      
  };
  
  SieveServerMetaDataExitsTest.prototype.require
      = function (imports)
  {
    imports["servermetadata"] = true;
  };
  
  SieveServerMetaDataExitsTest.prototype.init
      = function (parser)
  {
    parser.extract("servermetadataexists");
    
    this._whitespace.init(parser);
    this._annotations.init(parser);
        
    return this;
  };

  SieveServerMetaDataExitsTest.prototype.toScript
      = function ()
  {
    return "servermetadataexists"
      + this._whitespace.toScript()
      + this._annotations.toScript();
  };

////////////////////////////////////////////////////////////////////////////////
  
  if (!SieveLexer)
    throw "Could not register MatchTypes";

  SieveLexer.register(SieveCreateArgument);
  SieveLexer.register(SieveMailboxExistsTest);
  SieveLexer.register(SieveMetaDataExistsTest);
  SieveLexer.register(SieveMetaDataTest);
  SieveLexer.register(SieveServerMetaDataExitsTest);
  SieveLexer.register(SieveServerMetaDataTest);


})(window);