/*
 * The content of this file is licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via
 * email from the author.
 *
 * Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

/*
  NOTES:
  ======

  The communication in this library is asynchonous! After sending a request,
  you will be notified by a listerner, as soon as a response arrives.

  If a request caused an error or timeout, its error listener will be called
  to resolve the issue. If a server rejects a request, the onError() function
  of the error listener will be invoked. In case of a timeout situation, the
  onTimeout() function is called.

  If a request succees, the corresponding response listener of the request
  will be notified.

  The addResponse(), getNextRequest(), hasNextRequest(), cancel() Methods are
  used by the Sieve object, and should not be invoked manually.

  When the sieve object receives a response, it is passed to the addResponse()
  Method of the requesting object. A timeout is singaled by passing invoking
  the cancel() Method.

*/

(function (exports) {

  // Enable Strict Mode
  "use strict";

  const {
    SieveSimpleResponse,
    SieveCapabilitiesResponse,
    SieveListScriptResponse,
    SieveSaslLoginResponse,
    SieveSaslCramMd5Response,
    SieveGetScriptResponse,
    SieveSaslScramShaResponse
  } = require("./SieveResponse.js");

  const { SieveCrypto } = require("./SieveCrypto.js");

  const STATE_CRAM_MD5_CHALLENGED = 1;
  const STATE_CRAM_MD5_INIT = 0;

  const RESPONSE_OK = 0;
  const RESPONSE_BYE = 1;
  const RESPONSE_NO = 2;

  // ****************************************************************************//

  /**
   * An abstract class, it is the prototype for any requests
   * @constructor
   */
  function SieveAbstractRequest() {
    throw new Error("Abstract Constructor, do not Invoke");
  }

  SieveAbstractRequest.prototype.errorListener = null;
  SieveAbstractRequest.prototype.byeListener = null;
  SieveAbstractRequest.prototype.responseListener = null;

  SieveAbstractRequest.prototype.addErrorListener
    = function (listener) {
      this.errorListener = listener;
    };

  SieveAbstractRequest.prototype.addByeListener
    = function (listener) {
      this.byeListener = listener;
    };

  /**
   * Add a response listener to this request. The response listener will
   * be triggered in case a successful server response was received
   *
   * @param {Function} listener
   *   the listener which should be invoked when the server response
   *
   */
  SieveAbstractRequest.prototype.addResponseListener
    = function (listener) {
      this.responseListener = listener;
    };

  /**
   * In general Sieve uses an unsolicited communication.
   * The client sends messages to server and the server responds
   * to those.
   *
   * But there are some exceptions to this rule, e.g. the
   * init request upon connecting or after tls completed.
   * Both are send by the server to the client.
   *
   * @returns {boolean}
   *   true in case the request is unsolicited. Which means
   *   the client sends a request and the server responds
   *   to that.
   *   false in case the request is solicited. Which means
   *   it was send by the server without an explicit
   *   request from the client.
   */
  SieveAbstractRequest.prototype.isUnsolicited
    = function () {
      return true;
    };

  SieveAbstractRequest.prototype.hasNextRequest
    = function () {
      return false;
    };

  /**
   * Returns the next request as a string. It uses the given
   * Request builder to assemble the string.
   *
   * @param  {SieveAbstractRequestBuilder} builder
   *   a reference to a stateless request builder which can be used
   *   to form the request string.
   * @returns {string}
   *   the data which should be send to the server
   *
   * @abstract
   */
  SieveAbstractRequest.prototype.getNextRequest = function (builder) {
    throw new Error("Abstract Method implement me " + builder);
  };

  SieveAbstractRequest.prototype.cancel
    = function () {
      if ((this.errorListener) && (this.errorListener.onTimeout))
        this.errorListener.onTimeout();
    };

  SieveAbstractRequest.prototype.onNo
    = function (response) {
      if ((this.errorListener) && (this.errorListener.onError))
        this.errorListener.onError(response);
    };

  SieveAbstractRequest.prototype.onBye
    = function (response) {
      if ((response.getResponse() === RESPONSE_BYE) && (this.byeListener))
        this.byeListener.onByeResponse(response);
    };

  SieveAbstractRequest.prototype.onOk
    = function (response) {
      throw new Error("Abstract Method override me " + response);
    };

  /**
   * An abstract helper, which calls the default message handlers
   * for the given response
   *
   * @param {SieveSimpleResponse} response
   *   thr response which should be handled by this request.
   *
   */
  SieveAbstractRequest.prototype.addResponse
    = function (response) {
      if (response.getResponse() === RESPONSE_OK)
        this.onOk(response);
      else if (response.getResponse() === RESPONSE_BYE)
        this.onBye(response);
      else if (response.getResponse() === RESPONSE_NO)
        this.onNo(response);
      else
        throw new Error("Invalid Response Code");
    };

  // ****************************************************************************//

  /**
   * An abstract calls derived from AbstractRequest. It is the foundation for
   * any requests implementing a SASL compatible authentication.
   *
   * @constructor
   */
  function SieveAbstractSaslRequest() {
    throw new Error("Abstract Constructor, do not Invoke");
  }

  SieveAbstractSaslRequest.prototype = Object.create(SieveAbstractRequest.prototype);
  SieveAbstractSaslRequest.prototype.constructor = SieveAbstractSaslRequest;

  SieveAbstractSaslRequest.prototype._username = "";
  SieveAbstractSaslRequest.prototype._password = "";
  SieveAbstractSaslRequest.prototype._authorization = "";


  /**
   * Sets the sasl mechanisms username. Not all SASL Mechanisms require an username.
   *
   * @param {string} username
   *   the username
   *
   **/
  SieveAbstractSaslRequest.prototype.setUsername
    = function (username) {
      this._username = username;
    };

  /**
   * Most SASL mechanisms need a password or secret to authenticate.
   * But there are also mechanisms like SASL EXTERNAL which does not need any passwords.
   * They use different methods to transfer the credentials.
   *
   * @returns {boolean}
   *   indicates if this SASL Mechanism needs a password
   */
  SieveAbstractSaslRequest.prototype.hasPassword
    = function () {
      return true;
    };

  /**
   * Sets the sasl request's password.
   *
   * @param {string} password
   *   the password which shall be used for the authentication.
   * @returns {SieveAbstractSaslRequest}
   *   a self reference
   **/
  SieveAbstractSaslRequest.prototype.setPassword
    = function (password) {
      this._password = password;
      return this;
    };

  /**
   * Checks if this mechanism supports authorization. Keep in mind
   * authorization is rearely used and only very few machanisms
   * support it.
   *
   * With autorization you use your credentials to login as a different user.
   * Which means you first authenticate with your username and then do the
   * authorization which switch the user. Typically admins and superusers have
   * such super powers.
   *
   * @returns {boolean}
   *   true in case the request supports authorization otherwise false.
   */
  SieveAbstractSaslRequest.prototype.isAuthorizable
    = function () {
      // Sub classes shall overwrite this with true in case authorization is supported
      return false;
    };

  /**
   * Sets the username which should be authorized.
   * In case authorization is not supported it will be silently ignored.
   *
   * @param {string} authorization
   *   the username used for authorization
   * @returns {SieveAbstractRequest}
   *   a self reference
   **/
  SieveAbstractSaslRequest.prototype.setAuthorization
    = function (authorization) {
      if (this.isAuthorizable())
        this._authorization = authorization;

      return this;
    };

  SieveAbstractSaslRequest.prototype.onOk
    = function (response) {
      if (this.responseListener)
        this.responseListener.onSaslResponse(response);
    };

  // ****************************************************************************//

  /**
   * Loads a script from the server and returns the content.
   * In case the script is non existant an error will be triggered.
   *
   * @param {string} script
   *   the script which should be retrived
   * @author Thomas Schmid
   * @constructor
   */
  function SieveGetScriptRequest(script) {
    this.script = script;
  }

  // Inherrit prototypes from SieveAbstractRequest...
  SieveGetScriptRequest.prototype = Object.create(SieveAbstractRequest.prototype);
  SieveGetScriptRequest.prototype.constructor = SieveGetScriptRequest;

  SieveGetScriptRequest.prototype.getNextRequest = function (builder) {
    return builder
      .addLiteral("GETSCRIPT")
      .addQuotedString(this.script);
  };

  SieveGetScriptRequest.prototype.onOk
    = function (response) {
      if (this.responseListener)
        this.responseListener.onGetScriptResponse(response);
    };

  /**
   * @inheritdoc
   */
  SieveGetScriptRequest.prototype.addResponse
    = function (parser) {
      SieveAbstractRequest.prototype.addResponse.call(this,
        (new SieveGetScriptResponse(this.script)).parse(parser));
    };

  // ****************************************************************************//

  /**
   * Stores the given script on the server.
   * The script is validated by the server and will be rejected with a NO
   * in case the validation failes.
   *
   * Please not it will overwrite silently any existing script with the same name.
   *
   * @param {string} script
   *   the script's name
   * @param {string} body
   *   the sieve script which should be stored on the server.
   *
   * @constructor
   * @author Thomas Schmid
   */
  function SievePutScriptRequest(script, body) {
    this.script = script;

    // cleanup linebreaks...

    // eslint-disable-next-line no-control-regex
    this.body = body.replace(/\r\n|\r|\n|\u0085|\u000C|\u2028|\u2029/g, "\r\n");
  }

  // Inherrit prototypes from SieveAbstractRequest...
  SievePutScriptRequest.prototype = Object.create(SieveAbstractRequest.prototype);
  SievePutScriptRequest.prototype.constructor = SievePutScriptRequest;

  SievePutScriptRequest.prototype.getNextRequest
    = function (builder) {
      return builder
        .addLiteral("PUTSCRIPT")
        .addQuotedString(this.script)
        .addMultiLineString(this.body);
    };

  SievePutScriptRequest.prototype.onOk
    = function (response) {
      if (this.responseListener)
        this.responseListener.onPutScriptResponse(response);
    };

  /**
   * @inheritdoc
   */
  SievePutScriptRequest.prototype.addResponse
    = function (parser) {
      SieveAbstractRequest.prototype.addResponse.call(this,
        (new SieveSimpleResponse()).parse(parser));
    };

  // ****************************************************************************//

  /**
   * The CheckScriptRequest validates the Syntax of a Sieve script. The script
   * is not stored on the server.
   *
   * If the script fails this test, the server replies with a NO response. The
   * response contains one or more CRLF separated error messages.
   *
   * An OK response can contain Syntax Warnings.
   *
   *   C: CheckScript {31+}
   *   C: #comment
   *   C: InvalidSieveCommand
   *   C:
   *   S: NO "line 2: Syntax error"
   *
   * @param {string} body
   *   the script which should be check for syntactical validity
   *
   * @constructor
   */
  function SieveCheckScriptRequest(body) {
    // Strings in JavaScript should use the encoding of the xul document and...
    // ... sockets use binary strings. That means for us we have to convert...
    // ... the JavaScript string into a UTF8 String.

    // Further more Sieve expects line breaks to be \r\n. Mozilla uses \n ...
    // ... according to the documentation. But for some unknown reason a ...
    // ... string sometimes  contains mixed line breaks. Thus we convert ...
    // ... any \r\n, \r and \n to \r\n.

    // eslint-disable-next-line no-control-regex
    this.body = body.replace(/\r\n|\r|\n|\u0085|\u000C|\u2028|\u2029/g, "\r\n");
    // this.body = UTF8Encode(body).replace(/\r\n|\r|\n/g, "\r\n");
  }

  // Inherrit prototypes from SieveAbstractRequest...
  SieveCheckScriptRequest.prototype = Object.create(SieveAbstractRequest.prototype);
  SieveCheckScriptRequest.prototype.constructor = SieveCheckScriptRequest;

  SieveCheckScriptRequest.prototype.getNextRequest
    = function (builder) {
      return builder.addLiteral("CHECKSCRIPT")
        .addMultiLineString(this.body);
    };

  SieveCheckScriptRequest.prototype.onOk
    = function (response) {
      if (this.responseListener)
        this.responseListener.onCheckScriptResponse(response);
    };

  /**
   * @inheritdoc
   */
  SieveCheckScriptRequest.prototype.addResponse
    = function (parser) {
      SieveAbstractRequest.prototype.addResponse.call(this,
        (new SieveSimpleResponse()).parse(parser));
    };

  // ****************************************************************************//

  /**
   * This class encaspulates a Sieve SETACTIVE request.
   * <p>
   * Either none or one serverscripts can be active, this means you can't have
   * more than one active scripts
   * <p>
   * You activate a Script by calling SETACTIVE and the scriptname. At activation
   * the previous active Script will become inactive.
   *
   * @param {string} script - The script name which should be activated. Passing
   * an empty string deactivates the active script.
   *
   * @author Thomas Schmid
   * @constructor
   */
  function SieveSetActiveRequest(script) {
    this.script = "";

    if ((typeof (script) !== 'undefined') && (script !== null))
      this.script = script;
  }

  // Inherrit prototypes from SieveAbstractRequest...
  SieveSetActiveRequest.prototype = Object.create(SieveAbstractRequest.prototype);
  SieveSetActiveRequest.prototype.constructor = SieveSetActiveRequest;

  SieveSetActiveRequest.prototype.getNextRequest
    = function (builder) {
      return builder
        .addLiteral("SETACTIVE")
        .addQuotedString(this.script);
    };


  SieveSetActiveRequest.prototype.onOk
    = function (response) {
      if (this.responseListener)
        this.responseListener.onSetActiveResponse(response);
    };

  /**
   * @inheritdoc
   */
  SieveSetActiveRequest.prototype.addResponse
    = function (parser) {
      SieveAbstractRequest.prototype.addResponse.call(this,
        (new SieveSimpleResponse()).parse(parser));
    };

  // ****************************************************************************//

  /**
   *
   * @author Thomas Schmid
   * @constructor
   */
  function SieveCapabilitiesRequest() {
  }

  // Inherrit prototypes from SieveAbstractRequest...
  SieveCapabilitiesRequest.prototype = Object.create(SieveAbstractRequest.prototype);
  SieveCapabilitiesRequest.prototype.constructor = SieveCapabilitiesRequest;

  SieveCapabilitiesRequest.prototype.getNextRequest
    = function (builder) {
      return builder
        .addLiteral("CAPABILITY");
    };

  SieveCapabilitiesRequest.prototype.onOk
    = function (response) {
      if (this.responseListener)
        this.responseListener.onCapabilitiesResponse(response);
    };

  /**
   * @inheritdoc
   */
  SieveCapabilitiesRequest.prototype.addResponse
    = function (parser) {
      SieveAbstractRequest.prototype.addResponse.call(this,
        (new SieveCapabilitiesResponse()).parse(parser));
    };

  // ****************************************************************************//

  /**
   * @param {string} script
   * @author Thomas Schmid
     * @constructor
   */
  function SieveDeleteScriptRequest(script) {
    this.script = script;
  }

  // Inherrit prototypes from SieveAbstractRequest...
  SieveDeleteScriptRequest.prototype = Object.create(SieveAbstractRequest.prototype);
  SieveDeleteScriptRequest.prototype.constructor = SieveDeleteScriptRequest;

  SieveDeleteScriptRequest.prototype.getNextRequest
    = function (builder) {
      return builder
        .addLiteral("DELETESCRIPT")
        .addQuotedString(this.script);
    };


  SieveDeleteScriptRequest.prototype.onOk
    = function (response) {
      if (this.responseListener)
        this.responseListener.onDeleteScriptResponse(response);
    };

  /**
   * @inheritdoc
   */
  SieveDeleteScriptRequest.prototype.addResponse
    = function (parser) {
      SieveAbstractRequest.prototype.addResponse.call(this,
        (new SieveSimpleResponse()).parse(parser));
    };

  // ****************************************************************************//

  /**
   * The NOOP request does nothing, it is used for protocol re-synchronisation or
   * to reset any inactivity auto-logout timer on the server.
   *
   * The response to the NOOP command is always OK.
   *
   * @author Thomas Schmid
   * @constructor
   */
  function SieveNoopRequest() {
  }

  // Inherrit prototypes from SieveAbstractRequest...
  SieveNoopRequest.prototype = Object.create(SieveAbstractRequest.prototype);
  SieveNoopRequest.prototype.constructor = SieveNoopRequest;

  /** @returns {string} */
  SieveNoopRequest.prototype.getNextRequest
    = function (builder) {
      return builder
        .addLiteral("NOOP");
    };


  SieveNoopRequest.prototype.onOk
    = function (response) {
      if (this.responseListener)
        this.responseListener.onNoopResponse(response);
    };

  /**
   * @inheritdoc
   */
  SieveNoopRequest.prototype.addResponse
    = function (parser) {
      SieveAbstractRequest.prototype.addResponse.call(this,
        (new SieveSimpleResponse()).parse(parser));
    };

  // ****************************************************************************//

  /**
   * This command is used to rename a Sieve script's. The Server will reply with
   * a NO response if the old script does not exist, or a script with the new
   * name already exists.
   *
   * Renaming the active script is allowed, the renamed script remains active.
   *
   * @param {string} oldScript Name of the script, which should be renamed
   * @param {string} newScript New name of the Script
   *
   * @author Thomas Schmid
   * @constructor
   */
  function SieveRenameScriptRequest(oldScript, newScript) {
    this.oldScript = oldScript;
    this.newScript = newScript;
  }

  // Inherrit prototypes from SieveAbstractRequest...
  SieveRenameScriptRequest.prototype = Object.create(SieveAbstractRequest.prototype);
  SieveRenameScriptRequest.prototype.constructor = SieveRenameScriptRequest;

  SieveRenameScriptRequest.prototype.getNextRequest
    = function (builder) {
      return builder
        .addLiteral("RENAMESCRIPT")
        .addQuotedString(this.oldScript)
        .addQuotedString(this.newScript);
    };

  SieveRenameScriptRequest.prototype.onOk
    = function (response) {
      if (this.responseListener)
        this.responseListener.onRenameScriptResponse(response);
    };

  /**
   * @inheritdoc
   */
  SieveRenameScriptRequest.prototype.addResponse
    = function (parser) {
      SieveAbstractRequest.prototype.addResponse.call(this,
        (new SieveSimpleResponse()).parse(parser));
    };

  // ****************************************************************************//

  /**
   * This command is used to list all sieve script of the current user.
   * In case there are no scripts the server responds with an empty list.
   *
   * @author Thomas Schmid
   * @constructor
   */
  function SieveListScriptRequest() {
  }

  // Inherrit prototypes from SieveAbstractRequest...
  SieveListScriptRequest.prototype = Object.create(SieveAbstractRequest.prototype);
  SieveListScriptRequest.prototype.constructor = SieveListScriptRequest;

  SieveListScriptRequest.prototype.getNextRequest
    = function (builder) {
      return builder
        .addLiteral("LISTSCRIPTS");
    };

  SieveListScriptRequest.prototype.onOk
    = function (response) {
      if (this.responseListener)
        this.responseListener.onListScriptResponse(response);
    };

  /**
   * @inheritdoc
   */
  SieveListScriptRequest.prototype.addResponse
    = function (parser) {
      SieveAbstractRequest.prototype.addResponse.call(this,
        new SieveListScriptResponse().parse(parser));
    };

  // ****************************************************************************//

  /**
   * Initializes switching to tls via start tls
   * @constructor
   */
  function SieveStartTLSRequest() {
  }

  // Inherrit prototypes from SieveAbstractRequest...
  SieveStartTLSRequest.prototype = Object.create(SieveAbstractRequest.prototype);
  SieveStartTLSRequest.prototype.constructor = SieveStartTLSRequest;

  SieveStartTLSRequest.prototype.getNextRequest
    = function (builder) {
      return builder
        .addLiteral("STARTTLS");
    };

  SieveStartTLSRequest.prototype.onOk
    = function (response) {
      if (this.responseListener)
        this.responseListener.onStartTLSResponse(response);
    };

  /**
   * @inheritdoc
   */
  SieveStartTLSRequest.prototype.addResponse
    = function (parser) {
      SieveAbstractRequest.prototype.addResponse.call(this,
        (new SieveSimpleResponse()).parse(parser));

    };

  // ****************************************************************************//

  /**
   * A logout request signals the server that the client wishes to terminate
   * the current session.
   * <pre>
   * Client > LOGOUT
   * Server < OK "Logout Complete"
   * [ connection terminated ]
   * </pre>
   * <p>
   * The following example shows how to use a SieveLogoutRequest:
   * <pre>
   *  var event = {
   *    onLogoutResponse: function(response)
   *    {
   *      alert("Logout successfull");
   *    }
   *    ,
   *    onError: function(response)
   *    {
   *      alert("SERVER ERROR:"+response.getMessage());
   *    }
   *  }
   *
   *  var request = new SieveLogoutRequest();
   *  request.addErrorListener(event);
   *  request.addSaslListener(event);
   *
   *  sieve.addRequest(request);
   * </pre>
   *
   * @author Thomas Schmid
   * @constructor
   */
  function SieveLogoutRequest() {
  }

  // Inherrit prototypes from SieveAbstractRequest...
  SieveLogoutRequest.prototype = Object.create(SieveAbstractRequest.prototype);
  SieveLogoutRequest.prototype.constructor = SieveLogoutRequest;

  SieveLogoutRequest.prototype.getNextRequest
    = function (builder) {
      return builder.addLiteral("LOGOUT");
    };

  SieveLogoutRequest.prototype.onOk
    = function (response) {
      if (this.responseListener)
        this.responseListener.onLogoutResponse(response);
    };

  SieveLogoutRequest.prototype.onBye
    = function (response) {
      // As issued a logout request thus onBye response is perfectly fine...
      // ... and equivalten to an ok in this case.
      this.onOk(response);
    };

  /**
   * @inheritdoc
   */
  SieveLogoutRequest.prototype.addResponse
    = function (parser) {
      SieveAbstractRequest.prototype.addResponse.call(this,
        (new SieveSimpleResponse()).parse(parser));
    };

  // ****************************************************************************//

  /**
   * A ManageSieve server automatically post his capabilities as soon as the
   * connection is established or a secure channel is successfully started
   * (STARTTLS command). In order to capture this information a dummy request
   * is used. It does not send a real request, but it parses the initial response
   * of the sieve server. Therefore it is important to add the request before the
   * connection is established. Otherwise the message queue will be jammed.
   *
   * @example
   * Server < "IMPLEMENTATION" "Cyrus timsieved v2.1.18-IPv6-Debian-2.1.18-1+sarge2"
   *        < "SASL" "PLAIN"
   *        < "SIEVE" "fileinto reject envelope vacation imapflags notify subaddress relational regex"
   *        < "STARTTLS"
   *        < OK
   *
   * @example
   *  let sieve = new Sieve('example.com',2000,false,3)
   *
   *  let request = new SieveInitRequest();
   *  sieve.addRequest(request);
   *
   *  sieve.connect();
   *
   * @author Thomas Schmid <schmid-thomas@gmx.net>
   * @constructor
   */
  function SieveInitRequest() { }

  // Inherrit prototypes from SieveAbstractRequest...
  SieveInitRequest.prototype = Object.create(SieveAbstractRequest.prototype);
  SieveInitRequest.prototype.constructor = SieveInitRequest;

  SieveInitRequest.prototype.onOk
    = function (response) {
      if (this.responseListener)
        this.responseListener.onInitResponse(response);
    };

  SieveInitRequest.prototype.isUnsolicited = function () {
    return false;
  };

  /**
   * @inheritdoc
   */
  SieveInitRequest.prototype.addResponse
    = function (parser) {
      SieveAbstractRequest.prototype.addResponse.call(this,
        (new SieveCapabilitiesResponse()).parse(parser));
    };

  /**
      Implements the SASL Plain autentication method.

      Please note, that the password is only base64 encoded. Therefore it can be
      read or sniffed easily. A secure connection will solve this issue. So send
      whenever possible, a SieveStartTLSRequest before calling this request.

      @example
      var event = {
        onSaslResponse: function(response)
        {
          alert("Login successfull");
        }
        ,
        onError: function(response)
        {
          alert("SERVER ERROR:"+response.getMessage());
        }
      }

      var request = new SieveSaslPlainRequest('geek');
      request.setPassword('th3g33k1');
      request.addErrorListener(event);
      request.addSaslListener(event);

      sieve.addRequest(request);

    PROTOCOL INTERACTION:
    =====================

      Client > AUTHENTICATE "PLAIN" AHRlc3QAc2VjcmV0   | AUTHENTICATE "PLAIN" [UTF8NULL]test[UTF8NULL]secret
      Server < OK                                      | OK

      @constructor
   **/
  function SieveSaslPlainRequest() {
  }

  // Inherrit prototypes from SieveSASLAbstractRequest...
  SieveSaslPlainRequest.prototype = Object.create(SieveAbstractSaslRequest.prototype);
  SieveSaslPlainRequest.prototype.constructor = SieveSaslPlainRequest;

  SieveSaslPlainRequest.prototype.isAuthorizable
    = function () {
      return true;
    };

  SieveSaslPlainRequest.prototype.getNextRequest
    = function (builder) {
      return builder
        .addLiteral("AUTHENTICATE")
        .addQuotedString("PLAIN")
        .addQuotedBase64(this._authorization + "\0" + this._username + "\0" + this._password);
    };

  /**
   * @inheritdoc
   */
  SieveSaslPlainRequest.prototype.addResponse
    = function (parser) {
      SieveAbstractRequest.prototype.addResponse.call(this,
        (new SieveSimpleResponse()).parse(parser));
    };


  /* ******************************************************************************

    FACTSHEET:
    ==========
      CLASS NAME          : SieveSaslLoginRequest
      USES CLASSES        : SieveSaslLoginResponse

      CONSCTURCTOR        : SieveLoginRequest(String username)
      DECLARED FUNCTIONS  : void addSaslListener(...)
                            void addErrorListener(...)
                            void addResponse(String parser)
                            String getNextRequest()
                            Boolean hasNextRequest()
                            void setPassword(String password)
      EXCEPTIONS          :
      AUTHOR              : Thomas Schmid

    DESCRIPTION:
    ============
      This request implements the SALS Login autentication method. It is similar
      to the SASL Plain method. The main difference is that SASL Login is somekind
      of dialog driven. The server will request first the username and then the
      password. With SASL Plain both, username and password are requested at the
      sametime.
      Please note, that the passwort is only base64 encoded. Therefore it can be
      read or sniffed easily. A secure connection will solve this issue. So send
      whenever possible, a SieveStartTLSRequest before calling this request.

    LINKS:
    ======
        * http://darwinsource.opendarwin.org/Current/CyrusIMAP-156.9/cyrus_imap/imap/AppleOD.c
        * http://www.opensource.apple.com/darwinsource/Current/CyrusIMAP-156.10/cyrus_imap/imap/AppleOD.c

    EXAMPLE:
    ========

      var event = {
        onSaslResponse: function(response)
        {
          alert("Login successfull");
        }
        ,
        onError: function(response)
        {
          alert("SERVER ERROR:"+response.getMessage());
        }
      }

      var request = new SieveSaslLoginRequest();
      request.setUsername('geek');
      request.setPassword('th3g33k1');
      request.addErrorListener(event);
      request.addSaslListener(event);

      sieve.addRequest(request);

    PROTOCOL INTERACTION:
    =====================

      Client > AUTHENTICATE "LOGIN"   | AUTHENTICATE "LOGIN"
      Server < {12}                   | {12}
             < VXNlcm5hbWU6           | Username:
      Client > {8+}                   | {8+}
             > Z2Vlaw==               | geek
      Server < {12}                   | {12}
             < UGFzc3dvcmQ6           | Password:
      Client > {12+}                  | {12+}
             > dGgzZzMzazE=           | th3g33k1
      Server < OK                     | OK

  *******************************************************************************/

  /**
   * This request implements the SALS Login autentication method. It is deprecated
   * and has been superseeded by SASL Plain method. SASL Login uses a question and
   * answer style communication. The server will request first the username and
   * then the password.
   * <p>
   * Please note, that the passwort is not encrypted it is only base64 encoded.
   * Therefore it can be read or sniffed easily. A secure connection will solve
   * this issue. So send whenever possible, a SieveStartTLSRequest before calling
   * this request.
   *
   * @author Thomas Schmid
   * @constructor
   * @deprecated
   */
  function SieveSaslLoginRequest() {
    this.response = new SieveSaslLoginResponse();
  }

  // Inherrit prototypes from SieveAbstractRequest...
  SieveSaslLoginRequest.prototype = Object.create(SieveAbstractSaslRequest.prototype);
  SieveSaslLoginRequest.prototype.constructor = SieveSaslLoginRequest;

  SieveSaslLoginRequest.prototype.getNextRequest
    = function (builder) {
      switch (this.response.getState()) {
        case 0:
          return builder
            .addLiteral("AUTHENTICATE")
            .addQuotedString("LOGIN");
        case 1:
          return builder
            .addQuotedBase64(this._username);
        case 2:
          return builder
            .addQuotedBase64(this._password);
      }

      throw new Error("Unkown state in sasl login");
    };

  SieveSaslLoginRequest.prototype.hasNextRequest
    = function () {
      if (this.response.getState() === 4)
        return false;

      return true;
    };

  /**
   * @inheritdoc
   */
  SieveSaslLoginRequest.prototype.addResponse
    = function (parser) {
      this.response.parse(parser);

      if (this.hasNextRequest())
        return;

      SieveAbstractRequest.prototype.addResponse.call(this, this.response);
    };

  // ****************************************************************************//

  /**
   * Implements the CRAM-MD5 Challenge-Response Mechanism as defined in RFC2195.
   *
   * It is considered to be weak and should only be used via encrypted connections.
   *
   * @author Thomas Schmid
   * @author Max Dittrich
   * @constructor
   */
  function SieveSaslCramMd5Request() {
    this.response = new SieveSaslCramMd5Response();
  }

  // Inherrit prototypes from SieveAbstractRequest...
  SieveSaslCramMd5Request.prototype = Object.create(SieveAbstractSaslRequest.prototype);
  SieveSaslCramMd5Request.prototype.constructor = SieveSaslCramMd5Request;

  /**
   * Retruns the crypto engine which should be used for this request.
   * @returns {SieveCrypto}
   *   the crypto engine for sha1
   */
  SieveSaslCramMd5Request.prototype.getCrypto = function () {
    return new SieveCrypto("MD5");
  };

  /**
   * Called when the server challenges the client to calculate a secret.
   *
   * @param {SieveAbstractRequestBuilder} builder
   *   the builder which should be used to build the response.   *
   * @returns {SieveAbstractRequestBuilder}
   *   the builder which contains the response for the challenge.
   */
  SieveSaslCramMd5Request.prototype.onChallenged
    = function (builder) {

      let challenge = this.response.getChallenge();
      // decoding the base64-encoded challenge
      challenge = builder.convertFromBase64(challenge);

      const crypto = this.getCrypto();
      const hmac = crypto.HMAC(this._password, challenge, "hex");

      return builder
        .addQuotedBase64(this._username + " " + hmac);
    };

  SieveSaslCramMd5Request.prototype.getNextRequest
    = function (builder) {
      switch (this.response.getState()) {
        case STATE_CRAM_MD5_INIT:
          return builder
            .addLiteral("AUTHENTICATE")
            .addQuotedString("CRAM-MD5");
        case STATE_CRAM_MD5_CHALLENGED:
          return this.onChallenged(builder);
      }

      throw new Error("Illegal state in SaslCram");
    };

  SieveSaslCramMd5Request.prototype.hasNextRequest
    = function () {
      if (this.response.getState() === 4)
        return false;

      return true;
    };

  /**
   * @inheritdoc
   */
  SieveSaslCramMd5Request.prototype.addResponse
    = function (parser) {
      this.response.parse(parser);

      if (this.hasNextRequest())
        return;

      SieveAbstractRequest.prototype.addResponse.call(this, this.response);
    };

  /**
   * This request implements an abstract base class for the "Salted Challenge Response Authentication
   * Mechanism" (SCRAM). A SASL SCRAM-SHA-1 compatible implementation is mandatory
   * for every manage sieve server. SASL SCRAM-SHA-1 superseeds DIGEST-MD5.
   *
   * @author Thomas Schmid
   * @constructor
   */
  function SieveAbstractSaslScramRequest() {
    this.response = new SieveSaslScramShaResponse();
  }

  // Inherrit prototypes from SieveAbstractRequest...
  SieveAbstractSaslScramRequest.prototype = Object.create(SieveAbstractSaslRequest.prototype);
  SieveAbstractSaslScramRequest.prototype.constructor = SieveAbstractSaslScramRequest;

  SieveAbstractSaslScramRequest.prototype.isAuthorizable = function () {
    // overwrite the default as this mechanism support authorization
    return true;
  };

  SieveAbstractSaslScramRequest.prototype.getSaslName = function () {
    throw new Error("Implement SASL Name");
  };

  SieveAbstractSaslScramRequest.prototype.getCrypto = function () {
    throw new Error("Implement Crypto Method which returns a crypto provider");
  };

  SieveAbstractSaslScramRequest.prototype.onChallengeServer = function (builder) {

    let crypto = this.getCrypto();

    this._cnonce = crypto.H("" + (Math.random() * 1234567890), "hex");

    // For integration tests, we need to fake the nonce...
    // ... so we take the nonce from the rfc otherwise the verification fails.
    //
    // ### DEBUG SHA1 ###
    // this._cnonce = "fyko+d2lbbFgONRv9qkxdawL";
    // this._username = "user";
    // this._password = "pencil";
    //
    // ### DEBUG SHA256 ###
    // this._cnonce = "rOprNGfwEbeRWgbNEkqO";
    // this._username = "user";
    // this._password = "pencil";

    // TODO SCRAM: escape/normalize authorization and username
    // ;; UTF8-char except NUL, "=", and ","
    // "=" is escaped by =2C and "," by =3D

    // Store client-first-message-bare
    this._authMessage = "n=" + this._username + ",r=" + this._cnonce;
    this._g2Header = "n," + (this._authorization !== "" ? "a=" + this._authorization : "") + ",";

    return builder
      .addLiteral("AUTHENTICATE")
      .addQuotedString(this.getSaslName())
      .addQuotedBase64("" + this._g2Header + this._authMessage);
  };

  SieveAbstractSaslScramRequest.prototype.onValidateChallenge = function (builder) {
    // Check if the server returned our nonce. This should prevent...
    // ... man in the middle attacks.
    let nonce = this.response.getNonce();
    if ((nonce.substr(0, this._cnonce.length) !== this._cnonce))
      throw new Error("Nonce invalid");

    const crypto = this.getCrypto();

    // As first step we need to salt the password...
    let salt = this.response.getSalt();
    let iter = this.response.getIterationCounter();

    // TODO Normalize password; and convert it into a byte array...
    // ... It might contain special charaters.

    // ... this is done by applying a simplified PBKDF2 algorithm...
    // ... so we endup by calling Hi(Normalize(password), salt, i)
    this._saltedPassword = crypto.Hi(this._password, salt, iter);

    // the clientKey is defined as HMAC(SaltedPassword, "Client Key")
    let clientKey = crypto.HMAC(this._saltedPassword, "Client Key");

    // create the client-final-message-without-proof, ...
    let msg = "c=" + builder.convertToBase64(this._g2Header) + ",r=" + nonce;
    // ... append it and the server-first-message to client-first-message-bare...
    this._authMessage += "," + this.response.getServerFirstMessage() + "," + msg;

    // ... and convert it into a byte array.
    this._authMessage = crypto.strToByteArray(this._authMessage);

    // As next Step sign out message, this is done by applying the client...
    // ... key through a pseudorandom function to the message. It is defined...
    // as HMAC(H(ClientKey), AuthMessage)
    let clientSignature = crypto.HMAC(
      crypto.H(clientKey),
      this._authMessage);

    // We now complete the cryptographic part an apply our clientkey to the...
    // ... Signature, so that the server can be sure it is talking to us.
    // The RFC defindes this step as ClientKey XOR ClientSignature
    let clientProof = clientKey;
    for (let k = 0; k < clientProof.length; k++)
      clientProof[k] ^= clientSignature[k];

    // Every thing done so let's send the message...
    // "c=" base64( (("" / "y") "," [ "a=" saslname ] "," ) "," "r=" c-nonce s-nonce ["," extensions] "," "p=" base64
    return builder
      .addQuotedBase64(msg + ",p=" + builder.convertToBase64(clientProof));
    //      return "\""+btoa(msg+",p="+btoa(this.byteArrayToStr(clientProof)))+"\"\r\n";
  };

  SieveAbstractSaslScramRequest.prototype.getNextRequest
    = function (builder) {

      // Step1: Client sends Message to server. See SASL Login how to integrate it
      // into the AUTHENTICATE Command.
      //
      // e.g.: "AUTHENTICATE \"SCRAM-SHA-1\" \"n,,n=user,r=fyko+d2lbbFgONRv9qkxdawL\"\r\n"

      switch (this.response.getState()) {
        case 0:
          return this.onChallengeServer(builder);
        case 1:
          return this.onValidateChallenge(builder);
        case 2:
          // obviously we have to send an empty response. The server did not wrap...
          // ... the verifier into the Response Code...
          return builder
            .addQuotedString("");
        // return "\"\"\r\n";
      }

      throw new Error("Illegal state in SaslCram");
    };

  SieveAbstractSaslScramRequest.prototype.hasNextRequest
    = function () {
      if (this.response.getState() === 4)
        return false;

      return true;
    };

  SieveAbstractSaslScramRequest.prototype.onOk
    = function (response) {

      let crypto = this.getCrypto();

      let serverSignature = crypto.HMAC(
        crypto.HMAC(
          this._saltedPassword,
          "Server Key"),
        this._authMessage
      );

      if (response.getVerifier() !== crypto.byteArrayToStr(serverSignature)) {
        response.message = "Server Signature not invalid ";
        response.response = 2;
        this.onNo(response);
        return;
      }

      SieveAbstractSaslRequest.prototype.onOk.call(this, response);
    };

  /**
   * @inheritdoc
   */
  SieveAbstractSaslScramRequest.prototype.addResponse
    = function (parser) {

      this.response.parse(parser);

      if (this.hasNextRequest())
        return;

      SieveAbstractRequest.prototype.addResponse.call(this, this.response);
    };


  /**
   * Implements the SCRAM-SHA-1 mechanism.
   */
  class SieveSaslScramSha1Request extends SieveAbstractSaslScramRequest {
    /**
     * Gets the SASL Mechanism name.
     *
     * @returns {string}
     *   the SASL Mechanism's unique it as string.
     */
    getSaslName() {
      return "SCRAM-SHA-1";
    }

    /**
     * Retruns the crypto engine which should be used for this request.
     * @returns {SieveCrypto}
     *   the crypto engine for sha1
     */
    getCrypto() {
      return new SieveCrypto("SHA1");
    }
  }

  /**
   * Implements the SCRAM-SHA-256 mechanism.
   */
  class SieveSaslScramSha256Request extends SieveAbstractSaslScramRequest {

    /**
     * Gets the SASL Mechanism name.
     *
     * @returns {string}
     *   the SASL Mechanism's unique it as string.
     */
    getSaslName() {
      return "SCRAM-SHA-256";
    }

    /**
     * Retruns the crypto engine which should be used for this request.
     * @returns {SieveCrypto}
     *   the crypto engine for sha265
     */
    getCrypto() {
      return new SieveCrypto("SHA256");
    }
  }

  /**
   * This request implements SASL External Mechanism (rfc4422 Appendix A).
   * It's a dumb-dumb implementation, and relies upon an established tls connection.
   * It tells the server to use the cert provided during the TLS handshake.
   *
   * @author Thomas Schmid
   * @constructor
   */
  function SieveSaslExternalRequest() {
  }

  // Inherrit prototypes from SieveAbstractRequest...
  SieveSaslExternalRequest.prototype = Object.create(SieveAbstractSaslRequest.prototype);
  SieveSaslExternalRequest.prototype.constructor = SieveSaslExternalRequest;

  SieveSaslExternalRequest.prototype.isAuthorizable
    = function () {
      // overwrite the default behaviour.
      return true;
    };

  SieveSaslExternalRequest.prototype.getNextRequest
    = function (builder) {
      return builder
        .addLiteral("AUTHENTICATE")
        .addQuotedString("EXTERNAL")
        .addQuotedBase64("" + this._authorization);
    };

  /**
   * SASL External uses the TLS Cert for authentication.
   * Thus it does not rely upon any password, so this mehtod retuns always false.
   *
   * @returns {boolean}
   *   returns always false
   */
  SieveSaslExternalRequest.prototype.hasPassword
    = function () {
      return false;
    };

  /**
   * @inheritdoc
   */
  SieveSaslExternalRequest.prototype.addResponse
    = function (parser) {
      SieveAbstractRequest.prototype.addResponse.call(this,
        (new SieveSimpleResponse()).parse(parser));
    };

  exports.SieveGetScriptRequest = SieveGetScriptRequest;
  exports.SievePutScriptRequest = SievePutScriptRequest;
  exports.SieveCheckScriptRequest = SieveCheckScriptRequest;
  exports.SieveSetActiveRequest = SieveSetActiveRequest;
  exports.SieveCapabilitiesRequest = SieveCapabilitiesRequest;
  exports.SieveDeleteScriptRequest = SieveDeleteScriptRequest;
  exports.SieveNoopRequest = SieveNoopRequest;
  exports.SieveRenameScriptRequest = SieveRenameScriptRequest;
  exports.SieveListScriptRequest = SieveListScriptRequest;
  exports.SieveStartTLSRequest = SieveStartTLSRequest;
  exports.SieveLogoutRequest = SieveLogoutRequest;
  exports.SieveInitRequest = SieveInitRequest;
  exports.SieveSaslPlainRequest = SieveSaslPlainRequest;
  exports.SieveSaslLoginRequest = SieveSaslLoginRequest;
  exports.SieveSaslCramMd5Request = SieveSaslCramMd5Request;
  exports.SieveSaslScramSha1Request = SieveSaslScramSha1Request;
  exports.SieveSaslScramSha256Request = SieveSaslScramSha256Request;
  exports.SieveSaslExternalRequest = SieveSaslExternalRequest;

})(module.exports || this);
