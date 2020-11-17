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

import { SieveSession } from "./SieveSession.mjs";

/**
 * A mozilla specific session implementation.
 */
class SieveMozSession extends SieveSession {

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
  async onDisconnected(hadError) {

    if (this.listeners && this.listeners.onDisconnected) {
      await this.listeners.onDisconnected(hadError);
      return;
    }

    super.onDisconnected(hadError);
  }

  /**
   * @inheritdoc
   */
  async connect(host, port) {

    await new Promise(async (resolve, reject) => {

      try {
        this.on("error", (error) => {
          reject(error);
        });

        this.on("disconnected", (hadError) => {
          reject(new Error(`Server disconnected ${hadError}`));
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
