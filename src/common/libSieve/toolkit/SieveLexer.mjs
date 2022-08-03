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

import { SieveCapabilities } from "./logic/GenericCapabilities.mjs";

const QUOTE_LENGTH = 50;

// Sieve Lexer is a static class...

// TODO merge the lexer with the sieve DOM.

const SieveLexer =
{
  ids: new Map(),

  maxId: 0,
  _capabilities: new SieveCapabilities(),

  /**
   * Clears and resets all lexer entries.
   */
  flush: function() {
    this.ids.clear();
  },

  /**
   * Returns a lexer entry by this node name.
   * @param {string} id
   *   the unique node name
   * @returns {object}
   *   the object definition.
   */
  getByName: function (id) {
    if (id.startsWith("@"))
      throw new Error(`Invalid node name ${id}.`);

    return this.ids.get(id);
  },

  /**
   * Returns a lexer entry by this type name.
   * @param {string} id
   *   the unique node name
   * @returns {object[]}
   *   all the object definition with the given type.
   */
  getByType : function(id) {
    if (!id.startsWith("@"))
      throw new Error(`Invalid type name ${id}.`);

    return this.ids.get(id);
  },

  /**
   * Registers a generic element
   *
   * @param {string} name
   *  a unique name for this element
   * @param {string} type
   *  a type information for this element. It is used to create group/classes of elements.
   *  It does not have to be unique.
   * @param {object} obj
   *  the callbacks which are invoked, e.g. when probing, checking for capabilities or creating a new instance.
   */
  registerGeneric: function (name, type, obj) {
    if (!type)
      throw new Error("Lexer Error: Registration failed, element has no type");

    if (!name)
      throw new Error("Lexer Error: Registration failed, element has no name");


    if (name.startsWith("@"))
      throw new Error(`Invalid node name ${name}.`);

    if (!type.startsWith("@"))
      throw new Error(`Invalid type name ${type}.`);


    if (!obj.onProbe)
      throw new Error("Lexer Error: Registration failed, element has onProbe method");

    if (!obj.onNew)
      throw new Error("Lexer Error: Registration failed, element has onNew method");

    if (!obj.onCapable)
      throw new Error("Lexer Error: Registration failed, element has onCapable method");

    if (this.ids.has(name))
      throw new Error(`Node name ${name} is already in use.`);

    if (!this.ids.has(type))
      this.ids.set(type, new Set());

    this.ids.set(name, obj);
    this.ids.get(type).add(obj);
  },

  /**
   * Gets the constructor for the given types and probes if the token can
   * be consumed by the element.
   *
   * @param {string|string[]} types
   *  the constructor types  which should be queried to find a matching constructor
   * @param {SieveParser} token
   *  the token which is to probe if the constructor is compatible
   *
   * @returns {SieveElement|null}
   *  the element which was created or null in case no matching constructor was found
   * @throws
   *  throws an exception in case querying a constructor failed or invalid type information is passed.
   */
  getConstructor: function (types, token) {
    if (typeof (types) === "string")
      types = [types];

    if (!Array.isArray(types))
      throw new Error("Invalid Type list, not an array");

    // enumerate all selectors...
    for (const type of types) {

      // Skip in case it is an invalid type.
      if (!type.startsWith("@"))
        continue;

      for (const value of this.ids.get(type)) {

        if (!(value.onCapable(this._capabilities)))
          continue;

        const result = value.onProbe(token, this);
        if (typeof(result) !== "boolean")
          throw new Error("onProbe did not return a boolean");

        if (!result)
          continue;

        return value;
      }
    }

    return null;
  },

  /**
   * Creates a new object by calling the given constructor.
   * It automatically attaches the docshell to the newly created object.
   *
   * @param {SieveDocument} docshell
   *  the docshell which owns the new element
   * @param {object} constructor
   *  the constructor which should be used to create the new element
   * @param {SieveParser} [parser]
   *  an optional initializer for the newly created object
   *
   * @returns {SieveElement}
   *  the newly created sieve element
   *
   * @throws in case the document could not be created.
   * This could be caused by an invalid initializer or unsupported capabilities.
   */
  createInstance: function (docshell, constructor, parser) {

    if (!constructor.onCapable(this._capabilities))
      throw new Error("Capability not supported");

    const item = constructor.onNew(docshell, ++(this.maxId));

    if ((typeof (parser) !== "undefined") && (parser))
      item.init(parser);

    return item;
  },

  /**
   * Creates an element by the given type information.
   *
   * It probes all registered constructors for this type,
   * checks if the data is parsable by this constructor.
   * If so the new element will be returned.
   *
   * @param {SieveDocument} docshell
   *  the document which owns the new element
   * @param {string} types
   *  the constructor types
   * @param {SieveParser} parser
   *  a sieve parser containing the data which can be probed by the constructors.
   * @returns {SieveElement}
   *  the element which was created
   * @throws
   *  in case the document could not be created.
   **/
  createByClass: function (docshell, types, parser) {
    const item = this.getConstructor(types, parser);

    if ((typeof (item) === 'undefined') || (item === null))
      throw new Error("Unknown or incompatible type >>" + types + "<< at >>" + parser.bytes(QUOTE_LENGTH) + "<<");

    return this.createInstance(docshell, item, parser);
  },

  /**
   * Creates an element for a by name and returns the result
   *
   * @param {SieveDocument} docshell
   *  the document which owns the new element
   * @param {string} name
   *  the constructor name which should be used to create the element
   * @param {SieveParser} [parser]
   *   Optional, used to initialize the created element.
   *
   * @returns {SieveElement}
   *  the newly created element
   **/
  createByName: function (docshell, name, parser) {
    if (!this.ids.has(name))
      throw new Error("No Constructor for >>" + name + "<< found");

    return this.createInstance(docshell, this.ids.get(name), parser);
  },

  getMaxId: function () {
    return this.maxId();
  },

  probeByName: function (name, parser) {
    // If there's no data then skip
    if ((typeof (parser) === "undefined") || parser.empty())
      return false;

    if (!this.ids.has(name))
      throw new Error("Unknown name " + name);

    if (!this.ids.get(name).onCapable(this._capabilities))
      return false;

    if (!this.ids.get(name).onProbe(parser, this))
      return false;

    return true;
  },

  /**
   * Tests if the given Data is parsable
   * @param {string|string[]} types
   *   either a single type as string or a list of things containing all type to test.
   * @param {SieveParser} parser
   *  a SieveParser which contains the data which should be probed
   * @returns {boolean}
   *  true in case a valid constructor was found otherwise false
   */
  probeByClass: function (types, parser) {

    // If there's no data then skip
    if ((typeof (parser) === "undefined") || parser.empty())
      return false;

    // Check for an valid element constructor...
    if (this.getConstructor(types, parser))
      return true;

    return false;
  },

  supportsByName: function (name) {
    if (!this.ids.has(name))
      return false;

    if (!this.ids.get(name).onCapable(this._capabilities))
      return false;

    return true;
  },

  supportsByClass: function (selectors) {
    if (typeof (selectors) === "string")
      selectors = [selectors];


    if (!Array.isArray(selectors))
      throw new Error("Invalid Type list, not an array");

    // enumerate all selectors...
    for (const selector of selectors) {

      // Skip in case it is an invalid type.
      if (!selector.startsWith("@"))
        continue;

      for (const type of this.ids.get(selector))
        if (type.onCapable(this._capabilities))
          return true;
    }

    return false;
  },

  capabilities: function (capabilities) {
    if (typeof (capabilities) === "undefined")
      return this._capabilities;

    this._capabilities = new SieveCapabilities(capabilities);

    return this._capabilities;
  }
};

export { SieveLexer };
