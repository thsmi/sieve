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
  /* global SieveDataTransfer */

  /**
   *
   */
  class SieveDropHandler {

    /**
     *
     */
    constructor(flavours) {

      this._flavours = [];

      if (typeof (flavours) !== "undefined" && flavours !== null)
        this._flavours = [].concat(flavours);

      this._owner = null;
    }

    /**
     * Gets the flavour for this drop type
     * @returns {string[]}
     *   a string array containing all supported drop flavours.
     */
    flavours() {
      return this._flavours;
    }

    document() {
      if (!this._owner)
        throw new Error("Owner for this Drop Handler");

      return this._owner.document();
    }

    bind(owner, sibling) {
      this._owner = owner;
      this._sibling = sibling;
    }

    /**
     * @returns {SieveAbstractWidget}
     *   The owner on thich the drag event occured
     */
    owner() {
      return this._owner;
    }

    /**
     * The target/sibling, the element which consumes the drop
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
     *
     * @param {*} html
     */
    attach(html) {

      html
        .bind("drop", (e) => { return this.onDragDrop(e); })
        .bind("dragover", (e) => { return this.onDragOver(e); })
        .bind("dragleave", (e) => { return this.onDragExit(e); })
        .bind("dragenter", (e) => { return this.onDragEnter(e); });
    }

    /* Official HTML5 Drag&Drop events... */

    onDragEnter(event) {

      if (!this.canDrop(event))
        return true;

      this.owner().html().attr("sivDragging", "true");

      return false;
    }

    onDragExit(event) {

      this.owner().html().removeAttr("sivDragging");

      // Exit is only used for UI cleanup, so we should never cancel this event.
      // Our parent might want to do cleanup too.
      return true;
    }

    onDragOver(event) {

      if (!this.canDrop(event))
        return true;

      this.owner().html().attr("sivDragging", "true");

      return false;
    }

    onDragDrop(event) {

      this.owner().html().removeAttr("sivDragging");

      if (!this.drop(event))
        return true;

      return false;
    }

    onDrop(flavour, event) {
      let dt = new SieveDataTransfer(event.originalEvent.dataTransfer);

      let meta = JSON.parse(dt.getData(flavour));

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

    drop(event) {
      for (let i = 0; i < this.flavours().length; i++) {
        if (!this.onCanDrop(this.flavours()[i], event))
          continue;

        return this.onDrop(this.flavours()[i], event);
      }

      return true;
    }

    onCanDrop(flavour, event) {
      let dt = new SieveDataTransfer(event.originalEvent.dataTransfer);

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
     *
     * @param {*} sivFlavour
     * @param {*} type
     * @returns {boolean}
     */
    canCreateElement(sivFlavour, type) {
      return false;
    }

    /**
     *
     * @param {*} sivFlavour
     * @param {*} id
     * @returns {boolean}
     */
    canMoveElement(sivFlavour, id) {
      return false;
    }

    canDrop(event) {
      for (let i = 0; i < this.flavours().length; i++) {
        if (!this.onCanDrop(this.flavours()[i], event))
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
   *
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
      let source = this.document().id(id);

      if (source.html().parent().prev().get(0) == this.owner().html().get(0))
        return false;

      if (source.html().parent().next().get(0) == this.owner().html().get(0))
        return false;

      return true;
    }

    moveTest(source, target) {

      // Create a new Condition...
      let newCondition = this.document().createByName("condition");

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

    moveAction(source, target) {

      // remember owner
      let oldOwner = source.remove(true, target);
      // Move Item to new owner
      target.append(source, this.sibling());

      // refresh old and new Owner
      target.widget().reflow();
      oldOwner.widget().reflow();
    }

    moveElement(sivFlavour, id) {
      let source = this.document().id(id);
      if (!source)
        throw new Error("Block Drop Handler: No Element found for " + id);

      let target = this.parent().getSieve();
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
    canCreateElement(sivFlavour, type) {
      if (sivFlavour === "sieve/operator")
        return false;

      return true;
    }

    createElement(sivFlavour, type) {

      let item = this.parent().getSieve();

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
    canMoveElement(sivFlavour, id) {
      return true;
    }

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
      // ... source directly before or after the traget.
      if (flavour !== "sieve/action") {
        // we have to the check if the test's parent is a conditional
        source = source.parent();

        // if the node has no parent something is wrong...
        if (!source || !source.parent())
          return false;

        // if it's a conditional statement it's parent does not have a test method
        if (!source.parent().test) {
          if (source.html().parent().prev().prev().get(0) === this.owner().html().get(0))
            return false;

          if (source.html().parent().next().get(0) === this.owner().html().get(0))
            return false;
        }
      }

      // ... it's safe to add any other element everywhere except as...
      // ... last element.
      if (this.sibling())
        return true;

      // ... if the last element has no test, it's an else statement...
      // ... and it's not possible to add anything...
      let target = this.parent().getSieve();
      if (!target)
        return false;

      if (!target.children(":last").test)
        return false;

      return true;
    }

    moveElement(flavour, id) {
      let oldOwner;

      let source = this.document().id(id);
      if (!source)
        throw new Error("Block Drop Handler: No Element found for " + id);

      let target = this.parent().getSieve();
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
      let target = this.parent().getSieve();
      if (!target)
        return false;

      if (!target.children(":last").test)
        return false;

      return true;
    }

    createElement(sivFlavour, type) {
      // The new home for our element
      let item = this.parent().getSieve();
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

      // As we nest the tests we get in troube if the test is a direct descendant
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

    moveElement(sivFlavour, id) {
      let source = this.document().id(id);
      if (!source)
        throw new Error("Test Drop Handler: No Element found for " + id);

      // The new home for our element
      let target = this.owner().getSieve();

      if (!target)
        throw new Error("Element " + this.owner().id() + " not found");

      // Find the if element which owns this test...
      let conditional = source;
      while (conditional.parent().test)
        conditional = conditional.parent();

      // Wrap test into new test
      let outer = target.parent();
      let inner = this.document().createByName("operator/anyof");

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

    createElement(sivFlavour, type) {
      // The new home for our element
      let inner = this.owner().getSieve();

      if (!inner)
        throw new Error("Element " + this.owner().id() + " not found");

      let container = inner.parent();
      let test = null;

      if (sivFlavour === "sieve/test") {
        test = inner.document().createByName(type);
        type = "operator/anyof";
      }


      let outer = inner.document().createByName(type);
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

      let source = target.document().id(id);
      if (!source)
        return false;

      while (target) {
        if (source.id() === target.id())
          return false;

        target = target.parent();
      }

      // It makes no sense so drop the item directly before or after the element.
      if (source.html().parent().prev().get(0) == this.owner().html().get(0))
        return false;

      if (source.html().parent().next().get(0) == this.owner().html().get(0))
        return false;

      return true;
    }

    moveElement(sivFlavour, id) {
      let target = this.parent().getSieve();

      if (!target)
        throw new Error("Element " + this.parent().getSieve().id() + " not found");

      let source = this.document().id(id);
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
    canCreateElement(sivFlavour, type) {
      if (sivFlavour !== "sieve/test")
        return false;

      return true;
    }

    createElement(sivFlavour, type) {
      let item = this.parent().getSieve();

      if (!item)
        throw new Error("Element " + this.parent().getSieve().id() + " not found");

      let elm = item.document().createByName(type);

      item.append(elm, this.sibling());
      item.widget().reflow();
    }
  }

  exports.SieveDropHandler = SieveDropHandler;
  exports.SieveMultaryDropHandler = SieveMultaryDropHandler;
  exports.SieveTestDropHandler = SieveTestDropHandler;
  exports.SieveConditionDropHandler = SieveConditionDropHandler;
  exports.SieveBlockDropHandler = SieveBlockDropHandler;
  exports.SieveTrashBoxDropHandler = SieveTrashBoxDropHandler;

})(window);
