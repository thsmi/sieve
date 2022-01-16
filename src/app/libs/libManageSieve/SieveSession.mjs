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
import { TLS_SECURITY_EXPLICIT } from "./SieveAbstractClient.mjs";

/**
 * @inheritdoc
 */
class SieveNodeSession extends SieveAbstractSession {

  /**
   * @inheritdoc
   */
  async connect(url) {

    const options = {
      security : this.getOption("security", TLS_SECURITY_EXPLICIT),
      fingerprints : this.getOption("certFingerprints"),
      ignoreCertErrors : this.getOption("certIgnoreError")
    };

    await super.connect(url, options);
  }

}

export { SieveNodeSession as SieveSession };
