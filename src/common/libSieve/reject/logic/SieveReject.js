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

  function SieveReject(docshell, id) {
    SieveAbstractElement.call(this, docshell, id);

    this.reason = this._createByName("string", "text:\r\n.\r\n");

    this.whiteSpace = this._createByName("whitespace", " ");

    this.semicolon = this._createByName("atom/semicolon");
  }

  SieveReject.prototype = Object.create(SieveAbstractElement.prototype);
  SieveReject.prototype.constructor = SieveReject;

  SieveReject.isElement
    = function (parser, lexer) {
      return parser.startsWith("reject");
    };

  SieveReject.isCapable
    = function (capabilities) {
      return (capabilities["reject"] === true);
    };

  SieveReject.nodeName = function () {
    return "action/reject";
  };

  SieveReject.nodeType = function () {
    return "action";
  };

  SieveReject.prototype.init
    = function (parser) {
      // Syntax :
      // <"reject"> <reason: string> <";">

      // remove the "redirect" identifier ...
      parser.extract("reject");

      // ... eat the deadcode before the stringlist...
      this.whiteSpace.init(parser);

      // ... extract the reject reason...
      this.reason.init(parser);

      // ... drop the semicolon
      this.semicolon.init(parser);

      return this;
    };

  SieveReject.prototype.getReason
    = function () {
      return this.reason.value();
    };

  SieveReject.prototype.setReason
    = function (reason) {
      return this.reason.value(reason);
    };

  SieveReject.prototype.require
    = function (requires) {
      requires["reject"] = true;
    };

  SieveReject.prototype.toScript
    = function () {
      return "reject"
        + this.whiteSpace.toScript()
        + this.reason.toScript()
        + this.semicolon.toScript();
    };

  // *****************************************************************************//

  function SieveEreject(docshell, id) {
    SieveAbstractElement.call(this, docshell, id);

    this.reason = this._createByName("string", "text:\r\n.\r\n");

    this.whiteSpace = this._createByName("whitespace", " ");

    this.semicolon = this._createByName("atom/semicolon");
  }

  SieveEreject.prototype = Object.create(SieveAbstractElement.prototype);
  SieveEreject.prototype.constructor = SieveEreject;

  SieveEreject.isElement
    = function (parser, lexer) {
      return parser.startsWith("ereject");
    };

  SieveEreject.isCapable
    = function (capabilities) {
      return (capabilities["ereject"] === true);
    };

  SieveEreject.nodeName = function () {
    return "action/ereject";
  };

  SieveEreject.nodeType = function () {
    return "action";
  };

  SieveEreject.prototype.init
    = function (parser) {
      // Syntax :
      // <"ereject"> <reason: string> <";">

      // remove the "redirect" identifier ...
      parser.extract("ereject");

      // ... eat the deadcode before the stringlist...
      this.whiteSpace.init(parser);

      // ... extract the reject reason...
      this.reason.init(parser);

      // ... drop the semicolon
      this.semicolon.init(parser);

      return this;
    };

  SieveEreject.prototype.getReason
    = function () {
      return this.reason.value();
    };

  SieveEreject.prototype.setReason
    = function (reason) {
      return this.reason.value(reason);
    };

  SieveEreject.prototype.require
    = function (requires) {
      requires["ereject"] = true;
    };

  SieveEreject.prototype.toScript
    = function () {
      return "ereject"
        + this.whiteSpace.toScript()
        + this.reason.toScript()
        + this.semicolon.toScript();
    };

  if (!SieveLexer)
    throw new Error("Could not register Actions");

  SieveLexer.register(SieveReject);
  SieveLexer.register(SieveEreject);

})(window);
