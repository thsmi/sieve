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

const {
  contextBridge,
  ipcRenderer,
  shell,
  clipboard
} = require('electron');

const net = require('net');
const tls = require('tls');

contextBridge.exposeInMainWorld('preload', {

  /**
   * Returns the apps version
   *
   * @returns {string}
   *    the app version as string.
   */
  getVersion : async() => {
    return await ipcRenderer.invoke("get-version");
  },

  /**
   * Opens the update url pointing to the latest release in the default browser.
   */
  openUpdateUrl: () => {
    shell.openExternal('https://github.com/thsmi/sieve/releases/latest');
  },

  /**
   * Copies data to the system's clipboard
   *
   * @param {string} data
   *   the data to be put into the clipboard.
   */
  copy: (data) => {
    clipboard.writeText(data);
  },
  /**
   * Retrieves the data stored inside the system's clipboards.
   *
   * @returns {string}
   *   the data contained in the clipboard.
   */
  paste: () => {
    return clipboard.readText();
  },

  openDialog: async (options) => {
    return await ipcRenderer.invoke("open-dialog", options);
  },
  saveDialog: async (options) => {
    return await ipcRenderer.invoke("save-dialog", options);
  },

  /**
   * Opens the developer tools for debugging.
   */
  openDeveloperTools: async () => {
    await ipcRenderer.invoke("open-developer-tools");
  },
  /**
   * Reloads the UI
   */
  reloadUI: async () => {
    await ipcRenderer.invoke("reload-ui");
  },

  /**
   * Checks if the system provides a safe storage.
   *
   * @returns {boolean}
   *   true in case the system supports safe storage otherwise false.
   */
  hasEncryption : async () => {
    return await ipcRenderer.invoke("has-encryption");
  },
  /**
   * Encrypts the given data using the safe storage api.
   * @param {string} data
   *   the data to be encrypted
   * @returns {string}
   *   the encrypted data.
   */
  encrypt : async(data) => {
    return await ipcRenderer.invoke("encrypt-string", data);
  },
  /**
   * Decrypts the given data using the safe storage api.
   * @param {string} data
   *   the data to be decrypted
   * @returns {string}
   *   the decrypted data.
   */
  decrypt : async(data) => {
    return await ipcRenderer.invoke("decrypt-string", data);
  },

  /**
   * Creates and connects a new tcp socket for the given host and port.
   *
   * @param {int} port
   *   the port as number
   * @param {string} host
   *   the remote'S hostname or ip
   * @returns {net.Socket}
   *   the newly created socket.
   */
  createSocket: async(port, host) => {
    return net.connect(port, host);
  },

  /**
   * Creates a secure Socket from a regular unsecure socket-
   *
   * @param {net.Socket} socket
   *   the socket to be upgraded.
   * @param {string} host
   *   the hostname needed to verify certificates.
   * @returns {tls.TLSSocket}
   *   the secure socket.
   */
  createTlsSocket: async(socket, host) => {
    return tls.connect({
      socket: socket,
      servername : host,
      rejectUnauthorized : false});
  }
});
