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

"use strict";

(function (exports) {

  /* global SieveLexer */
  /* global SieveAbstractElement */

  function SieveLocalPart(docshell, id) {
    SieveAbstractElement.call(this, docshell, id);
  }

  SieveLocalPart.prototype = Object.create(SieveAbstractElement.prototype);
  SieveLocalPart.prototype.constructor = SieveLocalPart;

  SieveLocalPart.nodeName = function () {
    return "address-part/local";
  };

  SieveLocalPart.nodeType = function () {
    return "address-part/";
  };

  SieveLocalPart.isElement
    = function (parser, lexer) {
      if (parser.startsWith(":localpart"))
        return true;

      return false;
    };

  SieveLocalPart.prototype.init
    = function (parser) {
      parser.extract(":localpart");
      return this;
    };

  SieveLocalPart.prototype.toScript
    = function () {
      return ":localpart";
    };


  // *******************************************************************//

  function SieveDomainPart(docshell, id) {
    SieveAbstractElement.call(this, docshell, id);
  }

  SieveDomainPart.prototype = Object.create(SieveAbstractElement.prototype);
  SieveDomainPart.prototype.constructor = SieveDomainPart;

  SieveDomainPart.nodeName = function () {
    return "address-part/domain";
  };

  SieveDomainPart.nodeType = function () {
    return "address-part/";
  };

  SieveDomainPart.isElement
    = function (parser, lexer) {
      if (parser.startsWith(":domain"))
        return true;

      return false;
    };

  SieveDomainPart.prototype.init
    = function (parser) {
      parser.extract(":domain");
      return this;
    };

  SieveDomainPart.prototype.toScript
    = function () {
      return ":domain";
    };


  // *******************************************************************//

  function SieveAllPart(docshell, id) {
    SieveAbstractElement.call(this, docshell, id);
  }

  SieveAllPart.prototype = Object.create(SieveAbstractElement.prototype);
  SieveAllPart.prototype.constructor = SieveAllPart;

  SieveAllPart.nodeName = function () {
    return "address-part/all";
  };

  SieveAllPart.nodeType = function () {
    return "address-part/";
  };

  SieveAllPart.isElement
    = function (parser, lexer) {
      if (parser.startsWith(":all"))
        return true;

      return false;
    };

  SieveAllPart.prototype.init
    = function (parser) {
      parser.extract(":all");
      return this;
    };

  SieveAllPart.prototype.toScript
    = function () {
      return ":all";
    };

  // *******************************************************************//

  /**
   * Addresses are one of the most frequent things represented as strings.
   * These are structured, and allows comparison against the local-
   * part or the domain of an address
   *
   *             email@example.com
   *          [local Part]@[Domain Part]
   *
   * ist example.com der domain-part, email der local-part.
   */
  // ":localpart" / ":domain" / ":all"


  function SieveAddressPart(docshell, id) {
    // call super constructor.
    SieveAbstractElement.call(this, docshell, id);

    // the default matchtype is by definition a :is
    this._part = this._createByName("address-part/all", ":all");
    this.optional = true;
  }

  SieveAddressPart.prototype = Object.create(SieveAbstractElement.prototype);
  SieveAddressPart.prototype.constructor = SieveAddressPart;

  SieveAddressPart.nodeName = function () {
    return "address-part";
  };

  SieveAddressPart.nodeType = function () {
    return "address-part";
  };

  SieveAddressPart.isElement
    = function (parser, lexer) {
      return lexer.probeByClass(["address-part/"], parser);
    };

  SieveAddressPart.prototype.require
    = function (imports) {
      this._part.require(imports);
    };

  SieveAddressPart.prototype.init
    = function (parser) {
      this._part = this._createByClass(["address-part/"], parser);

      if (this._part instanceof SieveAllPart)
        this.optional = false;

      return this;
    };

  SieveAddressPart.prototype.isOptional
    = function (value) {
      if (typeof (value) === "undefined")
        return ((this.optional) && (this._part instanceof SieveAllPart));

      this.optional = !!value;

      return this;
    };

  SieveAddressPart.prototype.addressPart
    = function (value) {
      if (typeof (value) === "undefined")
        return this._part.toScript();

      value = value.toLowerCase();

      if (!this._probeByClass(["address-part/"], value))
        throw new Error("Unkonwn Address Part >>" + value + "<<");

      this._part = this._createByClass(["address-part/"], value);

      return this;
    };

  SieveAddressPart.prototype.toScript
    = function () {
      if (this.isOptional())
        return "";

      return this._part.toScript();
    };

  if (!SieveLexer)
    throw new Error("Could not register AddressParts");

  SieveLexer.register(SieveDomainPart);
  SieveLexer.register(SieveLocalPart);
  SieveLexer.register(SieveAllPart);

  SieveLexer.register(SieveAddressPart);

})(window);
