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

const SIEVE_PORT = 4190;

/**
 * Parses a sieve urls in "server form"
 *
 * It consists of a userinfo the hostname and port and is
 * formally defined as this:
 *
 * "sieve://" [ userinfo "@" ] host [ ":" port ]
 *
 */
class SieveUrl {

  /**
   * Creates a new instance and parses the url
   *
   * @param {string} url
   *  the url in server form to be parsed.
   */
  constructor(url) {
    const regex = /^sieve:\/\/((?<user>.+?)(:(?<password>.+?))?@)?(?<host>[^:]+)(:(?<port>\d+))?$/gs;
    const match = regex.exec(url);

    if (!match)
      throw new Error(`Not a valid sieve url ${url}`);

    this.host = match.groups["host"];
    this.port = match.groups["port"];
    this.user = match.groups["user"];
    this.password = match.groups["password"];
  }

  /**
   * Returns the uri's remote hostname.
   *
   * @returns {string}
   *   the remote hostname
   */
  getHost() {
    return this.host;
  }

  /**
   * Returns the uri's remote port.
   * In case it was not specified it will return the default sieve port.
   *
   * @returns {string}
   *   the remote port
   */
  getPort() {
    if ((this.port === null) || (typeof(this.port) === "undefined"))
      this.port = `${SIEVE_PORT}`;

    return this.port;
  }

  /**
   * Returns the optional user info part of the uri.
   *
   * @returns {string}
   *   the user info, normally omitted and thus null.
   */
  getUser() {
    if (typeof(this.user) === "undefined")
      return null;

    return this.user;
  }

  /**
   * Returns the optional and deprecated password part of the uri.
   *
   * @returns {string}
   *   the password, normally omitted and thus null.
   */
  getPassword() {
    if (typeof(this.password) === "undefined")
      return null;

    return this.password;
  }

}

export { SieveUrl };
