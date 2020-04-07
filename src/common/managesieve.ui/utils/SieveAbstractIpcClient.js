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

  const { SieveUniqueId } = require("./SieveUniqueId.js");

  const _requestHandlers = new Map();
  const _responseHandlers = new Map();

  /**
   * An abstract implementation for a inter process/frame communication.
   */
  class SieveAbstractIpcClient {

    /**
     * Generates a unique id
     * @returns {string}
     *   a unique id
     */
    static generateId() {
      return (new SieveUniqueId()).generate();
    }

    /**
     * Gets a logger instance.
     * @abstract
     *
     * @returns {SieveLogger}
     *   a sieve logger instance
     */
    static getLogger() {
      throw new Error(`Implement getLogger`);
    }

    /**
     * Called every time a new ipc message was received.
     * @param {Event} e
     *   the ipc message containing the data.
     */
    static onMessage(e) {
      const msg = this.parseMessageFromEvent(e);

      if (msg.isResponse === true) {
        this.onResponse(msg);
        return;
      }

      if (msg.isRequest === true) {
        this.onRequest(msg, e.source);
        return;
      }

      this.onError(e);
    }

    /**
     * Called upon an external request which requires a response.
     *
     * @param {object} request
     *   the response message containing the data.
     *
     * @param {object} source
     *   the object which emitted/created this message.
     */
    static async onRequest(request, source) {

      this.getLogger().logIpcMessage(`OnRequest: ${JSON.stringify(request)}`);

      if (!_requestHandlers.has(request.subject)) {
        this.getLogger().logIpcMessage(`Unknown subject ${request.subject} in ${window.location}`);
        return;
      }

      const handler = _requestHandlers.get(request.subject);

      const response = request;
      response.isResponse = true;

      try {
        if (!handler.has(request.action)) {
          this.getLogger().logIpcMessage(`Unknown action ${request.action} in ${window.location}`);
          throw new Error(`Unknown action ${request.action}`);
        }

        response.payload = await (handler.get(request.action)(request));
      } catch (ex) {
        response.error = ex.message;
        this.getLogger().logIpcMessage(ex);
      }

      this.dispatch(response, source);
    }

    /**
     * Called when a response to a request it received.
     *
     * @param {object} message
     *   the response message containing the data.
     */
    static onResponse(message) {

      this.getLogger().logIpcMessage(`On Response:  ${JSON.stringify(message)}`);

      const id = message.id;

      // Check if the id is known to us.
      if (id === undefined || id === null)
        return;

      if (!_responseHandlers.has(message.id))
        return;

      this.getLogger().logIpcMessage(`Callback for ${id}`);

      // Check the response handlers
      const handler = _responseHandlers.get(id);
      _responseHandlers.delete(id);

      handler(message);
    }

    /**
     * Sends a message via the ipc communication
     * @abstract
     * @param {string} message
     *   the message to be send.
     * @param {Window} target
     *   the target which should receive the message
     * @param {object} [origin]
     *   optional information about the origin.
     */
    static dispatch(message, target, origin) {
      throw new Error(`Implement me ${message} ${target} ${origin}`);
    }

    /**
     * Extracts the message from the message event.
     * @abstract
     *
     * @param {Event} e
     *   the event which contains the message.
     */
    static parseMessageFromEvent(e) {
      throw new Error(`Implement me ${e} `);
    }

    /**
     * Extracts the message source from the event object.
     * @abstract
     *
     * @param {Event} e
     *   the event which should be analyzed
     * @returns {object}
     *   the message source
     */
    static getSource(e) {
      throw new Error(`Implement me ${e} `);
    }

    /**
     * Registers a request handler for the given action.
     * The can be at most one handler per action. In case it already
     * exists it will be replaced.
     *
     * @param {string} subject
     *   the subject name to listen to. All other subject will be ignored.
     * @param {string} action
     *   the action's unique name.
     * @param {Function} callback
     *   the callback which should be invoked upon a matching request.
     */
    static setRequestHandler(subject, action, callback) {
      if (!_requestHandlers.has(subject))
        _requestHandlers.set(subject, new Map());

      _requestHandlers.get(subject).set(action, callback);
    }

    /**
     * Sends a message to the given target.
     *
     * @param {string} subject
     *   the messages subject name specifies who will receive the message.
     * @param {string} action
     *   the action to be performed.
     * @param {object} payload
     *   the payload to be send
     * @param {Window} [target]
     *   the target which host the receiver. In case it is omitted "parent" is used.
     * @returns {*}
     *   the messages response or an exception in case of an error.
     */
    static async sendMessage(subject, action, payload, target) {

      const id = this.generateId();

      const msg = JSON.stringify({
        id: id,
        subject: subject,
        action: action,
        payload: payload,
        isRequest: true
      });

      return await new Promise((resolve, reject) => {

        const onResponse = (message) => {
          if (message.error) {
            reject(message.error);
            return;
          }

          resolve(message.payload);
        };

        _responseHandlers.set(id, onResponse);
        this.dispatch(msg, target);
      });
    }
  }

  // Require modules need to use export.module
  if (typeof (module) !== "undefined" && module && module.exports)
    module.exports.SieveAbstractIpcClient = SieveAbstractIpcClient;
  else
    exports.SieveAbstractIpcClient = SieveAbstractIpcClient;

})(this);
