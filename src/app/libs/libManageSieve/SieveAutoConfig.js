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

  const SIEVE_PORT_NEW = 4190;
  const SIEVE_PORT_OLD = 2000;

  const { SieveLogger } = require("./SieveLogger.js");
  const { Sieve } = require("./SieveClient.js");
  const { SieveInitRequest } = require("./SieveRequest.js");

  /**
   * Tries to detect the correct sieve port.
   * It is typically either 2000 or 4190.
   */
  class SieveAutoConfig {

    /**
     * Creates a new auto config instance. It tries to automagically detect
     * the correct sieve settings.
     *
     * @param {string} hostname
     *   the hostname or ip which should be tested
     */
    constructor(hostname) {
      this.hostname = hostname;
      this.logger = new SieveLogger();
      this.logger.level(255);
    }

    /**
     * Autodetects the sieve port for all well known sieve ports.
     * In case autodetect fails an exception is thrown.
     *
     * @returns {int}
     *  the sieve port in case autodetect succeeds.
     */
    async detect() {

      for (const port of [SIEVE_PORT_NEW, SIEVE_PORT_OLD])
        if (await this.probe(port))
          return port;

      throw new Error("Could not detect the sieve port");
    }

    /**
     * Tries a handshake on the given port.
     * @param {int} port
     *   the tcp port which should be challanged
     * @returns {boolean}
     *   true in case it is a manage sieve port otherwise false.
     */
    async probe(port) {

      const sieve = new Sieve(this.logger);

      return await new Promise((resolve) => {

        const listener = {

          onInitResponse: function () {
            resolve(true);
            sieve.disconnect();
          },

          onError: function () {
            resolve(false);
            sieve.disconnect();
          },

          onTimeout: function () {
            resolve(false);
            sieve.disconnect();
          },

          onDisconnect: function () {
            // we are already disconnected....
            resolve(false);
          }
        };

        const request = new SieveInitRequest();
        request.addErrorListener(listener.onError);
        request.addResponseListener(listener.onInitResponse);
        sieve.addRequest(request);

        sieve.addListener(listener);

        sieve.connect(this.hostname, port, false);
      });
    }
  }

  exports.SieveAutoConfig = SieveAutoConfig;

})(exports || this);
