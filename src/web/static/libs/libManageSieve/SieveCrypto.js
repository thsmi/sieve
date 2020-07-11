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

import { SieveAbstractCrypto } from "./SieveAbstractCrypto.js";

/**
 * A Mozilla specific crypto implementation.
 */
class SieveWebSocketCrypto extends SieveAbstractCrypto {

  /**
   * Returns the HMAC implementation for the given name.
   * In case the algorithm is unknown an exception is thrown.
   *
   * @returns {nsICryptoHMAC}
   *   the HMAC type.
   */
  getCryptoHMAC() {
    throw new Error("Implement me");
  }

  /**
   * Returns the hashing implementation for the given name.
   * In case the algorithm is unknown an exception is thrown.
   *
   * @returns {nsICryptoHash}
   *   the Hash type .
   */
  getCryptoHash() {
    throw new Error("Implement me");
  }

  /**
   * @inheritdoc
   */
  HMAC(key, bytes, output) {
    throw new Error("Implement me");
  }

  /**
   * @inheritdoc
   */
  H(bytes, output) {
    throw new Error("Implement me");
  }

}

export { SieveWebSocketCrypto as SieveCrypto };
