/*
 * The contents of this file is licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via email
 * from the author. Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

/**
 * Stores a session's server compatibility settings.
 */
class SieveCompatibility {

  /**
   * Creates a new instance with the minimal possible compatibility settings
   * They should be updated with the server's real capabilities.
   */
  constructor() {
    this.startTLS = true;
    this.sasl = [];

    this.noop = false;
    this.checkscript = false;
    this.renamescript = false;
  }

  /**
   * Updates the compatibility matrix.
   *
   * @param {SieveCapabilityResponse} capabilities
   *   the Capability response
   *
   * @returns {boolean}
   *   a self reference.
   */
  update(capabilities) {

    this.sasl = [...capabilities.getSasl()];
    this.startTLS = capabilities.getTLS();

    this.noop = capabilities.canNoop();
    this.checkscript = capabilities.canCheckScript();
    this.renamescript = capabilities.canRenameScript();

    return this;
  }

  /**
   * The rename command is used to rename script in a single atomic operation.
   *
   * It can be emulated by uploading the new script and deleting the old script.
   *
   * @returns {boolean}
   *   true in case the server supports the atomic rename script operation.
   */
  canRenameScript() {
    return this.renamescript;
  }

  /**
   * The checkscript command is used to check a script for syntax errors in
   * a single atomic operation.
   *
   * It can be emulated by uploading a temporary script. Uploading a broken
   * script will result in an error. But you need to take care that in the
   * good case the temporary script is cleaned up as well as the temporary
   * script does not clash with existing scripts.
   *
   * @returns {boolean}
   *   true in ase the server supports the atomic checkscript operation.
   */
  canCheckScript() {
    return this.checkscript;
  }

  /**
   * A noop is used to keep a connection with minimal overhead alive.
   * It can be emulated by sending a capability request which ia also
   * side effect free.
   *
   * @returns {boolean}
   *   true in case the server supports the noop operation.
   */
  canNoop() {
    return this.noop;
  }

  /**
   * Checks if the server supports upgrading the socket using starttls.
   *
   * Please note this is typically false when the server does not support
   * upgrading or if the connection is secured and was already upgraded.
   *
   * So it is normal that this capability changes during the authentication
   * handshake.
   *
   * @returns {boolean}
   *   true in case the server supports securing the connection.
   */
  canStartTLS() {
    return this.startTLS;
  }

  /**
   * Returns a list with supported sasl mechanisms.
   *
   * Most servers are configured for security reason to provide sasl mechanics
   * only when being upgraded to a secure connection.
   *
   * So it is quite normal that this list is empty on an unsecured connection.
   *
   * @returns {string[]}
   *   the list with supported sasl mechanism. It is sorted by priority.
   *
   */
  getSaslMechanisms() {
    // We want our member to be immutable thus we need to return a
    // copy of the array containing the sasl mechanisms.
    return [...this.sasl];
  }
}

export { SieveCompatibility };
