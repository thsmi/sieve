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

import { SieveParser } from "./SieveParser.js";

const NO_ELEMENT = -1;

/**
 * Creates a new document for sieve scripts it is used to parse
 * store and manipulate sieve scripts
 */
class SieveDocument {

  /**
   * Creates a new instance.
   *
   * @param {SieveLexer} lexer
   *   the lexer which should be associated with this document.
   *   It will be used to create new objects.
   * @param {SieveDesigner} [widgets]
   *   the layout engine which should be used to render the document.
   *   Can be omitted in case the document should not be rendered.
   */
  constructor(lexer, widgets) {
    this._lexer = lexer;
    this._widgets = widgets;
    this._nodes = {};

    // we cannot use this.createNode(). It would add a node without a parent...
    // ... to this._nodes. All nodes without a valid parent and their...
    // ... descendants are removed when this.compact() is called. So that we...
    // ... would end up with an empty tree.
    this._rootNode = this._lexer.createByName(this, "block/rootnode");
  }

  /**
   * Returns the root node for this document
   * @returns {SieveElement} the documents root node.
   */
  root() {
    return this._rootNode;
  }

  /**
   *
   * @param {*} elms
   * @param {*} name
   * @param {*} result
   */
  _walk(elms, name, result) {

    elms.forEach(function (item) {

      if (item.nodeName() === name) {
        result.push(item);
        return;
      }

      if (!item.elms) {
        return;
      }

      this._walk(item.elms, name, result);
    }, this);
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

    this._walk(this.root().elms, name, result);

    return result;
  }

  /**
   * Renders this the document as html
   *
   * @returns {HTMLElement}
   *   the html element
   */
  html() {
    return this._rootNode.widget().html();
  }

  /**
   *
   * @param {*} elm
   */
  layout(elm) {
    return this._widgets.widget(elm);
  }

  /**
   * A shorthand to create children bound to this Element...
   *
   * @param {string} name
   *   the element name.
   * @param {SieveParser|string} parser
   *   a parser object or a string which holds the data that should be evaluated.
   * @param {SieveAbstractElement} [parent]
   *   a the elements optional parent.
   * @returns {SieveAbstractElement}
   *   the newly generated element.
   */
  createByName(name, parser, parent) {
    if (typeof (parser) === "string")
      parser = new SieveParser(parser);

    const item = this._lexer.createByName(this, name, parser);

    if (typeof (parent) !== "undefined")
      item.parent(parent);

    // cache nodes...
    this._nodes[item.id()] = item;

    return item;
  }

  /**
   *
   * @param {string|string[]} types
   *   an list with types.
   * @param {SieveParser|string} parser
   *   a parser object or a string which holds the data that should be evaluated.
   * @param {*} parent
   */
  createByClass(types, parser, parent) {
    if (typeof (parser) === "string")
      parser = new SieveParser(parser);

    const item = this._lexer.createByClass(this, types, parser);

    if (typeof (parent) !== "undefined")
      item.parent(parent);

    // cache nodes...
    this._nodes[item.id()] = item;

    return item;
  }

  /**
   *
   * @param {string} name
   * @param {string|SieveParser} parser
   *   a parser object or a string which holds the data that should be evaluated.
   */
  probeByName(name, parser) {
    if (typeof (parser) === "string")
      parser = new SieveParser(parser);

    return this._lexer.probeByName(name, parser);
  }

  /**
   * Uses the Document's lexer to check if a parser object
   * or a string starts with the expected types
   *
   * @param {string|string[]} types
   *   an array with acceptable types.
   * @param {string|SieveParser} parser
   *   a parser object or a string which holds the data that should be evaluated.
   * @returns {boolean}
   *   true in case the parser or string is of the given type otherwise false.
   */
  probeByClass(types, parser) {
    if (typeof (parser) === "string")
      parser = new SieveParser(parser);

    return this._lexer.probeByClass(types, parser);
  }

  /**
   *
   * @param {string} name
   */
  supportsByName(name) {
    return this._lexer.supportsByName(name);
  }

  /**
   *
   * @param {*} type
   */
  supportsByClass(type) {
    return this._lexer.supportsByClass(type);
  }

  /**
   *
   * @param {string} id
   *   the unique id
   */
  id(id) {
    return this._nodes[id];
  }

  /**
   * Gets and sets the script content for this document.
   *
   * @param {string} [data]
   *   the script content to be parsed by this document.
   * @returns {string}
   *   the document converted to a script
   */
  script(data) {
    if (typeof (data) === "undefined")
      return this._rootNode.toScript();

    // the sieve syntax prohibits single \n and \r
    // they have to be converted to \r\n

    // convert all \r\n to \r ...
    data = data.replace(/\r\n/g, "\r");
    // ... now convert all \n to \r ...
    data = data.replace(/\n/g, "\r");
    // ... finally convert all \r to \r\n
    data = data.replace(/\r/g, "\r\n");

    let r = 0;
    let n = 0;
    for (let i = 0; i < data.length; i++) {
      if (data.charCodeAt(i) === "\r".charCodeAt(0))
        r++;
      if (data.charCodeAt(i) === "\n".charCodeAt(0))
        n++;
    }
    if (n !== r)
      throw new Error("Something went terribly wrong. The linebreaks are mixed up...\n");

    const parser = new SieveParser(data);

    this._rootNode.init(parser);

    if (!parser.empty())
      throw new Error("Unknown Element at: " + parser.bytes());

    // data should be empty right here...
    return parser.bytes();
  }

  /**
   *
   * @param {*} capabilities
   */
  capabilities(capabilities) {
    if (typeof (capabilities) === "undefined")
      return this._lexer.capabilities();

    return this._lexer.capabilities(capabilities);
  }

  /**
   * In oder to speedup mutation elements are cached. But this cache is lazy.
   * So deleted objects will remain in memory until you call this cleanup
   * Method.
   *
   * It checks all cached elements for a valid parent pointer. If it's missing
   * the document was obviously deleted...
   *
   * @param {string[]} whitelist
   *   an optional whitelist list, with elements which should not be released
   * @returns {int}
   *   the number of deleted elements
   */
  compact(whitelist) {

    const items = [];
    let cnt = 0;
    let item;

    whitelist = [].concat(whitelist);

    // scan for null nodes..
    for (item in this._nodes)
      if (whitelist.indexOf(this._nodes[item]) === NO_ELEMENT)
        if (this._nodes[item].parent() === null)
          items.push(item);

    // ...cleanup these nodes...
    for (let i = 0; i < items.length; i++)
      delete (this._nodes[items[i]]);

    // ... and remove all dependent nodes
    while (items.length) {
      const it = items.shift();

      for (item in this._nodes)
        if (whitelist.indexOf(this._nodes[item]) === NO_ELEMENT)
          if (this._nodes[item].parent().id() === it)
            items.push(item);

      delete (this._nodes[it]);
      cnt++;
    }

    return cnt;
  }
}

export { SieveDocument };
