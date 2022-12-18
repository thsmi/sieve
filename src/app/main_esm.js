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

(async () => {
  try {
    await (await import('./sieve.mjs')).main();
  } catch (ex) {
    // eslint-disable-next-line no-console
    console.log(ex);
  }
})();
