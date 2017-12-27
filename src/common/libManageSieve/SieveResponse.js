/*
 * The contents of this file is licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via email
 * from the author. Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 *
 * Contibutors:
 *   Max Dittrich
 *
 */

// Enable Strict Mode
"use strict";

(function (exports) {

  /* global SieveResponseCodeReferral */
  /* global SieveResponseCodeSasl */
  /* global SieveResponseCode */

  const CHAR_B = [66, 98];
  const CHAR_E = [69, 101];
  const CHAR_N = [78, 110];
  const CHAR_O = [79, 111];
  const CHAR_K = [75, 107];
  const CHAR_Y = [89, 121];

  const TOKEN_OK = [CHAR_O, CHAR_K];
  const TOKEN_BYE = [CHAR_B, CHAR_Y, CHAR_E];
  const TOKEN_NO = [CHAR_N, CHAR_O];

  /**
   * This class implements a generic response handler for simple sieve requests.
   *
   * Simple requests just indicate, wether the command succeded or not. They
   * return only status information, and do not contain any data relevant for
   * the user.
   *
   * @see SieveResponseParser
   *
   * @param {SieveResponseParser} parser
   *  a SieveResponseParser object containing the response sent by the server.
   *
   * @constructor
   */
  function SieveSimpleResponse(parser) {
    /*
     * Examples for simple responses
     *
     * 'NO (0000) "Message"\r\n'
     * 'BYE (0000) {4+}\r\n1234\r\n'
     * 'NO \"Message\"\r\n'
     * 'BYE {4+}\r\n1234\r\n'
     * 'NO (0000)\r\n'
     */

    this.message = "";
    this.responseCode = [];

    // OK
    if (parser.startsWith(TOKEN_OK)) {
      this.response = 0;
      parser.extract(TOKEN_OK.length);
    }
    // BYE
    else if (parser.startsWith(TOKEN_BYE)) {
      this.response = 1;
      parser.extract(TOKEN_BYE.length);
    }
    // NO
    else if (parser.startsWith(TOKEN_NO)) {
      this.response = 2;
      parser.extract(TOKEN_NO.length);
    }
    else
      throw new Error("NO, OK or BYE expected in " + parser.getData());

    // is there a Message?
    if (parser.isLineBreak()) {
      parser.extractLineBreak();
      return;
    }

    // remove the space
    parser.extractSpace();

    // we found "(" so we got an responseCode, they are extremely ugly...
    if (parser.startsWith([[40]])) {
      // remove the opening bracket...
      parser.extract(1);
      // ... but remember it
      let nesting = 0;

      // According to the RFC the first tag must be always an atom, but in...
      // ... reality this is not true. Cyrus servers send it as a string
      if (parser.isString())
        this.responseCode.push(parser.extractString());
      else
        this.responseCode.push(parser.extractToken([32, 41]));

      while (parser.isSpace()) {
        parser.extractSpace();

        // We might stumbe upon opening brackets...
        if (parser.startsWith([[40]])) {
          // ... oh we did, so increase our nesting counter.
          parser.extract(1);
          nesting++;
        }

        // ok, more tokens, more fun...
        // ... it could be either a string, a number, an atom or even a backet
        if (parser.isString())
          this.responseCode.push(parser.extractString());
        else
          this.responseCode.push(parser.extractToken([32, 41]));

        // is it a closing bracket
        if (parser.startsWith([[41]]) && nesting) {
          parser.extract(1);
          nesting--;
        }
      }

      if (!parser.startsWith([[41]]))
        throw new Error("Closing Backets expected in " + parser.getData());

      parser.extract(1);

      if (parser.isLineBreak()) {
        parser.extractLineBreak();
        return;
      }

      parser.extractSpace();
    }

    this.message = parser.extractString();

    parser.extractLineBreak();
  }

  SieveSimpleResponse.prototype.message = null;
  SieveSimpleResponse.prototype.responseCode = null;
  SieveSimpleResponse.prototype.response = null;

  SieveSimpleResponse.prototype.getMessage
    = function () {
      if ((typeof (this.message) === 'undefined') || (this.message === null))
        throw new Error("Message not Initialized");

      return this.message;
    };

  SieveSimpleResponse.prototype.hasError
    = function () {
      if ((typeof (this.response) === 'undefined') || (this.response === null))
        throw new Error("response not Initialized");

      if (this.response === 0)
        return false;

      return true;
    };

  SieveSimpleResponse.prototype.getResponse
    = function () {
      return this.response;
    };

  SieveSimpleResponse.prototype.getResponseCode
    = function () {
      if ((typeof (this.responseCode) === 'undefined') || (this.responseCode === null))
        throw new Error("Response Code not Initialized");

      let code = "";
      if (this.responseCode.length)
        code = this.responseCode[0].toUpperCase();

      switch (code) {
        case "REFERRAL":
          return new SieveResponseCodeReferral(this.responseCode);

        case "SASL":
          return new SieveResponseCodeSasl(this.responseCode);
      }

      // TODO Implement these Response codes:
      // "ACTIVE" / "NONEXISTENT" / "ALREADYEXISTS" / "WARNINGS"
      return new SieveResponseCode(this.responseCode);
    };

  /**
   * Parses the capabilites posted by the ManageSieve server upon a client
   * connection, after successful STARTTLS and AUTHENTICATE or by issuing the
   * CAPABILITY command.
   *
   * @see {SieveCapabilitiesRequest}
   *
   * @param {SieveResponseParser} parser
   *   a parser containing the response sent by the server
   *
   * @constructor
   */
  function SieveCapabilitiesResponse(parser) {
    this.details = {
      implementation: null,
      version: 0,

      extensions: {},
      tls: false,
      sasl: {},

      maxredirects: -1,
      owner: "",
      notify: {},
      language: "i-default",

      compatibility: {}
    };

    while (parser.isString()) {
      let tag = parser.extractString();

      let value = "";
      if (parser.isLineBreak() === false) {
        parser.extractSpace();
        value = parser.extractString();
      }

      parser.extractLineBreak();

      switch (tag.toUpperCase()) {
        case "STARTTLS":
          this.details.tls = true;
          break;
        case "IMPLEMENTATION":
          this.details.implementation = value;
          break;
        case "SASL":
          this.details.sasl = value.split(" ");
          break;
        case "SIEVE":
          var extensions = value.split(" ");
          this.details.extensions = {};

          for (let i = 0; i < extensions.length; ++i)
            this.details.extensions["" + extensions[i]] = true;

          break;
        case "VERSION":
          this.details.version = parseFloat(value);
          if (this.details.version < 1.0)
            break;

          // Version 1.0 introduced rename, noop and checkscript
          this.details.compatibility.renamescript = true;
          this.details.compatibility.noop = true;
          this.details.compatibility.checkscript = true;

          break;
        case "MAXREDIRECTS":
          this.details.maxredirects = parseInt(value, 10);
          break;
        case "LANGUAGE":
          this.details.language = value;
          break;
        case "NOTIFY":
          this.details.notify = value.split(" ");
          break;
        case "OWNER":
          this.details.owner = value;
          break;
        case "RENAME":
          this.details.compatibility.renamescript = true;
          break;
        case "NOOP":
          this.details.compatibility.noop = true;
          break;
      }
    }

    if (this.details.implementation === null)
      throw new Error("Server did not provide an Implementation string.");

    // invoke inheritted Object constructor...
    SieveSimpleResponse.call(this, parser);
  }

  // Inherrit properties from SieveSimpleResponse
  SieveCapabilitiesResponse.prototype = Object.create(SieveSimpleResponse.prototype);
  SieveCapabilitiesResponse.prototype.constructor = SieveCapabilitiesResponse;

  /**
   * Returns a structure which contains all the details on the server's capabilities
   * like the implementation, version, extension, sasl mechanisms etc.
   *
   * @return {Object}
   *   the object which the capabilities.
   */
  SieveCapabilitiesResponse.prototype.getDetails
    = function () { return this.details; };

  /**
   * Returns the servers implementation details.
   *
   * This is a custom string which typically identifies the server's implementation
   * as well a the version.
   *
   * You should never attempt to parse this string.
   *
   * @returns {String}
   *   the servers implementation details
   */
  SieveCapabilitiesResponse.prototype.getImplementation
    = function () { return this.details.implementation; };

  /**
   * Returns the list of supported sasl mechanisms.
   *
   * They may change after a secure channel was established.
   */
  SieveCapabilitiesResponse.prototype.getSasl
    = function () { return this.details.sasl; };

  SieveCapabilitiesResponse.prototype.getExtensions
    = function (asString) {
      if (!asString)
        return this.details.extensions;

      let result = "";

      for (let item in this.details.extensions)
        result += item + " ";

      return result;

    };

  /**
   * Indicates wether or not TLS is supported by this implementation.
   *
   * Note: After the command STARTTLS or AUTHENTICATE completes successfully, this
   * value is always false.
   *
   * @return {Boolean}
   *   true if TLS is supported, false if not.
   */
  SieveCapabilitiesResponse.prototype.getTLS
    = function () { return this.details.tls; };

  /**
   * Inorder to maintain compatibility to older implementations, the servers
   * should state their compatibility level upon login.
   *
   * A value of "0" indicates, minimal ManageSieve support. This means the server
   * implements the commands AUTHENTICATE, STARTTLS, LOGOUT, CAPABILITY, HAVESPACE,
   * PUTSCRIPT, LISTSCRIPTS, SETACTIVE, GETSCRIPT and DELETESCRIPT
   *
   * A value of "1.0" adds to the minimal ManageSieve Support the commands
   * RENAMESCRIPT, CHECKSCRIPT and NOOP.
   *
   * @return {float}
   *   a positive float describing the compatibility level of the ManageSieve server.
   */
  SieveCapabilitiesResponse.prototype.getVersion
    = function () { return this.details.version; };

  /**
   * Returns the limit on the number of Sieve "redirect" actions a script can
   * perform during a single evaluation.
   *
   * Note, this is different from the total number of "redirect" actions a
   * script can contain.
   *
   * @return {int}
   *   a non-negative number of redirects, or -1 for infinite redirects
   */
  SieveCapabilitiesResponse.prototype.getMaxRedirects
    = function () { return this.details.maxredirects; };

  /**
   * Returns a string array of URI schema parts for supported notification
   * methods. This capability is be specified, if the Sieve implementation
   * supports the "enotify" extension.
   *
   *  @return {String[]}
   *    The schema parts as string array
   */
  SieveCapabilitiesResponse.prototype.getNotify
    = function () { return this.details.notify; };

  /**
   * Returns the language currently used for human readable error messages.
   * If this capability is not returned, the "i-default" [RFC2277] language is
   * assumed.
   *
   * Note that the current language might be per-user configurable (i.e. it
   * might change after authentication)
   *
   * @return {String}
   *   a [RFC4646] conform language tag as string
   */
  SieveCapabilitiesResponse.prototype.getLanguage
    = function () { return this.details.language; };

  /**
   * Returns a list with sieve commands which are supported by this implementation
   * and are not part of the absolute minimal ManageSieve support.
   *
   * The server advertises such additional commands either by explicitely
   * naming the command or by using the compatiblility level capability.
   *
   * Examples are RENAME, NOOP and CHECKSCRIPT.
   *
   * @return {Object}
   *   an associative array containing additional sieve commands
   */
  SieveCapabilitiesResponse.prototype.getCompatibility
    = function () { return this.details.compatibility; };

  /**
   * Gets the name of the logged in user.
   *
   * Note: This value is only avaiable after AUTHENTICATE command succeeds
   *
   * @return {String}
   *   a String containing the username
   */
  SieveCapabilitiesResponse.prototype.getOwner
    = function () { return this.details.owner; };


  //* **************************************************************************//

  function SieveListScriptResponse(parser) {
    //    sieve-name    = string
    //    string        = quoted / literal
    //    (sieve-name [SP "ACTIVE"] CRLF) response-oknobye

    this.scripts = [];
    let i = -1;

    while (parser.isString()) {
      i++;

      this.scripts[i] = {};
      this.scripts[i].script = parser.extractString();

      if (parser.isLineBreak()) {
        this.scripts[i].active = false;
        parser.extractLineBreak();

        continue;
      }

      parser.extractSpace();

      if (parser.extractToken([13]).toUpperCase() !== "ACTIVE")
        throw new Error("Error \"ACTIVE\" expected");

      this.scripts[i].active = true;
      parser.extractLineBreak();

    }

    // invoke inheritted Object constructor...
    SieveSimpleResponse.call(this, parser);
  }

  // Inherrit properties from SieveSimpleResponse
  SieveListScriptResponse.prototype = Object.create(SieveSimpleResponse.prototype);
  SieveListScriptResponse.prototype.constructor = SieveListScriptResponse;

  SieveListScriptResponse.prototype.getScripts
    = function () { return this.scripts; };


  //* ************************************
  function SieveSaslLoginResponse() {
    this.state = 0;
  }

  SieveSaslLoginResponse.prototype = Object.create(SieveSimpleResponse.prototype);
  SieveSaslLoginResponse.prototype.constructor = SieveSaslLoginResponse;

  SieveSaslLoginResponse.prototype.add
    = function (parser) {

      if ((this.state === 0) && (parser.isString())) {
        // String should be 'Username:' or something similar
        parser.extractString();
        parser.extractLineBreak();

        this.state++;
        return;
      }

      if ((this.state === 1) && (parser.isString())) {
        // String should be equivalten to 'Password:'
        parser.extractString();
        parser.extractLineBreak();

        this.state++;
        return;
      }

      if (this.state === 2) {
        // Should be either a NO, BYE or OK
        this.state = 4;
        SieveSimpleResponse.call(this, parser);
        return;
      }

      // is it an error message?
      try {
        SieveSimpleResponse.call(this, parser);
      }
      catch (ex) {
        throw new Error('Illegal State:' + this.state + ' / ' + parser.getData(0) + '\n' + ex);
      }

      this.state = 4;
      return;
    };

  SieveSaslLoginResponse.prototype.getState
    = function () { return this.state; };


  /**
   * @author Thomas Schmid
   * @author Max Dittrich
   * @constructor
   */
  function SieveSaslCramMd5Response() {
    this.state = 0;
  }

  SieveSaslCramMd5Response.prototype = Object.create(SieveSimpleResponse.prototype);
  SieveSaslCramMd5Response.prototype.constructor = SieveSaslCramMd5Response;

  SieveSaslCramMd5Response.prototype.add
    = function (parser) {

      if ((this.state === 0) && (parser.isString())) {
        // The challenge is contained within a string
        this.challenge = parser.extractString();
        parser.extractLineBreak();

        this.state++;

        return;
      }

      if (this.state === 1) {
        // Should be either a NO, BYE or OK
        this.state = 4;

        // Invoke the interited constructor to parse the rest of the message
        SieveSimpleResponse.call(this, parser);
        return;
      }

      throw new Error('Illegal State:' + this.state + ' / ' + parser.getData());
    };

  SieveSaslCramMd5Response.prototype.getState
    = function () { return this.state; };

  SieveSaslCramMd5Response.prototype.getChallenge
    = function () {
      if (this.state < 1)
        throw new Error("Illegal State, request not completed");

      return this.challenge;
    };

  /* ********************************************************
      literal               = "{" number  "+}" CRLF *OCTET
      quoted                = <"> *1024QUOTED-CHAR <">
      response-getscript    = [string CRLF] response-oknobye
      string                = quoted / literal
  **********************************************************/

  function SieveGetScriptResponse(scriptName, parser) {
    /** @private, @type {String} */
    this.scriptName = scriptName;
    /** @private, @type {String} */
    this.scriptBody = "";

    if (parser.isString()) {
      this.scriptBody = parser.extractString();
      parser.extractLineBreak();
    }

    // invoke inheritted Object constructor...
    SieveSimpleResponse.call(this, parser);
  }

  // Inherrit properties from SieveSimpleResponse
  SieveGetScriptResponse.prototype = Object.create(SieveSimpleResponse.prototype);
  SieveGetScriptResponse.prototype.constructor = SieveGetScriptResponse;

  /**
   * Contains the requested sieve script.
   * Keep in mind scripts can't be locked, so several clients may manipulate
   * a script at the same time.
   *
   * @return {String} returns the requested script's content
   */
  SieveGetScriptResponse.prototype.getScriptBody
    = function () { return this.scriptBody; };

  /**
   * @return {String} Containing the script's Name.
   */
  SieveGetScriptResponse.prototype.getScriptName
    = function () { return this.scriptName; };

  /**
   * Parses responses for SCRAM-SHA-1 authentication.
   *
   * SCRAM is a secure client first authentication mechanism. The client
   * callanges the server and descides if the connection is trustworthy.
   *
   * This requires a way mor logic on the client than with simple authentication
   * mechanisms. It also requires more communication, in total two roundtrips.
   */

  function SieveSaslScramSha1Response() {
    this.state = 0;
  }

  SieveSaslScramSha1Response.prototype = Object.create(SieveSimpleResponse.prototype);
  SieveSaslScramSha1Response.prototype.constructor = SieveSaslScramSha1Response;

  /**
   * Parses the server-first-message it is defined to be:
   *   [reserved-mext ","] nonce "," salt "," iteration-count ["," extensions]
   *
   * Where
   *  reserved-mext   : "m=" 1*(value-char)
   *  nonce           : "r=" c-nonce
   *  salt            : "s=" base64(salt)
   *  iteration-count : "i=" posit-number
   *
   * Extensions are optional and for future use.
   * Neither c-nonce nor salt can contain a "," character
   *
   * @param {SieveResponseParser} parser
   *   the response parser which contains the response to be parsed.
   * @returns {void}
   *
   * @private
   */
  SieveSaslScramSha1Response.prototype._parseFirstMessage
    = function (parser) {
      this._serverFirstMessage = parser.convertFromBase64(parser.extractString());

      let tokens = this._serverFirstMessage.split(',');

      // Test for the reserved-mext token. If it is existant, we just skip it
      if ((tokens[0].length <= 2) || tokens[0][0] === "m")
        tokens.shift();

      // Extract the nonce
      if ((tokens[0].length <= 2) || (tokens[0][0] !== "r"))
        throw new Error("Nonce missing");

      this._nonce = tokens[0].substr(2);


      if ((tokens[1].length <= 2) || (tokens[1][0] !== "s"))
        throw new Error("Salt missing");

      this._salt = parser.convertFromBase64(tokens[1].substr(2));


      if ((tokens[2].length <= 2) || (tokens[2][0] !== "i"))
        throw new Error("Iteration Count missing");

      this._iter = parseInt(tokens[2].substr(2), 10);
    };

  /**
   * Parses the server-final-message. It is defined to be:
   *   (server-error / verifier) ["," extensions]
   *
   * Where
   *  server-error    : "e=" server-error-value
   *  verifier        : "v=" base64(ServerSignature)
   *
   * Extensions are optional and for future use.
   * As suggested by the RFC they will be ignored
   *
   * @param {SieveResponseParser} parser
   *   the parser which should be to process the message.
   * @returns {void}
   */
  SieveSaslScramSha1Response.prototype._parseFinalMessage
    = function (parser) {

      let data = parser.extractString();
      // server-final-message = (server-error / verifier) ["," extensions]
      let token = parser.convertFromBase64(data).split(",");

      if (token[0].length <= 2)
        throw new Error("Response expected but got : " + data);

      // server-error = "e="
      if (token[0][0] === "e") {
        this._serverError = token[0].substr(2);
        return;
      }

      // verifier = "v=" base64
      if (token[0][0] === "v") {
        this._verifier = parser.convertFromBase64(token[0].substr(2));
        return;
      }

      throw new Error("Invalid Final message");
    };

  SieveSaslScramSha1Response.prototype.add
    = function (parser) {

      if ((this.state === 0) && (parser.isString())) {
        this._parseFirstMessage(parser);
        parser.extractLineBreak();

        this.state++;

        return;
      }


      // There are two valid responses...
      // ... either the Server sends us something like that:
      //
      //   S: cnNwYXV0aD1lYTQwZjYwMzM1YzQyN2I1NTI3Yjg0ZGJhYmNkZmZmZA==
      //   C: ""
      //   S: OK

      if ((this.state === 1) && (parser.isString())) {

        this._parseFinalMessage(parser);
        parser.extractLineBreak();

        this.state++;

        return;
      }

      // Or the response is wrapped into the ResponseCode in order to save...
      // ... roundtip time so we endup with the following
      //
      // S: OK (SASL "cnNwYXV0aD1lYTQwZjYwMzM1YzQyN2I1NTI3Yjg0ZGJhYmNkZmZmZA==")

      if (this.state === 1) {
        SieveSimpleResponse.call(this, parser);

        this._parseFinalMessage(this.getResponseCode().getSasl(), parser);

        this.state = 4;

        return;
      }

      if (this.state === 2) {
        SieveSimpleResponse.call(this, parser);
        this.state = 4;
        return;
      }

      throw new Error('Illegal State:' + this.state + ' / ' + parser.getData());
    };

  SieveSaslScramSha1Response.prototype.getState
    = function () { return this.state; };

  SieveSaslScramSha1Response.prototype.getSalt
    = function () {
      if (this.state < 1)
        throw new Error("Illegal State, request not completed");

      return this._salt;
    };

  SieveSaslScramSha1Response.prototype.getIterationCounter
    = function () {
      if (this.state < 1)
        throw new Error("Illegal State, request not completed");

      return this._iter;
    };

  SieveSaslScramSha1Response.prototype.getNonce
    = function () {
      if (this.state < 1)
        throw new Error("Illegal State, request not completed");

      return this._nonce;
    };

  SieveSaslScramSha1Response.prototype.getServerFirstMessage
    = function () {
      if (this.state < 1)
        throw new Error("Illegal State, request not completed");

      return this._serverFirstMessage;
    };

  SieveSaslScramSha1Response.prototype.getServerError
    = function () {
      if (this.state < 2)
        throw new Error("Illegal State, request not completed");

      return this._serverError;
    };

  SieveSaslScramSha1Response.prototype.getVerifier
    = function () {
      if (this.state < 2)
        throw new Error("Illegal State, request not completed");

      return this._verifier;
    };


  if (exports.EXPORTED_SYMBOLS) {
    exports.EXPORTED_SYMBOLS.push("SieveSimpleResponse");
    exports.EXPORTED_SYMBOLS.push("SieveCapabilitiesResponse");
    exports.EXPORTED_SYMBOLS.push("SieveListScriptResponse");
    exports.EXPORTED_SYMBOLS.push("SieveSaslLoginResponse");
    exports.EXPORTED_SYMBOLS.push("SieveSaslCramMd5Response");
    exports.EXPORTED_SYMBOLS.push("SieveGetScriptResponse");
    exports.EXPORTED_SYMBOLS.push("SieveSaslScramSha1Response");
  }

  exports.SieveSimpleResponse = SieveSimpleResponse;
  exports.SieveCapabilitiesResponse = SieveCapabilitiesResponse;
  exports.SieveListScriptResponse = SieveListScriptResponse;
  exports.SieveSaslLoginResponse = SieveSaslLoginResponse;
  exports.SieveSaslCramMd5Response = SieveSaslCramMd5Response;
  exports.SieveGetScriptResponse = SieveGetScriptResponse;
  exports.SieveSaslScramSha1Response = SieveSaslScramSha1Response;

})(this);
