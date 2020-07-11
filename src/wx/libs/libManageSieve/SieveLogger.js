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

/* global Components */

import { SieveAbstractLogger } from "./SieveAbstractLogger.js";

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

    Components.classes["@mozilla.org/consoleservice;1"]
      .getService(Components.interfaces.nsIConsoleService)
      .logStringMessage(`[${this.getTimestamp()} ${this.prefix()}] ${message}`);

    return this;
  }
}

export { SieveMozLogger as SieveLogger };

