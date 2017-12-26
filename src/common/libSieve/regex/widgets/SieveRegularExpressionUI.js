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

  /* global SieveAbstractMatchUI */
  /* global SieveDesigner */

  function SieveRegExMatchUI(id) {
    SieveAbstractMatchUI.call(this, id);
  }

  SieveRegExMatchUI.prototype = Object.create(SieveAbstractMatchUI.prototype);
  SieveRegExMatchUI.prototype.constructor = SieveRegExMatchUI;

  SieveRegExMatchUI.nodeName = function () {
    return "match-type/regex";
  };

  SieveRegExMatchUI.nodeType = function () {
    return "match-type/";
  };

  SieveRegExMatchUI.isCapable = function (capabilities) {
    return !!capabilities["regex"];
  };

  SieveRegExMatchUI.prototype.html
    = function (callback) {

      return SieveAbstractMatchUI.prototype.html.call(
        this, ":regex", "... regex matches ...",
        " Matches and compares using on a regular expression as defined in IEEE.1003-2.1992", callback);
    };


  //* ***********************************************************************************

  if (!SieveDesigner)
    throw new Error("Could not register Regex Widgets");

  SieveDesigner.register2(SieveRegExMatchUI);

})(window);
