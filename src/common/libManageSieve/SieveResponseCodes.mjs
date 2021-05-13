/*
 * The contents of this file is licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via email
 * from the author. Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

const RESPONSE_CODE_NAME = 0;
const RESPONSE_CODE_EXTENSION = 1;

import { SieveUrl } from "./SieveUrl.mjs";

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
   * Response codes should not encapsulated in quotes according to the RFC.
   * Never the less Cyrus Servers sometimes do encapsulate the response codes.
   *
   * This method is aware of this behaviour, and should be always when comparing
   * ResponseCodes
   *
   * @param {string} code
   *   the response code which should be tested for equality
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
   * Gets the sasl response code.
   *
   * @returns {string}
   *   Returns the sasl response
   */
  getSasl() {
    return this.code[RESPONSE_CODE_EXTENSION];
  }
}

/**
 * In case of a referral a special response code is returned.
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

    this.url = new SieveUrl(this.code[RESPONSE_CODE_EXTENSION]);
  }

  /**
   * Gets the sieve url to which the server referred the client.
   *
   * @returns {SieveUrl}
   *   the url to which the connection was referred.
   */
  getUrl() {
    return this.url;
  }
}

export {
  SieveResponseCode,
  SieveResponseCodeSasl,
  SieveResponseCodeReferral
};
