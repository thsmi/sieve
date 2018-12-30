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

(function () {

  "use strict";

  /* global SieveLexer */
  /* global SieveAbstractElement */

  /**
   * Implements a sieve numeric atom as defined in the rfc.
   *
   * A numeric value is an integer plus an optional unit
   * The unit may any of the following postfixes:
   * K for kilo, M for Mega and G for Giga
   */
  class SieveNumber extends SieveAbstractElement {

    /**
     * @inheritdoc
     */
    constructor(docshell, id) {
      super(docshell, id);
      this._number = "1";
      this._unit = "";
    }

    /**
     * @inheritdoc
     */
    static isElement(parser) {
      return parser.isNumber(parser);
    }

    /**
     * @inheritdoc
     */
    static nodeName() {
      return "number";
    }

    /**
     * @inheritdoc
     */
    static nodeType() {
      return "number/";
    }

    /**
     * @inheritdoc
     */
    init(parser) {
      this._number = parser.extractNumber();

      if (parser.isChar(['K', 'M', 'G', 'k', 'm', 'g']))
        this._unit = parser.extractChar();

      return this;
    }

    /**
     * Get or sets the number's value.
     * @returns {int}
     *   the current numeric value.
     **/
    getValue() {
      return this._number;
    }

    /**
     * Get or sets the number's value.
     * @param {string|int} number
     *   the number which should be set.
     * @returns {SieveNumber}
     *   a self refernece.
     */
    setValue(number) {
      if (typeof (number) === "undefined" || number === null)
        throw new Error("Invalid Number");

      number = parseInt(number, 10);

      if (isNaN(number))
        throw new Error("Not a number: " + number);

      this._number = number;
      return this;
    }

    /**
     * Gets or sets the number's unit.
     *
     * @returns {string}
     *   the current unit
     */
    getUnit() {
      return this._unit.toUpperCase();
    }

    /**
     * Sets the number's unit.
     * Valid units are an empty string, K for Kilo, M for Mega or G for Giga.
     *
     * @param {string} unit
     *   the unit which shall be set. If omitted the unit remains unchanged.
     * @returns {SieveNumber}
     *   a self reference.
     */
    setUnit(unit) {
      if (typeof (unit) === "undefined" || unit === null)
        throw new Error("No unit specified");

      unit = unit.toUpperCase();

      if ((unit !== "") && (unit !== "K") && (unit !== "M") && (unit !== "G"))
        throw new Error("Invalid unit must be either K, M or G");

      this._unit = unit;
      return this;
    }

    /**
     * @inheritdoc
     */
    toScript() {
      return "" + this._number + "" + this._unit;
    }
  }

  if (!SieveLexer)
    throw new Error("Could not register Atoms");

  SieveLexer.register(SieveNumber);

})(window);
