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

  /* global $ */

  const { SieveLogger } = require("./SieveLogger.js");

  const entities = {

    "import.title" : "Import Accounts",
    "import.verify" : "Verifying configuration, please wait...",
    "import.account" : "Account Name",
    "import.hostname" : "Hostname",
    "import.username" : "Username",
    "import.accept" : "Import",

    "account.disconnected.title" : "Not Connected to the Server",
    "account.disconnected.description" : "The account is not connected to the server.",
    "account.connect" : "Connect",

    "account.connecting.title" : "Connecting...",
    "account.disconnecting.title" : "Disconnecting...",

    "account.create.title" : "Create Account",
    "account.create.displayName" : "Display name",
    "account.create.displayName.placeholder" : "e.g. work or mail@example.com",
    "account.server.hostname" : "Hostname",
    "account.server.hostname.placeholder" : "e.g. imap.example.com",
    "account.server.port" : "Port",
    "account.server.port.placeholder" : "e.g. 4190 or 2000",
    "account.server.username" : "Username",
    "account.create.accept" : "Create",

    "account.delete.title" : "Delete Account",
    "account.delete.description1" : "Do you really want to delete the configuration for",
    "account.delete.description2" : "?",
    "account.delete.accept" : "Delete",

    "account.details.delete.title" : "Danger Zone",
    "account.details.delete.description" : "Remove this server configuration from the app. Your account on your mail server will remain untouched, no scripts are deleted and the currently active remains active.",
    "account.details.delete" : "Delete Server",

    "account.settings" : "Settings",
    "account.newscript" : "New script",
    "account.donate" : "Donate",

    "settings.server.displayname" : "Display Name",
    "settings.server.displayname.placeholder" : "e.g. work or mail@example.com",
    "settings.server.hostname" : "Hostname",
    "settings.server.hostname.placeholder" : "e.g. imap.example.com",
    "settings.server.port" : "Port",
    "settings.server.port.placeholder" : "e.g. 4190 or 2000",
    "settings.server.fingerprint" : "Fingerprint",
    "settings.server.fingerprint.description" : "The fingerprint is used to trust certificates which can not be validated automatically. You will need this only if you are using with self-signed certificates.",
    "settings.server.fingerprint.placeholder" : "The server's certificates fingerprint.",
    "settings.server.idle1" : "Send idle message after",
    "settings.server.idle2" : "minutes of in activity.",
    "settings.server.idle.description" : "Most server will disconnect a client after being inactive for a certain time span. To prevent this and keep the connection alive, idle messages are sent. To disable keep alive messages set the interval to zero.",

    "settings.credentials.security" : "Security",
    "settings.credentials.forceEncryption" : "Encrypted Connection",
    "settings.credentials.noEncryption" : "None",
    "settings.credentials.authentication" : "Authentication",
    "settings.credentials.sasl.default" : "Use suggested Mechanism",
    "settings.credentials.sasl.plain" : "Force plain",
    "settings.credentials.sasl.login" : "Force login (Deprecated)",
    "settings.credentials.sasl.crammd5" : "Force CRAM-MD5",
    "settings.credentials.sasl.scramsha1" : "Force SCRAM-SHA-1",
    "settings.credentials.sasl.scramsha256" : "Force SCRAM-SHA-256",
    "settings.credentials.sasl.external" : "Force External",
    "settings.credentials.sasl.none" : "No Authentication",
    "settings.credentials.username" : "Username",
    "settings.credentials.authorization1": "Proxy authorization allows an authenticated user to act on behalf of another users. Usually servers provide this feature only to special elevated administrator or root accounts.",
    "settings.credentials.authorization2": "Keep in mind very few authentication mechanism support authorization. So you should always force SASL Plain Authentication, when using this feature.",
    "settings.credentials.authorization" : "Authorization",
    "settings.credentials.authorization.implicit" : "Implicit, server decides (default)",
    "settings.credentials.authorization.current" : "Explicit, use current user",
    "settings.credentials.authorization.prompt" : "Explicit, prompt for username",
    "settings.credentials.authorization.username" : "Explicit, use different user",
    "settings.credentials.authorization.username2" : "Username",

    "account.settings.edit" : "Edit Settings",
    "account.disconnect" : "Disconnect",
    "account.reconnect" : "Reconnect",
    "account.capabilities.show" : "Show Server Capabilities",

    "account.details.title" : "Account Details",
    "account.details.server" : "Server",
    "account.details.secure" : "(Secure Connection)",
    "account.details.fingerprint" : "Fingerprint",
    "account.details.username" : "Username",
    "account.details.sasl" : "SASL Mechanism",
    "account.details.server.edit" : "Edit Server",
    "account.details.credentials.edit" : "Edit Credentials",
    "account.details.debugging.edit" : "Debugging",

    "account.script.active" : "active",
    "account.script.deactivate" : "Deactivate",
    "account.script.activate" : "Activate",
    "account.script.rename" : "Rename",
    "account.script.delete" : "Delete",
    "account.script.edit" : "Edit",

    "account.error.title" : "Connection Error",
    "account.error.description" : "Failed to connect to the server",
    "account.error.accept" : "Ok",

    "password.dialog.title" : "Password Required",
    "password.dialog.description" : "Please enter the password for your Sieve account.",
    "password.dialog.account" : "Account",
    "password.dialog.username" : "Username",
    "password.dialog.password" : "Password",
    "password.dialog.accept" : "Login",

    // the authorization dialog...
    "authorization.title" : "Authorization Required",
    "authorization.description" : "Please enter the user as which you would like to be authorized.",
    "authorization.account" : "Account",
    "authorization.username" : "Username",
    "authorization.placeholder" : "Authorization",
    "authorization.accept" : "Authorize",

    "cert.title" : "Security alert",
    "cert.description1" : "Your mail server's authenticity cannot be verified!",
    "cert.description2" : "Someone might try to impersonate your mail server.",
    "cert.error" : "The validation failed with the following error message:",
    "cert.fingerprint" : "You need to verify manually, if the fingerprint matches your mailserver's fingerprint:",
    "cert.warning" : "Continue only if the fingerprints match and the error message is reasonable!",
    "cert.accept" : "Continue",

    "script.create.title" : "Create Script",
    "script.create.description" : "Enter the new name for your script",
    "script.create.name" : "The new script's name",
    "script.create.accept" : "Create",

    "script.delete.title" : "Delete Script",
    "script.delete.description1": "Are you really sure to delete the script",
    "script.delete.description2": "?",
    "script.delete.description3": "This can not be undone",
    "script.delete.accept" : "Delete",

    "script.rename.title" : "Rename Script",
    "script.rename.description": "Enter the new name for your script",
    "script.rename.placeholder" : "New Script name",
    "script.rename.accept" : "Rename",

    "script.busy.title" : "Script is in use",
    "script.busy.description1" : "The script",
    "script.busy.description2" : "can not be renamed or deleted.",
    "script.busy.description3" : "It is currently being edited in a tab.",
    "script.busy.accept" : "Ok",

    "editor.save.title" : "Script changed",
    "editor.save.description1" : "The Script",
    "editor.save.description2" : "was changed.",
    "editor.save.description3" : "Do you want to save the changes?",
    "editor.save.accept" : "Save Changes",
    "editor.save.discard" : "Discard Changes",

    "editor.error.save.title" : "Failed to save the script",
    "editor.error.save.description" : "The script can not be saved to the server this is most likely due to an invalid syntax.",

    "editor.syntax.title" : "Syntax check",
    "editor.syntax.description" : "While editing script they can be checked for validity. The syntax check is performed by the server. In order to keep network traffic low, syntax check are grouped.",
    "editor.syntax.switch" : "Checks scripts while editing",

    "editor.indentation.title" : "Indentation",
    "editor.indentation.description" : "The editor automatically indent code while typing.",
    "editor.indentation.width" : "Indention width",
    "editor.indentation.policy" : "Indention Policy",
    "editor.indentation.tabs" : "Use Tabs",
    "editor.indentation.spaces" : "Use Spaces",
    "editor.indentation.tabWidth" : "Tab width",

    "editor.defaults.title" : "Defaults",
    "editor.defaults.description" : "Use the current settings as default for all editor instances or load the default values.",
    "editor.defaults.save" : "Save as defaults",
    "editor.defaults.load" : "Load defaults",

    "texteditor.cut" : "Cut",
    "texteditor.copy" : "Copy",
    "texteditor.paste" : "Paste",

    "texteditor.undo" : "Undo",
    "texteditor.redo" : "Redo",
    "texteditor.findAndReplace" : "Find & Replace",
    "texteditor.reference" : "Reference",

    "texteditor.find" : "Find",
    "texteditor.find.text" : "Search for...",
    "texteditor.replace" : "Replace",
    "texteditor.replace.text" : "Replace with...",

    "texteditor.matchCase" : "Match Case.",
    "texteditor.backwards" : "Search Backward",

    "updater.message" : "A new version was released click to update.",

    "debug.transport.description" : "Used to log and debug the communication between this app and the server. All of the settings apply to this accounts after a reconnect.",
    "debug.transport.clientserver" : "Client to Server communication (requests)",
    "debug.transport.serverclient" : "Server to Client communication (responses)",
    "debug.transport.states" : "Exceptions and State Machine Information",
    "debug.transport.rawdump" : "Raw Dump/Dump Byte Stream",
    "debug.transport.session" : "Session management",

    "debug.global.title" : "Global",
    "debug.global.description" : "Used to log and debug the app's UI and rendering. The settings are global and apply to all accounts after restarting the app.",
    "debug.global.actions" : "User Events and Actions",
    "debug.global.ipc" : "IPC Messages",
    "debug.global.widgets" : "Widgets",
    "debug.global.i18n" : "Internationalization (I18n)"
  };

  let instance = null;

  /**
   * A poor mans I18n helper class which provides help to translate strings.
   */
  class SieveI18n {

    /**
     * Creates or returns an initialized i18n instance.
     * It is guaranteed to be a singleton.
     *
     * @returns {SieveI18n}
     *   the logger instance.
     */
    static getInstance() {

      if (instance === null)
        instance = new SieveI18n();

      return instance;
    }

    /**
     * Gets an instance of the default logger.
     *
     * @returns {SieveLogger}
     *   a reference to a logger instance.
     */
    getLogger() {
      return SieveLogger.getInstance();
    }


    /**
     * Sets the current locale. In case the locale is unknown an exception will be thrown.
     *
     * @param {string} locale
     *   the new locale
     * @returns {SieveI18n}
     *   a self reference
     */
    async setLocale(locale) {

      // navigator.language

      if (locale === undefined)
        locale = "en-US";

      if (this.locale === locale)
        return this;

      return await new Promise((resolve, reject) => {
        if (this.locale === locale)
          resolve(this);

        $.getJSON(`./i18n/${locale}.json`)
          .done((data) => {
            this.strings = data;
            resolve(this);
          })
          .fail(() => {
            reject(new Error("Failed to load locale"));
          });
      });
      // this.strings = require(`./i18n/${locale}.json`);
    }

    /**
     * Returns the translated string for the entity.
     * In case no translation was found an exception is thrown.
     *
     * @param {string} entity
     *   the string which should be translated
     * @returns {string}
     *   the translated string
     */
    getString(entity) {
      const value = entities[entity];
      // const value = this.strings[string];

      if (typeof (value) === "undefined" || value === null)
        throw new Error(`No translation for ${entity}`);

      return value;
    }

  }

  if (typeof(module) !== "undefined" && module && module.exports)
    module.exports.SieveI18n = SieveI18n;
  else
    exports.SieveI18n = SieveI18n;

})(this);
