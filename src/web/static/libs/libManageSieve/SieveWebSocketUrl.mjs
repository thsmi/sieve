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


/**
 * Parses our custom sieve websocket url format
 *
 * "sieve://" host [ ":" port ] ["/" endpoint]
 *
 */
class SieveWebSocketUrl {

  /**
   * Creates a new instance and parses the url
   *
   * @param {string} url
   *  the url in server form to be parsed.
   */
  constructor(url) {
    const regex = /^sieve:\/\/(?<host>[^:]+):(?<port>\d+)(\/(?<endpoint>.*))?$/gs;
    const match = regex.exec(url);

    if (!match)
      throw new Error(`Not a valid sieve url ${url}`);

    this.host = match.groups["host"];
    this.port = match.groups["port"];
    this.endpoint = match.groups["endpoint"];
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
    // FIXME: We should set a default port
    // if ((this.port === null) || (typeof(this.port) === "undefined"))
    //  this.port = `${SIEVE_PORT}`;

    return this.port;
  }

  /**
   * Returns the server side endpoint.
   *
   * @returns {string}
   *   the endpoint as string.
   */
  getEndpoint() {
    if ((typeof(this.endpoint) === "undefined") || (this.endpoint === null))
      return "";

    return this.endpoint;
  }


}

export { SieveWebSocketUrl };
