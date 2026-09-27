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

import { SieveLogger } from "./SieveLogger.mjs";

const FIRST_ELEMENT = 0;

const DEFAULT_LOCALE = "en-US";
const DEFAULT_PATH = "./i18n/";

// A list with all supported languages.
const LANGUAGES = new Set();
LANGUAGES.add("en-US");
LANGUAGES.add("de-DE");
LANGUAGES.add("cz-CZ");

// Maps a language to a supported language.
const LANGUAGE_MAPPING = new Map();
LANGUAGE_MAPPING.set("en", "en-US");
LANGUAGE_MAPPING.set("de", "de-DE");
LANGUAGE_MAPPING.set("cz", "cz-CZ");

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
   * Tries to find a compatible and supported language.
   * In case the language can not be mapped it will
   * fallback to american english.
   *
   * @param {string} language
   *   a language string in BCP 47 format
   *
   * @returns {string}
   *   the best compatible locale.
   */
  getLanguage(language) {

    // Check if it's a perfect match with a well known language region.
    if (LANGUAGES.has(language))
      return language;

    // If not we split the language from the region...
    language = language.split('-')[FIRST_ELEMENT].toLowerCase();

    // ... and try to find the matching the language.
    // in case it fails we fall back to the default.
    if (!LANGUAGE_MAPPING.has(language))
      return DEFAULT_LOCALE;

    language = LANGUAGE_MAPPING.get(language);

    // Double check that our mapping really points to a supported language.
    // if not we fall back to the default.
    if (!LANGUAGES.has(language))
      return DEFAULT_LOCALE;

    return language;
  }

  /**
   * Loads translations for the given locale.
   *
   * @param {string} [locale]
   *   optional the locale to be loaded, if omitted or set to "default"
   *   the browser's default language (navigator.language) is used.
   * @param {string} [path]
   *   the optional path to the directory where the locale files are stored.
   *   If omitted ./i18n is used
   * @returns {SieveI18n}
   *   a self reference.
   */
  async load(locale, path) {

    if (typeof (locale) === "undefined" || locale === null || locale === "default")
      locale = navigator.language;

    if (typeof (path) === "undefined" || path === null)
      path = DEFAULT_PATH;

    if (!path.endsWith("/"))
      path = `${path}/`;

    this.getLogger().logI18n(`Language set to ${locale}`);

    locale = this.getLanguage(locale);

    this.getLogger().logI18n(`Language normalized to ${locale}`);

    try {
      await this.loadDictionary(`${path}${locale}.json`);
    } catch {
      // In case loading the dictionary failed e.g. due to a parsing error
      // we try falling back to our default one which is used during development.
      await this.loadDictionary(`${path}${DEFAULT_LOCALE}.json`);
    }

    return this;
  }

  /**
   * Loads a dictionary which is used to translate the strings.
   * It will throw an exception in case the dictionary can not be loaded.
   *
   * @param {string} dictionary
   *   the path to the dictionary file.
   *
   * @returns {SieveI18n}
   *   a self reference
   */
  async loadDictionary(dictionary) {

    let data = null;

    try {
      data = await (await fetch(dictionary, { cache: "no-store" })).text();
    } catch (ex) {
      this.getLogger().logI18n(`Loading dictionary ${dictionary} failed with error ${ex}`);
      throw new Error(`Failed to load dictionary ${dictionary}`);
    }

    try {
      this.entities = JSON.parse(data.replace(/^\s+\/\/.*$/gm, ""));
    } catch (ex) {
      this.getLogger().logI18n(`Parsing dictionary ${dictionary} failed with error ${ex}`);
    }

    this.getLogger().logI18n(`Dictionary ${dictionary} loaded`);

    return this;
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

export { SieveI18n };
