"use strict";

export { SieveI18n };

/**
* A poor mans I18n helper class which provides help to translat strings.
*/
class SieveI18n {

  /**
   * Initializes the new i18n instance.
   * @param {String} locale
   *   the locale which should be used for translations.
   * @constructor
   */
  SieveI18n(locale) {
    if (locale === undefined)
      locale = "en-US";

    this.setLocale(locale);
  }

  /**
   * Sets the current locale. In case the locale is unknown an exception will be thrown.
   * 
   * @param {String} locale 
   *   the new locale
   * @returns {SieveI18n}
   *   a self reference
   */
  setLocale(locale) {
    if (this.locale == locale)
      return this;

    this.strings = require(`./i18n/${locale}.json`);
  }

  /**
   * The strings unique id
   * 
   * @param {String} string
   *   the string which should be translated
   * @returns {String}
   *   the tranlated string
   */
  getString(string) {
    return this.strings[string];
  }

}

