/*
 * The contents of this file is licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via email
 * from the author. Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 *
 * Contributors:
 *   Max Dittrich
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

  const MAX_REDIRECTS_UNLIMITED = -1;

  /**
   * This class implements a generic response handler for simple sieve requests.
   *
   * Simple requests just indicate, wether the command succeeded or not. They
   * return only status information, and do not contain any data relevant for
   * the user.
   *
   * @see SieveResponseParser
   *
   * @param {SieveResponseParser} [parser]
   *  a SieveResponseParser object containing the response sent by the server.
   *
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

          // We might stumble upon opening brackets...
          if (parser.startsWith([[CHAR_BRACKET_OPEN]])) {
            // ... oh we did, so increase our nesting counter.
            parser.extract(ONE_CHAR);
            nesting++;
          }

          // ok, more tokens, more fun...
          // ... it could be either a string, a number, an atom or even a bracket
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
          throw new Error("Closing brackets expected in " + parser.getData());

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
     * @returns {string}
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
     * @returns {boolean}
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
     * The server responds to a message with either an ok, bye or no.
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
     * E.g.: In case the server wants to do a referral. It will answer a request with a BYE
     * and adds the details to the REFERRAL response code.
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
   * Parses the capabilities posted by the ManageSieve server upon a client
   * connection, after successful STARTTLS and AUTHENTICATE or by issuing the
   * CAPABILITY command.
   *
   * @see {SieveCapabilitiesRequest}
   *
   * @param {SieveResponseParser} parser
   *   a parser containing the response sent by the server
   */
  class SieveCapabilitiesResponse extends SieveSimpleResponse {

    /**
     * @inheritdoc
     */
    constructor() {

      super();

      this.details = {
        implementation: null,
        version: 0,

        extensions: {},
        tls: false,
        sasl: {},

        maxredirects: MAX_REDIRECTS_UNLIMITED,
        owner: "",
        notify: {},
        language: "i-default",

        compatibility: {}
      };
    }

    /**
     * Parses the sieve extensions string. It is a space separated list of strings.
     * @param {string} value
     *   the string which should be parsed
     * @returns  {object.<string, boolean>}
     *   a map with pairs of extension name and activation status.
     */
    parseSieveExtensions(value) {
      const extensions = value.split(" ");
      const result = {};

      for (let i = 0; i < extensions.length; ++i)
        result["" + extensions[i]] = true;

      return result;
    }

    /**
     * @inheritdoc
     */
    parse(parser) {
      while (parser.isString()) {
        const tag = parser.extractString();

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
     * @returns {object}
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
     * @returns {string}
     *   the servers implementation details
     */
    getImplementation() { return this.details.implementation; }

    /**
     * Returns the list of supported sasl mechanisms.
     *
     * They may change after a secure channel was established.
     * @returns {string}
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
     * @returns {object.<string,boolean>|string}
     *   the server's supported extension.
     */
    getExtensions(asString) {
      if (!asString)
        return this.details.extensions;

      let result = "";

      for (const item in this.details.extensions)
        result += item + " ";

      return result;
    }

    /**
     * Indicates wether or not TLS is supported by this implementation.
     *
     * Note: After the command STARTTLS or AUTHENTICATE completes successfully, this
     * value is always false.
     *
     * @returns {boolean}
     *   true if TLS is supported, false if not.
     */
    getTLS() { return this.details.tls; }

    /**
     * In order to maintain compatibility to older implementations, the servers
     * should state their compatibility level upon login.
     *
     * A value of "0" indicates, minimal ManageSieve support. This means the server
     * implements the commands AUTHENTICATE, STARTTLS, LOGOUT, CAPABILITY, HAVESPACE,
     * PUTSCRIPT, LISTSCRIPTS, SETACTIVE, GETSCRIPT and DELETESCRIPT
     *
     * A value of "1.0" adds to the minimal ManageSieve Support the commands
     * RENAMESCRIPT, CHECKSCRIPT and NOOP.
     *
     * @returns {float}
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
     * @returns {int}
     *   a non-negative number of redirects, or -1 for infinite redirects
     */
    getMaxRedirects() { return this.details.maxredirects; }

    /**
     * Returns a string array of URI schema parts for supported notification
     * methods. This capability is be specified, if the Sieve implementation
     * supports the "enotify" extension.
     *
     * @returns {string[]}
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
     * @returns {string}
     *   a [RFC4646] conform language tag as string
     */
    getLanguage() { return this.details.language; }

    /**
     * Returns a list with sieve commands which are supported by this implementation
     * and are not part of the absolute minimal ManageSieve support.
     *
     * The server advertises such additional commands either by explicitly
     * naming the command or by using the compatibility level capability.
     *
     * Examples are RENAME, NOOP and CHECKSCRIPT.
     *
     * @returns {object}
     *   an associative array containing additional sieve commands
     */
    getCompatibility() { return this.details.compatibility; }

    /**
     * Gets the name of the logged in user.
     *
     * Note: This value is only available after AUTHENTICATE command succeeds
     *
     * @returns {string}
     *   a String containing the username
     */
    getOwner() { return this.details.owner; }
  }



  /**
   * Parses list script response.
   */
  class SieveListScriptsResponse extends SieveSimpleResponse {

    /**
     * @inheritdoc
     */
    parse(parser) {
      //    sieve-name    = string
      //    string        = quoted / literal
      //    (sieve-name [SP "ACTIVE"] CRLF) response-oknobye

      const scripts = [];
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
     * @param {string} name
     *   the script name, to simplify the handling as the server just returns the content.
     */
    constructor(name) {
      super();
      this.scriptName = name;
    }

    /**
     * @inheritdoc
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
     * @returns {string} returns the requested script's content
     */
    getScriptBody() { return this.scriptBody; }

    /**
     * Returns the requested script's name,
     *
     * @returns {string} the script name.
     */
    getScriptName() { return this.scriptName; }
  }


  /**
   * In contrast to a simple sieve request most of the sasl
   * requests are more complex and require multiple round trips
   * to be completed. Which means the response has to track
   * the state.
   *
   * This simple wrapper makes the response stateful.
   */
  class SieveStateFullResponse extends SieveSimpleResponse {

    /**
     * @inheritdoc
     */
    constructor() {
      super();
      this.state = 0;
    }

    /**
     * Gets the responses current state
     *
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
     * @inheritdoc
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
        // String should be equivalent to 'Password:'
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
        throw new Error(`Illegal State: ${this.state} / ${parser.getData(0)}\n${ex}`);
      }

      this.state = STATE_LOGIN_COMPLETED;
      return this;
    }
  }

  const STATE_CRAMMD5_INITIATED = 0;
  const STATE_CRAMMD5_CHALLENGED = 1;
  const STATE_CRAMMD5_COMPLETED = 4;

  /**
   * @author Thomas Schmid
   * @author Max Dittrich
   */
  class SieveSaslCramMd5Response extends SieveStateFullResponse {

    /**
     * @inheritdoc
     */
    parse(parser) {

      if ((this.state === STATE_CRAMMD5_INITIATED) && (parser.isString())) {
        // The challenge is contained within a string
        this.challenge = parser.extractString();
        parser.extractLineBreak();

        this.state = STATE_CRAMMD5_CHALLENGED;

        return this;
      }

      if (this.state === STATE_CRAMMD5_CHALLENGED) {
        // Should be either a NO, BYE or OK
        this.state = STATE_CRAMMD5_COMPLETED;

        // Invoke the parent parser to consume the rest of the message
        super.parse(parser);
        return this;
      }

      throw new Error(`Illegal State: ${this.state} / ${parser.getData()}`);
    }

    /**
     * Gets the challenge returned by the server.
     *
     * @returns {string}
     *   the server's challenge which needs to be answered.
     */
    getChallenge() {
      if (this.state < STATE_CRAMMD5_CHALLENGED)
        throw new Error("Illegal State, request not completed");

      return this.challenge;
    }
  }

  const SHA_STATE_FIRST_MESSAGE = 0;
  const SHA_STATE_FINAL_MESSAGE = 1;
  const SHA_STATE_COMPLETED = 4;

  const SHA_FIRST_TOKEN = 0;
  const SHA_PREFIX_LENGTH = 2;

  /**
   * Parses responses for SCRAM-SHA authentication.
   *
   * SCRAM is a secure client first authentication mechanism. The client
   * challenges the server and deicides if the connection is trustworthy.
   *
   * This requires a way mor logic on the client than with simple authentication
   * mechanisms. It also requires more communication, in total two roundtrips.
   */
  class SieveSaslScramShaResponse extends SieveStateFullResponse {

    /**
     * Extracts the reserved-mext token from the array of tokens.
     * @param {string[]} tokens
     *   the first message response split into tokens.
     * @returns {string}
     *  the optional reserved-mext token or an empty string.
     */
    _extractReservedMext(tokens) {
      const token = tokens[SHA_FIRST_TOKEN];

      // Test for the reserved-mext token. If it is existent, we just skip it
      if ((token.length <= SHA_PREFIX_LENGTH) || !token.startsWith("m="))
        return "";

      tokens.shift();
      return token.substr(SHA_FIRST_TOKEN);
    }

    /**
     * Extracts the nonce from the first message.
     * @param {string[]} tokens
     *   the first message response split into tokens.
     * @returns {string}
     *   the nonce or an exception in case it could not be extracted.
     */
    _extractNonce(tokens) {
      const token = tokens[SHA_FIRST_TOKEN];

      // Extract the nonce
      if ((token.length <= SHA_PREFIX_LENGTH) || !token.startsWith("r="))
        throw new Error(`Nonce expected but got ${token}`);

      tokens.shift();

      // remove the "r="
      return token.substr(SHA_PREFIX_LENGTH);
    }

    /**
     * Extracts the salt from the first message.
     * @param {string[]} tokens
     *   the first message response split into tokens.
     * @returns {string}
     *   the salt as base64 encoded string or an exception in case
     *   it could not be extracted
     */
    _extractSalt(tokens) {
      const token = tokens[SHA_FIRST_TOKEN];

      if ((token.length <= SHA_PREFIX_LENGTH) || !token.startsWith("s="))
        throw new Error(`Salt expected but got ${token}`);

      tokens.shift();

      // remove the "s=""
      return token.substr(SHA_PREFIX_LENGTH);
    }

    /**
     * Extracts the iteration count from the first message.
     * @param {string[]} tokens
     *   the first message response split into tokens.
     * @returns {int}
     *   the iteration count as integer or an exception in case the
     *   iterations could not be extracted.
     */
    _extractIterations(tokens) {
      const token = tokens[SHA_FIRST_TOKEN];

      if ((token.length <= SHA_PREFIX_LENGTH) || !token.startsWith("i="))
        throw new Error(`Iteration Count expected but got ${token}`);

      tokens.shift();

      // Remove the prefix and convert to an integer
      return parseInt(token.substr(SHA_PREFIX_LENGTH), 10);
    }

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
     *
     *
     * @private
     */
    _parseFirstMessage(parser) {
      this._serverFirstMessage = parser.convertFromBase64(parser.extractString());

      const tokens = this._serverFirstMessage.split(',');

      this._extractReservedMext(tokens);
      this._nonce = this._extractNonce(tokens);

      this._salt = parser.convertFromBase64(this._extractSalt(tokens));
      this._iter = this._extractIterations(tokens);
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
     * @param {string} [data]
     *   optional, the server's final message. It omitted it
     *   will be parsed from the response.
     *
     *
     * @private
     */
    _parseFinalMessage(parser, data) {

      if (typeof (data) === "undefined" || data === null)
        data = parser.extractString();

      // server-final-message = (server-error / verifier) ["," extensions]
      const token = parser.convertFromBase64(data).split(",")[SHA_FIRST_TOKEN];

      if (token.length <= SHA_PREFIX_LENGTH)
        throw new Error(`Response expected but got: ${data}`);

      // server-error = "e="
      if (token.startsWith("e=")) {
        this._serverError = token.substr(SHA_PREFIX_LENGTH);
        return;
      }

      // verifier = "v=" base64
      if (token.startsWith("v=")) {
        this._verifier = parser.convertFromBase64(token.substr(SHA_PREFIX_LENGTH));
        return;
      }

      throw new Error("Invalid Final message");
    }

    /**
     * @inheritdoc
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
      // ... roundtrip time so we end up with the following
      //
      // S: OK (SASL "cnNwYXV0aD1lYTQwZjYwMzM1YzQyN2I1NTI3Yjg0ZGJhYmNkZmZmZA==")

      if (this.state === SHA_STATE_FINAL_MESSAGE) {
        super.parse(parser);

        this._parseFinalMessage(parser, this.getResponseCode().getSasl(), parser);

        this.state = SHA_STATE_COMPLETED;

        return this;
      }

      throw new Error(`Illegal State: ${this.state} / ${parser.getData()}`);
    }

    /**
     * The salt is transferred with the first message and used to
     * randomize the SHA request
     *
     * @returns {string}
     *   the salt
     */
    getSalt() {
      if (this.state < SHA_STATE_FINAL_MESSAGE)
        throw new Error("Illegal State, request not completed");

      return this._salt;
    }

    /**
     * @returns {int}
     *   the number of iterations.
     */
    getIterationCounter() {
      if (this.state < SHA_STATE_FINAL_MESSAGE)
        throw new Error("Illegal State, request not completed");

      return this._iter;
    }

    /**
     * Returns the nonce. Please note this it is only available after the
     * final message was received
     *
     * @returns {string}
     *   the nonce received from the server on an exception in case it is unknown.
     */
    getNonce() {
      if (this.state < SHA_STATE_FINAL_MESSAGE)
        throw new Error("Illegal State, request not completed");

      return this._nonce;
    }

    /**
     * Returns the servers first message. Pleas not is tis only available when the
     * final message was received.
     *
     * @returns {string}
     *   the server's first message or an exception in case it is unknown.
     */
    getServerFirstMessage() {
      if (this.state < SHA_STATE_FINAL_MESSAGE)
        throw new Error("Illegal State, request not completed");

      return this._serverFirstMessage;
    }

    /**
     *
     */
    getServerError() {
      if (this.state < 2)
        throw new Error("Illegal State, request not completed");

      return this._serverError;
    }

    /**
     * The server's signature which needs to be verified.
     *
     * @returns {string}
     *   the server's signature
     */
    getVerifier() {
      if (this.state < 2)
        throw new Error("Illegal State, request not completed");

      return this._verifier;
    }
  }

  exports.SieveSimpleResponse = SieveSimpleResponse;
  exports.SieveCapabilitiesResponse = SieveCapabilitiesResponse;
  exports.SieveListScriptsResponse = SieveListScriptsResponse;
  exports.SieveSaslLoginResponse = SieveSaslLoginResponse;
  exports.SieveSaslCramMd5Response = SieveSaslCramMd5Response;
  exports.SieveGetScriptResponse = SieveGetScriptResponse;
  exports.SieveSaslScramShaResponse = SieveSaslScramShaResponse;

})(module.exports || this);
