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

(function (exports) {

  "use strict";

  /**
   * A generic base class for Sieve Exceptions.
   */
  class SieveException extends Error {
  }

  /**
   * An error on the client side.
   */
  class SieveClientException extends SieveException {
  }

  /**
   * The request took too long or it was canceled.
   * This is a clients side exception.
   */
  class SieveTimeOutException extends SieveClientException {

    /**
     * Creates a new timeout exception.
     *
     * @param {Error} [error]
     *   the optional root error which caused this exception.
     */
    constructor(error) {
      super("Request took too long or was canceled.");
      this.error = error;
    }
  }

  /**
   * The Certificate validation failed.
   */
  class SieveCertValidationException extends SieveClientException {
    /**
     * Creates a Certificate Validation Exception.
     *
     * @param {object} securityInfo
     *   the security info object with details on the certificate.
     */
    constructor(securityInfo) {
      super("Error while validating Certificate");

      this.securityInfo = securityInfo;
    }

    /**
     * The security Info object with detailed information
     * on the certificate which caused this error.
     *
     * @returns {object}
     *   the security info.
     */
    getSecurityInfo() {
      return this.securityInfo;
    }
  }

  /**
   * The server signaled an error.
   *
   * The most reliable way to recover from such an error is to
   * disconnect and then reconnect to the server.
   */
  class SieveServerException extends SieveException {

    /**
     * Creates a server side exception
     *
     * @param {SieveSimpleResponse} response
     *   the servers response which indicated the error.
     */
    constructor(response) {
      super(response.getMessage());
      this.response = response;
    }

    /**
     * Returns the server's response it typically contains the cause
     * why the request failed.
     *
     * @returns {SieveSimpleResponse}
     *   the server response objet
     */
    getResponse() {
      return this.response;
    }
  }

  /**
   * The server terminated the connection and referred to a new host
   */
  class SieveReferralException extends SieveServerException {

    /**
     * The new remote hostname to which the server referred the connection.
     * @returns {string}
     *   the hostname
     */
    getHostname() {
      return this.getResponse().getResponseCode().getHostname();
    }

    /**
     * The new remote port to which the server referred the connection.
     * @returns {string}
     *   the port
     */
    getPort() {
      return this.getResponse().getResponseCode().getPort();
    }
  }

  exports.SieveClientException = SieveClientException;
  exports.SieveReferralException = SieveReferralException;
  exports.SieveServerException = SieveServerException;
  exports.SieveTimeOutException = SieveTimeOutException;
  exports.SieveCertValidationException = SieveCertValidationException;

  exports.SieveException = SieveException;

})(module.exports || this);
