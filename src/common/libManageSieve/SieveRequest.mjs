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
  The communication in this library is asynchronous! After sending a request,
  you will be notified by a listener, as soon as a response arrives.

  If a request caused an error or timeout, its error listener will be called
  to resolve the issue. If a server rejects a request, the onError() function
  of the error listener will be invoked. In case of a timeout situation, the
  onTimeout() function is called.

  If a request succeeded, the corresponding response listener of the request
  will be notified.

  The onResponse(), getNextRequest(), hasNextRequest() Methods are
  used by the Sieve object, and should not be invoked manually.

  When the sieve object receives a response, it is passed to the onResponse()
  Method of the requesting object. A timeout is signaled by passing invoking
  the abort() Method.

*/

import {
  SieveSimpleResponse,
  SieveCapabilitiesResponse,
  SieveListScriptsResponse,
  SieveSaslLoginResponse,
  SieveGetScriptResponse,
  SieveSaslScramShaResponse
} from "./SieveResponse.mjs";

import { SieveCrypto } from "./SieveCrypto.mjs";

import { SieveBase64Encoder } from "./SieveBase64.mjs";

const STATE_LOGIN_INITIALIZED = 0;
const STATE_LOGIN_USERNAME = 1;
const STATE_LOGIN_PASSWORD = 2;
const STATE_LOGIN_COMPLETED = 4;

const RESPONSE_OK = 0;
const RESPONSE_BYE = 1;
const RESPONSE_NO = 2;

const SEED = 1234567890;

/**
 * An abstract class, it is the prototype for any requests
 */
class SieveAbstractRequest {

  /**
   * Creates a new Instance.
   */
  constructor() {
    this.errorListener = null;
    this.timeoutListener = null;
    this.byeListener = null;

    this.responseListener = null;

    this.optional = false;
    this.abandoned = false;
  }

  /**
   * The error listener is called whenever the server returns an error state
   * @param {Function} listener
   *   the listener which should be invoked
   * @returns {SieveAbstractRequest}
   *   a self reference
   */
  addErrorListener(listener) {

    if (typeof listener !== 'function') {
      throw new Error("Error listener is not a function");
    }

    this.errorListener = listener;
    return this;
  }

  /**
   * The timeout listener is calls whenever sending a request fails for some
   * reason. This could be because of a timeout or because the server terminated
   * the connection or something else happened.
   *
   * The listener does not necessarily wait for a timeout event. E.g. in case the
   * connection is lost it will fire immediately.
   *
   * @param {Function} listener
   *   the listener which should be invoked
   * @returns {SieveAbstractRequest}
   *   a self reference
   */
  addTimeoutListener(listener) {

    // TODO should be renamed to error listener as it is more than just a timeout handler...
    if (typeof listener !== 'function') {
      throw new Error("Timeout listener is not a function");
    }

    this.timeoutListener = listener;
    return this;
  }

  /**
   * The bye listener is called whenever the server terminated the connection
   * gracefully.
   *
   * @param {Function} listener
   *   the listener which should be invoked
   * @returns {SieveAbstractRequest}
   *   a self reference
   */
  addByeListener(listener) {

    if (typeof listener !== 'function') {
      throw new Error("Bye listener is not a function");
    }

    this.byeListener = listener;
    return this;
  }

  /**
   * Add a response listener to this request. The response listener will
   * be triggered in case a successful server response was received
   *
   * @param {Function} listener
   *   the listener which should be invoked when the server response
   * @returns {SieveAbstractRequest}
   *   a self reference
   */
  addResponseListener(listener) {

    if (typeof listener !== 'function') {
      throw new Error(`Listener is not a function ${listener}`);
    }

    this.responseListener = listener;
    return this;
  }

  /**
   * Marks this request a optional. See isOptional for more details.
   *
   * @returns {SieveAbstractRequest}
   *   a self reference.
   */
  makeOptional() {
    this.optional = true;
    return this;
  }

  /**
   * Optional means the request will be send to the server. But a server
   * response is not required. This is used to workaround a common bug in
   * old sieve implementations.
   *
   * Please note an optional request will resolve earliest after the next
   * subsequent request was resolved.
   *
   * @returns {boolean}
   *   false in case this request is not optional which is the default.
   */
  isOptional() {
    return this.optional;
  }

  /**
   * In general sieve is bidirectional, client first communication. This means
   * the client sends a request to server and the server responds to it. Request
   * and responses typically form pairs.
   *
   * But there are exceptions to this rule, e.g. the init response upon
   * connect or after tls handshake. In this case it is a one-way communication.
   * The server sends a response without being triggered by a request.
   *
   * @returns {boolean}
   *   true in case the request is bidirectional. Which means
   *   the client sends a request and the server responds
   *   to that.
   *   false in case the request is unidirectional. Which means
   *   it was send by the server without being explicitly
   *   request by the client.
   */
  hasRequest() {
    return true;
  }

  /**
   * Most request use a single request response pair. But especially the SASL
   * script use normally more than one round trip due to security reasons.
   *
   * This flags indicates if the Request's internal state engine was completed.
   *
   * @returns {boolean}
   *   false in case the request has been completed. True in case it is still
   *   running and waits for sending the next request.
   */
  hasNextRequest() {
    return false;
  }

  /**
   * Returns the next request as a string. It uses the given
   * Request builder to assemble the string.
   *
   * @param  {SieveRequestBuilder} builder
   *   a reference to a stateless request builder which can be used
   *   to form the request string.
   * @returns {string}
   *   the data which should be send to the server
   *
   * @abstract
   */
  async getNextRequest(builder) {
    throw new Error(`Abstract Method implement me ${builder}`);
  }

  /**
   * Marks this request as abandoned because the request timedout or the socket
   * was closed.This should never be invoked directly by any other object than
   * the sieve connection.
   *
   * @param {Error} [reason]
   *   the optional reason why the request was abandoned.
   */
  abandon(reason) {
    this.abandoned = true;
    this.reason = reason;
  }

  /**
   * Checks if this message was abandoned.
   *
   * @returns {boolean}
   *   true in case the request is abandoned otherwise false.
   */
  isAbandoned() {
    return this.aborted;
  }

  /**
   * Triggers the request timeout listener.
   *
   * The request has to be abandoned and non optional otherwise the
   * call is silently discarded.
   */
  async onAbandon() {

    if (!this.isAbandoned())
      return;

    if (this.isOptional())
      return;

    if (this.timeoutListener)
      this.timeoutListener(this.reason);
  }

  /**
   * Trigger the error listener to signal an error condition.
   *
   * This should never be invoked directly by any other object than the
   * sieve connection or this class.
   *
   * @param {SieveSimpleResponse} response
   *   the response which should be handled by this request.
   */
  async onNo(response) {
    if (this.errorListener)
      this.errorListener(response);
  }

  /**
   * Trigger the bye listener.
   *
   * This should never be invoked directly by any other object than the
   * sieve connection or this class.
   *
   * @param {SieveSimpleResponse} response
   *   the response which should be handled by this request.
   */
  async onBye(response) {
    if ((response.getResponse() === RESPONSE_BYE) && (this.byeListener))
      this.byeListener(response);
  }

  /**
   * Triggers the ok listener. This is normally when the request completed
   * successfully.
   *
   * This should never be invoked directly by any other object than the
   * sieve connection or this class.
   *
   * @param {SieveSimpleResponse} response
   *   the response which should be handled by this request.
   *
   * @abstract
   */
  async onOk(response) {
    throw new Error(`Abstract method override me ${response}`);
  }

  /**
   * An abstract helper, which calls the default message handlers
   * for the given response
   *
   * @param {SieveSimpleResponse} response
   *   the response which should be handled by this request.
   * @returns {SieveAbstractRequest}
   *   a self reference
   */
  async onResponse(response) {

    if (response.getResponse() === RESPONSE_OK) {
      await this.onOk(response);
      return this;
    }

    if (this.isOptional())
      throw new Error("Invalid Response for an optional Request");

    if (response.getResponse() === RESPONSE_BYE) {
      await this.onBye(response);
      return this;
    }

    if (response.getResponse() === RESPONSE_NO) {
      await this.onNo(response);
      return this;
    }

    throw new Error("Invalid Response Code");
  }
}

/**
 * An abstract calls derived from AbstractRequest. It is the foundation for
 * any requests implementing a SASL compatible authentication.
 */
class SieveAbstractSaslRequest extends SieveAbstractRequest {

  /**
   * @inheritdoc
   */
  constructor() {
    super();

    this._username = "";
    this._password = "";
    this._authorization = "";
  }

  /**
   * Sets the sasl mechanisms username. Not all SASL Mechanisms require an username.
   *
   * @param {string} username
   *   the username
   * @returns {SieveAbstractSaslRequest}
   *   a self reference
   **/
  setUsername(username) {
    this._username = username;
    return this;
  }

  /**
   * Most SASL mechanisms need a password or secret to authenticate.
   * But there are also mechanisms like SASL EXTERNAL which do not need a password.
   * They use different methods to transfer the credentials.
   *
   * @returns {boolean}
   *   indicates if this SASL Mechanism needs a password
   */
  hasPassword() {
    return true;
  }

  /**
   * Sets the sasl request's password.
   *
   * @param {string} password
   *   the password which shall be used for the authentication.
   * @returns {SieveAbstractSaslRequest}
   *   a self reference
   **/
  setPassword(password) {
    this._password = password;
    return this;
  }

  /**
   * Checks if this mechanism supports authorization. Keep in mind
   * authorization is rarely used and only very few mechanisms
   * support it.
   *
   * With authorization you use your credentials to login as a different user.
   * Which means you first authenticate with your username and then do the
   * authorization which switch the user. Typically admins and superusers have
   * such super powers.
   *
   * @returns {boolean}
   *   true in case the request supports authorization otherwise false.
   */
  isAuthorizable() {
    // Sub classes shall overwrite this with true in case authorization is supported
    return false;
  }

  /**
   * Sets the username which should be authorized.
   * In case authorization is not supported it will be silently ignored.
   *
   * @param {string} authorization
   *   the username used for authorization
   * @returns {SieveAbstractRequest}
   *   a self reference
   **/
  setAuthorization(authorization) {
    if (this.isAuthorizable())
      this._authorization = authorization;

    return this;
  }

  /**
   * @inheritdoc
   */
  async onOk(response) {
    if (this.responseListener)
      this.responseListener(response);
  }
}

/**
 * Loads a script from the server and returns the content.
 * In case the script is non existent an error will be triggered.
 */
class SieveGetScriptRequest extends SieveAbstractRequest {

  /**
   * Create a new request which load a sieve script from the
   * remote server.
   *
   * @param {string} script
   *   the script which should be retrieved
   */
  constructor(script) {
    super();
    this.script = script;
  }

  /**
   * @inheritdoc
   */
  async getNextRequest(builder) {
    return builder
      .addLiteral("GETSCRIPT")
      .addQuotedString(this.script);
  }

  /**
   * @inheritdoc
   */
  async onOk(response) {
    if (this.responseListener)
      this.responseListener(response);
  }

  /**
   * @inheritdoc
   */
  async onResponse(parser) {
    return await (super.onResponse(
      await (new SieveGetScriptResponse(this.script)).parse(parser)));
  }
}

/**
 * Stores the given script on the server.
 * The script is validated by the server and will be rejected with a NO
 * in case the validation fails.
 *
 * Please not it will overwrite silently any existing script with the same name.
 */
class SievePutScriptRequest extends SieveAbstractRequest {

  /**
   * Creates a request which stores a sieve script on the server.
   *
   * @param {string} script
   *   the script's name
   * @param {string} body
   *   the sieve script which should be stored on the server.
   */
  constructor(script, body) {
    super();
    this.script = script;

    // cleanup line breaks...

    // eslint-disable-next-line no-control-regex
    this.body = body.replace(/\r\n|\r|\n|\u0085|\u000C|\u2028|\u2029/g, "\r\n");
  }

  /**
   * @inheritdoc
   */
  async getNextRequest(builder) {
    return builder
      .addLiteral("PUTSCRIPT")
      .addQuotedString(this.script)
      .addMultiLineString(this.body);
  }

  /**
   * @inheritdoc
   */
  async onOk(response) {
    if (this.responseListener)
      this.responseListener(response);
  }

  /**
   * @inheritdoc
   */
  async onResponse(parser) {
    return await(super.onResponse(
      await (new SieveSimpleResponse()).parse(parser)));
  }
}

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
 */
class SieveCheckScriptRequest extends SieveAbstractRequest {

  /**
   * Creates a new request which checks if the scripts' syntax is valid.
   * @param {string} body
   *   the script which should be check for syntactical validity
   */
  constructor(body) {
    super();
    // Strings in JavaScript should use the encoding of the xul document and...
    // ... sockets use binary strings. That means for us we have to convert...
    // ... the JavaScript string into a UTF8 String.

    // Further more Sieve expects line breaks to be \r\n. Mozilla uses \n ...
    // ... according to the documentation. But for some unknown reason a ...
    // ... string sometimes contains mixed line breaks. Thus we convert ...
    // ... any \r\n, \r and \n to \r\n.

    // eslint-disable-next-line no-control-regex
    this.body = body.replace(/\r\n|\r|\n|\u0085|\u000C|\u2028|\u2029/g, "\r\n");
  }

  /**
   * @inheritdoc
   */
  async getNextRequest(builder) {
    return builder.addLiteral("CHECKSCRIPT")
      .addMultiLineString(this.body);
  }

  /**
   * @inheritdoc
   */
  async onOk(response) {
    if (this.responseListener)
      this.responseListener(response);
  }

  /**
   * @inheritdoc
   */
  async onResponse(parser) {
    return await(super.onResponse(
      await (new SieveSimpleResponse()).parse(parser)));
  }
}

/**
 * This class encapsulates a Sieve SETACTIVE request.
 * <p>
 * Either none or one server scripts can be active, this means you can't have
 * more than one active scripts
 * <p>
 * You activate a Script by calling SETACTIVE and the script name. At activation
 * the previous active Script will become inactive.
 */
class SieveSetActiveRequest extends SieveAbstractRequest {

  /**
   * Creates a new request which activates the given script
   * @param {string} script - The script name which should be activated. Passing
   * an empty string deactivates the active script.
   */
  constructor(script) {
    super();

    this.script = "";

    if ((typeof (script) !== 'undefined') && (script !== null))
      this.script = script;
  }

  /**
   * @inheritdoc
   */
  async getNextRequest(builder) {
    return builder
      .addLiteral("SETACTIVE")
      .addQuotedString(this.script);
  }

  /**
   * @inheritdoc
   */
  async onOk(response) {
    if (this.responseListener)
      this.responseListener(response);
  }

  /**
   * @inheritdoc
   */
  async onResponse(parser) {
    return await(super.onResponse(
      await (new SieveSimpleResponse()).parse(parser)));
  }
}

/**
 * The capability request asks the server to transmit his
 * capabilities like the supported sieve extensions, as
 * well as a list with all possible SASL authentication mechanisms.
 *
 * The returned capabilities depends upon the context. A server may
 * refuse to advertise SASL Mechanisms while using an insecure
 * connection. As soon as you started a secure connection it may offer
 * additional Mechanisms.
 *
 * So you should always refresh the server's capabilities.
 */
class SieveCapabilitiesRequest extends SieveAbstractRequest {

  /**
   * @inheritdoc
   */
  async getNextRequest(builder) {
    return builder
      .addLiteral("CAPABILITY");
  }

  /**
   * @inheritdoc
   */
  async onOk(response) {
    if (this.responseListener)
      this.responseListener(response);
  }

  /**
   * @inheritdoc
   */
  async onResponse(parser) {
    return await(super.onResponse(
      await (new SieveCapabilitiesResponse()).parse(parser)));
  }
}

/**
 * The delete script command is used to remove a script from the server.
 * Deleting an non existing script will result in an error. Also deleting
 * the active script will result in an error.
 */
class SieveDeleteScriptRequest extends SieveAbstractRequest {

  /**
   * Creates a request which deletes the given script.
   * @param {string} script
   *   the scripts name which should be deleted
   */
  constructor(script) {
    super();
    this.script = script;
  }

  /**
   * @inheritdoc
   */
  async getNextRequest(builder) {
    return builder
      .addLiteral("DELETESCRIPT")
      .addQuotedString(this.script);
  }

  /**
   * @inheritdoc
   */
  async onOk(response) {
    if (this.responseListener)
      this.responseListener(response);
  }

  /**
   * @inheritdoc
   */
  async onResponse(parser) {
    return await(super.onResponse(
      await (new SieveSimpleResponse()).parse(parser)));
  }
}

/**
 * The NOOP request does nothing, it is used for protocol resynchronization or
 * to reset any inactivity auto-logout timer on the server.
 *
 * The response to the NOOP command is always OK.
 */
class SieveNoopRequest extends SieveAbstractRequest {

  /**
   * @inheritdoc
   */
  async getNextRequest(builder) {
    return builder
      .addLiteral("NOOP");
  }

  /**
   * @inheritdoc
   */
  async onOk(response) {
    if (this.responseListener)
      this.responseListener(response);
  }

  /**
   * @inheritdoc
   */
  async onResponse(parser) {
    return await(super.onResponse(
      await (new SieveSimpleResponse()).parse(parser)));
  }
}


/**
 * This command is used to rename a Sieve script. The Server will reply with
 * a NO response if the old script does not exist, or a script with the new
 * name already exists.
 *
 * Renaming the active script is allowed, the server ensures that the
 * renamed script remains active.
 */
class SieveRenameScriptRequest extends SieveAbstractRequest {

  /**
   * Creates a rename script request.
   *
   * @param {string} oldScript Name of the script, which should be renamed
   * @param {string} newScript New name of the script
   **/
  constructor(oldScript, newScript) {
    super();
    this.oldScript = oldScript;
    this.newScript = newScript;
  }

  /**
   * @inheritdoc
   */
  async getNextRequest(builder) {
    return builder
      .addLiteral("RENAMESCRIPT")
      .addQuotedString(this.oldScript)
      .addQuotedString(this.newScript);
  }

  /**
   * @inheritdoc
   */
  async onOk(response) {
    if (this.responseListener)
      this.responseListener(response);
  }

  /**
   * @inheritdoc
   */
  async onResponse(parser) {
    return await(super.onResponse(
      await (new SieveSimpleResponse()).parse(parser)));
  }
}

/**
 * This command is used to list all sieve script of the current user.
 * In case there are no scripts the server responds with an empty list.
 */
class SieveListScriptsRequest extends SieveAbstractRequest {

  /**
   * @inheritdoc
   */
  async getNextRequest(builder) {
    return builder
      .addLiteral("LISTSCRIPTS");
  }

  /**
   * @inheritdoc
   */
  async onOk(response) {
    if (this.responseListener)
      this.responseListener(response);
  }

  /**
   * @inheritdoc
   */
  async onResponse(parser) {
    return await(super.onResponse(
      await (new SieveListScriptsResponse()).parse(parser)));
  }
}

/**
 * Initializes switching to tls via start tls
 */
class SieveStartTLSRequest extends SieveAbstractRequest {

  /**
   * @inheritdoc
   */
  async getNextRequest(builder) {
    return builder
      .addLiteral("STARTTLS");
  }

  /**
   * @inheritdoc
   */
  async onOk(response) {
    if (this.responseListener)
      this.responseListener(response);
  }

  /**
   * @inheritdoc
   */
  async onResponse(parser) {
    return await(super.onResponse(
      await (new SieveSimpleResponse()).parse(parser)));
  }
}

/**
 * A logout request signals the server that the client wishes to terminate
 * the current session.
 * <pre>
 * Client > LOGOUT
 * Server < OK "Logout Complete"
 * [ connection terminated ]
 * </pre>
 * <p>
 */
class SieveLogoutRequest extends SieveAbstractRequest {

  /**
   * @inheritdoc
   */
  async getNextRequest(builder) {
    return builder.addLiteral("LOGOUT");
  }

  /**
   * @inheritdoc
   */
  async onOk(response) {
    if (this.responseListener)
      this.responseListener(response);
  }

  /**
   * @inheritdoc
   */
  async onBye(response) {
    // As issued a logout request thus onBye response is perfectly fine...
    // ... and equivalent to an ok in this case.
    await this.onOk(response);
  }

  /**
   * @inheritdoc
   */
  async onResponse(parser) {
    return await(super.onResponse(
      await (new SieveSimpleResponse()).parse(parser)));
  }
}

/**
 * A ManageSieve server automatically post his capabilities as soon as the
 * connection is established or a secure channel is successfully started
 * (STARTTLS command). In order to capture this information a dummy request
 * is used. It does not send a real request, but it parses the initial response
 * of the sieve server. Therefore it is important to add the request before the
 * connection is established. Otherwise the message queue will be jammed.
 *
 * Server < "IMPLEMENTATION" "Cyrus timsieved v2.1.18-IPv6-Debian-2.1.18-1+sarge2"
 *        < "SASL" "PLAIN"
 *        < "SIEVE" "fileinto reject envelope vacation imapflags notify subaddress relational regex"
 *        < "STARTTLS"
 *        < OK
 *
 */
class SieveInitRequest extends SieveAbstractRequest {

  /**
   * @inheritdoc
   */
  async onOk(response) {
    if (this.responseListener)
      this.responseListener(response);
  }

  /**
   * @inheritdoc
   */
  hasRequest() {
    return false;
  }

  /**
   * @inheritdoc
   */
  async onResponse(parser) {
    return await(super.onResponse(
      await (new SieveCapabilitiesResponse()).parse(parser)));
  }
}

/**
 * Implements the SASL Plain authentication method.
 *
 * The password is only base64 encoded not encrypted. Therefore it can be
 * read or sniffed easily. A secure connection will solve this issue. Always
 * start a tls session before using this request.
 *
 * Client > AUTHENTICATE "PLAIN" AHRlc3QAc2VjcmV0   | AUTHENTICATE "PLAIN" [UTF8NULL]test[UTF8NULL]secret
 * Server < OK                                      | OK
 */
class SieveSaslPlainRequest extends SieveAbstractSaslRequest {

  /**
   * The sasl plain request always support proxy authentication.
   *
   * @returns {boolean}
   *   always true
   */
  isAuthorizable() {
    return true;
  }

  /**
   * @inheritdoc
   */
  async getNextRequest(builder) {
    return builder
      .addLiteral("AUTHENTICATE")
      .addQuotedString("PLAIN")
      .addQuotedBase64(`${this._authorization}\0${this._username}\0${this._password}`);
  }

  /**
   * @inheritdoc
   */
  async onResponse(parser) {
    return await(super.onResponse(
      await (new SieveSimpleResponse()).parse(parser)));
  }
}

/**
 * This request implements the SASL Login authentication method. It is deprecated
 * and has been superseded by SASL Plain method. SASL Login uses a question and
 * answer style communication. The server will request first the username and
 * then the password.
 * <p>
 * Please note, that the password is not encrypted, it is only base64 encoded.
 * Therefore it can be read or sniffed easily. A secure connection will solve
 * this issue. So send whenever possible, a SieveStartTLSRequest before calling
 * this request.
 * <p>
 *   Client > AUTHENTICATE "LOGIN"   | AUTHENTICATE "LOGIN"
 *   Server < {12}                   | {12}
 *          < VXNlcm5hbWU6           | Username:
 *   Client > {8+}                   | {8+}
 *          > Z2Vlaw==               | geek
 *   Server < {12}                   | {12}
 *          < UGFzc3dvcmQ6           | Password:
 *   Client > {12+}                  | {12+}
 *          > dGgzZzMzazE=           | th3g33k1
 *   Server < OK                     | OK
 *
 * @deprecated
 */
class SieveSaslLoginRequest extends SieveAbstractSaslRequest {

  /**
   * @inheritdoc
   */
  constructor() {
    super();
    this.response = new SieveSaslLoginResponse();
  }

  /**
   * @inheritdoc
   */
  async getNextRequest(builder) {
    switch (this.response.getState()) {
      case STATE_LOGIN_INITIALIZED:
        return builder
          .addLiteral("AUTHENTICATE")
          .addQuotedString("LOGIN");
      case STATE_LOGIN_USERNAME:
        return builder
          .addQuotedBase64(this._username);
      case STATE_LOGIN_PASSWORD:
        return builder
          .addQuotedBase64(this._password);
    }

    throw new Error("Unknown state in SASL login");
  }

  /**
   * @inheritdoc
   */
  hasNextRequest() {
    if (this.response.hasError())
      return false;

    if (this.response.getState() === STATE_LOGIN_COMPLETED)
      return false;

    return true;
  }

  /**
   * @inheritdoc
   */
  async onResponse(parser) {
    await this.response.parse(parser);

    if (this.hasNextRequest())
      return this;

    return await(super.onResponse(this.response));
  }
}

const SHA_STATE_FIRST_MESSAGE = 0;
const SHA_STATE_FINAL_MESSAGE = 1;
const SHA_STATE_EMPTY_MESSAGE = 2;
const SHA_STATE_COMPLETED = 4;

/**
 * This request implements an abstract base class for the "Salted Challenge Response Authentication
 * Mechanism" (SCRAM). A SASL SCRAM-SHA-1 compatible implementation is mandatory
 * for every manage sieve server. SASL SCRAM-SHA-1 supersedes DIGEST-MD5.
 *
 * @author Thomas Schmid
 */
class SieveAbstractSaslScramRequest extends SieveAbstractSaslRequest {

  /**
   * @inheritdoc
   */
  constructor() {
    super();
    this.response = new SieveSaslScramShaResponse();
  }

  /**
   * Checks if the request supports authorization
   *
   * @returns {boolean}
   *   true, as a scram request can always be used for a proxy authentication
   */
  isAuthorizable() {
    // overwrite the default as this mechanism support authorization
    return true;
  }

  /**
   * Gets the SASL Mechanism name.
   * @abstract
   *
   * @returns {string}
   *   the SASL Mechanism's unique it as string.
   */
  getSaslName() {
    throw new Error("Implement SASL Name");
  }

  /**
   * Returns the crypto engine/provider which should be used for this request.
   * @abstract
   *
   * @returns {SieveCrypto}
   *   the crypto engine
   */
  getCrypto() {
    throw new Error("Implement Crypto Method which returns a crypto provider");
  }

  /**
   * Before sending the username to the server is needs to be normalized.
   * The comma and the equal character have a special meaning and need to
   * escaped.
   *
   * @param {string} username
   *   the username which should be escaped
   * @returns {string}
   *   the escaped username
   */
  normalizeUsername(username) {

    // Safe Chars:
    // UTF8-char except "=" and ","
    // 0x01-0x2B, 0x2D-0x3C, 0X3E-0x7F,
    // UTF8-2, UTF8-3, UTF8-4

    // Theoretically we should run SASLPrep on str but the server does ist anyway.
    return username.replace("=", "=3D").replace(",", "=2C");
  }

  /**
   * Calculates a nonce for the initial request.
   *
   * @returns {string}
   *   a sequence of printable ascii characters except a comma (,).
   */
  async generateNonce() {
    return await (this.getCrypto().H("" + (Math.random() * SEED), "hex"));
  }

  /**
   * Sends the "client-first-message" to the server.
   *
   * @param  {SieveRequestBuilder} builder
   *   a reference to an request builder.
   *
   * @returns {SieveRequestBuilder}
   *   a builder which contains the request data.
   */
  async sendFirstRequest(builder) {

    this._cnonce = await this.generateNonce();

    // For integration tests, we need to fake the nonce...
    // ... so we take the nonce from the rfc otherwise the verification fails.
    //
    // ### DEBUG SHA1 ###
    // this._cnonce = "fyko+d2lbbFgONRv9qkxdawL";
    // this._username = "user";
    // this._password = "pencil";
    // this._authorization = "";
    //
    // ### DEBUG SHA256 ###
    // this._cnonce = "rOprNGfwEbeRWgbNEkqO";
    // this._username = "user";
    // this._password = "pencil";

    this._authMessage = `n=${this.normalizeUsername(this._username)},r=${this._cnonce}`;
    this._g2Header = `n,${(this._authorization !== "" ? "a=" + this.normalizeUsername(this._authorization) : "")},`;

    return builder
      .addLiteral("AUTHENTICATE")
      .addQuotedString(this.getSaslName())
      .addQuotedBase64(`${this._g2Header}${this._authMessage}`);
  }

  /**
   * Sends the "client-final-message" to the server.
   *
   * @param  {SieveRequestBuilder} builder
   *   a reference to an request builder.
   *
   * @returns {SieveRequestBuilder}
   *   a builder which contains the request data.
   */
  async sendFinalRequest(builder) {

    // Check if the server returned our nonce. This should prevent...
    // ... man in the middle attacks.
    const nonce = this.response.getNonce();
    if ((nonce.substr(0, this._cnonce.length) !== this._cnonce))
      throw new Error("Nonce invalid");

    const crypto = this.getCrypto();

    // As first step we need to salt the password...
    const salt = this.response.getSalt();
    const iter = this.response.getIterationCounter();

    const password = (new TextEncoder()).encode(this._password);

    // ... this is done by applying a simplified PBKDF2 algorithm...
    // ... so we endup by calling Hi(Normalize(password), salt, i)
    this._saltedPassword = await (crypto.Hi(crypto.normalize(password), salt, iter));

    // the clientKey is defined as HMAC(SaltedPassword, "Client Key")
    const clientKey = await (crypto.HMAC(this._saltedPassword, "Client Key"));

    // create the client-final-message-without-proof, ...

    const msg = `c=${(new SieveBase64Encoder(this._g2Header)).toUtf8()},r=${nonce}`;
    // ... append it and the server-first-message to client-first-message-bare...
    this._authMessage += "," + this.response.getServerFirstMessage() + "," + msg;

    // ... and convert it into a byte array.
    this._authMessage = crypto.strToByteArray(this._authMessage);


    // As next Step sign out message, this is done by applying the client...
    // ... key through a pseudorandom function to the message. It is defined...
    // as HMAC(H(ClientKey), AuthMessage)
    const clientSignature = await (crypto.HMAC(
      await (crypto.H(clientKey)),
      this._authMessage));

    // We now complete the cryptographic part an apply our clientkey to the...
    // ... Signature, so that the server can be sure it is talking to us.
    // The RFC defines this step as ClientKey XOR ClientSignature
    const clientProof = clientKey;
    for (let k = 0; k < clientProof.length; k++)
      clientProof[k] ^= clientSignature[k];

    // Every thing done so let's send the message...
    // "c=" base64( (("" / "y") "," [ "a=" saslname ] "," ) "," "r=" c-nonce s-nonce ["," extensions] "," "p=" base64
    return builder
      .addQuotedBase64(`${msg},p=${(new SieveBase64Encoder(clientProof)).toUtf8()}`);
    //      return "\""+btoa(msg+",p="+btoa(this.byteArrayToStr(clientProof)))+"\"\r\n";
  }

  /**
   * @inheritdoc
   */
  async getNextRequest(builder) {

    // Step1: Client sends Message to server. See SASL Login how to integrate it
    // into the AUTHENTICATE Command.
    //
    // e.g.: "AUTHENTICATE \"SCRAM-SHA-1\" \"n,,n=user,r=fyko+d2lbbFgONRv9qkxdawL\"\r\n"


    switch (this.response.getState()) {
      case SHA_STATE_FIRST_MESSAGE:
        return await (this.sendFirstRequest(builder));
      case SHA_STATE_FINAL_MESSAGE:
        return await (this.sendFinalRequest(builder));
      case SHA_STATE_EMPTY_MESSAGE:
        // We have to send an empty response. The server did not wrap...
        // ... the verifier into the Response Code...
        return builder
          .addQuotedString("");
    }

    throw new Error(`Illegal state ${this.response.getState()} in SASL SCRAM`);
  }

  /**
   * @inheritdoc
   */
  hasNextRequest() {

    if (this.response.hasError())
      return false;

    if (this.response.getState() === SHA_STATE_COMPLETED)
      return false;

    return true;
  }

  /**
   * @inheritdoc
   */
  async onOk(response) {

    const crypto = this.getCrypto();

    const serverSignature = await (crypto.HMAC(
      await (crypto.HMAC(this._saltedPassword, "Server Key")),
      this._authMessage
    ));

    if (response.getVerifier() !== crypto.byteArrayToStr(serverSignature)) {

      response.setResponse(RESPONSE_NO);
      response.setMessage("Server Signature not invalid");

      await this.onNo(response);
      return;
    }

    await super.onOk(response);
  }

  /**
   * @inheritdoc
   */
  async onResponse(parser) {

    await this.response.parse(parser);

    if (this.hasNextRequest())
      return this;

    return await(super.onResponse(this.response));
  }
}

/**
 * Implements the SCRAM-SHA-1 mechanism.
 */
class SieveSaslScramSha1Request extends SieveAbstractSaslScramRequest {

  /**
   * @inheritdoc
   */
  getSaslName() {
    return "SCRAM-SHA-1";
  }

  /**
   * @inheritdoc
   */
  getCrypto() {
    return new SieveCrypto("SHA-1");
  }
}

/**
 * Implements the SCRAM-SHA-256 mechanism.
 */
class SieveSaslScramSha256Request extends SieveAbstractSaslScramRequest {

  /**
   * @inheritdoc
   */
  getSaslName() {
    return "SCRAM-SHA-256";
  }

  /**
   * @inheritdoc
   */
  getCrypto() {
    return new SieveCrypto("SHA-256");
  }
}

/**
 * Implements the SCRAM-SHA-512 mechanism.
 */
class SieveSaslScramSha512Request extends SieveAbstractSaslScramRequest {

  /**
   * @inheritdoc
   */
  getSaslName() {
    return "SCRAM-SHA-512";
  }

  /**
   * @inheritdoc
   */
  getCrypto() {
    return new SieveCrypto("SHA-512");
  }
}

/**
 * This request implements SASL External Mechanism (rfc4422 Appendix A).
 * It's a dumb-dumb implementation, and relies upon an established tls connection.
 * It tells the server to use the cert provided during the TLS handshake.
 *
 * @author Thomas Schmid
 */
class SieveSaslExternalRequest extends SieveAbstractSaslRequest {

  /**
   * @inheritdoc
   */
  isAuthorizable() {
    // overwrite the default behaviour.
    return true;
  }

  /**
   * @inheritdoc
   */
  async getNextRequest(builder) {
    return builder
      .addLiteral("AUTHENTICATE")
      .addQuotedString("EXTERNAL")
      .addQuotedBase64("" + this._authorization);
  }

  /**
   * SASL External uses the TLS Cert for authentication.
   * Thus it does not rely upon any password, so this method returns always false.
   *
   * @returns {boolean}
   *   returns always false
   */
  hasPassword() {
    return false;
  }

  /**
   * @inheritdoc
   */
  async onResponse(parser) {
    return await(super.onResponse(
      await (new SieveSimpleResponse()).parse(parser)));
  }
}

export {
  SieveGetScriptRequest,
  SievePutScriptRequest,
  SieveCheckScriptRequest,
  SieveSetActiveRequest,
  SieveCapabilitiesRequest,
  SieveDeleteScriptRequest,
  SieveNoopRequest,
  SieveRenameScriptRequest,
  SieveListScriptsRequest,
  SieveStartTLSRequest,
  SieveLogoutRequest,
  SieveInitRequest,
  SieveSaslPlainRequest,
  SieveSaslLoginRequest,
  SieveSaslScramSha1Request,
  SieveSaslScramSha256Request,
  SieveSaslScramSha512Request,
  SieveSaslExternalRequest
};
