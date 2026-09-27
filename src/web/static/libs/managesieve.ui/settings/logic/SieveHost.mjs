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

import { SieveAbstractHost } from "./SieveAbstractHost.mjs";

// eslint-disable-next-line no-magic-numbers
const THIRTY_SECONDS = 30 * 1000;
// eslint-disable-next-line no-magic-numbers
const ONE_MINUTE = 60 * 1000;
// eslint-disable-next-line no-magic-numbers
const FIVE_MINUTES = 5 * ONE_MINUTE;

const HTTP_PROTOCOL = "http:";
const HTTP_PORT = 80;

const HTTPS_PROTOCOL = "https:";
const HTTPS_PORT = 443;

/**
 * This class loads the hostname from an IMAP account. The hostname is not
 * cached it. This ensures that always the most recent settings are used.
 */
class SieveWebSocketHost extends SieveAbstractHost {

  /**
   * @inheritdoc
   */
  async getDisplayName() {
    return this.account.getServerConfig().displayname;
  }

  /**
   * @inheritdoc
   */
  async getHostname() {
    return window.location.hostname;
  }

  /**
   * Returns the host's port which should be used for the websocket connection.
   *
   * It is assumed that the sieve endpoints runs from the very same endpoint
   * as underlying html page and thus is derived from the window.location.
   *
   * @returns {string}
   *   the port as string
   */
  async getPort() {

    const port = window.location.port;
    if (port !== "")
      return port;

    if (window.location.protocol === HTTP_PROTOCOL)
      return HTTP_PORT;

    if (window.location.protocol === HTTPS_PROTOCOL)
      return HTTPS_PORT;

    throw new Error("Failed to retrieve server port");
  }

  /**
   * @inheritdoc
   */
  async getKeepAlive() {
    return THIRTY_SECONDS;
  }

  /**
   * Returns the endpoint or path for the given hostname.
   *
   * @returns {string}
   *   the endpoint as string.
   */
  async getEndpoint() {
    return window.location.pathname + this.account.getServerConfig().endpoint;
  }

  /**
   * @inheritdoc
   */
  async getUrl() {
    return `sieve://${await this.getHostname()}:${await this.getPort()}${await this.getEndpoint()}`;
  }
}

export { SieveWebSocketHost as SieveHost };
