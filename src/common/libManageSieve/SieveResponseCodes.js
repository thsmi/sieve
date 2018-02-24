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

  function SieveResponseCode(code) {
    this.code = code;
  }

  SieveResponseCode.prototype.code = [];

  /**
   * Responsecodes should not encapulsted in quotes according to the RFC.
   * Never the less Cyrus Servers sometimes do encapsulate the response codes.
   *
   * This method is aware of this behaviour, and should be always when comparing
   * ResponseCodes
   *
   * @param {String} code
   *   the response code which should be testet for equality
   * @returns {boolean}
   *   true in case the response code is equal otherwise false.
   */
  SieveResponseCode.prototype.equalsCode
    = function (code) {
      if ((!this.code) || (!this.code.length))
        return false;

      if (this.code[0].toUpperCase() !== code.toUpperCase())
        return false;

      return true;
    };


  function SieveResponseCodeSasl(code) {
    SieveResponseCode.call(this, code);

    if (this.code[0].toUpperCase() !== "SASL")
      throw new Error("Malformed SASL Response Code");
  }

  // Inherit prototypes from SieveResponseCode...
  SieveResponseCodeSasl.prototype = Object.create(SieveResponseCode.prototype);
  SieveResponseCodeSasl.prototype.constructor = SieveResponseCodeSasl;


  SieveResponseCodeSasl.prototype.getSasl
    = function () {
      return this.code[1];
    };


  function SieveResponseCodeReferral(code) {
    SieveResponseCode.call(this, code);

    if (this.code[0].toUpperCase() !== "REFERRAL")
      throw new Error("Malformed REFERRAL Response Code");

    // We should have received something similiar to
    //   REFERRAL "sieve://c3.mail.example.com"

    // the quoted text contains the authority
    // authority = [ userinfo "@" ] host [ ":" port ]
    let uri = this.code[1];

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

  // Inherrit prototypes from SieveResponseCode...
  SieveResponseCodeReferral.prototype = Object.create(SieveResponseCode.prototype);
  SieveResponseCodeReferral.prototype.constructor = SieveResponseCodeReferral;

  SieveResponseCodeReferral.prototype.getHostname
    = function () {
      return this.hostname;
    };

  /**
   * Returns the port of the referred server. If the server did not specify
   * any Port null is returend.
   *
   * @return {Int}
   *   the port number or null
   */
  SieveResponseCodeReferral.prototype.getPort
    = function () {
      return this.port;
    };

  exports.SieveResponseCode = SieveResponseCode;
  exports.SieveResponseCodeSasl = SieveResponseCodeSasl;
  exports.SieveResponseCodeReferral = SieveResponseCodeReferral;

})(module.exports || this);
