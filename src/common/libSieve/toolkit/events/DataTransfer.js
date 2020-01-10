/*
 * The contents of this file are licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via
 * email from the author.
 *
 * Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 *
 */

(function (exports) {

  "use strict";

  const RANDOM_SEED_SIZE = 10000000;
  const HEX_STRING = 16;

  // We need these global object to bypass the bug
  let _transfer = null;
  let _token = null;

  /**
   * A stupid wrapper around the data transfer used to bypass a google chrome/
   * electron bug. The bug causes getData() to return always an empty string in
   * dragenter and dragover events.
   *
   * Strangely this happens only in a chrome web app or in electron. "Normal"
   * Chrome does not suffer from this bug.
   *
   * The workaround is to store the transfer element locally and just add
   * a token to the drag's datatransfer element.
   *
   * This wrapper automatically detects buggy runtimes so that the workaround
   * is only used when realy needed.
   *
   * The workaround has some limitation you can set at most one data object.
   */
  class SieveDataTransfer {

    /**
     *  Creates a new data transfer instance.
     *
     *  @param {DataTransfer} dt
     *    the data transfer object which should be wrapped.
     */
    constructor(dt) {
      this.dt = dt;
    }

    /**
     * Checks if the current runtime is affected by the drag and drop bug.
     * @returns {boolean}
     *   returns true in case it is bug free otherwise false
     **/
    isBugFree() {

      // Check if we are running in electron...
      if (window.navigator.userAgent.toLowerCase().indexOf(" electron/"))
        return false;

      if (window.navigator.userAgent.toLowerCase().indexOf(" chrome/"))
        return false;

      return true;
    }

    /**
     * Calculates a random token, which is used to idenfiy the transfer.
     * It is just a precausion in for very unlikely cases, that an
     * external drop uses the very same flavours.
     *
     * @returns {string}
     *   a unique token
     */
    generateToken() {
      return Math.floor(Math.random() * RANDOM_SEED_SIZE).toString(HEX_STRING) + Date.now().toString(HEX_STRING);
    }

    /**
     * Checks if the DataTransfer contains the given flavour.
     *
     * @param {string} flavour
     *   the flavour which should be checked
     * @returns {boolean}
     *   true in case the flavour is contained otherwise false.
     */
    contains(flavour) {
      for (let i = 0; i < this.dt.items.length; i++)
        if (this.dt.items[i].type === flavour)
          return true;

      return false;
    }

    /**
     * Retunrs the data bound to the given flavour.
     *
     * @param {string} flavour
     *   the flavour as string
     * @returns {string}
     *   the data stored in the dragtarget.
     */
    getData(flavour) {

      // in case we are bug free we can take a short cut...
      if (this.isBugFree())
        return this.dt.getData(flavour);

      // ... otherwise we need a workaround to recover.
      if (!this.contains(flavour))
        return "";

      if (!this.contains(_token))
        return "";

      return _transfer;
    }

    /**
     * Binds the data to the data transfer object
     *
     * @param {string} flavour
     *   the drag falvour as string
     * @param {object} transfer
     *   the transfer object should be a string
     *
     */
    setData(flavour, transfer) {

      this.dt.setData(flavour, transfer);

      if (this.isBugFree())
        return;

      // ignore the "application/sieve" flavour
      if (flavour === "application/sieve")
        return;

      if (_transfer || _token)
        throw new Error("Transfer in progress, clear before starting new one.");

      _transfer = transfer;

      // We generate a onetime token to ensure drag and drop integrity
      _token = this.generateToken();
      this.dt.setData(_token, "");
    }

    /**
     * Clear needs to be called before and after each drop.
     * Otherwise you may leak.
     *
     * It releases the drop target from the current context.
     *
     */
    clear() {
      _token = null;
      _transfer = null;
    }
  }

  exports.SieveDataTransfer = SieveDataTransfer;

})(window);
