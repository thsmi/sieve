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

import { SieveLogger } from "./SieveLogger.js";
import { SieveI18n } from "./SieveI18n.js";

/**
 * Loads an html fragment from a file or url.
 */
class SieveTemplate {

  /**
   * Gets an instance of the default i18n
   *
   * @returns {SieveI18n}
   *   a reference to an i18n instance.
   */
  getI18n() {
    return SieveI18n.getInstance();
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
   * Translates a loaded template.
   * It queries all data-i18n and translates all elements found.
   *
   * @param {DocumentFragment} fragment
   *   the template which should be translated.
   * @returns {DocumentFragment}
   *   the translated template.
   */
  translate(fragment) {

    // Check if a translator is attached to this loader...
    // if ((typeof(this.i18n) === "undefined") || (this.i18n === null))
    //  return fragment;

    // Get all elements with a data-i18n tag from the fragment.
    for (const elm of fragment.querySelectorAll('[data-i18n]')) {

      const entity = elm.dataset.i18n;

      // We translate the placeholder on HTML Elements
      if ((elm instanceof HTMLInputElement) && (elm.type === "text" || elm.type === "email")) {
        try {
          elm.placeholder = this.getI18n().getString(entity);
        } catch (ex) {
          this.getLogger().logI18n(ex);
        }
        continue;
      }

      // Warn if text content is not empty.
      if (elm.textContent.trim() !== "") {
        this.getLogger().logI18n(`Text node for ${entity} not empty, replacing existing text`);
      }

      // Get the translation and update the text...
      try {
        elm.textContent = this.getI18n().getString(entity);
      } catch (ex) {
        this.getLogger().logI18n(ex);
        elm.classList.add("alert-danger");
        elm.textContent = entity;
      }
    }

    return fragment;
  }

  /**
   * Load a template from a string.
   *
   * @param {string} html
   *   the template to be transformed
   * @returns {HTMLElement}
   *   the html element
   */
  convert(html) {
    const doc = (new DOMParser()).parseFromString(html, "text/html");
    return this.translate(doc.body.firstElementChild);
  }

  /**
   * Loads an html fragment from file or url
   *
   * @param {string} tpl
   *   the path tho the template file
   * @returns {Promise<HTMLElement>}
   *   the template which should be loaded.
   */
  async load(tpl) {
    this.getLogger().logWidget(`Load template ${tpl}`);

    return this.convert(
      await (await fetch(tpl, { cache: "no-store" })).text());
  }
}

export { SieveTemplate };
