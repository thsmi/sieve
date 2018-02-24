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

/* global window */

(function (exports) {
  // Enable Strict Mode
  "use strict";

  const SIEVE_PORT_NEW = 4190;
  const SIEVE_PORT_OLD = 2000;

  const { SieveLogger } = require("./SieveNodeLogger.js");
  /* global require */
  const { Sieve } = require("./SieveNodeClient.js");
  const {
    /* SieveCapabilitiesRequest,
    SieveLogoutRequest,*/
    SieveInitRequest
  } = require("./SieveRequest.js");

  /**
   * Tries to detect the correct sieve port.
   * It is typically either 2000 or 4190.
   */
  class SieveAutoConfig {

    /**
     * Creates a new auto config instance. It tries to automagically detect
     * the correct sieve settings.
     *
     * @param {String} hostname
     *   the hostname or ip which should be tested
     * @constructor
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
      let ports = [SIEVE_PORT_NEW, SIEVE_PORT_OLD];

      for (let port of ports)
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

      let sieve = new Sieve(this.logger);


      return new Promise(async (resolve) => {

        let listener = {

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

        let request = new SieveInitRequest();
        request.addErrorListener(listener);
        request.addResponseListener(listener);
        sieve.addRequest(request);

        sieve.addListener(listener);

        sieve.connect(this.hostname, port, false);
      });
    }
  }

  exports.SieveAutoConfig = SieveAutoConfig;

})(exports || this);
