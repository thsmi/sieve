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

const Cc = Components.classes;
const Ci = Components.interfaces;

import { SieveAbstractTimer } from "./SieveAbstractTimer.js";

/**
 * The mozilla timer is special.
 * It implements a custom interface and invokes a fixed callback method.
 */
class SieveMozTimer extends SieveAbstractTimer {

  /**
   * Creates a new instance.
   */
  constructor() {
    super();

    this.timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
  }

  /**
   * @inheritdoc
   */
  cancel() {
    this.timer.cancel();
  }

  /**
   * @inheritdoc
   */
  start(callback, ms) {
    this.timer.cancel();

    if (ms === 0)
      return;

    this.callback = callback;
    this.timer.initWithCallback(this, ms, Ci.nsITimer.TYPE_ONE_SHOT);
  }


  /**
   * The entry point triggered by the mozilla timer.
   *
   * @param {nsITimer} timer
   *   the timer which caused this callback.
   *
   */
  notify(timer) {
    if (this.timer !== timer)
      return;

    if (!this.callback)
      return;

    // We need to null the callback otherwise we leak. But we need to do this
    // before invoking the callback. As it is perfectly fine if the callback
    // restarts the timer and thus sets a new callback. And in this case nulling
    // the callback would accidentally cancel the new callback.
    const callback = this.callback;
    this.callback = null;

    (async () => {
      await callback();
    })();
  }

}

export { SieveMozTimer as SieveTimer };
