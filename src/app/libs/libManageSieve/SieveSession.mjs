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
 * @inheritdoc
 */
class SieveNodeSession extends SieveAbstractSession {

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
