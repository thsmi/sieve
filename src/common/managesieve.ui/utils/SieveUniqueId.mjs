/*
 * The contents of this file is licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via email
 * from the author. Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 *
 */

const RANDOM_SEED_SIZE = 10000000;
const HEX_STRING = 16;

/**
 * Generates a poor mans unique id.
 * It simply combines the current time with a random number.
 * Which should be more than sufficient for us.
 */
class SieveUniqueId {

  /**
   * Creates a pseudo random alpha numerical uuid lookalike
   *
   * It starts always with the id prefix, this guarantees that it will
   * never start with a number and thus can be used safely as an HTML id.
   *
   * @returns {string}
   *   the generated id.
   */
  generate() {
    return "siv-"
        + (Math.floor(Math.random() * RANDOM_SEED_SIZE).toString(HEX_STRING))
        + Date.now().toString(HEX_STRING);
  }
}

export { SieveUniqueId };
