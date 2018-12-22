/*
 * The contents of this file are licensed. You may obtain a copy of
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

(function () {

  "use strict";

  /* global SieveLexer */
  /* global SieveBlock */
  /* global SieveBlockBody */

  function SieveElse(docshell, id) {
    SieveBlock.call(this, docshell, id);

    this.ws = [];

    this.ws[0] = this._createByName("whitespace", "\r\n");
    this.ws[1] = this._createByName("whitespace", "\r\n");
  }

  SieveElse.prototype = Object.create(SieveBlock.prototype);
  SieveElse.prototype.constructor = SieveElse;

  SieveElse.isElement
    = function (parser, lexer) {
      return parser.startsWith("else");
    };

  SieveElse.nodeName = function () {
    return "condition/else";
  };

  SieveElse.nodeType = function () {
    return "condition/";
  };

  SieveElse.prototype.init
    = function (parser) {
      parser.extract("else");

      this.ws[0].init(parser);

      SieveBlock.prototype.init.call(this, parser);

      this.ws[1].init(parser);

      return this;
    };

  SieveElse.prototype.toScript
    = function () {
      return "else"
        + this.ws[0].toScript()
        + SieveBlock.prototype.toScript.call(this)
        + this.ws[1].toScript();
    };

  // ****************************************************************************//

  function SieveIf(docshell, id) {
    SieveElse.call(this, docshell, id);

    this._test = null;
    this.ws[2] = this._createByName("whitespace");
  }

  SieveIf.prototype = Object.create(SieveElse.prototype);
  SieveIf.prototype.constructor = SieveIf;

  SieveIf.isElement
    = function (parser, lexer) {
      return parser.startsWith("if");
    };

  SieveIf.nodeName = function () {
    return "condition/if";
  };

  SieveIf.nodeType = function () {
    return "condition/";
  };


  SieveIf.prototype.init
    = function (parser) {
      parser.extract("if");

      this.ws[2].init(parser);

      this._test = this._createByClass(["test", "operator"], parser);

      this.ws[0].init(parser);

      SieveBlock.prototype.init.call(this, parser);

      this.ws[1].init(parser);

      return this;
    };

  SieveIf.prototype.removeChild
    = function (childId, cascade, stop) {
      let elm = SieveBlock.prototype.removeChild.call(this, childId);
      if (cascade && elm)
        return this;

      if (elm)
        return elm;

      if (this.test().id() !== childId)
        throw new Error("Unknown ChildId");

      if (!cascade)
        throw new Error("Use cascade to delete conditions");

      this.test().parent(null);
      this._test = null;

      if ((!stop) || (stop.id() !== this.id()))
        return this.remove(cascade, stop);

      return this;
    };

  SieveIf.prototype.test
    = function (item) {
      if (typeof (item) === "undefined")
        return this._test;

      if (item.parent())
        throw new Error("Test already bound to " + item.parent().id());

      // Release old test...
      if (this._test)
        this._test.parent(null);

      // ... and bind new test to this node
      this._test = item.parent(this);

      return this;
    };

  SieveIf.prototype.empty
    = function () {
      return (!this._test) ? true : false;
    };


  SieveIf.prototype.require
    = function (imports) {
      SieveElse.prototype.require.call(this, imports);
      this._test.require(imports);
    };

  SieveIf.prototype.toScript
    = function () {
      return "if"
        + this.ws[2].toScript()
        + this._test.toScript()
        + this.ws[0].toScript()
        + SieveBlock.prototype.toScript.call(this)
        + this.ws[1].toScript();
    };

  /**
   *
   */
  class SieveCondition extends SieveBlockBody {

    /**
     * @inheritdoc
     */
    constructor(docshell, id) {
      super(docshell, id);

      this.elms[0] = this._createByName("condition/if", "if false {\r\n}\r\n");
    }

    /**
     * @inheritdoc
     */
    static isElement(parser, lexer) {
      return SieveIf.isElement(parser, lexer);
    }

    /**
     * @inheritdoc
     */
    static nodeName() {
      return "condition";
    }

    /**
     * @inheritdoc
     */
    static nodeType() {
      return "condition";
    }

    /**
     * @inheritdoc
     */
    init(parser) {

      this.elms[0] = this._createByName("condition/if", parser);

      while (parser.startsWith("elsif")) {
        parser.extract("els");

        this.elms.push(
          this._createByName("condition/if", parser));

      }

      if (this._probeByName("condition/else", parser))
        this.elms.push(this._createByName("condition/else", parser));

      return this;
    }

    removeChild(childId, cascade, stop) {
      // should we remove the whole node
      if (typeof (childId) === "undefined")
        throw new Error("Child ID Missing");

      if (stop && (stop.id() === this.id()))
        cascade = false;

      let elm = SieveBlockBody.prototype.removeChild.call(this, childId, cascade, stop);

      //  ... if we endup after delete with just an else, merge it into parent...
      if ((this.children().length) && (!this.children(0).test)) {
        // we copy all of our else statements into our parent...
        while (this.children(0).children().length)
          this.parent().append(this.children(0).children(0), this);

        return this.children(0).remove(cascade, stop);
      }


      // If SieveBlockBody cascaded through our parent, it should be null...
      // ... and we are done

      // 4. the condition might now be empty
      if (this.parent() && (!this.children().length))
        return this.remove(cascade, stop);

      if (this.parent() && cascade)
        return this;


      return elm;
    }

    /**
     * @inheritdoc
     */
    toScript() {
      let str = "";

      for (let i = 0; i < this.elms.length; i++) {
        if ((i > 0) && (this.elms[i].test))
          str += "els";

        str += this.elms[i].toScript();
      }

      return str;
    }
  }


  if (!SieveLexer)
    throw new Error("Could not register Conditional Elements");

  SieveLexer.register(SieveIf);
  SieveLexer.register(SieveElse);
  SieveLexer.register(SieveCondition);

})(window);
