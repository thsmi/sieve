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

  let instance = null;

  /**
   * A poor mans i18n helper class which provides help to translate strings.
   */
  class SieveI18n {

    /**
     * Initializes a new instance.
     */
    constructor() {
      this.entities = {};
    }

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
     * Loads a dictionary which is used to translate the strings.
     * It will fail silently in case the dictionary can not be loaded.
     *
     * @param {string} dictionary
     *   the path to the dictionary file.
     *
     * @returns {SieveI18n}
     *   a self reference
     */
    async load(dictionary) {
      if (typeof(dictionary) === "undefined" || dictionary === null) {
        dictionary = `./i18n/${navigator.language}.json`;
      }

      return await new Promise((resolve) => {

        $.ajax(dictionary, { dataType: "text" })
          .done((data) => {
            try {
              this.entities = JSON.parse(data.replace(/^\s+\/\/.*$/gm, ""));
            }
            catch (ex) {
              this.getLogger().logI18n(`Parsing dictionary ${dictionary} failed with error ${ex}`);
            }
            resolve(this);
          })
          .fail(() => {
            this.getLogger().logI18n(`Failed to load dictionary ${dictionary}`);
            resolve(this);
          });
      });
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
      const value = this.entities[entity];

      if (typeof (value) === "undefined" || value === null)
        throw new Error(`No translation for ${entity}`);

      return value;
    }

  }

  if (typeof (module) !== "undefined" && module && module.exports)
    module.exports.SieveI18n = SieveI18n;
  else
    exports.SieveI18n = SieveI18n;

})(this);
