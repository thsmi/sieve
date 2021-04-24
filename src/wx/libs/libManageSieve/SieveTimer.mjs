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


import { SieveAbstractTimer } from "./SieveAbstractTimer.mjs";

/**
 * Uses JavaScript's setTimeout() method to implement a timer.
 */
class SieveWebTimer extends SieveAbstractTimer {


  /**
   * @inheritdoc
   */
  cancel() {
    if (!this.timer)
      return;

    window.clearTimeout(this.timer);
    this.timer = null;
  }

  /**
   * @inheritdoc
   */
  start(callback, ms) {
    this.cancel();

    if (ms === 0)
      return;

    this.timer = window.setTimeout(callback, ms);
  }
}

export { SieveWebTimer as SieveTimer };
