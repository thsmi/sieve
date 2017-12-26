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

(function (exports) {

  "use strict";

  /* global SieveLexer */
  /* global SieveAbstractElement */

  function SieveNumber(docshell, id) {
    SieveAbstractElement.call(this, docshell, id);

    this._number = "1";
    this._unit = "";
  }

  SieveNumber.isElement
    = function (parser, lexer) {
      return parser.isNumber(parser);
    };

  SieveNumber.nodeName = function () {
    return "number";
  };

  SieveNumber.nodeType = function () {
    return "number/";
  };

  SieveNumber.prototype = Object.create(SieveAbstractElement.prototype);
  SieveNumber.prototype.constructor = SieveNumber;

  SieveNumber.prototype.init
    = function (parser) {
      this._number = parser.extractNumber();

      if (parser.isChar(['K', 'k', 'M', 'm', 'G', 'g']))
        this._unit = parser.extractChar();

      return this;
    };

  SieveNumber.prototype.value
    = function (number) {
      if (typeof (number) === "undefined")
        return this._number;

      number = parseInt(number, 10);

      if (isNaN(number))
        throw new Error("Invalid Number");

      this._number = number;
      return this;
    };

  SieveNumber.prototype.unit
    = function (unit) {
      if (typeof (unit) === "undefined")
        return this._unit.toUpperCase();

      if ((unit !== "") && (unit !== "K") && (unit !== "M") && (unit !== "G"))
        throw new Error("Invalid unit mut be either K, M or G");

      this._unit = unit;
      return this;
    };

  SieveNumber.prototype.toScript
    = function () {
      return "" + this._number + "" + this._unit;
    };

  if (!SieveLexer)
    throw new Error("Could not register Atoms");

  SieveLexer.register(SieveNumber);

})(window);
