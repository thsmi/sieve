/*
 * The content of this file is licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via
 * email from the author.
 *
 * Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

(function (exports) {

  "use strict";

  /* global ExtensionCommon */
  /* global Components */

  const Cc = Components.classes;
  const Ci = Components.interfaces;

  /**
   * A helper class for dom manipulations...
   */
  class SieveDomHelper {

    /**
     * Creates a new instance
     * @param {Document} document
     *   the dom element which should be used by this helper.
     */
    constructor(document) {
      this.document = document;
    }

    /**
     * Checks if a menu item with the given id exists.
     *
     * @param {string} id
     *   the nodes unique id
     * @returns {boolean}
     *   true in case the element exists otherwise false.
     */
    hasNode(id) {
      const node = this.document.getElementById(id);

      if (!node)
        return false;

      return true;
    }

    /**
     * Gets an existing node from the document.
     * In case it does not exist an exception it throws.
     *
     * @param {string} id
     *   the nodes unique id
     * @returns {DOMElement}
     *   the dom element or throws an exception.
     */
    getNode(id) {
      const node = this.document.getElementById(id);
      if (!node)
        throw new Error(`Unknown element ${id}`);

      return node;
    }

    /**
     * Removes the node with the given id. In case no such node exists
     * it will fail silently.
     * @param {string} id
     *   the node to be removed.
     */
    removeNode(id) {
      const elm = this.document.getElementById(id);
      if (elm)
        elm.parentNode.removeChild(elm);
    }

    /**
     * Inserts the menu item directly before the reference node.
     * @param {string} refId
     *   the reference node.
     * @param {SieveAbstractWidget} item
     *   the item to be added
     */
    insertBefore(refId, item) {

      const ref = this.getNode(refId);
      this.removeNode(item.getId());

      ref.parentNode.insertBefore(item.createNode(this.document), ref);
    }

    /**
     * Inserts the menu item directly after the reference node.
     * @param {string} refId
     *   the reference node.
     * @param {SieveAbstractWidget} item
     *   the item to be added
     */
    insertAfter(refId, item) {

      const ref = this.getNode(refId);
      this.removeNode(item.getId());

      ref.parentNode.insertBefore(item.createNode(this.document), ref.nextSibling);
    }

    /**
     * Inserts the menu item as a last child of the reference node.
     *
     * @param {string} refId
     *   the reference node.
     * @param {SieveAbstractWidget} item
     *   the item to be added.
     */
    appendChild(refId, item) {
      const ref = this.getNode(refId);
      this.removeNode(item.getId());

      ref.appendChild(item.createNode(this.document));
    }
  }

  /**
   * An abstract wrapper for menu item widgets.
   */
  class SieveAbstractWidget {

    /**
     * Creates a new instance
     * @param {string} id
     *   the unique menu item.
     */
    constructor(id) {
      this.id = id;
    }

    /**
     * Gets the widgets unique id which is used inside the DOM.
     *
     * @returns {string}
     *   returns the widgets unique id.
     */
    getId() {
      return this.id;
    }

    /**
     * Creates a new node in the given document.
     * @abstract
     *
     * @param {Document} document
     *   the dom document to which the widget should be added.
     * @returns {DOMElement}
     *   the newly created node.
     */
    createNode(document) {
      throw new Error(`Implement createNode(${document})`);
    }
  }


  /**
   * A warper for a menu item label.
   */
  class SieveMenuLabel extends SieveAbstractWidget {

    /**
     * Initializes the menu label widget.
     *
     * @param {string} id
     *   the widgets unique id.
     * @param {string} label
     *   the widgets description.
     * @param {string} [accesskey]
     *   the optional access key.
     */
    constructor(id, label, accesskey) {
      super(id);
      this.label = label;
      this.accesskey = accesskey;
    }

    /**
     * @inheritdoc
     */
    createNode(document) {

      const item = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "menuitem");
      item.setAttribute("id", this.id);
      item.setAttribute("label", this.label);

      if (typeof (this.accesskey) !== "undefined" || this.accesskey !== null)
        item.setAttribute("accesskey", this.accesskey);

      return item;
    }
  }

  /**
   * A wrapper for a menu item separator
   */
  class SieveMenuSeparator extends SieveAbstractWidget {

    /**
     * @inheritdoc
     */
    createNode(document) {
      const item = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "menuseparator");
      item.setAttribute("id", this.id);

      return item;
    }
  }

  /**
   * A wrapper for an app menu label
   */
  class SieveAppMenuLabel extends SieveAbstractWidget {

    /**
     * Initializes the app menu widget.
     *
     * @param {string} id
     *   the widgets unique id.
     * @param {string} label
     *   the widgets description.
     * @param {string} [accesskey]
     *   the optional access key.
     */
    constructor(id, label, accesskey) {
      super(id);
      this.label = label;
      this.accesskey = accesskey;
    }

    /**
     * @inheritdoc
     */
    createNode(document) {

      const item = document.createElementNS(
        "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "toolbarbutton");
      item.setAttribute("id", this.id);
      item.setAttribute("label", this.label);
      item.setAttribute("class", "subviewbutton");

      if (typeof (this.accesskey) !== "undefined" || this.accesskey !== null)
        item.setAttribute("accesskey", this.accesskey);

      return item;
    }
  }

  /**
   * A wrapper for an app menu separator
   */
  class SieveAppMenuSeparator extends SieveAbstractWidget {

    /**
     * @inheritdoc
     */
    createNode(document) {

      const item = document.createElementNS(
        "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "toolbarseparator");
      item.setAttribute("id", this.id);

      return item;
    }
  }

  const callbacks = new Set();
  const ids = new Set();

  /**
   * Clears all of the known custom ui elements from all known windows.
   */
  function clearAllWindows() {

    const wm = Cc["@mozilla.org/appshell/window-mediator;1"]
      .getService(Ci.nsIWindowMediator);

    const windows = wm.getEnumerator(null);

    while (windows.hasMoreElements()) {

      const doc = new SieveDomHelper(windows.getNext().docShell.domWindow.document);

      for (const id of ids)
        doc.removeNode(id);
    }
  }

  /**
   * Converts the widget description into a widget class
   * which can be used to construct the dom element.
   *
   * @param {object} widget
   *   the widget description
   *
   * @returns {SieveAbstractWidget}
   *   the widget or an exception in case the description is invalid.
   */
  function createWidget(widget) {

    if (widget.type === "menu-label")
      return new SieveMenuLabel(widget.id, widget.label, widget.accesskey);

    if (widget.type === "menu-separator")
      return new SieveMenuSeparator(widget.id);

    if (widget.type === "appmenu-label")
      return new SieveAppMenuLabel(widget.id, widget.label, widget.accesskey);

    if (widget.type === "appmenu-separator")
      return new SieveAppMenuSeparator(widget.id);

    throw new Error("Unknown widget type");
  }


  /**
   * Gets the document of the given window.
   * In case no window with the given id exists an exception will be thrown.
   *
   * @param {string} windowId
   *   the windows unique id
   *
   * @returns {SieveDomHelper}
   *   the warper which can be used to access the windows document.
   */
  function getDocumentByWindow(windowId) {

    const wm = Cc["@mozilla.org/appshell/window-mediator;1"]
      .getService(Ci.nsIWindowMediator);

    const windows = wm.getEnumerator(null);

    while (windows.hasMoreElements()) {
      const win = windows.getNext().docShell.domWindow;

      if (`${windowId}` === `${win.docShell.outerWindowID}`)
        return new SieveDomHelper(win.document);
    }

    throw new Error(`Invalid window ${windowId}`);
  }

  /**
   * Invokes an event callback for the given window and element.
   *
   * @param {string} windowId
   *   the windows unique id.
   * @param {string} id
   *   the elements unique id on which the event occurred
   */
  function invokeCallback(windowId, id) {
    for (const callback of callbacks)
      callback(windowId, id);
  }


  /**
   * Implements a webextension api for sieve session and connection management.
   */
  class SieveMenuApi extends ExtensionCommon.ExtensionAPI {
    /**
     * @inheritdoc
     */
    getAPI(context) {

      context.callOnClose({
        close: () => { clearAllWindows(); }
      });

      return {
        sieve: {
          menu: {

            onCommand: new ExtensionCommon.EventManager({
              context,
              name: "sieve.session.onCommand",
              register: (fire) => {

                const callback = async (windowsId, id) => {
                  return await fire.async(windowsId, id);
                };

                callbacks.add(callback);

                return () => {
                  callbacks.delete(callback);
                };
              }
            }).api(),

            /**
             * Adds the widget to the given window.
             *
             * @param {string} windowId
             *   the window id to which the element should be added.
             * @param {object} widget
             *   the widget description.
             */
            async add(windowId, widget) {

              const item = createWidget(widget);
              const document = getDocumentByWindow(windowId);

              const id = item.getId();

              switch (widget.position) {
                case "child":
                  document.appendChild(widget.reference, item);
                  break;

                case "before":
                  document.insertBefore(widget.reference, item);
                  break;

                case "after":
                  document.insertAfter(widget.reference, item);
                  break;

                default:
                  throw new Error(`Invalid position ${widget.position}`);
              }

              ids.add(id);

              await document.getNode(id)
                .addEventListener("command", () => { invokeCallback(windowId, id); });
            },

            /**
             * Removes a menu item from the window.
             *
             * @param {string} windowId
             *   the unique window id.
             * @param {string} id
             *   the menu elements id
             */
            async remove(windowId, id) {
              await getDocumentByWindow(windowId).removeNode(id);
            },

            /**
             * Checks if the given menu item exist in the given window.
             * @param {string} windowId
             *   the unique window id.
             * @param {string} id
             *   the menu element's id
             *
             * @returns {boolean}
             *   true in case the element exists otherwise false.
             */
            async has(windowId, id) {
              return await getDocumentByWindow(windowId).hasNode(id);
            }
          }
        }
      };
    }
  }

  exports.SieveMenuApi = SieveMenuApi;

})(this);
