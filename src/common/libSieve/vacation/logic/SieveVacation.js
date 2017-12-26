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

  /**
   * vacation [":days" number] [":subject" string]
                      [":from" string] [":addresses" string-list]
                      [":mime"] [":handle" string] <reason: string>
   * @param {} docshell
   * @param {} id
   */
  function SieveVacation(docshell, id) {
    SieveAbstractElement.call(this, docshell, id);

    this.whiteSpace = [];
    this.whiteSpace[0] = this._createByName("whitespace", " ");
    this.whiteSpace[1] = this._createByName("whitespace", " ");
    this.whiteSpace[2] = this._createByName("whitespace", " ");
    this.whiteSpace[3] = this._createByName("whitespace", " ");
    this.whiteSpace[4] = this._createByName("whitespace", " ");
    this.whiteSpace[5] = this._createByName("whitespace", " ");
    this.whiteSpace[6] = this._createByName("whitespace", " ");

    this._days = this._createByName("vacation-days");
    this._subject = this._createByName("vacation-subject");
    this._from = this._createByName("vacation-from");
    this._addresses = this._createByName("vacation-addresses");
    this._mime = this._createByName("vacation-mime");
    this._handle = this._createByName("vacation-handle");

    this._state = {};

    // Required
    this._reason = this._createByName("string", '""');

    this.semicolon = this._createByName("atom/semicolon");
  }

  SieveVacation.prototype = Object.create(SieveAbstractElement.prototype);
  SieveVacation.prototype.constructor = SieveVacation;

  SieveVacation.isElement
    = function (parser, lexer) {
      return parser.startsWith("vacation");
    };

  SieveVacation.isCapable
    = function (capabilities) {
      return (capabilities["vacation"] === true);
    };

  SieveVacation.nodeName = function () {
    return "action/vacation";
  };

  SieveVacation.nodeType = function () {
    return "action";
  };

  SieveVacation.prototype.require
    = function (imports) {
      imports["vacation"] = true;
    };

  SieveVacation.prototype.init
    = function (parser) {

      parser.extract("vacation");
      this.whiteSpace[0].init(parser);

      this._state = {};

      while (true) {

        if (this._probeByName("vacation-days", parser)) {
          this._days.init(parser);
          this.whiteSpace[1].init(parser);

          this._state["days"] = true;

          continue;
        }

        if (this._probeByName("vacation-subject", parser)) {
          this._subject.init(parser);
          this.whiteSpace[2].init(parser);

          this._state["subject"] = true;

          continue;
        }

        if (this._probeByName("vacation-from", parser)) {
          this._from.init(parser);
          this.whiteSpace[3].init(parser);

          this._state["from"] = true;

          continue;
        }

        if (this._probeByName("vacation-addresses", parser)) {
          this._addresses.init(parser);
          this.whiteSpace[4].init(parser);

          this._state["addresses"] = true;

          continue;
        }

        if (this._probeByName("vacation-mime", parser)) {
          this._mime.init(parser);
          this.whiteSpace[5].init(parser);

          this._state["mime"] = true;

          continue;
        }

        if (this._probeByName("vacation-handle", parser)) {
          this._handle.init(parser);
          this.whiteSpace[6].init(parser);

          this._state["handle"] = true;

          continue;
        }

        // no more optional elements..
        break;

      }

      this._reason.init(parser);

      this.semicolon.init(parser);

      return this;
    };

  SieveVacation.prototype.state
    = function (value) {
      if (typeof (value) !== "undefined")
        this._state = value;

      return this._state;
    };

  SieveVacation.prototype.reason
    = function (value) {
      return this._reason.value(value);
    };

  SieveVacation.prototype.subject
    = function (value) {
      return this._subject.subject.value(value);
    };

  SieveVacation.prototype.days
    = function (value) {
      return this._days.days.value(value);
    };

  SieveVacation.prototype.from
    = function (value) {
      return this._from.from.value(value);
    };

  SieveVacation.prototype.handle
    = function (value) {
      return this._handle.handle.value(value);
    };

  SieveVacation.prototype.addresses
    = function () {
      return this._addresses.addresses;
    };

  SieveVacation.prototype.toScript
    = function () {
      return "vacation"
        + this.whiteSpace[0].toScript()
        + (this._state["days"] ?
          "" + this._days.toScript() + this.whiteSpace[1].toScript() : "")
        + (this._state["subject"] ?
          "" + this._subject.toScript() + this.whiteSpace[2].toScript() : "")
        + (this._state["from"] ?
          "" + this._from.toScript() + this.whiteSpace[3].toScript() : "")
        + (this._state["addresses"] ?
          "" + this._addresses.toScript() + this.whiteSpace[4].toScript() : "")
        + (this._state["mime"] ?
          "" + this._mime.toScript() + this.whiteSpace[5].toScript() : "")
        + (this._state["handle"] ?
          "" + this._handle.toScript() + this.whiteSpace[6].toScript() : "")
        + this._reason.toScript()
        + this.semicolon.toScript();
    };

  // ------------------------------------------------------------------------------------/



  function SieveVacationDays(docshell, id) {
    // call super constructor.
    SieveAbstractElement.call(this, docshell, id);

    // Initialize defaults...
    this.whitespace = this._createByName("whitespace", " ");
    this.days = this._createByName("number");
  }

  SieveVacationDays.prototype = Object.create(SieveAbstractElement.prototype);
  SieveVacationDays.prototype.constructor = SieveVacationDays;

  SieveVacationDays.nodeName = function () {
    return "vacation-days";
  };

  SieveVacationDays.nodeType = function () {
    return "vacation-days";
  };

  SieveVacationDays.isElement
    = function (parser, lexer) {
      if (parser.startsWith(":days"))
        return true;

      return false;
    };

  SieveVacationDays.prototype.init
    = function (parser) {

      parser.extract(":days");

      // Parse values
      this.whitespace.init(parser);
      this.days.init(parser);

      return this;
    };

  SieveVacationDays.prototype.toScript
    = function () {
      return ":days" + this.whitespace.toScript() + this.days.toScript();
    };

  // ---------------------------------------------------------------------------

  function SieveVacationSubject(docshell, id) {
    // call super constructor.
    SieveAbstractElement.call(this, docshell, id);

    this.whitespace = this._createByName("whitespace", " ");
    this.subject = this._createByName("string");
  }

  SieveVacationSubject.prototype = Object.create(SieveAbstractElement.prototype);
  SieveVacationSubject.prototype.constructor = SieveVacationSubject;

  SieveVacationSubject.nodeName = function () {
    return "vacation-subject";
  };

  SieveVacationSubject.nodeType = function () {
    return "vacation-subject";
  };

  SieveVacationSubject.isElement
    = function (parser, lexer) {
      if (parser.startsWith(":subject"))
        return true;

      return false;
    };

  SieveVacationSubject.prototype.init
    = function (parser) {
      parser.extract(":subject");

      this.whitespace.init(parser);
      this.subject.init(parser);

      return this;
    };

  SieveVacationSubject.prototype.toScript
    = function () {
      return ":subject" + this.whitespace.toScript() + this.subject.toScript();
    };


  // ---------------------------------------------------------------------------

  function SieveVacationFrom(docshell, id) {
    // call super constructor.
    SieveAbstractElement.call(this, docshell, id);

    // the default matchtype is by definition a :is
    this.whitespace = this._createByName("whitespace", " ");
    this.from = this._createByName("string");
  }

  SieveVacationFrom.prototype = Object.create(SieveAbstractElement.prototype);
  SieveVacationFrom.prototype.constructor = SieveVacationFrom;

  SieveVacationFrom.nodeName = function () {
    return "vacation-from";
  };

  SieveVacationFrom.nodeType = function () {
    return "vacation-from";
  };

  SieveVacationFrom.isElement
    = function (parser, lexer) {
      if (parser.startsWith(":from"))
        return true;

      return false;
    };

  SieveVacationFrom.prototype.init
    = function (parser) {
      parser.extract(":from");

      this.whitespace.init(parser);
      this.from.init(parser);

      return this;
    };

  SieveVacationFrom.prototype.toScript
    = function () {
      return ":from" + this.whitespace.toScript() + this.from.toScript();
    };


  // ---------------------------------------------------------------------------

  function SieveVacationAddresses(docshell, id) {
    // call super constructor.
    SieveAbstractElement.call(this, docshell, id);

    this.whitespace = this._createByName("whitespace", " ");
    this.addresses = this._createByName("stringlist");
  }

  SieveVacationAddresses.prototype = Object.create(SieveAbstractElement.prototype);
  SieveVacationAddresses.prototype.constructor = SieveVacationAddresses;

  SieveVacationAddresses.nodeName = function () {
    return "vacation-addresses";
  };

  SieveVacationAddresses.nodeType = function () {
    return "vacation-addresses";
  };

  SieveVacationAddresses.isElement
    = function (parser, lexer) {
      if (parser.startsWith(":addresses"))
        return true;

      return false;
    };

  SieveVacationAddresses.prototype.init
    = function (parser) {
      parser.extract(":addresses");

      this.whitespace.init(parser);
      this.addresses.init(parser);

      return this;
    };

  SieveVacationAddresses.prototype.toScript
    = function () {
      return ":addresses" + this.whitespace.toScript() + this.addresses.toScript();
    };

  // ---------------------------------------------------------------------------

  function SieveVacationMime(docshell, id) {
    // call super constructor.
    SieveAbstractElement.call(this, docshell, id);
  }

  SieveVacationMime.prototype = Object.create(SieveAbstractElement.prototype);
  SieveVacationMime.prototype.constructor = SieveVacationMime;

  SieveVacationMime.nodeName = function () {
    return "vacation-mime";
  };

  SieveVacationMime.nodeType = function () {
    return "vacation-mime";
  };

  SieveVacationMime.isElement
    = function (parser, lexer) {
      if (parser.startsWith(":mime"))
        return true;

      return false;
    };

  SieveVacationMime.prototype.init
    = function (parser) {
      parser.extract(":mime");

      return this;
    };

  SieveVacationMime.prototype.toScript
    = function () {
      return ":mime";
    };

  // ---------------------------------------------------------------------------

  function SieveVacationHandle(docshell, id) {
    // call super constructor.
    SieveAbstractElement.call(this, docshell, id);

    this.whitespace = this._createByName("whitespace", " ");
    this.handle = this._createByName("string");

  }

  SieveVacationHandle.prototype = Object.create(SieveAbstractElement.prototype);
  SieveVacationHandle.prototype.constructor = SieveVacationHandle;

  SieveVacationHandle.nodeName = function () {
    return "vacation-handle";
  };

  SieveVacationHandle.nodeType = function () {
    return "vacation-handle";
  };

  SieveVacationHandle.isElement
    = function (parser, lexer) {
      if (parser.startsWith(":handle"))
        return true;

      return false;
    };

  SieveVacationHandle.prototype.init
    = function (parser) {
      parser.extract(":handle");

      this.whitespace.init(parser);
      this.handle.init(parser);

      return this;
    };

  SieveVacationHandle.prototype.toScript
    = function () {
      return ":handle" + this.whitespace.toScript() + this.handle.toScript();
    };


  if (!SieveLexer)
    throw new Error("Could not register variables extension");

  SieveLexer.register(SieveVacationDays);
  SieveLexer.register(SieveVacationSubject);
  SieveLexer.register(SieveVacationFrom);
  SieveLexer.register(SieveVacationAddresses);
  SieveLexer.register(SieveVacationMime);
  SieveLexer.register(SieveVacationHandle);

  SieveLexer.register(SieveVacation);

})(window);
