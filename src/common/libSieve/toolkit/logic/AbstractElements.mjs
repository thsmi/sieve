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

/**
 * The base element from on which each element in the sieve dom is based
 */
class SieveAbstractElement {

  /**
   * Creates a new instance
   *
   * @param {SieveDocument} docshell
   *  the document which owns this element
   * @param {string} id
   *  the elements unique id.
   */
  constructor(docshell, id) {
    if (!id)
      throw new Error("Invalid id");

    this._id = id;

    this._parent = null;
    this._docshell = docshell;
  }

  /**
   * Creates a new element base on his name.
   * A shorthand to document().createByName()
   *
   * @param {string} name
   *   the element's unique nodeName which should be created.
   * @param {string|SieveParser} parser
   *   a sieve script parser or a string.
   *
   * @returns {SieveAbstractElement}
   *   the newly generated element.
   */
  createByName(name, parser) {
    return this.document().createByName(name, parser, this);
  }

  /**
   * Creates a new element based on this type.
   * A shorthand for document().createByClass()
   *
   * @param {string|string[]} types
   *   the the types which are acceptable.
   * @param {string|SieveParser} parser
   *   the data which should be tested.
   *
   * @returns {SieveAbstractElement}
   *   the newly generated element.
   */
  createByClass(types, parser) {
    return this.document().createByClass(types, parser, this);
  }

  /**
   * Tests if the data can be parsed by the given element.
   *
   * @param {string} name
   *   the element's unique node name which should be tested.
   * @param {string|SieveParser} parser
   *   a sieve script parser or a string which should be tested.
   *
   * @returns {boolean}
   *   true in case the data can be parsed.
   */
  probeByName(name, parser) {
    return this.document().probeByName(name, parser);
  }

  /**
   * Tests if the data can be parsed yb the given type.
   *
   * @param {string|string[]} types
   *   the types which should be tests.
   * @param {string|SieveParser} parser
   *   the data which should be tested.
   *
   * @returns {boolean}
   *   true in case the data can be parsed.
   */
  probeByClass(types, parser) {
    return this.document().probeByClass(types, parser);
  }

  /**
   * Returns the current element's unique node name.
   * @abstract
   *
   * @returns {string}
   *   the node name
   */
  nodeName() {
    throw new Error("Implement SieveAbstractElement::nodeName()");
  }

  /**
   * Returns the current element's type.
   * @abstract
   *
   * @returns {string}
   *   the type
   */
  nodeType() {
    throw new Error("Implement SieveAbstractElement::nodeType()");
  }

  /**
   * Initializes this element with the given data
   * @abstract
   *
   * @param {SieveParser} data
   *  the data which is used to initialize the element
   * @returns {SieveAbstractElement}
   *  a self reference
   */
  init(data) {
    throw new Error(`Implement SieveAbstractElement::init(${data})`);
  }

  /**
   * Converts the element into a sieve script
   * @abstract
   *
   * @returns {string}
   *   the elements representation in sieve
   */
  toScript() {
    throw new Error(`Implement SieveAbstractElement::toScript() for ${this._id}`);
  }

  /**
   * Returns the new Widget bound to this element.
   * @returns {SieveAbstractWidget}
   *  the widget which is associated with this element.
   */
  widget() {
    if (!this._widget)
      this._widget = this.document().layout(this);

    return this._widget;
  }

  /**
   *
   * @param {boolean} refresh
   * @returns
   */
  html(refresh) {
    if (typeof (refresh) !== "undefined")
      if (refresh)
        this.widget().reflow();

    if (this.widget() === null)
      return null;

    return this.widget().html();
  }

  /**
   * Returns the Document which "owns" this element
   *
   * @returns {SieveDocument}
   *   the sieve document
   */
  document() {
    return this._docshell;
  }

  /**
   * Returns the unique identifier for this element.
   *
   * In case the parameter "id" is passed, the default behavior
   * is inverted. Instead of returning a unique identifier for
   * this element, a reverse lookup is started and the SieveElement
   * with a matching id is returned.
   *
   * @param {int} [id]
   *   defines to use a reverse lookup by the Id
   * @returns {int|SieveElement}
   *   the id in case the id was omitted otherwise the element.
   */
  id(id) {
    if (typeof (id) === "undefined")
      return this._id;

    return this._docshell.id(id);
  }

  /**
   * Gets or sets the element's parent.
   *
   * @param {SieveAbstractElement} [parent]
   *   the optional new parent.
   * @returns {SieveAbstractElement}
   *   the parent element.
   */
  parent(parent) {
    if (typeof (parent) === "undefined")
      return this._parent;

    this._parent = parent;

    return this;
  }

  /**
   *
   * @param {*} imports
   */
  // eslint-disable-next-line no-unused-vars
  require(imports) {
  }

  /**
   * Removes this node from the parent Node.
   * The Node is not removed from the document.
   *
   * If cascade is set to true, empty parents will be removed unless either the
   * root node or the specified stop marker is removed.
   *
   * @param {boolean} [cascade]
   *   set to true if you want to delete empty parents
   * @param {SieveAbstractElement} [stop]
   *   element which stops the cascade
   * @returns {SieveAbstractElement}
   *   returns the node which is removed
   */
  remove(cascade, stop) {
    // Locate our parent...
    if (!this._parent)
      throw new Error("No parent Node");

    if ((stop) && (this.id() === stop.id()))
      cascade = false;

    // The worst case we have a parent but our parent does not know us...
    if (this._parent && !this._parent.hasChild(this.id())) {
      // ... then we simply remove the parent because deleting an non
      // existent child will create an error.
      this.parent(null);
      return this;
    }

    // ...and remove this node
    const elm = this._parent.removeChild(this._id, cascade, stop);

    if ((!cascade) && (elm.id() !== this._id))
      throw new Error("Could not remove Node");

    // ... finally cleanup all evidence to our parent Node;
    this.parent(null);
    return elm;
  }
}

export {
  SieveAbstractElement
};
