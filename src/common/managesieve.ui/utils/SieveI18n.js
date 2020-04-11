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
    "account.disconnected.title" : "Not Connected to the Server",
    "account.disconnected.description" : "The account is not connected to the server.",
    "account.connect" : "Connect",

    "account.delete.title" : "Danger Zone",
    "account.delete.description" : "Remove this server configuration from the app. Your account on your mail server will remain untouched, no scripts are deleted and the currently active remains active.",
    "account.delete" : "Delete Server",

    "account.settings" : "Settings",
    "account.newscript" : "New script",
    "account.donate" : "Donate",

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

    "password.dialog.title" : "Password Required",
    "password.dialog.description" : "Please enter the password for your Sieve account.",
    "password.dialog.account" : "Account",
    "password.dialog.username" : "Username",
    "password.dialog.password" : "Password",
    "password.dialog.accept" : "Login",

    "script.create.title" : "Create Script",
    "script.create.description" : "Enter the new name for your script",
    "script.create.name" : "The new script's name",
    "script.create.accept" : "Create",

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
    "texteditor.backwards" : "Search Backward"
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
     * The strings unique id
     *
     * @param {string} entity
     *   the string which should be translated
     * @returns {string}
     *   the translated string
     */
    getString(entity) {
      const value = entities[entity];
      // const value = this.strings[string];

      if (typeof (value) === "undefined" || value === null) {
        this.getLogger().logI18n("No translation for ${entity}");
        return entity;
      }

      return `##${value}##`;
    }

  }

  if (typeof(module) !== "undefined" && module && module.exports)
    module.exports.SieveI18n = SieveI18n;
  else
    exports.SieveI18n = SieveI18n;

})(this);
