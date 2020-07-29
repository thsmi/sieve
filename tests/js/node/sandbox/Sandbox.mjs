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

import { AbstractSandboxedTestFixture } from "./../../common/sandbox/AbstractSandboxedFixture.mjs";

class SandboxedTestFixture extends AbstractSandboxedTestFixture {

  constructor() {
    super();

    process.on("message", (message) => {
      try {
        this.onMessage(message);
      } catch (ex) {
        console.error(ex);
      }
    });
  }

  /**
   * @inheritdoc
   */
  send(type, data={}) {

    process.send(JSON.stringify({
      type: `${type}`,
      payload : data
    }));
  }

  /**
   * Loads scripts into the sandbox.
   * @param {string[]} scripts
   *   a string array with urls pointing to the scripts to be loaded.
   */
  async require(scripts) {

    for (const script of scripts) {
      this.logTrace(`Injecting script ${script}...`);
      await import(script);
    }
  }


}

if (!global.net)
  global.net = {};

if (!global.net.tschmid)
  global.net.tschmid = {};

if (!global.net.tschmid.yautt)
  global.net.tschmid.yautt = {};

if (!global.net.tschmid.yautt.test)
  global.net.tschmid.yautt.test = {};

try {
  global.net.tschmid.yautt.test = new SandboxedTestFixture();
} catch (ex) {
  console.log(ex);
}
