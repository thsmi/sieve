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


import { SieveAbstractCrypto } from "./SieveAbstractCrypto.mjs";
const { createHmac, createHash } = require('crypto');

/**
 * A Electron specific crypto implementation.
 *
 * @deprecated
 * Node implements since version 15.x the web crypto api which makes
 * this class obsolete as the new api is marked as mature.
 * See https://nodejs.org/api/webcrypto.html for more details.
 *
 */
class SieveNodeCrypto extends SieveAbstractCrypto {

  /**
   * @inheritdoc
   */
  HMAC(key, bytes, output) {

    if (typeof (key) === "undefined" || key === null)
      throw new Error("Invalid key");

    if (Array.isArray(key))
      key = Buffer.from(key);

    if (Array.isArray(bytes))
      bytes = Buffer.from(bytes);

    if (typeof (output) === "undefined" || output === null)
      output = "latin1";

    const rv =
      createHmac(this.name, key)
      .update(bytes)
      .digest(output);

    if (output === "hex")
      return rv;

    return this.strToByteArray(rv);
  }

  /**
   * @inheritdoc
   */
  H(bytes, output) {

    if (typeof (output) === "undefined" || output === null)
      output = "latin1";

    if (Array.isArray(bytes))
      bytes = Buffer.from(bytes);

    const rv = createHash(this.name)
      .update(bytes)
      .digest(output);

    if (output === "hex")
      return rv;

    return this.strToByteArray(rv);
  }
}

export { SieveNodeCrypto as SieveCrypto };
