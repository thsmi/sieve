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

import { SieveParser } from "./SieveParser.mjs";
import { SieveCapabilities } from "./logic/GenericCapabilities.mjs";

const QUOTE_LENGTH = 50;
const NOT_FOUND = -1;

/**
 * Creates a new document for sieve scripts it is used to parse
 * store and manipulate sieve scripts
 */
class SieveDocument {

  /**
   * Creates a new instance.
   *
   * @param {Map} grammar
   *   the grammar which contains the element and type specifications for this documents
   * @param {SieveDesigner} [widgets]
   *   the layout engine which should be used to render the document.
   *   Can be omitted in case the document should not be rendered.
   */
  constructor(grammar, widgets) {
    this._widgets = widgets;
    this._nodes = new Map();

    this.grammar = grammar;

    this._capabilities = new SieveCapabilities();
  }

  /**
   * Returns the specification by his unique name.
   *
   * @param {string} id
   *   the unique node name
   * @returns {object}
   *   the object specification or undefined.
   */
  getSpecByName(id) {
    if (id.startsWith("@"))
      throw new Error(`Invalid node name ${id}.`);

    return this.grammar.get(id);
  }

  /**
   * Returns all specification for the  given type.
   *
   * @param {string} id
   *   the unique node name
   * @returns {object[]}
   *   all the specifications or undefined.
   */
  getSpecsByType(id) {

    if (!id.startsWith("@"))
      throw new Error(`Invalid type name ${id}.`);

    if (!this.grammar.has(id))
      return new Set();

    return this.grammar.get(id);
  }

  /**
   * CHecks if one of the given type can parse the data and returns his
   * specification.
   *
   * It stops as soon as an element indicates it can parse the data.
   *
   * @param {string|string[]} typeNames
   *  the constructor types  which should be queried to find a matching constructor
   * @param {SieveParser} parser
   *  the token which is to probe if the constructor is compatible
   * @returns {object}
   *  the specification which can parse the date or undefined.
   *
   * @throws
   *  throws an exception in case querying a constructor failed or invalid type information is passed.
   */
  getSpecByTypes(typeNames, parser) {
    if (typeof (typeNames) === "string")
      typeNames = [typeNames];

    if (!Array.isArray(typeNames))
      throw new Error("Invalid Type list, not an array");

    // enumerate all selectors...
    for (const typeName of typeNames) {

      const specs = this.getSpecsByType(typeName);

      for (const spec of specs) {

        if (!(spec.onCapable(this.capabilities())))
          continue;

        const result = spec.onProbe(parser, this);
        if (typeof (result) !== "boolean")
          throw new Error("onProbe did not return a boolean");

        if (!result)
          continue;

        return spec;
      }
    }

    return null;
  }


  /**
   * Returns the root node for this document
   *
   *  @returns {SieveElement} the documents root node.
   */
  root() {

    // We initialize the rood node lazily and we cannot use this.createBySpec().
    // It would add a node without a parent to this._nodes.
    //
    // All nodes without a valid parent and their descendants are removed when
    // this.compact() is called. So that we would end up with an empty tree.
    if (!this._rootNode)
      this._rootNode = this.getSpecByName("block/rootnode").onNew(this);

    return this._rootNode;
  }

  /**
   * Walks the dom tree an returns all matching elements
   *
   * @param {SieveAbstractElement[]} elms
   *   the elements which should be walked
   * @param {string} name
   *   the name which should be searched.
   * @param {SieveAbstractElement[]} result
   *   an array to which all found elements will be added.
   */
  _walk(elms, name, result) {

    elms.forEach((item) => {

      if (item.nodeName() === name) {
        result.push(item);
        return;
      }

      if (!item.elms) {
        return;
      }

      this._walk(item.elms, name, result);
    });
  }

  /**
   * Walks the document tree from the root node looking for the given name.
   *
   * @param {string} name
   *   the name which should be queried.
   * @returns {SieveAbstractElement[]}
   *   the element found.
   */
  queryElements(name) {

    const result = [];

    const items = [
      this.root().getElement("imports"),
      this.root().getElement("body")
    ];

    this._walk(items, name, result);
    return result;
  }

  /**
   * Renders this the document as html
   *
   * @returns {HTMLElement}
   *   the html element
   */
  html() {
    return this.root().widget().html();
  }

  /**
   *
   * @param {*} elm
   */
  layout(elm) {
    return this._widgets.widget(elm);
  }

  /**
   * Creates a new object from the given specification.
   *
   * It will be automatically assigned a numeric id and added to this
   * document's scope.
   *
   * @param {object} spec
   *  the specification to be used to create the new object.
   * @param {SieveParser} [parser]
   *  an optional initializer for the newly created object.
   * @param {SieveElement} [parent]
   *  an optional parent element who owns this element.
   *
   * @returns {SieveElement}
   *  the newly created sieve element.
   *
   * @throws in case the document could not be created.
   * This could be caused by an invalid initializer or unsupported capabilities.
   */
  createBySpec(spec, parser, parent) {

    if (!spec.onCapable(this.capabilities()))
      throw new Error("Capability not supported");

    const item = spec.onNew(this, parser, parent);

    this._nodes.set(item.id(), item);

    return item;
  }

  /**
   * Creates an element by the unique name and returns a reference.
   *
   * @param {string} name
   *   the element name.
   * @param {SieveParser|string} [parser]
   *   parser object or a string which should be parsed.
   * @param {SieveAbstractElement} [parent]
   *   a the element's optional parent.
   * @returns {SieveAbstractElement}
   *   the newly generated element.
   */
  createByName(name, parser, parent) {

    if (typeof (parser) === "string")
      parser = new SieveParser(parser);

    const spec = this.getSpecByName(name);
    if (!spec)
      throw new Error(`No specification for >>${name}<< found`);

    return this.createBySpec(spec, parser, parent);
  }


  /**
   * Creates a new element by the class name.
   *
   * It probes all registered constructors for this type,
   * checks if the data is parsable. If so the new element will be returned.
   *
   * @param {string|string[]} types
   *   an list with types to be checked.
   * @param {SieveParser|string} parser
   *   a parser object or a string which holds the data that should be evaluated.
   * @param {SieveAbstractElement} [parent]
   *   the optional parent element which owns the new element.
   * @returns {SieveAbstractElement}
   *   the new element.
   */
  createByClass(types, parser, parent) {
    if (typeof (parser) === "string")
      parser = new SieveParser(parser);

    const spec = this.getSpecByTypes(types, parser);

    if (!spec)
      throw new Error("Unknown or incompatible type >>" + types + "<< at >>" + parser.bytes(QUOTE_LENGTH) + "<<");

    return this.createBySpec(spec, parser, parent);
  }

  /**
   * Checks if the data can be parsed by the given element.
   *
   * @param {string} name
   *   the element's unique name.
   * @param {string|SieveParser} parser
   *   a parser object or a string which holds the data that should be evaluated.
   *
   * @returns {boolean}
   *   true in case data can be parsed by the element otherwise false.
   */
  probeByName(name, parser) {
    if (typeof (parser) === "string")
      parser = new SieveParser(parser);

    // Skip in case there's no data.
    if ((typeof (parser) === "undefined") || parser.empty())
      return false;

    const item = this.getSpecByName(name);

    if (!item)
      throw new Error(`No specification for >>${name}<< found`);

    if (!item.onCapable(this.capabilities()))
      return false;

    if (!item.onProbe(parser, this))
      return false;

    return true;
  }

  /**
   * Uses the given data an check if it can be parsed by any of the given types.
   *
   * @param {string|string[]} types
   *   a type or an array with acceptable types.
   * @param {string|SieveParser} parser
   *   a parser object or a string which holds the data that should be evaluated.
   * @returns {boolean}
   *   true in case the data can be parsed, otherwise false.
   */
  probeByClass(types, parser) {
    if (typeof (parser) === "string")
      parser = new SieveParser(parser);

    // If there's no data then skip
    if ((typeof (parser) === "undefined") || parser.empty())
      return false;

    // Check for an valid element constructor...
    if (this.getSpecByTypes(types, parser))
      return true;

    return false;
  }

  /**
   * Checks if the given name is supported by the lexer.
   *
   * @param {string} name
   *   the nodeName to be checked.
   * @returns {boolean}
   *   true in cse the given nodeName is supported.
   */
  supportsByName(name) {

    const item = this.getSpecByName(name);

    if (!item)
      return false;

    if (!item.onCapable(this.capabilities()))
      return false;

    return true;
  }

  /**
   * Checks if the given type is supported by the lexer.
   *
   * @param {string|string[]} types
   *   the type(s) to be checked.
   * @returns {boolean}
   *   true in case the given type is supported.
   */
  supportsByClass(types) {
    if (typeof (types) === "string")
      types = [types];

    if (!Array.isArray(types))
      throw new Error("Invalid Type list, not an array");

    // enumerate all selectors...
    for (const type of types) {
      for (const spec of this.getSpecsByType(type))
        if (spec.onCapable(this.capabilities()))
          return true;
    }

    return false;
  }

  /**
   * Returns the element with the given id.
   *
   * @param {string} id
   *   the unique id.
   * @returns {SieveAbstractElement}
   *   the requested element.
   */
  id(id) {
    return this._nodes.get(id);
  }

  /**
   * Gets the script content for this document.
   *
   * @returns {string}
   *   the document converted to a script
   */
  getScript() {
    this.capabilities().clear();

    this.root().getElement("body").require(this.capabilities());

    for (const item of this.capabilities().dependencies)
      this.require(item);

    // TODO Remove unused requires...
    return this.root().toScript();
  }

  /**
   * Add a require to the import block.
   * In the require is already present, it will be silently skipped.
   *
   * @param {string} capability
   *   the require capability which should be added.
   * @returns {SieveBlockImport}
   *   a self reference.
   */
  require(capability) {
    const imports = this.root().getElement("imports");

    // We should try to insert new requires directly after the last require
    // statement otherwise it looks strange. So we just keep track of the
    // last require we found.
    let last = NOT_FOUND;

    for (const [index, item] of imports.getChildren().entries()) {
      if (item.nodeName() !== "import/require")
        continue;

      if (item.getElement("capabilities").contains(capability))
        return this;

      last = index;
    }

    const elm = imports.createByName("import/require");
    elm.getElement("capabilities").values(capability);

    // FIXME we should use append here instead of duplicating code.
    // no other import was found means just push
    if (last === NOT_FOUND) {
      imports.getChildren().push(elm);
      return this;
    }

    imports.getChildren().splice(last, 0, elm);
    return this;
  }

  /**
   * Sets the new sieve content for this document.
   *
   * @param {string} data
   *   the script content to be parsed by this document.
   */
  setScript(data) {
    // the sieve syntax prohibits single \n and \r
    // they have to be converted to \r\n

    // convert all \r\n to \r ...
    data = data.replace(/\r\n/g, "\r");
    // ... now convert all \n to \r ...
    data = data.replace(/\n/g, "\r");
    // ... finally convert all \r to \r\n
    data = data.replace(/\r/g, "\r\n");

    const parser = new SieveParser(data);

    this.root().init(parser);

    if (!parser.empty())
      throw new Error(`Unknown Element at: ${parser.bytes()}`);

    this.checkImports();
  }

  /**
   * Checks if all of the import section's require statements are supported.
   */
  checkImports() {
    const imports = this.root().getElement("imports");

    for (const item of imports.getChildren()) {

      if (item.nodeName() !== "import/require")
        continue;

      for (const dependency of item.getElement("capabilities").values())
        if (!this.capabilities().hasCapability(dependency))
          throw new Error('Unknown capability string "' + dependency + '"');
    }
  }

  /**
   * Gets or sets the documents capabilities.
   *
   * @param {object} [capabilities]
   *   the optional new capabilities
   * @returns {object}
   *   the currently active capabilities
   */
  capabilities(capabilities) {
    if (typeof (capabilities) === "undefined")
      return this._capabilities;

    this._capabilities = new SieveCapabilities(capabilities);

    return this._capabilities;
  }

  /**
   * Removes empty elements from the tree. It starts at the given leave and
   * traverses down until either a non empty element or the root node is found.
   *
   * @param {SieveAbstractElement} element
   *   the element where to start the traversal.
   *
   * @returns {SieveAbstractElement}
   *   the first non empty element.
   */
  collapse(element) {

    if (!element)
      return null;

    let item = null;

    while (element.empty()) {
      item = element;
      element = item.parent();

      item.remove();
    }

    return element;
  }

  /**
   * In oder to speedup mutation elements are cached. But this cache is lazy.
   * So deleted objects will remain in memory until you call this cleanup
   * Method.
   *
   * It checks all cached elements for a valid parent pointer. If it's missing
   * the document was obviously deleted...
   *
   * @returns {int}
   *   the number of deleted elements
   */
  compact() {

    const items = [];
    let cnt = 0;

    // Delete all nodes without a parent element.
    for (const [key, value] of this._nodes) {
      if (value.parent() !== null)
        continue;

      this._nodes.delete(key);
      items.push(key);
      cnt++;
    }

    // Remove all nodes which reference a node without a parent.
    while (items.length) {
      const id = items.shift();

      for (const [key, value] of this._nodes)
        if (value.parent().id() === id)
          items.push(key);

      if (!this._nodes.has(id))
        continue;

      const node = this._nodes.get(id);
      node.parent(null);

      this._nodes.delete(id);
      cnt++;
    }

    return cnt;
  }
}

export { SieveDocument };
