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

/* global SieveCapabilities */

(function (exports) {

  "use strict";

  const QUOTE_LENGTH = 50;

  // Sieve Lexer is a static class...

  const SieveLexer =
    {
      types: {},
      names: {},
      maxId: 0,
      _capabilities: new SieveCapabilities(),

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
       *
       *
       */
      registerGeneric: function (name, type, obj) {
        if (!type)
          throw new Error("Lexer Error: Registration failed, element has no type");

        if (!name)
          throw new Error("Lexer Error: Registration failed, element has no name");

        if (typeof (this.types[type]) === 'undefined')
          this.types[type] = {};

        if (!obj.onProbe)
          throw new Error("Lexer Error: Registration failed, element has onProbe method");

        if (!obj.onNew)
          throw new Error("Lexer Error: Registration failed, element has onNew method");

        if (!obj.onCapable)
          throw new Error("Lexer Error: Registration failed, element has onCapable method");

        this.names[name] = obj;
        this.types[type][name] = obj;

        // TODO There should be only one probe and one create method.
        // We should use a prefix to distinguish between types and unique names.
        // this.items[name] = obj;
        // this.items["@" + type][name] = obj;
      },

      register: function (callback) {
        if (!callback.nodeType)
          throw new Error("Lexer Error: Registration failed, element has no type");

        const type = callback.nodeType();

        if (!callback.nodeName)
          throw new Error("Lexer Error: Registration failed, element has no name");

        const name = callback.nodeName();

        if (!callback.isElement)
          throw new Error("Lexer Error: isElement function for " + name + " missing");

        if (typeof (this.types[type]) === 'undefined')
          this.types[type] = {};

        const obj = {};
        obj.name = name;
        obj.onProbe = function (token, doc) { return callback.isElement(token, doc); };
        obj.onNew = function (docshell, id) { return new callback(docshell, id); };
        obj.onCapable = function (capabilities) {

          // FIXME: does not work with ES5 static... needs a callback.constructor.isCapable
          if (!callback.isCapable)
            return true;

          return callback.isCapable(capabilities);
        };

        this.names[name] = obj;
        this.types[type][name] = obj;
      },

      /**
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


        if (!Array.isArray(types)) {
          throw new Error("Invalid Type list, not an array");
        }
        // enumerate all selectors...
        for (let type in types) {
          type = types[type];

          for (const key in this.types[type])
            if (this.types[type][key].onCapable(this._capabilities))
              if (this.types[type][key].onProbe(token, this))
                return this.types[type][key];
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
        if (!this.names[name])
          throw new Error("No Constructor for >>" + name + "<< found");

        return this.createInstance(docshell, this.names[name], parser);
      },

      getMaxId: function () {
        return this.maxId();
      },

      probeByName: function (name, parser) {
        // If there's no data then skip
        if ((typeof (parser) === "undefined") || parser.empty())
          return false;

        if (typeof (this.names[name]) === "undefined")
          throw new Error("Unknown name " + name);

        if (!this.names[name].onCapable(this._capabilities))
          return false;

        if (!this.names[name].onProbe(parser, this))
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
        if (typeof (this.names[name]) === "undefined")
          return false;

        if (!this.names[name].onCapable(this._capabilities))
          return false;

        return true;
      },

      supportsByClass: function (selectors) {
        if (typeof (selectors) === "string")
          selectors = [selectors];


        if (!Array.isArray(selectors))
          throw new Error("Invalid Type list, not an array");

        // enumerate all selectors...
        for (let selector in selectors) {
          selector = selectors[selector];

          for (const key in this.types[selector])
            if (this.types[selector][key].onCapable(this._capabilities))
              return true;
        }

        return false;
      },

      capabilities: function (capabilities) {
        if (typeof (capabilities) === "undefined")
          return this._capabilities;

        this._capabilities = new SieveCapabilities(capabilities);

        return this;
      }
    };

  exports.SieveLexer = SieveLexer;

})(window);
