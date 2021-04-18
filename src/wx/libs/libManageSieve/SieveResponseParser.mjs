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

import { SieveAbstractResponseParser } from "./SieveAbstractResponseParser.mjs";

/**
 * Implements a mozilla specific response parser
 **/
class SieveMozResponseParser extends SieveAbstractResponseParser {

  /**
   * @inheritdoc
   **/
  convertToBase64(decoded) {
    return btoa(decoded);
  }

  /**
   * @inheritdoc
   **/
  convertFromBase64(encoded) {
    return atob(encoded);
  }

}

export { SieveMozResponseParser as SieveResponseParser };
