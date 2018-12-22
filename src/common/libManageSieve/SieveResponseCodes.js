/*
 * The contents of this file is licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via email
 * from the author. Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

(function (exports) {

  // Enable Strict Mode
  "use strict";

  const RESPONSE_CODE_NAME = 0;
  const RESPONSE_CODE_EXTENSION = 1;

  /**
   * The response codes is a string with optional additional arguments
   */
  class SieveResponseCode {

    /**
     * Creates a new instance.
     *
     * @param {string[]} code
     *   the response code including the additional arguments returned by the server.
     */
    constructor(code) {
      this.code = code;
    }

    /**
     * Response codes should not encapulsted in quotes according to the RFC.
     * Never the less Cyrus Servers sometimes do encapsulate the response codes.
     *
     * This method is aware of this behaviour, and should be always when comparing
     * ResponseCodes
     *
     * @param {string} code
     *   the response code which should be testet for equality
     * @returns {boolean}
     *   true in case the response code is equal otherwise false.
     */
    equalsCode(code) {
      if ((!this.code) || (!this.code.length))
        return false;

      if (this.code[RESPONSE_CODE_NAME].toUpperCase() !== code.toUpperCase())
        return false;

      return true;
    }
  }


  /**
   * The server for sasl request always the response code "SASL"
   * followed by additional information.
   */
  class SieveResponseCodeSasl extends SieveResponseCode {

    /**
     * @inheritdoc
     */
    constructor(code) {
      super(code);

      if (this.code[RESPONSE_CODE_NAME].toUpperCase() !== "SASL")
        throw new Error("Malformed SASL Response Code");
    }

    /**
     * @returns {string}
     *   Returns the sasl response
     */
    getSasl() {
      return this.code[RESPONSE_CODE_EXTENSION];
    }
  }

  /**
   * In case of a refereal a special response code is returned.
   * It contains the address to which the server refers us.
   */
  class SieveResponseCodeReferral extends SieveResponseCode {

    /**
     * @inheritdoc
     */
    constructor(code) {
      super(code);

      if (this.code[RESPONSE_CODE_NAME].toUpperCase() !== "REFERRAL")
        throw new Error("Malformed REFERRAL Response Code");

      // We should have received something similiar to
      //   REFERRAL "sieve://c3.mail.example.com"

      // the quoted text contains the authority
      // authority = [ userinfo "@" ] host [ ":" port ]
      let uri = this.code[RESPONSE_CODE_EXTENSION];

      // remove the sieve:// scheme
      this.hostname = uri.slice("sieve://".length);

      // cleanup any script urls.
      if (this.hostname.indexOf("/") >= 0)
        this.hostname = this.hostname.slice(0, this.hostname.indexOf("/"));

      if (this.hostname.indexOf(":") === -1)
        return;

      // extract the port
      this.port = this.hostname.slice(this.hostname.indexOf(":") + 1);
      this.hostname = this.hostname.slice(0, this.hostname.indexOf(":"));
    }

    /**
     * Returns the hostname of the referred server.
     *
     * @returns {string}
     *   the hostname as string.
     */
    getHostname() {
      return this.hostname;
    }

    /**
     * Returns the port of the referred server. If the server did not specify
     * any Port null is returend.
     *
     * @returns {int}
     *   the port number or null
     */
    getPort() {
      return this.port;
    }
  }

  exports.SieveResponseCode = SieveResponseCode;
  exports.SieveResponseCodeSasl = SieveResponseCodeSasl;
  exports.SieveResponseCodeReferral = SieveResponseCodeReferral;

})(module.exports || this);
