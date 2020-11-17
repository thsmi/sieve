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
 * @inheritdoc
 */
class SieveNodeSession extends SieveSession {

  /**
   * @inheritdoc
   */
  async startTLS() {

    const options = {
      fingerprints: this.getOption("certFingerprints"),
      ignoreCertErrors: this.getOption("certIgnoreError")
    };

    await super.startTLS(options);
  }



}

export { SieveNodeSession as SieveSession };
