/*
 * The contents of this file are licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via
 * email from the author.
 *
 * Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 *
 */

import { SieveLexer } from "./SieveLexer.mjs";

// Sieve Layout Engine is a static class...

/**
 * A static class implementing a simple Layout engine.
 *
 * Widgets can register on rendering Elements.
 */
const SieveDesigner =
{
  names: {},
  types: {},

  /**
   * Registers a widget. A widget needs to be a prototype/class
   * with a static nodeName() and nodeType() method.
   *
   * @param {object} callback
   *   the constructor which should be called in case the widget needs
   *   to be constructed.
   * @throws throws an exception in case the callback is invalid
   *
   */
  register2: function (callback) {

    if (!callback.nodeType)
      throw new Error("Designer Error: Registration failed, element has no type");

    const type = callback.nodeType();

    if (!callback.nodeName)
      throw new Error("Designer Error: Registration failed, element has no name");

    const name = callback.nodeName();

    if (typeof (this.types[type]) === 'undefined')
      this.types[type] = {};

    const obj = {};
    obj.onNew = function (id) { return new callback(id); };
    obj.onCapable = (capabilities) => {
      if (callback.isCapable)
        return callback.isCapable(capabilities);

      return true;
    };

    this.names[name] = obj;
    this.types[type][name] = obj;

  },

  getWidgetsByClass: function (clazz, id) {

    const widgets = [];

    const tmp = this.types[clazz];
    const capabilities = SieveLexer.capabilities();

    for (const item in tmp) {
      if (tmp[item].onCapable(capabilities))
        widgets.push(tmp[item].onNew(id));
    }

    return widgets;
  },

  getWidgetByElement: function (elm) {

    if (!elm.nodeName || !elm.nodeName())
      throw new Error("Layout Engine Error: Element has no name");

    const name = elm.nodeName();

    if (!this.names[name])
      return null;

    return this.names[name].onNew(elm);
  },

  /**
   * Widgets can register a constructor in order to rendering element.
   * They use either the elements name or the constructor as identifier.
   *
   * When an element ist ready to be rendered the widgets constructor
   * is invoked, and the new widgets instance is bound to the element.
   *
   * @param {string|Constructor} name
   *   The name or the constructor of the element the widget can render.
   * @param {Constructor} callback
   *   Constructor which should be calls to render this element
   *
   */
  register: function (name, callback) {
    if (typeof (name) === "undefined" || !name)
      throw new Error("Layout Engine Error: Widget can't be registered without a name");

    if (typeof (name) !== "string")
      name = name.nodeName();

    this.names[name] = {};
    this.names[name].onNew = function (elm) { return new callback(elm); };
  },

  /**
   * Returns a widget for the given element.
   *
   * In case no widget registered for the element null is returned, other
   * wise a new instance which can be used to display the element.
   *
   * @param {SieveAbstractElement} elm
   *   the sieve element for which the widget should be returned.
   * @returns {object} the widget
   */
  widget: function (elm) {
    return this.getWidgetByElement(elm);
  }
};

export { SieveDesigner };
