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

(function (exports) {

  "use strict";

  /* global Services */
  /* global Components */

  const Cc = Components.classes;
  const Ci = Components.interfaces;

  const AUTH_TYPE_IMAP = 1;
  const AUTH_TYPE_CUSTOM = 2;

  const DEFAULT_AUTH_TYPE = AUTH_TYPE_IMAP;

  const CONFIG_AUTHENTICATION_TYPE = "activeLogin";

  const { SieveAbstractAuthentication } = require("./settings/SieveAbstractAuthentication.js");
  const { SieveAbstractMechanism } = require("./settings/SieveAbstractMechanism.js");


  /**
   * If you want to use the Authentication Settings of an existing IMAP account
   * use this class. Any Settings are loaded dynamically when needed. This means
   * any changes to the IMAP account apply imediately to this class.
   *
   * @param {string} imapKey
   *   The unique imapKey of the IMAP account, which should be used.
   * @constructor
   */
  class SieveImapAuth extends SieveAbstractAuthentication {

    /**
     * The accounts original hostname
     * @returns {string}
     *   return the hostname as string
     */
    getHostname() {
      return this.account.getHost().getHostname();
    }

    /**
     * @inheritdoc
     */
    getDescription() {
      return "account.auth.imap";
    }

    /**
     * Returns a reference to the IMAP incoming server
     *
     * @returns {nsIIncomingServer}
     *   the imap accounts incoming server
     **/
    getIncomingServer() {
      let imapKey = this.account.getKey();
      // use the IMAP Key to load the Account...
      return Cc['@mozilla.org/messenger/account-manager;1']
        .getService(Ci.nsIMsgAccountManager)
        .getIncomingServer(imapKey);
    }

    /**
     * @inheritdoc
     */
    getPassword() {

      let server = this.getIncomingServer();

      // in case the passwordPromptRequired attribute is true...
      // ... thunderbird will take care on retrieving a valid password...
      //
      if (server.passwordPromptRequired === false)
        return server.password;

      // ... otherwise we it is our job...
      let strings = Services.strings
        .createBundle("chrome://sieve/locale/locale.properties");

      let description = strings.GetStringFromName("account.password.description") + "\r\n";
      description += "\r\n";
      description += strings.GetStringFromName("account.password.username") + this.getUsername() + "\r\n";
      description += strings.GetStringFromName("account.password.hostname") + this.getHostname() + "\r\n";
      description += "\r\n";


      let input = { value: null };
      let check = { value: false };
      let result
        = Services.prompt.promptPassword(
          null,
          strings.GetStringFromName("account.password.title"),
          description,
          input, null, check);

      if (result)
        return input.value;

      return null;
    }

    /**
     * @inheritdoc
     **/
    getUsername() {
      return this.getIncomingServer().realUsername;
    }

    /**
     * @inheritdoc
     **/
    hasUsername() {
      return true;
    }
  }

  /**
   * Incase the Sieve Account requires a different login than the IMAP Account,
   * use this Class. It stores the username and the password if desired.
   *
   * Entries in the new Login-Manager are identified and enumerated by their
   * original hostname. Furthermore the username is stored in the prefs and
   * is used to find a matching account, as the original hostname is not
   * garanteed to be unique.
   *
   * @param {string} host
   *   the original hostname for this account
   * @param {string} uri
   *   the unique URI of the associated sieve account
   * @constructor
   */
  class SieveCustomAuth extends SieveAbstractAuthentication {

    /**
     * The accounts original hostname
     * @returns {string}
     *   return the hostname as string
     */
    getHostname() {
      return this.account.getHost().getHostname();
    }

    /**
     * @inheritdoc
     */
    getDescription() {
      return "account.auth.custom";
    }

    /**
     * Updates the account's username in the login manager
     * It uses the hostname to discover the username.
     *
     * @param {string} oldUserName
     *   the account's old username
     * @param {string} newUserName
     *   the account's new username
     *
     * @returns {boolean}
     *  true in case the username could be updated otherwise false.
     */
    _setUsernameByHost(oldUserName, newUserName) {
      let loginManager = Services.logins;
      let host = this.getHostname();

      // ...first look for entries which meet the proposed naming...
      let logins =
        loginManager.findLogins(
          {}, "sieve://" + host, null, "sieve://" + host);

      for (let i = 0; i < logins.length; i++) {
        if (logins[i].username !== oldUserName)
          continue;

        loginManager.removeLogin(logins[i]);

        logins[i].username = newUserName;

        loginManager.addLogin(logins[i]);
        return true;
      }

      return false;
    }

    /**
     * Updates the account's username in the login manager
     * It uses the sieve account uri to discover the username
     *
     * This is deprecated, as described in bug 474277 the original
     * hostname is a better option. But we still need it for backward
     * compatibility when Thunderbird fails to import the password and
     * username properly. There might be entries which want to be repaired
     *
     * @deprecated
     *
     * @param {string} oldUserName
     *   the account's old username
     * @param {string} newUserName
     *   the account's new username
     *
     * @returns {boolean}
     *   true in case the account was updated otherwise false
     */
    _setUsernameByUri(oldUserName, newUserName) {

      let loginManager = Services.logins;
      let host = this.getHostname();
      let uri = this.account.uri;

      let logins =
        loginManager.findLogins({}, "sieve://" + uri, "", null);

      for (let i = 0; i < logins.length; i++) {
        if (logins[i].username !== oldUserName)
          continue;

        loginManager.removeLogin(logins[i]);

        logins[i].hostname = "sieve://" + host;
        logins[i].httpRealm = "sieve://" + host;
        logins[i].formSubmitURL = null;
        logins[i].username = newUserName;
        logins[i].usernameField = "";
        logins[i].passwordField = "";

        loginManager.addLogin(logins[i]);
        return true;
      }

      return false;
    }


    /**
     * Updates the username.
     * Any saved passwords associated with this account will be updated too.
     * This is the default behaviour for Thunderbird3 an up.
     *
     * @param {string} username
     *   the username as string, has to be neither empty nor null.
     *
     */
    setUsername(username) {
      if (typeof (username) === "undefined" || username === null)
        username = "";

      // first we need to cache the old username...
      let oldUserName = this.getUsername();

      // ... and update the new username.
      this.account.prefs.setString("login.username", username);

      // we should also update the LoginManager...

      // ... first try updating by the hostname...
      if (this._setUsernameByHost(oldUserName, username))
        return;

      // ... an then try to migrate deprected login entries
      // which are addressed by the account uri.

      if (this._setUsernameByUri(oldUserName, username))
        return;

      // ok we give up, there is no passwort entry, this might be because...
      // ... the user might never set one, or it was deleted in the...
      // ... Login-Manager
      return;
    }

    /**
     * Shows a prompt which asks the user for a password.
     *
     * @param {string} username
     *   the account's username
     * @returns {string}
     *   the password or null in case the user dismissed the password prompt.
     */
    _promptPassword(username) {

      let input = { value: null };
      let check = { value: false };

      let strings = Services.strings
        .createBundle("chrome://sieve/locale/locale.properties");

      let description = strings.GetStringFromName("account.password.description") + "\r\n";
      description += "\r\n";
      description += strings.GetStringFromName("account.password.username") + username + "\r\n";
      description += strings.GetStringFromName("account.password.hostname") + this.getHostname() + "\r\n";
      description += "\r\n";

      let result =
        Services.prompt.promptPassword(
          null,
          strings.GetStringFromName("account.password.title"),
          description,
          input,
          strings.GetStringFromName("account.password.remember"),
          check);

      // no password, as the user canceled the dialog...
      if (result === false)
        return null;

      // user wants the password to be remembered...
      if (check.value === true) {
        // the password might be already added while the password prompt is displayed
        try {
          let login = Cc["@mozilla.org/login-manager/loginInfo;1"]
            .createInstance(Ci.nsILoginInfo);

          login.init("sieve://" + this.getHostname(), null, "sieve://" + this.getHostname(),
            "" + this.username, "" + input.value, "", "");

          login.addLogin(login);
        }
        catch (e) {
          // we don't care if we fail, it might work the next time...
        }
      }

      return input.value;
    }

    /**
     * Tries to obtain the password from the login manager by the account's hostname
     *
     * @param {string} username
     *   the username as string
     *
     * @returns {string}
     *   the password or null in case it could not be loaded e.g. the login manager was locked.
     **/
    _getPasswordByHost(username) {
      let host = this.getHostname();
      // First look for entries which meet the proposed naming...
      let logins =
        Services.logins.findLogins(
          {}, "sieve://" + host, null, "sieve://" + host);

      for (let i = 0; i < logins.length; i++)
        if (logins[i].username === username)
          return logins[i].password;

      return null;
    }

    /**
     * Tries to obtain the password from the login manager by the account's uri.
     * This is depreacted and just for backward compatibility.
     *
     * @deprecated
     *
     * @param {string} username
     *   the username as string
     *
     * @returns {string}
     *   the password or null in case it could not be loaded e.g. the login manager was locked.
     **/
    _getPasswordByUri(username) {

      // but as Thunderbird fails to import the password and username properly...
      // ...there might be some slightly different entries...
      let logins = Services.logins.findLogins({}, "sieve://" + this.account.Uri, "", null);

      for (let i = 0; i < logins.length; i++)
        if (logins[i].username === username)
          return logins[i].password;

      return null;
    }

    /**
     * Retrieves the password for the given account.
     *
     * If no suitable login information is stored in the password manager, a ...
     * ... dialog requesting the user for his password will be automatically ...
     * ... displayed, if needed.
     *
     * @returns {string}
     *   The password as string or null in case the password could not be retrived.
     */
    getPassword() {
      let username = this.getUsername();

      let password = null;

      // first try to look it up by hostname
      password = this._getPasswordByHost(username);
      if (password !== null)
        return password;

      // then try the deprecated lookup by uri.
      password = this._getPasswordByUri(username);
      if (password !== null)
        return password;

      // ok prompt for the password.
      return this._promptPassword(username);
    }

    /**
     * Returns the username for this login.
     *
     * The username is stored in the user preferences not in the Login Manager!
     *
     * @returns {string}
     *   The username or an empty string in case of an error
     */
    getUsername() {
      return this.account.prefs.getString("login.username", "");
    }

    /**
     * @inheritdoc
     */
    hasUsername() {
      return true;
    }
  }

  /**
   *
   **/
  class SieveAuthentication extends SieveAbstractMechanism {

    /**
     * @inheritdoc
     */
    getDefault() {
      return DEFAULT_AUTH_TYPE;
    }

    /**
     * @inheritdoc
     **/
    getKey() {
      return CONFIG_AUTHENTICATION_TYPE;
    }

    /**
     * @inheritdoc
     */
    hasMechanism(type) {
      switch (type) {
        case AUTH_TYPE_IMAP:
        case AUTH_TYPE_CUSTOM:
          return true;

        default:
          return false;
      }
    }

    /**
     * @inheritdoc
     */
    getMechanismById(type) {

      switch (type) {
        case AUTH_TYPE_CUSTOM:
          return new SieveCustomAuth(AUTH_TYPE_CUSTOM, this.account);

        case AUTH_TYPE_IMAP:
        // fall through
        default:
          return new SieveImapAuth(AUTH_TYPE_IMAP, this.account);
      }
    }
  }

  exports.SieveAuthentication = SieveAuthentication;

})(module.exports);
