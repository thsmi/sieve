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

const SEED_SIZE = 10000000;
const HEX_STRING = 16;

/**
 * The base element from on which each element in the sieve dom is based
 */
class SieveAbstractElement {

  /**
   * Creates a new instance
   *
   * @param {SieveDocument} docshell
   *  the document which owns this element
   * @param {string} name
   *   the element's name
   * @param {string} type
   *   the element's type
   */
  constructor(docshell, name, type) {

    if ((typeof(name) === "undefined") || (name === null))
      throw new Error("No node name supplied");

    if ((typeof(type) === "undefined") || (type === null))
      throw new Error("No node type supplied");

    // Generate a random element id.
    this._id = Math.floor(
      Math.random() * SEED_SIZE).toString(HEX_STRING)
      + Date.now().toString(HEX_STRING);

    this._parent = null;
    this._docshell = docshell;

    this._name = name;
    this._type = type;
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
    return this._name;
  }

  /**
   * Returns the current element's type.
   * @abstract
   *
   * @returns {string}
   *   the type
   */
  nodeType() {
    return this._type;
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
    throw new Error(`Implement SieveAbstractElement::toScript() for ${this.id()}`);
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
   * @param {boolean} invalidate
   * @returns
   */
  html(invalidate) {

    if (this.widget() === null)
      return null;

    if (invalidate === true)
      this.widget().reflow();

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
   * @returns {int|SieveElement}
   *   the id in case the id was omitted otherwise the element.
   */
  id() {
    return this._id;
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
   * @returns {SieveAbstractElement}
   *   returns the node which is removed
   */
  remove() {
    // Locate our parent...
    if (!this._parent)
      throw new Error("No parent Node");

    // The worst case we have a parent but our parent does not know us...
    if (this._parent && !this._parent.hasChild(this.id())) {
      // ... then we simply remove the parent because deleting an non
      // existent child will create an error.
      this.parent(null);
      return this;
    }

    // ...and remove this node
    const elm = this._parent.removeChild(this.id());

    // ... finally cleanup all evidence to our parent Node;
    this.parent(null);
    return elm;
  }

  /**
   * Checks if the block has a child with the given identifier
   *
   * @param {string} identifier
   *   the child's unique id
   * @returns {boolean}
   *   true in case the child is known otherwise false.
   */
  // eslint-disable-next-line no-unused-vars
  hasChild(identifier) {
    // the element is not capable of handling children thus we return false.
    return false;
  }
}

/**
 * An abstract implementation for an sieve element which hosts child elements.
 */
class SieveAbstractParentElement extends SieveAbstractElement {

  /**
   * @inheritdoc
   */
  constructor(docshell, name, type) {
    super(docshell, name, type);
    this.elms = [];
  }

  /**
   * Returns the element's children
   * @returns {SieveAbstractElement[]}
   *   the children as array.
   */
  getChildren() {
    return this.elms;
  }

  /**
   * Returns the element with the given index.
   * Positives indices start from the beginning while negative indices start from th end.
   *
   * @param {int} idx
   *   the index as integer
   *
   * @returns {SieveAbstractElement}
   *   the element with the given index.
   */
  getChild(idx) {
    return this.getChildren().at(idx);
  }

  /**
   * @inheritdoc
   */
  hasChild(identifier) {
    for (const elm of this.getChildren())
      if (elm.id() === identifier)
        return true;

    return false;
  }

  /**
   * Appends an Element to this Element.
   * If the element is already existent,it will be moved.
   *
   * @param {SieveElement} elm
   *   the element that should be appended
   * @param {SieveElement} [sibling]
   *   defines the sibling after which the new element should be inserted.
   *   In case no matching sibling is found, it will be appended at the end.
   * @returns {SieveAbstractBlock}
   *   a self reference
   */
  append(elm, sibling) {
    // we have to do this fist as there is a good chance the the index
    // might change after deleting...
    if (elm.parent())
      elm.remove();

    let idx = this.getChildren().length;

    if (sibling && sibling.id())
      for (idx = 0; idx < this.getChildren().length; idx++)
        if (this.getChild(idx).id() === sibling.id())
          break;

    this.getChildren().splice(idx, 0, elm);
    elm.parent(this);

    return this;
  }

  /**
   * Removes the node including all child elements.
   *
   * To remove just a child node pass it's id as an argument
   *
   * @param {int} childId
   *  the child id which should be removed.
   *
   * @returns {SieveAbstractElement}
   *   the removed element
   */
  removeChild(childId) {

    if (!childId)
      throw new Error("Child ID Missing");

    // Let's search and remove the child...
    for (let i = 0; i < this.getChildren().length; i++) {

      const elm = this.getChild(i);
      if (elm.id() !== childId)
        continue;

      elm.parent(null);
      this.getChildren().splice(i, 1);

      return elm;
    }

    // ... we fail in case we have not found the child
    throw new Error(`Unknown child ${childId}`);
  }

  /**
   * Checks if the block is empty
   *
   * @returns {boolean}
   *   true in case the block is empty otherwise false.
   */
  empty() {

    // The direct descendants of our root node are always considered as
    // not empty they would get accidentally whipped out on a cleanup.

    if (this.document().root().id() === this.parent().id())
      return false;

    for (const elm of this.getChildren())
      if (elm.widget())
        return false;

    return true;
  }

  /**
   * @inheritdoc
   */
  require(imports) {

    for (const elm of this.getChildren()) {
      if (!elm.require)
        continue;

      elm.require(imports);
    }
  }

  /**
   * @inheritdoc
   */
  toScript() {
    let str = "";

    for (const child of this.getChildren())
      str += child.toScript();

    return str;
  }
}

export {
  SieveAbstractElement,
  SieveAbstractParentElement
};
