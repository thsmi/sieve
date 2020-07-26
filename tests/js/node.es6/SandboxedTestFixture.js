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

import { AbstractSandboxedTestFixture } from "./AbstractSandboxedFixture.mjs";

/**
 * Implements a node specific facade which allows the sandbox to test fixture
 * to be controlled from outside the sandbox
 */
class SandboxedTestFixture extends AbstractSandboxedTestFixture {

  /**
   * @inheritdoc
   **/
  log(message, level) {
    net.tschmid.yautt.logger.log(message, level);
  }

}

export { SandboxedTestFixture };

/*
if (!exports.net)
  exports.net = {};

if (!exports.net.tschmid)
  exports.net.tschmid = {};

if (!exports.net.tschmid.yautt)
  exports.net.tschmid.yautt = {};

if (!exports.net.tschmid.yautt.test)
  exports.net.tschmid.yautt.test = {};

exports.net.tschmid.yautt.test = new SandboxedTestFixture();

*/