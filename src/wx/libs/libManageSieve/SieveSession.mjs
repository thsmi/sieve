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

import { SieveAbstractSession } from "./SieveAbstractSession.mjs";

/**
 * A mozilla specific session implementation.
 */
class SieveMozSession extends SieveAbstractSession {

  /**
   * @inheritdoc
   */
  async onError(error) {

    if (this.listeners && this.listeners.onError) {
      await this.listeners.onError(error);
      return;
    }

    super.onError(error);
  }

  /**
   * @inheritdoc
   */
  async onDisconnected() {

    if (this.listeners && this.listeners.onDisconnected) {
      await this.listeners.onDisconnected();
      return;
    }

    super.onDisconnected();
  }

  /**
   * @inheritdoc
   */
  async connect(host, port) {

    // eslint-disable-next-line no-async-promise-executor
    await new Promise(async (resolve, reject) => {

      try {
        this.on("error", (error) => {
          this.getLogger().logState("SieveSession:connect:onError()");
          reject(error);
        });

        this.on("disconnected", () => {
          this.getLogger().logState("SieveSession:connect:onDisconnected()");
          // reject(new Error(`Server disconnected`));
        });

        await super.connect(host, port);
        resolve();
      }
      catch (ex) {
        reject(ex);
      } finally {
        // Restore the original listener.
        this.on("error");
        this.on("disconnected");
      }
    });

    return this;
  }
}

export { SieveMozSession as SieveSession };
