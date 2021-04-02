/*
 * The contents of this file is licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via email
 * from the author. Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 *
 */

const ASCII = 36;
const SEED_OFFSET = 2;
const SEED_LENGTH = 16;
/**
 * Generates a poor mans unique id.
 * It simply combines the current time with a random number.
 * Which should be more than sufficient for us.
 */
class SieveUniqueId {

  /**
   * Creates a pseudo random alpha numerical id.
   * @returns {string}
   *   the generated id.
   */
  generate() {
    // "" + Math.floor(Math.random() * 10000000).toString(16) + Date.now().toString(16)
    return Date.now().toString(ASCII)
      + "-" + Math.random().toString(ASCII).substr(SEED_OFFSET, SEED_LENGTH);
  }
}

export { SieveUniqueId };
