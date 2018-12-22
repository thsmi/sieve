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

/* global window */


(function (exports) {
  "use strict";

  // TODO: Should be renamed to SieveAbstractWidget
  /**
   * @constructor
   * @param {SieveDocument} docshell
   *  the document which owns this element
   * @param {string} id
   *  the elements unique id.
   */
  function SieveAbstractElement(docshell, id) {
    if (!id)
      throw new Error("Invalid id");

    this._id = id;

    this._parent = null;
    this._docshell = docshell;
  }

  SieveAbstractElement.prototype.createByName = function (name, parser) {
    return this._docshell.createByName(name, parser, this);
  };

  // A shorthand to create children bound to this Element...
  SieveAbstractElement.prototype._createByName = function (name, parser) {
    return this._docshell.createByName(name, parser, this);
  };

  SieveAbstractElement.prototype._createByClass = function (types, parser) {
    return this._docshell.createByClass(types, parser, this);
  };

  SieveAbstractElement.prototype._probeByName = function (name, parser) {
    return this._docshell.probeByName(name, parser);
  };

  SieveAbstractElement.prototype._probeByClass = function (types, parser) {
    return this._docshell.probeByClass(types, parser);
  };

  /**
   * Returns the current element's unique nodename.
   * It is just a helper which calls the static methods
   *
   * @returns {string}
   *   the nodename
   */
  SieveAbstractElement.prototype.nodeName = function () {
    return Object.getPrototypeOf(this).constructor.nodeName();
  };

  SieveAbstractElement.prototype.nodeType = function () {
    return Object.getPrototypeOf(this).constructor.nodeType();
  };


  /**
   * Initializes this element with the given data
   * @param {SieveParser} data
   *  the data which is used to initialize the element
   * @returns {SieveAbstractElement}
   *  a self refrence
   */
  SieveAbstractElement.prototype.init
    = function (data) {
      throw new Error("Implement SieveAbstractElement::init" + data);
    };

  SieveAbstractElement.prototype.toScript
    = function () {
      throw new Error("Implement toScript() for " + this._id);
    };

  /**
   * Returns the new Widget bound to this element.
   * @returns {SieveAbstractWidget}
   *  the widget which is associated with this element.
   */
  SieveAbstractElement.prototype.widget
    = function () {
      if (!this._widget)
        this._widget = this.document().layout(this);

      return this._widget;
    };

  SieveAbstractElement.prototype.html
    = function (refresh) {
      if (typeof (refresh) !== "undefined")
        if (refresh)
          this.widget().reflow();

      if (this.widget() === null)
        return null;

      return this.widget().html();
    };

  /**
   * Retuns the Document which "owns" this element
   * @returns {SieveDocument} the sieve document
   */
  SieveAbstractElement.prototype.document
    = function () {
      return this._docshell;
    };

  /**
   * Returns the unique identifier for this element.
   *
   * In case the parameter "id" is passed, the default behaviour
   * is inverted. Instead of returning a unique identifier for
   * this element, a reverse lookup is started and the SieveElement
   * with a matching id is returned.
   *
   * @param {int} [id]
   *   defines to use a reverse lookup by the Id
   * @returns {int|SieveElement}
   *   the id in case the id was omitted otherwise the element.
   */
  SieveAbstractElement.prototype.id
    = function (id) {
      if (typeof (id) === "undefined")
        return this._id;

      return this._docshell.id(id);
    };

  SieveAbstractElement.prototype.parent
    = function (parent) {
      if (typeof (parent) === "undefined")
        return this._parent;

      this._parent = parent;

      return this;
    };

  SieveAbstractElement.prototype.require
    = function (imports) {
    };

  // TODO only temporary, should be merged into remove...
  /* SieveAbstractElement.prototype.removeChild
      = function ()
  {
    throw "Implement SieveAbstractElement.removeChild";
  }*/

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
  SieveAbstractElement.prototype.remove
    = function (cascade, stop) {
      // Locate our parent...
      if (!this._parent)
        throw new Error("No parent Node");

      if ((stop) && (this.id() === stop.id()))
        cascade = false;
      // ...and remove this node
      let elm = this._parent.removeChild(this._id, cascade, stop);

      if ((!cascade) && (elm.id() !== this._id))
        throw new Error("Could not remove Node");

      // ... finally cleanup all evidence to our parent Node;
      this._parent = null;

      return elm;
    };

  //* ***************************************************************************//

  function SieveAbstractBlock(docshell, id) {
    SieveAbstractElement.call(this, docshell, id);

    // Initialize Block Elements
    this.elms = [];
  }

  SieveAbstractBlock.prototype = Object.create(SieveAbstractElement.prototype);
  SieveAbstractBlock.prototype.constructor = SieveAbstractBlock;

  SieveAbstractBlock.prototype.children
    = function (idx) {
      if (typeof (idx) === "undefined")
        return this.elms;

      if ((typeof (idx) === "string") && (idx.toLowerCase() === ":last"))
        idx = this.elms.length - 1;

      return this.elms[idx];
    };

  /**
   * Appends an Element to this Element. Inf the element is alread existant, it will be moved
   *
   * @param {SieveElement} elm
   *   the element that should be appened
   * @param {SieveElement} [sibling]
   *   defines the sibling after which the new element should be inserted.
   *   In case no matching sibling is found, it will be appended at the end.
   * @returns {SieveAbstractBlock}
   *   a self reference
   */
  SieveAbstractBlock.prototype.append
    = function (elm, sibling) {
      // we have to do this fist as there is a good chance the the index
      // might change after deleting...
      if (elm.parent())
        elm.remove();

      let idx = this.elms.length;

      if (sibling && (sibling.id() >= 0))
        for (idx = 0; idx < this.elms.length; idx++)
          if (this.elms[idx].id() === sibling.id())
            break;

      this.elms.splice(idx, 0, elm);
      elm.parent(this);

      return this;
    };

  // TODO Merge with "remove" when its working as it should
  /**
   * Removes the node including all child elements.
   *
   * To remove just a child node pass it's id as an argument
   *
   * @param {int} [childId]
   *  the child id which should be removed.
   *
   * @returns {}
   */
  SieveAbstractBlock.prototype.removeChild
    = function (childId, cascade, stop) {
      // should we remove the whole node
      if (typeof (childId) === "undefined")
        throw new Error("Child ID Missing");
      // return SieveAbstractElement.prototype.remove.call(this);


      // ... or just a child item
      let elm = null;
      // Is it a direct match?
      for (let i = 0; i < this.elms.length; i++) {
        if (this.elms[i].id() !== childId)
          continue;

        elm = this.elms[i];
        elm.parent(null);
        this.elms.splice(i, 1);

        break;
      }

      if (cascade && this.empty())
        if ((!stop) || (stop.id() !== this.id()))
          return this.remove(cascade, stop);

      if (cascade)
        return this;

      return elm;
    };

  SieveAbstractBlock.prototype.empty
    = function () {
      // The direct descendants of our root node are always considered as
      // not empty. Otherwise cascaded remove would wipe them away.
      if (this.document().root() === this.parent())
        return false;

      for (let i = 0; i < this.elms.length; i++)
        if (this.elms[i].widget())
          return false;

      return true;
    };

  /**
   * @inheritdoc
   */
  SieveAbstractBlock.prototype.require
    = function (imports) {
      for (let i = 0; i < this.elms.length; i++)
        if (this.elms[i].require)
          this.elms[i].require(imports);
    };

  exports.SieveAbstractElement = SieveAbstractElement;
  exports.SieveAbstractBlock = SieveAbstractBlock;

})(window);
