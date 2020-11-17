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

import { SieveAbstractLogger } from "./SieveAbstractLogger.mjs";

/**
 * A mozilla specific logger
 */
class SieveMozLogger extends SieveAbstractLogger {

  /**
   * @inheritdoc
   **/
  log(message, level) {

    if (!this.isLoggable(level))
      return this;

    // eslint-disable-next-line no-console
    console.log(`[${this.getTimestamp()} ${this.prefix()}] ${message}`);

    return this;
  }
}

export { SieveMozLogger as SieveLogger };
