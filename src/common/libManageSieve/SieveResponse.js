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

(function (exports) {

  // Enable Strict Mode
  "use strict";

  const {
    SieveResponseCode,
    SieveResponseCodeSasl,
    SieveResponseCodeReferral
  } = require("./SieveResponseCodes.js");

  const CHAR_LOWERCASE_B = 66;
  const CHAR_UPPERCASE_B = 98;
  const CHAR_B = [CHAR_LOWERCASE_B, CHAR_UPPERCASE_B];

  const CHAR_LOWERCASE_E = 69;
  const CHAR_UPPERCASE_E = 101;
  const CHAR_E = [CHAR_LOWERCASE_E, CHAR_UPPERCASE_E];

  const CHAR_LOWERCASE_N = 78;
  const CHAR_UPPERCASE_N = 110;
  const CHAR_N = [CHAR_LOWERCASE_N, CHAR_UPPERCASE_N];

  const CHAR_LOWERCASE_O = 79;
  const CHAR_UPPERCASE_O = 111;
  const CHAR_O = [CHAR_LOWERCASE_O, CHAR_UPPERCASE_O];

  const CHAR_LOWERCASE_K = 75;
  const CHAR_UPPERCASE_K = 107;
  const CHAR_K = [CHAR_LOWERCASE_K, CHAR_UPPERCASE_K];

  const CHAR_LOWERCASE_Y = 89;
  const CHAR_UPPERCASE_Y = 121;
  const CHAR_Y = [CHAR_LOWERCASE_Y, CHAR_UPPERCASE_Y];

  const CHAR_BRACKET_OPEN = 40;
  const CHAR_BRACKET_CLOSE = 41;
  const CHAR_SPACE = 32;
  const CHAR_CR = 13;

  const TOKEN_OK = [CHAR_O, CHAR_K];
  const TOKEN_BYE = [CHAR_B, CHAR_Y, CHAR_E];
  const TOKEN_NO = [CHAR_N, CHAR_O];

  const SIEVE_VERSION_1 = 1.0;

  const ONE_CHAR = 1;

  const RESPONSE_OK = 0;
  const RESPONSE_BYE = 1;
  const RESPONSE_NO = 2;

  /**
   * This class implements a generic response handler for simple sieve requests.
   *
   * Simple requests just indicate, wether the command succeded or not. They
   * return only status information, and do not contain any data relevant for
   * the user.
   *
   * @see SieveResponseParser
   *
   * @param {SieveResponseParser} [parser]
   *  a SieveResponseParser object containing the response sent by the server.
   *
   * @constructor
   */
  class SieveSimpleResponse {

    /**
     * Initializes the simple response object.
     */
    constructor() {
      this.message = null;
      this.responseCode = null;
      this.response = null;
    }

    /**
     * Parses the server's status response. It indicates if the command succeeded or failed.
     *
     * @param {SieveAbstractResponseParser} parser
     *  a SieveResponseParser object containing the response sent by the server.
     * @returns {SieveSimpleResponse}
     *   a self reference
     */
    parse(parser) {
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
        this.response = RESPONSE_OK;
        parser.extract(TOKEN_OK.length);
      }
      // BYE
      else if (parser.startsWith(TOKEN_BYE)) {
        this.response = RESPONSE_BYE;
        parser.extract(TOKEN_BYE.length);
      }
      // NO
      else if (parser.startsWith(TOKEN_NO)) {
        this.response = RESPONSE_NO;
        parser.extract(TOKEN_NO.length);
      }
      else
        throw new Error("NO, OK or BYE expected in " + parser.getData());

      // is there a Message?
      if (parser.isLineBreak()) {
        parser.extractLineBreak();
        return this;
      }

      // remove the space
      parser.extractSpace();

      // we found "(" so we got an responseCode, they are extremely ugly...
      if (parser.startsWith([[CHAR_BRACKET_OPEN]])) {
        // remove the opening bracket...
        parser.extract(ONE_CHAR);
        // ... but remember it
        let nesting = 0;

        // According to the RFC the first tag must be always an atom, but in...
        // ... reality this is not true. Cyrus servers send it as a string
        if (parser.isString())
          this.responseCode.push(parser.extractString());
        else
          this.responseCode.push(parser.extractToken([CHAR_SPACE, CHAR_BRACKET_CLOSE]));

        while (parser.isSpace()) {
          parser.extractSpace();

          // We might stumbe upon opening brackets...
          if (parser.startsWith([[CHAR_BRACKET_OPEN]])) {
            // ... oh we did, so increase our nesting counter.
            parser.extract(ONE_CHAR);
            nesting++;
          }

          // ok, more tokens, more fun...
          // ... it could be either a string, a number, an atom or even a backet
          if (parser.isString())
            this.responseCode.push(parser.extractString());
          else
            this.responseCode.push(parser.extractToken([CHAR_SPACE, CHAR_BRACKET_CLOSE]));

          // is it a closing bracket
          if (parser.startsWith([[CHAR_BRACKET_CLOSE]]) && nesting) {
            parser.extract(ONE_CHAR);
            nesting--;
          }
        }

        if (!parser.startsWith([[CHAR_BRACKET_CLOSE]]))
          throw new Error("Closing Backets expected in " + parser.getData());

        parser.extract(ONE_CHAR);

        if (parser.isLineBreak()) {
          parser.extractLineBreak();
          return this;
        }

        parser.extractSpace();
      }

      this.message = parser.extractString();

      parser.extractLineBreak();

      return this;
    }

    /**
     * The server may return a human readable (error) message
     * @returns {String}
     *   the human readable message
     */
    getMessage() {
      if ((typeof (this.message) === 'undefined') || (this.message === null))
        throw new Error("Message not Initialized");

      return this.message;
    }

    /**
     * Checks if the request failed. In this case the server returns an error
     * instead of the expected response.
     * @returns {Boolean}
     *   true in case the request succeeded, false in case it failed due to an error.
     */
    hasError() {
      if ((typeof (this.response) === 'undefined') || (this.response === null))
        throw new Error("response not Initialized");

      if (this.response === RESPONSE_OK)
        return false;

      return true;
    }

    /**
     * The server reponds to a message with eiher an ok, bye or no.
     *
     * @returns {int}
     *   the servers response. It is set to 0 in case of an OK, to 1 in case of a BYE and to 3 incase of a NO
     */
    getResponse() {
      return this.response;
    }

    /**
     * A response code is used by the server to narrow down an error or to give hints.
     *
     * E.g.: In case the server wants to do a referal. It will answer a request with a BYE
     * and adds the details to the REFERAL response code.
     *
     * Or in case the user tries do delete the active script. Then the server responds with
     * a NO and will an response code "ACTIVE".
     *
     * In case of putting a script to the server it may respond with an OK and a WARNING
     * response code. Which means the script contains warnings which should addressed by the
     * server.
     *
     * @returns {SieveResponseCode}
     *   the response code for the current request.
     */
    getResponseCode() {
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

      // TODO Implement all of the Response codes:
      // "ACTIVE" / "NONEXISTENT" / "ALREADYEXISTS" / "WARNINGS" /AUTH-TOO-WEAK /TRANSITION-NEEDED /TRYLATER/ ENCRYPT-NEEDED / QUOTA / TAG
      return new SieveResponseCode(this.responseCode);
    }
  }

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
  class SieveCapabilitiesResponse extends SieveSimpleResponse {

    /**
     * @inheritDoc
     */
    constructor() {

      super();

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
    }

    /**
     * Parses the sieve extensions string. It is a space separated list of strings.
     * @param {String} value
     *   the string which should be parsed
     * @returns  {Object.<String, Boolean>}
     *   a map with pairs of extension name and activation status.
     */
    parseSieveExtensions(value) {
      let extensions = value.split(" ");
      let result = {};

      for (let i = 0; i < extensions.length; ++i)
        result["" + extensions[i]] = true;

      return result;
    }

    /**
     * @inheritDoc
     */
    parse(parser) {
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
            this.details.extensions = this.parseSieveExtensions(value);
            break;
          case "VERSION":
            this.details.version = parseFloat(value);
            if (this.details.version < SIEVE_VERSION_1)
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

      return super.parse(parser);
    }

    /**
     * Returns a structure which contains all the details on the server's capabilities
     * like the implementation, version, extension, sasl mechanisms etc.
     *
     * @return {Object}
     *   the object which the capabilities.
     */
    getDetails() { return this.details; }

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
    getImplementation() { return this.details.implementation; }

    /**
     * Returns the list of supported sasl mechanisms.
     *
     * They may change after a secure channel was established.
     * @returns {String}
     *   the sasl mechanism
     */
    getSasl() {
      return this.details.sasl;
    }

    /**
     * Returns the server's supported sieve language extensions
     *
     * @param {boolean} [asString]
     *   optional if true a string will be returned otherwise a
     *   structure with key value pairs.
     *
     * @returns {Object.<String,boolean>|String}
     *   the server's supported extension.
     */
    getExtensions(asString) {
      if (!asString)
        return this.details.extensions;

      let result = "";

      for (let item in this.details.extensions)
        result += item + " ";

      return result;
    }

    /**
     * Indicates wether or not TLS is supported by this implementation.
     *
     * Note: After the command STARTTLS or AUTHENTICATE completes successfully, this
     * value is always false.
     *
     * @return {Boolean}
     *   true if TLS is supported, false if not.
     */
    getTLS() { return this.details.tls; }

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
    getVersion() { return this.details.version; }

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
    getMaxRedirects() { return this.details.maxredirects; }

    /**
     * Returns a string array of URI schema parts for supported notification
     * methods. This capability is be specified, if the Sieve implementation
     * supports the "enotify" extension.
     *
     *  @return {String[]}
     *    The schema parts as string array
     */
    getNotify() { return this.details.notify; }

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
    getLanguage() { return this.details.language; }

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
    getCompatibility() { return this.details.compatibility; }

    /**
     * Gets the name of the logged in user.
     *
     * Note: This value is only avaiable after AUTHENTICATE command succeeds
     *
     * @return {String}
     *   a String containing the username
     */
    getOwner() { return this.details.owner; }
  }



  /**
   * Parses list script response.
   */
  class SieveListScriptResponse extends SieveSimpleResponse {

    /**
     * @inheritDoc
     */
    parse(parser) {
      //    sieve-name    = string
      //    string        = quoted / literal
      //    (sieve-name [SP "ACTIVE"] CRLF) response-oknobye

      let scripts = [];
      let i = -1;

      while (parser.isString()) {
        i++;

        scripts[i] = {};
        scripts[i].script = parser.extractString();

        if (parser.isLineBreak()) {
          scripts[i].active = false;
          parser.extractLineBreak();

          continue;
        }

        parser.extractSpace();

        if (parser.extractToken([CHAR_CR]).toUpperCase() !== "ACTIVE")
          throw new Error("Error \"ACTIVE\" expected");

        scripts[i].active = true;
        parser.extractLineBreak();

      }

      this.scripts = scripts;

      return super.parse(parser);
    }


    /**
     * An array of objects. Each object represents a script and
     * has at least a property named script which contains the
     * script name and a property named active which is either
     * true or false.
     *
     * @returns {object[]}
     *   an array of objects with the name and activation state for each script
     */
    getScripts() {
      return this.scripts;
    }
  }

  /**
   * Parses a get script response which returns the content
   * of a script
   */
  class SieveGetScriptResponse extends SieveSimpleResponse {

    /**
     * Parses a get script response.
     *
     * It is perfectly fine for the server to return an empty script.
     *
     * @param {String} name
     *   the script name, to simplify the handling as the server just returns the content.
     */
    constructor(name) {
      super();
      this.scriptName = name;
    }

    /**
     * @inheritDoc
     */
    parse(parser) {
      let body = "";
      //  [(<"> *1024QUOTED-CHAR <">) / ("{" number  "+}" CRLF *OCTET) CRLF] response-oknobye
      if (parser.isString()) {
        body = parser.extractString();
        parser.extractLineBreak();
      }

      this.scriptBody = body;

      return super.parse(parser);
    }

    /**
     * Contains the requested sieve script.
     * Keep in mind scripts can't be locked, so several clients may manipulate
     * a script at the same time.
     *
     * @return {String} returns the requested script's content
     */
    getScriptBody() { return this.scriptBody; }

    /**
     * @return {String} Containing the script's Name.
     */
    getScriptName() { return this.scriptName; }
  }


  /**
   * In contrast to a simple sieve request most of the sasl
   * requests are more complex and require multiple round trips
   * to be completed. Which means the response has to track
   * the state.
   *
   * This simple wrapper makes the resposne statefull.
   */
  class SieveStateFullResponse extends SieveSimpleResponse {

    /**
     * @inheritDoc
     */
    constructor() {
      super();
      this.state = 0;
    }

    /**
     * @returns {int}
     *  the current state as integer
     */
    getState() { return this.state; }

  }

  const STATE_LOGIN_USERNAME = 0;
  const STATE_LOGIN_PASSWORD = 1;
  const STATE_LOGIN_VERIFICATION = 2;
  const STATE_LOGIN_COMPLETED = 4;

  /**
   * SASL Login responses consist of multiple responses and requests.
   *
   * This means you need to call the parse method unless you reach the desired
   * state in the state engine or unless an exception is thrown.
   *
   * The state can be retrieved by calling getState.
   */
  class SieveSaslLoginResponse extends SieveStateFullResponse {

    /**
     * @inheritDoc
     */
    parse(parser) {

      if ((this.state === STATE_LOGIN_USERNAME) && (parser.isString())) {
        // String should be 'Username:' or something similar
        parser.extractString();
        parser.extractLineBreak();

        this.state = STATE_LOGIN_PASSWORD;
        return this;
      }

      if ((this.state === STATE_LOGIN_PASSWORD) && (parser.isString())) {
        // String should be equivalten to 'Password:'
        parser.extractString();
        parser.extractLineBreak();

        this.state = STATE_LOGIN_VERIFICATION;
        return this;
      }

      if (this.state === STATE_LOGIN_VERIFICATION) {
        // Should be either a NO, BYE or OK
        this.state = STATE_LOGIN_COMPLETED;

        super.parse(parser);
        return this;
      }

      // is it an error message?
      try {
        super.parse(parser);
      }
      catch (ex) {
        throw new Error('Illegal State:' + this.state + ' / ' + parser.getData(0) + '\n' + ex);
      }

      this.state = STATE_LOGIN_COMPLETED;
      return this;
    }
  }

  const STATE_CRAMMD5_INITIATED = 0;
  const STATE_CRAMMD5_CHALLANGED = 1;
  const STATE_CRAMMD5_COMPLETED = 4;

  /**
   * @author Thomas Schmid
   * @author Max Dittrich
   * @constructor
   */
  class SieveSaslCramMd5Response extends SieveStateFullResponse {

    /**
     * @inheritDoc
     */
    parse(parser) {

      if ((this.state === STATE_CRAMMD5_INITIATED) && (parser.isString())) {
        // The challenge is contained within a string
        this.challenge = parser.extractString();
        parser.extractLineBreak();

        this.state = STATE_CRAMMD5_CHALLANGED;

        return this;
      }

      if (this.state === STATE_CRAMMD5_CHALLANGED) {
        // Should be either a NO, BYE or OK
        this.state = STATE_CRAMMD5_COMPLETED;

        // Invoke the parent parser to consume the rest of the message
        super.parse(parser);
        return this;
      }

      throw new Error('Illegal State:' + this.state + ' / ' + parser.getData());
    }

    /**
     * @returns {String}
     *   the server's challange which needs to be answered.
     */
    getChallenge() {
      if (this.state < STATE_CRAMMD5_CHALLANGED)
        throw new Error("Illegal State, request not completed");

      return this.challenge;
    }
  }

  const SHA_STATE_FIRST_MESSAGE = 0;
  const SHA_STATE_FINAL_MESSAGE = 1;
  const SHA_STATE_COMPLETED = 4;

  /**
   * Parses responses for SCRAM-SHA authentication.
   *
   * SCRAM is a secure client first authentication mechanism. The client
   * callanges the server and descides if the connection is trustworthy.
   *
   * This requires a way mor logic on the client than with simple authentication
   * mechanisms. It also requires more communication, in total two roundtrips.
   */
  class SieveSaslScramShaResponse extends SieveStateFullResponse {


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
    _parseFirstMessage(parser) {
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
    }

    /**
     * Parses the server-final-message.
     *
     *  It is defined to be:
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
     * @param {String} [data]
     *   optional, the server's final message. It omitted it
     *   will be parsed from the response.
     * @returns {void}
     *
     * @private
     */
    _parseFinalMessage(parser, data) {

      if (typeof (data) === "undefined" || data === null)
        data = parser.extractString();

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
    }

    /**
     * @inheritDoc
     */
    parse(parser) {

      if ((this.state === SHA_STATE_FIRST_MESSAGE) && (parser.isString())) {
        this._parseFirstMessage(parser);
        parser.extractLineBreak();

        this.state = SHA_STATE_FINAL_MESSAGE;

        return this;
      }


      // There are two valid responses...
      // ... either the Server sends us something like that:
      //
      //   S: cnNwYXV0aD1lYTQwZjYwMzM1YzQyN2I1NTI3Yjg0ZGJhYmNkZmZmZA==
      //   C: ""
      //   S: OK

      if ((this.state === SHA_STATE_FINAL_MESSAGE) && (parser.isString())) {

        this._parseFinalMessage(parser);
        parser.extractLineBreak();

        this.state = 2;

        return this;
      }

      if (this.state === 2) {
        super.parse(parser);
        this.state = SHA_STATE_COMPLETED;
        return this;
      }

      // Or the response is wrapped into the ResponseCode in order to save...
      // ... roundtip time so we endup with the following
      //
      // S: OK (SASL "cnNwYXV0aD1lYTQwZjYwMzM1YzQyN2I1NTI3Yjg0ZGJhYmNkZmZmZA==")

      if (this.state === SHA_STATE_FINAL_MESSAGE) {
        super.parse(parser);

        this._parseFinalMessage(parser, this.getResponseCode().getSasl(), parser);

        this.state = SHA_STATE_COMPLETED;

        return this;
      }

      throw new Error('Illegal State:' + this.state + ' / ' + parser.getData());
    }

    /**
     * @returns {String}
     *   the salt which is used to randomize the sha request
     */
    getSalt() {
      if (this.state < SHA_STATE_FINAL_MESSAGE)
        throw new Error("Illegal State, request not completed");

      return this._salt;
    }

    /**
     * @return {int}
     *   the number of iterations.
     */
    getIterationCounter() {
      if (this.state < SHA_STATE_FINAL_MESSAGE)
        throw new Error("Illegal State, request not completed");

      return this._iter;
    }

    getNonce() {
      if (this.state < SHA_STATE_FINAL_MESSAGE)
        throw new Error("Illegal State, request not completed");

      return this._nonce;
    }

    getServerFirstMessage() {
      if (this.state < SHA_STATE_FINAL_MESSAGE)
        throw new Error("Illegal State, request not completed");

      return this._serverFirstMessage;
    }

    getServerError() {
      if (this.state < 2)
        throw new Error("Illegal State, request not completed");

      return this._serverError;
    }

    getVerifier() {
      if (this.state < 2)
        throw new Error("Illegal State, request not completed");

      return this._verifier;
    }
  }

  exports.SieveSimpleResponse = SieveSimpleResponse;
  exports.SieveCapabilitiesResponse = SieveCapabilitiesResponse;
  exports.SieveListScriptResponse = SieveListScriptResponse;
  exports.SieveSaslLoginResponse = SieveSaslLoginResponse;
  exports.SieveSaslCramMd5Response = SieveSaslCramMd5Response;
  exports.SieveGetScriptResponse = SieveGetScriptResponse;
  exports.SieveSaslScramShaResponse = SieveSaslScramShaResponse;

})(module.exports || this);
