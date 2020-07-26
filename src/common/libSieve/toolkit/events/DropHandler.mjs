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

import { SieveDataTransfer } from "./DataTransfer.mjs";

/**
 * Consumes drop events.
 */
class SieveDropHandler {

  /**
   * Creates a new instance.
   *
   * @param {string|string[]} flavours
   *   the drop flavours which are supported by this drop handler.
   */
  constructor(flavours) {

    this._flavours = [];

    if (typeof (flavours) !== "undefined" && flavours !== null)
      this._flavours = [].concat(flavours);

    this._owner = null;
  }

  /**
   * Gets the flavour for this drop type
   *
   * @returns {string[]}
   *   a string array containing all supported drop flavours.
   */
  flavours() {
    return this._flavours;
  }

  /**
   * A short hand to the sieve document. It queries the owner element.
   * In case no owner is set an exception will be thrown.
   *
   * @returns {SieveDocument}
   *   a reference to the sieve document to which the owner's element belongs.
   */
  document() {
    if (!this._owner)
      throw new Error("Owner for this Drop Handler");

    return this._owner.document();
  }

  /**
   *
   * @param {SieveAbstractElement} owner
   * @param {SieveAbstractElement} sibling
   */
  bind(owner, sibling) {
    this._owner = owner;
    this._sibling = sibling;
  }

  /**
   * The sieve element to which the drag handler is bound to.
   *
   * @returns {SieveAbstractWidget}
   *   The owner on which the drag event occurred
   */
  owner() {
    return this._owner;
  }

  /**
   * The target/sibling, the element which consumes the drop.
   *
   * @returns {SieveAbstractElement}
   *   the sibling element
   */
  sibling() {
    return this._sibling;
  }

  /**
   * The parent of this element.
   * @returns {SieveAbstractElement}
   *   the parent element
   */
  parent() {
    return this._owner.parent();
  }

  /**
   * Binds drag and drop event handlers to the html element
   *
   * @param {HTMLElement} html
   *   the html element
   */
  attach(html) {
    html.addEventListener("drop", (e) => { return this.onDragDrop(e); });
    html.addEventListener("dragover", (e) => { return this.onDragOver(e); });
    html.addEventListener("dragleave", (e) => { return this.onDragExit(e); });
    html.addEventListener("dragenter", (e) => { return this.onDragEnter(e); });
  }

  /* Official HTML5 Drag&Drop events... */

  /**
   * Called when a drag operations enters the drop handler.
   * It will trigger a style change to indicate that the element can safely dropped.
   *
   * @param {Event} event
   *   the dom event which was fired.
   * @returns {boolean}
   *   true if the drag handler supports the drag operation otherwise false.
   */
  onDragEnter(event) {

    if (!this.canDrop(event))
      return true;

    this.owner().html().dataset.sieveDragging = true;

    return false;
  }


  /**
   * Called when the drag operation exits the drop handler.
   * It is used to remove the style change from the onDragEnter event.
   *
   * @param {Event} event
   *   the dom event which was fired.
   *
   * @returns {boolean}
   *   always true.
   */
  // eslint-disable-next-line no-unused-vars
  onDragExit(event) {

    delete (this.owner().html().dataset.sieveDragging);

    // Exit is only used for UI cleanup, so we should never cancel this event.
    // Our parent might want to do cleanup too.
    return true;
  }

  /**
   * Called when an element is dragged over the drop handler.
   * @param {Event} event
   *   the dom event which was fired.
   *
   * @returns {boolean}
   *   true in case the drag over event can be handled otherwise false
   */
  onDragOver(event) {

    if (!this.canDrop(event))
      return true;

    this.owner().html().dataset.sieveDragging = true;

    return false;
  }

  /**
   * Called when a element was dropped onto this drop handler.
   *
   * @param {Event} event
   *   the dom event which was fired.
   *
   * @returns {boolean}
   *   true in case the element can be dropped, otherwise false.
   */
  onDragDrop(event) {

    delete (this.owner().html().dataset.sieveDragging);

    if (!this.drop(event))
      return true;

    return false;
  }

  /**
   * Called when an element is dropped onto the handler.
   * It either creates or moves the element depending on the data transfers
   * meta data.
   *
   * @param {string} flavour
   *   the data transfers preferred flavour.
   * @param {Event} event
   *   the dom event which was fired.
   *
   * @returns {boolean}
   *   true in case the element can be dropped other wise false.
   */
  onDrop(flavour, event) {
    const dt = new SieveDataTransfer(event.dataTransfer);

    const meta = JSON.parse(dt.getData(flavour));

    switch (meta.action) {
      case "create":
        if (!this.createElement)
          return false;

        this.createElement(flavour, meta.type);

        event.preventDefault();
        event.stopPropagation();

        dt.clear();
        return true;

      case "move":
        if (!this.moveElement)
          return false;

        this.moveElement(flavour, meta.id);

        event.preventDefault();
        event.stopPropagation();

        dt.clear();
        return true;
    }

    throw new Error("Invalid action..." + meta.action);
  }

  /**
   * Called when an element was dropped onto the drop handler
   *
   * @param {Event} event
   *   the dom event which was fired.
   *
   * @returns {boolean}
   *   true in case the drop was successful otherwise false.
   */
  drop(event) {
    for (const flavour of this.flavours()) {
      if (!this.onCanDrop(flavour, event))
        continue;

      return this.onDrop(flavour, event);
    }

    return true;
  }

  /**
   * Checks if the element can be dropped onto this drop handler.
   *
   * @param {string} flavour
   *   the flavour which should be checked.
   * @param {Event} event
   *   the dom event which was fired.
   *
   * @returns {boolean}
   *   true in case the flavour is supported by this drop handler otherwise false.
   */
  onCanDrop(flavour, event) {
    const dt = new SieveDataTransfer(event.dataTransfer);

    let meta = dt.getData(flavour);

    if (!meta || !meta.length)
      return false;

    meta = JSON.parse(meta);

    // accept only the registered drop flavour...
    if (!meta)
      return false;

    switch (meta.action) {
      case "create":
        return this.canCreateElement(flavour, meta.type);

      case "move":
        return this.canMoveElement(flavour, meta.id);
    }

    return false;
  }

  /**
   * Checks if the drop handler can create elements of the given flavour and type.
   *
   * @param {string} sivFlavour
   *   the drag and drop operations flavour.
   * @param {string} type
   *   the sieve element type to be created
   * @returns {boolean}
   *   true in cae the element can be created otherwise false.
   */
  // eslint-disable-next-line no-unused-vars
  canCreateElement(sivFlavour, type) {
    return false;
  }

  /**
   * Checks if the drop handler can move the given element.
   * @param {string} sivFlavour
   *   the drag and drop operations flavour.
   * @param {string} id
   *   the unique id of the sieve element to be moved
   * @returns {boolean}
   *   true in case the element can be moved otherwise false.
   */
  // eslint-disable-next-line no-unused-vars
  canMoveElement(sivFlavour, id) {
    return false;
  }

  /**
   * Checks if the drop event is compatible and can be handled.
   *
   * @param {Event} event
   *   the dom event which was fired.
   * @returns {boolean}
   *   true in case the element can be dropped otherwise false.
   */
  canDrop(event) {
    for (const flavour of this.flavours()) {
      if (!this.onCanDrop(flavour, event))
        continue;

      event.preventDefault();
      event.stopPropagation();
      return true;
    }

    return false;
  }
}

// ****************************************************************************//

/**
 * Accepts any elements which can be added to a block statement.
 */
class SieveBlockDropHandler extends SieveDropHandler {

  /**
   * @inheritdoc
   */
  constructor() {
    super(
      ["sieve/action", "sieve/test", "sieve/operator"]);
  }


  /**
   * @inheritdoc
   */
  canMoveElement(sivFlavour, id) {
    const source = this.document().id(id);

    if (source.html().parentElement.previousElementSibling === this.owner().html())
      return false;

    if (source.html().parentElement.nextElementSibling === this.owner().html())
      return false;

    return true;
  }

  /**
   * Moves a the given test from the source to the target destination.
   *
   * @param {*} source
   * @param {*} target
   */
  moveTest(source, target) {

    // Create a new Condition...
    const newCondition = this.document().createByName("condition");

    // Find the if element which owns this test...
    let conditional = source;
    while (conditional.parent().test)
      conditional = conditional.parent();

    // ... remove everything between our test and the conditional...
    let oldOwner = source.remove(true, conditional);

    // ... in case the conditional has no more a test...
    // ... we need to transfer all block element...
    if (!conditional.test()) {
      oldOwner = conditional.remove(true, target);

      newCondition.append(conditional);
      newCondition.children(1).test(source);
      newCondition.children(0).remove(true);
    }
    else
      newCondition.children(0).test(source);

    target.append(newCondition, this.sibling());

    target.widget().reflow();
    if (conditional.parent())
      conditional.widget().reflow();
    source.widget().reflow();
    oldOwner.widget().reflow();

  }

  /**
   *
   * @param {SieveAbstractElement} source
   * @param {SieveAbstractElement} target
   */
  moveAction(source, target) {

    // remember owner
    const oldOwner = source.remove(true, target);
    // Move Item to new owner
    target.append(source, this.sibling());

    // refresh old and new Owner
    target.widget().reflow();
    oldOwner.widget().reflow();
  }

  /**
   * Moves a sieve element to the element bound by the drop handler.
   *
   * @param {string} sivFlavour
   *   the drag operations flavour.
   * @param {string} id
   *   the id of the sieve element to be moved
   */
  moveElement(sivFlavour, id) {
    const source = this.document().id(id);
    if (!source)
      throw new Error("Block Drop Handler: No Element found for " + id);

    const target = this.parent().getSieve();
    if (!target)
      throw new Error("Block Drop Handler: No Element found for " + this.parent().id());

    switch (sivFlavour) {
      case "sieve/test":
      case "sieve/operator":
        this.moveTest(source, target);
        return;

      case "sieve/action":
        this.moveAction(source, target);
        return;
    }

    throw new Error("Incompatible Drop");
  }

  /**
   * @inheritdoc
   */
  // eslint-disable-next-line no-unused-vars
  canCreateElement(sivFlavour, type) {
    if (sivFlavour === "sieve/operator")
      return false;

    return true;
  }

  /**
   *
   * @param {*} sivFlavour
   * @param {*} type
   */
  createElement(sivFlavour, type) {

    const item = this.parent().getSieve();

    if (!item)
      throw new Error("Element " + this.parent().getSieve().id() + " not found");

    let elm = null;

    if (sivFlavour === "sieve/test") {
      elm = item.document().createByName("condition",
        "if " + item.document().createByName(type).toScript() + "{\r\n}\r\n");
      item.append(elm, this.sibling());
    }
    else if (sivFlavour === "sieve/action") {
      elm = item.document().createByName(type);

      item.append(elm, this.sibling());
      // item.append( item.document().createByName( "whitespace", "\r\n" ), this.sibling() );
    }
    else {
      throw new Error("Unknown Element " + type);
    }

    item.widget().reflow();
  }
}

/**
 *
 */
class SieveTrashBoxDropHandler extends SieveDropHandler {

  /**
   * @inheritdoc
   */
  constructor() {
    super(["sieve/action", "sieve/test", "sieve/if", "sieve/operator"]);
  }

  /**
   * @inheritdoc
   */
  // eslint-disable-next-line no-unused-vars
  canMoveElement(sivFlavour, id) {
    return true;
  }

  /**
   * Moves a sieve element to the trash bin and removes it from the document.
   *
   * @param {string} sivFlavour
   *   the drag operations flavour.
   * @param {string} id
   *   the id of the sieve element to be removed
   */
  moveElement(sivFlavour, id) {

    let item = this.document().id(id);
    if (!item)
      throw new Error("Trash Drop Handler: No Element found for " + id);

    item = item.remove(true);

    if (!item)
      throw new Error("Trash Drop Handler: No Element found for " + id);

    item.widget().reflow();

    window.setTimeout(() => { this.document().compact(); }, 0);
  }
}

// ****************************************************************************//

/**
 * Implements an handler for Sieve Test actions..
 */
class SieveConditionDropHandler extends SieveDropHandler {

  /**
   * @inheritdoc
   */
  constructor() {
    super(["sieve/test", "sieve/action", "sieve/operator"]);
  }

  /**
   * @inheritdoc
   */
  canMoveElement(flavour, id) {

    // actions can only be added as last element...
    if (flavour === "sieve/action")
      if (this.sibling())
        return false;

    // if there is no source node we can skip right here...
    let source = this.document().id(id);
    if (!source)
      return false;

    // nested test might be dropped directly in front of a test, in order to...
    // ... remove an operator. But it does not make any sense to drop the ...
    // ... source directly before or after the target.
    if (flavour !== "sieve/action") {
      // we have to the check if the test's parent is a conditional
      source = source.parent();

      // if the node has no parent something is wrong...
      if (!source || !source.parent())
        return false;

      // if it's a conditional statement it's parent does not have a test method
      if (!source.parent().test) {
        if (source.html().parentElement.previousElementSibling.previousElementSibling === this.owner().html())
          return false;

        if (source.html().parentElement.nextElementSibling === this.owner().html())
          return false;
      }
    }

    // ... it's safe to add any other element everywhere except as...
    // ... last element.
    if (this.sibling())
      return true;

    // ... if the last element has no test, it's an else statement...
    // ... and it's not possible to add anything...
    const target = this.parent().getSieve();
    if (!target)
      return false;

    if (!target.children(":last").test)
      return false;

    return true;
  }

  /**
   * Moves a sieve element to the element bound by the drop handler.
   *
   * @param {string} flavour
   *   the drag operations flavour.
   * @param {string} id
   *   the id of the sieve element to be moved
   */
  moveElement(flavour, id) {
    let oldOwner;

    const source = this.document().id(id);
    if (!source)
      throw new Error("Block Drop Handler: No Element found for " + id);

    const target = this.parent().getSieve();
    if (!target)
      throw new Error("Block Drop Handler: No Element found for " + this.parent().id());

    if (flavour === "sieve/action") {
      oldOwner = source.remove(true, target);

      // we need to warp the action into an else statement
      target.append(
        this.document().createByName("condition/else")
          .append(source));

      target.widget().reflow();
      oldOwner.widget().reflow();

      return;
    }

    // "sieve/test" || "sieve/operator"

    // Find the if element which owns this test...
    let conditional = source;
    while (conditional.parent().test)
      conditional = conditional.parent();

    // ... remove everything between our test and the conditional...
    oldOwner = source.remove(true, conditional);

    // in case the conditional is empty we can reuse it ...
    // ... this keep all block elements intact...
    if (conditional.test()) {
      // we can't reuse it, create a new conditional
      conditional = this.document().createByName("condition/if");
      conditional.test(source);
    }
    else {
      conditional.test(source);
      oldOwner = conditional.remove(true, target);
    }

    target.append(conditional, this.sibling());

    target.widget().reflow();
    oldOwner.widget().reflow();
    conditional.widget().reflow();

    return;
  }

  /**
   * @inheritdoc
   */
  // eslint-disable-next-line no-unused-vars
  canCreateElement(flavour, type) {
    if (flavour === "sieve/operator")
      return false;

    // actions can only be added as last element...
    if (flavour === "sieve/action")
      if (this.sibling())
        return false;

    // ... it's safe to add any other element everywhere except as...
    // ... last element.
    if (this.sibling())
      return true;

    // ... if the last element has no test, it's an else statement...
    // ... and it's not possible to add anything...
    const target = this.parent().getSieve();
    if (!target)
      return false;

    if (!target.children(":last").test)
      return false;

    return true;
  }

  /**
   *
   * @param {string} sivFlavour
   *   the flavour of the new element.
   * @param {*} type
   */
  createElement(sivFlavour, type) {
    // The new home for our element
    const item = this.parent().getSieve();
    let elm = null;

    if (!item)
      throw new Error("Element " + this.parent().id() + " not found");

    if (sivFlavour === "sieve/test") {
      elm = item.document().createByName("condition/if",
        "if " + item.document().createByName(type).toScript() + "{\r\n}\r\n");

      item.append(elm, this.sibling());

      item.widget().reflow();

      return;

    }

    if (sivFlavour === "sieve/action") {
      elm = item.document().createByName("condition/else",
        "else {\r\n" + item.document().createByName(type).toScript() + "}");

      item
        .append(elm)
        .widget().reflow();

      return;
    }

    throw new Error("Incompatible drop");
  }
}

/**
 *
 */
class SieveTestDropHandler extends SieveDropHandler {

  /**
   * @inheritdoc
   */
  constructor() {
    super(["sieve/operator", "sieve/test"]);
  }

  /**
   * @inheritdoc
   */
  canMoveElement(sivFlavour, id) {
    let target = this.owner().getSieve();
    if (!target)
      return false;

    let source = target.document().id(id);
    if (!source)
      return false;

    // As we nest the tests we get in trouble if the test is a direct descendant
    // of the source, or of the target.
    while (source) {
      if (source.id() === target.id())
        return false;

      source = source.parent();
    }

    source = target.document().id(id);
    while (target) {
      if (source.id() === target.id())
        return false;

      target = target.parent();
    }

    return true;
  }

  /**
   * Moves a sieve element to the element bound by the drop handler.
   *
   * @param {string} sivFlavour
   *   the drag operations flavour.
   * @param {string} id
   *   the id of the sieve element to be moved
   */
  moveElement(sivFlavour, id) {
    const source = this.document().id(id);
    if (!source)
      throw new Error("Test Drop Handler: No Element found for " + id);

    // The new home for our element
    const target = this.owner().getSieve();

    if (!target)
      throw new Error("Element " + this.owner().id() + " not found");

    // Find the if element which owns this test...
    let conditional = source;
    while (conditional.parent().test)
      conditional = conditional.parent();

    // Wrap test into new test
    const outer = target.parent();
    const inner = this.document().createByName("operator/anyof");

    target.parent(null);

    // ...and bind test to the new container...
    inner.test(target);
    // ... then add it to this container ...
    outer.test(inner, target.id());

    // ... finally update all backrefs.
    inner.parent(outer);
    target.parent(inner);

    // cleanup but stop at the source's parent condition
    let oldOwner = source.remove(true, conditional);
    let newConditional;

    // in case the conditional is empty we should migrate all actions ...
    // ... otherwise remove cascade will swipe them.
    if (!conditional.test()) {
      // find the new home for our actions
      newConditional = outer;
      while (newConditional.parent().test)
        newConditional = newConditional.parent();

      // migrate our children...
      while (conditional.children().length)
        newConditional.append(conditional.children(0).remove());

      // do the remaining cleanup...
      oldOwner = oldOwner.remove(true, target);
    }

    inner.append(source);

    outer.widget().reflow();
    if (newConditional)
      newConditional.widget().reflow();
    oldOwner.widget().reflow();
  }

  /**
   * @inheritdoc
   */
  canCreateElement() {
    return true;
  }

  /**
   *
   * @param {string} sivFlavour
   *   the flavour of the to be created element.
   * @param {*} type
   */
  createElement(sivFlavour, type) {
    // The new home for our element
    const inner = this.owner().getSieve();

    if (!inner)
      throw new Error("Element " + this.owner().id() + " not found");

    const container = inner.parent();
    let test = null;

    if (sivFlavour === "sieve/test") {
      test = inner.document().createByName(type);
      type = "operator/anyof";
    }


    const outer = inner.document().createByName(type);
    // share the same source...
    if (outer.parent())
      throw new Error("wrap already bound to " + outer.parent().id());

    inner.parent(null);

    // ...and bind test to the new container...
    outer.test(inner);
    // ... then add it to this container ...
    container.test(outer, inner.id());

    // ... finally update all backrefs.
    outer.parent(container);
    inner.parent(outer);

    if (sivFlavour === "sieve/test")
      outer.append(test);

    // newOwner.wrap(item.document().createByName(type))
    // item.widget().reflow();

    container.widget().reflow();
  }
}


// used in multary operators
/**
 *
 */
class SieveMultaryDropHandler extends SieveDropHandler {

  /**
   * @inheritdoc
   */
  constructor() {
    super(["sieve/operator", "sieve/test"]);
  }

  /**
   * @inheritdoc
   */
  canMoveElement(sivFlavour, id) {
    // We have to prevent that someone drops a parent onto a child...
    //  ... this would generate a ring reference
    let target = this.parent().getSieve();

    if (!target)
      return false;

    const source = target.document().id(id);
    if (!source)
      return false;

    while (target) {
      if (source.id() === target.id())
        return false;

      target = target.parent();
    }

    // It makes no sense so drop the item directly before or after the element.
    if (source.html().parentElement.previousElementSibling === this.owner().html())
      return false;

    if (source.html().parentElement.nextElementSibling === this.owner().html())
      return false;

    return true;
  }

  /**
   * Moves a sieve element to the element bound by the drop handler.
   *
   * @param {string} sivFlavour
   *   the drag operations flavour.
   * @param {string} id
   *   the id of the sieve element to be moved
   */
  moveElement(sivFlavour, id) {
    const target = this.parent().getSieve();

    if (!target)
      throw new Error("Element " + this.parent().getSieve().id() + " not found");

    const source = this.document().id(id);
    if (!source)
      throw new Error("Block Drop Handler: No Element found for " + id);


    // Find the if element which owns this test...
    let conditional = source;
    while (conditional.parent().test)
      conditional = conditional.parent();

    // ... remove everything between our test and the conditional...
    let oldOwner = source.remove(true, conditional);
    let newConditional;

    // in case the conditional is empty we should migrate all actions ...
    // ... otherwise remove cascade will swipe them.
    if (!conditional.test()) {
      // find the new home for our actions
      newConditional = target;
      while (newConditional.parent().test)
        newConditional = newConditional.parent();

      // migrate our children...
      while (conditional.children().length)
        newConditional.append(conditional.children(0).remove());

      // continue cleanup
      oldOwner = oldOwner.remove(true, target);
    }

    target.append(source, this.sibling());

    target.widget().reflow();
    if (newConditional)
      newConditional.widget().reflow();
    oldOwner.widget().reflow();

  }

  /**
   * @inheritdoc
   */
  // eslint-disable-next-line no-unused-vars
  canCreateElement(sivFlavour, type) {
    if (sivFlavour !== "sieve/test")
      return false;

    return true;
  }

  /**
   *
   * @param {*} sivFlavour
   * @param {*} type
   */
  createElement(sivFlavour, type) {
    const item = this.parent().getSieve();

    if (!item)
      throw new Error("Element " + this.parent().getSieve().id() + " not found");

    const elm = item.document().createByName(type);

    item.append(elm, this.sibling());
    item.widget().reflow();
  }
}

export {
  SieveDropHandler,
  SieveMultaryDropHandler,
  SieveTestDropHandler,
  SieveConditionDropHandler,
  SieveBlockDropHandler,
  SieveTrashBoxDropHandler
};
