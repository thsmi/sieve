/*
 * The contents of this file are licenced. You may obtain a copy of
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

  /* global SieveAbstractElement */
  /* global SieveLexer */

  // TODO we need to do a cleanup, which means document caches elements by their id.
  // These elements should be also tracked by the generic elements. espeically with tags.
  // So it would be good to have a method which collects all ids of elements in use.
  // all other elements can then be dropped and removed.

  // TODO we need a list of items to emulate blocks...


  /**
   * An Abstract implementation for all Generic elements
   */
  class SieveAbstractGeneric {

    /**
     * Creates a new instance
     * @param {SieveAbstractElement} parent
     *   the parent who owns this element.
     */
    constructor(parent) {

      if (parent === null || typeof (parent) === "undefined")
        throw new Error("Undefined or invalid parent");

      this.parent = parent;
    }

    /**
     * @returns {SieveAbstractElement}
     *   the parent element.
     */
    getParent() {
      return this.parent;
    }

    /**
     * @returns {SieveDocument}
     *   the parent document
     */
    getDocument() {
      return this.getParent().document();
    }

    /**
     * Parses the given buffer and extracts the informations needed by the generic element.
     *
     * @param  {SieveParser} parser
     *  the parser which should be used
     * @throws
     *   throws an exception in case the given buffer could not be parsed.
     *
     * @returns {void}
     */
    parse(parser) {
      throw new Error("Implement SieveAbstractGeneric::parse(" + typeof (parser) + ")");
    }

    /**
     * Matches the capabilities with the server's capability list.
     *
     * @param {SieveCapabilities} capabilities
     *   the capabilities provided by the server
     * @returns {SieveAbstractGeneric}
     *   a self reference
     */
    require(capabilities) {
      return this;
    }

    /**
     * Concerts the current sieve elements into a script.
     *
     * @returns {String}
     *   the sieve script as string
     */
    toScript() {
      throw new Error("Implement SieveAbstractGeneric::toScript");
    }

    /**
     * Checks if the current element is the default value.
     * Optional elements with the default value are typically not rendered.
     *
     * @returns {boolean}
     *   true in case the element is the default value otherwise false.
     */
    hasDefaultValue() {
      return true;
    }

    /**
     * Checks if the current element has a value and thus needs
     * to be rendered into a sieve script.
     *
     * @returns {boolean}
     *   true or false
     */
    isDefaultValue() {
      return true;
    }
  }

  /**
   * Creates a new token.
   * A token is a constant string. With an prefix and a optional postfix.
   *
   * The prefix defaults to an empty string and eats any leading whitespaces.
   * While the post fix is optional.
   */
  class SieveGenericLiteral extends SieveAbstractGeneric {

    /**
     * Creates a Generic Literal instance
     * @param {String} token
     *   the literal's token
     * @param {SieveAbstractElement} parent
     *   the parent element
     */
    constructor(token, parent) {

      super(parent);

      if (token === null || typeof (token) === "undefined" || typeof (token) !== "string")
        throw new Error("Token in a Literal as to be a string but is " + typeof (token));

      this._token = token;

      this._pre = this.getParent().createByName("whitespace", "");
      this._post = null;
    }

    /**
     * Initializes the whitespace before the element.
     *
     * Defaults to an empty string if omitted.
     *
     * @param {String} [prefix]
     *   the default prefix which is used for an uninitialized element
     * @returns {SieveGenericLiteral}
     *   a self reference
     */
    setPrefix(prefix) {

      if (prefix === null || typeof (prefix) === "undefined")
        prefix = "";

      this._pre.init(prefix);
      return this;
    }

    /**
     * Defines an optional postfix. Which is the whitespace after the literal
     * It is used to make the code more readable.
     *
     * @param {String} postfix
     *   the postfixes default value.
     * @param {boolean} [linebreak]
     *   if true the postfix is considered to end at a linebreak. This is used to make
     *   the code more readiable. Especially when moving elements.
     * @param {boolean} [optional]
     *   if true the postfix is optional, which means it is not an error when it is missing.
     *   If omitted it default to true
     * @returns {SieveGenericLiteral}
     *   a self reference
     */
    setPostfix(postfix, linebreak, optional) {

      if (postfix === null || typeof (postfix) === "undefined") {
        this._post = null;
        return this;
      }

      if (linebreak === null || typeof (linebreak) === "undefined")
        linebreak = true;

      if (optional === null || typeof (optional) === "undefined")
        optional = true;

      this._postIsOptional = optional;
      this._postExpectLinebreak = linebreak;
      this._post = this.getParent().createByName("whitespace", postfix);
      return this;
    }

    /**
     * @inheritDoc
     */
    parse(parser) {

      if (this.getDocument().probeByClass("whitespace", parser))
        this._pre.init(parser);
      else
        this._pre.init("");

      parser.extract(this._token);

      if (this._post === null)
        return;

      // Seems a bit strange, but we stop parsing at linebreaks.
      // This makes deleting elements easier and generates much
      // more readable code.
      if (this.getDocument().probeByName("whitespace", parser)) {
        this._post.init(parser, this._postExpectLinebreak);
        return;
      }

      if (this._postIsOptional === false)
        throw new Error("Whitespace expected...");

      this._post.init("");
      return;
    }

    /**
     * @inheritDoc
     */
    toScript() {
      let result = "";

      result += this._pre.toScript() + this._token;

      if (this._post !== null)
        result += this._post.toScript();

      return result;
    }


  }

  /**
   *
   */
  class SieveGenericMandatoryItem extends SieveAbstractGeneric {

    /**
     * @inheritDoc
     */
    constructor(parent) {
      super(parent);
      this._elements = new Map();
    }

    /**
     *
     * @param {} id
     * @returns {boolean}
     *   true in case the element exists otherwise false
     */
    hasElement(id) {
      return this._elements.has(id);
    }

    /**
     *
     * @param {*} id
     */
    getElement(id) {

      if (!this.hasElement(id))
        throw new Error("No Element with id " + id);

      return this._elements.get(id).element;
    }

    /**
     * Initializes the given parameter.
     * @param {Object} parameter
     *  the parameter which should be set
     * @returns {void}
     */
    addParameter(parameter) {

      if (parameter.type === null || typeof (parameter.type) === 'undefined')
        throw new Error("Parameter without a type ");

      let item = {};
      item.element = this.getParent().createByName(parameter.type, parameter.value);
      item.whitespace = this.getParent().createByName("whitespace", " ");

      this._elements.set(parameter.id, item);
    }

    /**
     * Assigns parameters to this object.
     * Any existing parametes will be replaced.
     *
     * @param  {Array} parameters
     *  the parameters which should be set.
     *
     * @returns {SieveGenericMandatoryItem}
     *   a self reference
     */
    setParameters(parameters) {

      if (!parameters || !parameters.length)
        throw new Error("Invalid Parameters");

      // Drop any existing elements...
      this._elements.clear();

      // Initialize all Parameters...
      parameters.forEach((parameter) => {
        this.addParameter(parameter);
      });

      return this;
    }

    /**
     * @inheritDoc
     */
    require(capabilities) {

      this._elements.forEach((item) => {
        item.element.require(capabilities);
      });

      return this;
    }

    /**
     * @inheritDoc
     */
    parse(parser) {

      this._elements.forEach((item) => {
        item.whitespace.init(parser);
        item.element.init(parser);
      });

      return this;
    }

    /**
     * @inheritDoc
     */
    toScript() {

      let result = "";

      this._elements.forEach((item) => {
        result += item.whitespace.toScript();
        result += item.element.toScript();
      });

      return result;
    }
  }


  /**
   *
   */
  class SieveGenericDependentItem extends SieveGenericMandatoryItem {

    /**
     * @returns {boolean}
     */
    isDependent() {
      return true;
    }

    /**
     * @inheritDoc
     */
    parse(parser) {

      try {
        super.parse(parser);
      } catch (ex) {
        this.enabled = false;
        throw ex;
      }

      this.enabled = true;
      return this;
    }

    /**
     * @inheritDoc
     */
    toScript() {

      if (!this.enabled)
        return "";

      return super.toScript();
    }
  }


  /**
   * This is used to model a tag.
   *
   * A tag may be a single flag or a list of mutual exclusive like in matchtypes.
   *
   * But all Tags are by definition optional, they may be there or not.
   * This also means they have an implicit default value which makes parsing akward.
   *
   * In case the tag is missing (which means using the implicit default) the class is fully transparent.
   * Otherwise it is greedy and eats leading and tailing whitespaces.
   */
  class SieveGenericOptionalItem extends SieveAbstractGeneric {

    /**
     * Createas a new instance
     * @param  {SieveGenericStructure} parent
     *   the parent element
     */
    constructor(parent) {
      super(parent);

      this._optionals = new Map();
      this._elements = new Set();

      this._tail = null;
    }

    /**
     * Checks if the given id is managed by this element.
     * @param {String} id
     *   the element's unique id
     * @returns {boolean}
     *   true in case the element is a child element otherwise false.s
     */
    hasElement(id) {
      return this._optionals.has(id);
    }

    /**
     * Returns the element for the given id.
     * @param {String} id
     *   the element's unique id.
     * @returns {SieveAbstractElement}
     *   the sieve element with this is.
     */
    getElement(id) {

      if (!this.hasElement(id))
        // TODO we should throw it is an error.
        return null;

      return this._optionals.get(id).element;
    }

    /**
     * Enables the given id. In case the element is disabled the implicit fallback is used
     * @param {*} id
     * @param {*} status
     * @returns {boolean}
     */
    enable(id, status) {

      if (!this.hasElement(id))
        throw new Error("Unknown element " + id);

      if (status === false) {
        this._elements.delete(id);
        return false;
      }

      if (status === true) {
        this._elements.add(id);
        return false;
      }

      return this._elements.has(id);
    }

    /**
     *
     * @param {*} tag
     */
    addTag(tag) {

      if (tag.type === null || typeof (tag.type) === 'undefined')
        throw new Error("Tag without a type");

      if (tag.id === null || typeof (tag.id) === 'undefined')
        throw new Error("Tag without an id");

      // Skip element if it is not supported by the current system
      if (SieveLexer.supportsByName(tag.type) === false)
        return;

      let item = {};
      // item.id = tag.id;
      item.type = tag.type;
      item.element = this.getParent().createByName(tag.type, tag.value);

      let separator = " ";
      if (tag.separator)
        separator = tag.separator;

      item.whitespace = this.getParent().createByName("whitespace", separator);

      this._optionals.set(tag.id, item);

      if (tag.enabled)
        this._elements.add(tag.id);
    }

    /**
     *
     * @param {*} tags
     */
    setTags(tags) {

      if (!tags || !tags.length)
        throw new Error("Invalid Tags");

      if (this._optionals.length)
        throw new Error(" Tags already initialized");

      // Initialize all Parameters...
      tags.forEach((tag) => {
        this.addTag(tag);
      });

      if (this._elements.size)
        this._tail = this.getParent().createByName("whitespace", " ");

      return this;
    }


    /**
     * @inheritDoc
     */
    parse(parser) {

      // Skip in case this element has not tags
      if (!this._optionals)
        return this;

      this._elements = new Set();

      // Tags may be optional, which means they might be there nor not...
      let pos = parser.pos();

      // ... in any case it needs to be separated by a whitespace
      // if not we know are no tags.
      let whitespace = this.getParent().createByName("whitespace", "");
      if (this.getDocument().probeByClass("whitespace", parser))
        whitespace.init(parser);

      // then we clone the tags element to track duplicate elements.
      let ids = new Set(this._optionals.keys());
      let hasTags = true;

      // now we need to parse until there are no more tags.
      while (hasTags) {

        hasTags = false;

        for (let id of ids) {

          let item = this._optionals.get(id);

          if (!this.getDocument().probeByName(item.type, parser))
            continue;

          item.whitespace = whitespace;
          item.element.init(parser);

          // Then drop it from our worker
          ids.delete(id);
          this._elements.add(id);

          whitespace = this.getParent().createByName("whitespace", "");

          // In case there are no more whitespaces we can skip right here.
          if (this.getDocument().probeByClass("whitespace", parser))
            whitespace.init(parser);

          hasTags = true;
          break;
        }
      }

      // in case we did not find any tags, there won't be any elements. Which means we have
      // to restore the extracted whitespaces. We do this by reseting the postion.
      if (this._elements.size === 0) {

        this._tail = null;
        parser.pos(pos);
        return this;
      }

      this._tail = whitespace;

      return this;
    }

    /**
     * @inheritDoc
     */
    require(imports) {

      for (let id of this._elements) {
        this._optionals.get(id).element.require(imports);
      }

      return this;
    }

    /**
     * @inheritDoc
     */
    hasDefaultValue() {

      if (this._elements.size > 0)
        return false;

      for (let item of this._optionals.values()) {

        if (item.element.hasDefaultValue())
          continue;

        return false;
      }

      return true;
    }

    /**
     *@inheritDoc
     */
    isDefaultValue() {

      // in case we have an element we can skip right here
      if (this._elements.size > 0)
        return false;

      // we can skip otherwise in case one of our
      // optionals has a non default value.
      for (let item of this._optionals.values()) {

        if (item.element.isDefaultValue())
          continue;

        return false;
      }

      return true;
    }

    /**
     * @inheritDoc
     */
    toScript() {

      let result = "";

      // We try to preserve all elemets entered by the user
      for (let id of this._elements) {

        let item = this._optionals.get(id);

        result += item.whitespace.toScript();
        result += item.element.toScript();
      }

      // Then add other optional elements.
      for (let [id, item] of this._optionals) {
        if (this._elements.has(id))
          continue;

        if (item.element.hasDefaultValue) {

          if (item.element.hasDefaultValue() && item.element.isDefaultValue())
            continue;
        }

        // TODO: Do we realy need this? A value which is enabled
        // is contained in this._elements and a value which is not enabled
        // should not be rendered.
        if (!item.element.hasCurrentValue || item.element.hasCurrentValue() === false) {
          continue;
        }

        result += item.whitespace.toScript();
        result += item.element.toScript();
      }

      if (this._tail)
        result += this._tail.toScript();

      return result;
    }
  }

  /**
   *
   */
  class SieveGenericStructure extends SieveAbstractElement {

    /**
     *
     * @param {*} docshell
     * @param {*} id
     * @param {*} type
     */
    constructor(docshell, id, type) {
      super(docshell, id);

      this._elements = [];
      this._requirements = null;
      this._nodeName = type;
    }

    /**
     * @inheritDoc
     */
    nodeName() {
      if (this._nodeName === null)
        throw new Error("Uninitialized Element");

      return this._nodeName;
    }

    /**
     * @inheritDoc
     */
    require(capabilities) {


      capabilities
        .require(this._requirements);

      this._elements.forEach((element) => {
        element.require(capabilities);
      });

      return this;
    }

    /**
     * @inheritDoc
     */
    init(parser) {

      let pos = null;
      let prev = null;

      this._elements.forEach((element) => {

        if (element.isDependent && element.isDependent()) {

          // save the current position for a rollback
          pos = parser.pos();

          // A dependent element is optional so it is ok
          // if we fail here
          try {
            element.parse(parser);
          }
          catch (ex) {
            // TODO reset item
            // Reset the position as if nothing happened
            parser.pos(pos);
            pos = null;
          }

          // and continue with the next element
          prev = element;
          return;
        }

        // This happens only if the previous element
        // was a dependent element, and it was parsed
        // successfully
        if (pos !== null) {

          try {
            element.parse(parser);

          } catch (ex) {

            prev.enabled = false;

            // parsing failed. So let's reset the position and
            // try parsing without the dependent element.
            // we need to reset the dependet element
            parser.pos(pos);
            element.parse(parser);
          }

          pos = null;
          return;
        }

        element.parse(parser);
        return;
      });


      /* this._elements.forEach( function ( element ) {
         element.parse( parser );
       }, this );*/

      return this;
    }

    /**
     * @inheritDoc
     */
    toScript() {

      let result = "";

      this._elements.forEach(function (element) {
        result += element.toScript();
      }, this);

      return result;
    }

    /**
     * @returns {boolean}
     */
    hasDefaultValue() {
      for (let item of this._elements) {
        if (item.hasDefaultValue())
          continue;

        return false;
      }

      return true;
    }

    /**
     * @returns {boolean}
     */
    isDefaultValue() {

      for (let item of this._elements) {

        if (item.isDefaultValue())
          continue;

        return false;
      }

      return true;
    }


    /**
     * Adds the dependencies to this generic element.
     * The dependencies can be a plain string or a
     * object with an "any" or "all" key. Either key needs
     * to point to an array of strings.
     *
     * @param  {any} requirements
     *   the required capabilities.
     *
     * @returns {SieveGenericStructure}
     *   a self reference
     */
    addRequirements(requirements) {

      this._requirements = requirements;
      return this;
    }

    /**
     * Enables the given element.
     * Disabling means using the implicit allback.
     *
     * In case the given element is non existant an exception is thrown
     *
     * @param {String} id
     *   the unique element's id
     * @param {boolean} [status]
     *   the new status in case it should be changed.
     * @returns {boolean}
     *   the elements status
     */
    enable(id, status) {

      for (let item of this._elements) {

        if (!item.enable || !item.hasElement)
          continue;

        if (!item.hasElement(id))
          continue;

        return item.enable(id, status);
      }

      throw new Error("No Element with id " + id + " found");
    }

    /**
     *
     * @param {String} token
     *   the literals token
     * @param {*} postfix
     * @param {*} prefix
     */
    addLiteral(token, postfix, prefix) {

      let literal = new SieveGenericLiteral(token, this);
      literal.setPostfix(postfix);
      literal.setPrefix(prefix);

      this._elements.push(literal);

      return this;
    }


    /**
     * @param  {Array.<object>|object} tags
     */
    addOptionalItems(tags) {

      // we bail silently out in case no tags are defined.
      if (typeof (tags) === "undefined" || tags === null)
        return this;

      // Ok if it is something else than an array we just
      // convert it into an array
      if (!Array.isArray(tags))
        tags = [tags];

      this._elements.push(
        new SieveGenericOptionalItem(this).setTags(tags));

      return this;
    }

    /**
     * A dependent element is something between
     * an optional and mandatory element.
     *
     * Such an element is by definition optional but can not
     * live without the mandatory element but has a fixed position.
     * This can occure in case of an ambious type definition.
     *
     * Let's take an example structure
     * "action" <variables:string> [flags:string];
     *
     * As you can see the action has two string parameters.
     * This allow the following two commands
     *
     * action "flags";
     * action "variables" "flags"
     *
     * As the parser is linear the optional "variable" parameter
     * would be greedy an consume the string so that the mandatory
     * flags parameter would fails.
     *
     * A dependent element fixes this. The "variable" element is
     * non greedy. So that in the first case the "flags".
     *
     * @param {Array.<object>|object} parameters
     *  the configuration and parameters for the dependent item
     * @returns {SieveGenericStructure}
     *  a self reference
     */
    addDependentItems(parameters) {

      if (typeof (parameters) === "undefined" || parameters === null)
        return this;

      if (!Array.isArray(parameters))
        parameters = [parameters];

      this._elements.push(
        new SieveGenericDependentItem(this).setParameters(parameters));

      return this;
    }

    /**
     * A mandatory element is a required element.
     * In case it is not at the expected position
     * an error will be raised
     *
     * @param  {Array.<object>|object} parameters
     *  the configuration and parameter for the generic items.
     * @returns {SieveGenericStructure}
     *  a self reference
     */
    addMandatoryItems(parameters) {

      if (typeof (parameters) === "undefined" || parameters === null)
        return this;

      if (!Array.isArray(parameters))
        parameters = [parameters];

      this._elements.push(
        new SieveGenericMandatoryItem(this).setParameters(parameters));

      return this;
    }

    /**
     *
     * @param {*} id
     * @returns {boolean}
     */
    hasElement(id) {

      for (let item of this._elements) {

        if (!item.hasElement || !item.hasElement(id))
          continue;

        return true;
      }

      return false;
    }

    /**
     *
     * @param {*} id
     */
    getElement(id) {

      for (let item of this._elements) {

        if (!item.hasElement || !item.hasElement(id))
          continue;

        return item.getElement(id);
      }

      throw new Error("No element with id " + id);
    }
  }


  /**
   * Used for matchtype, comparators, addressppart or body transforms
   */
  class SieveGenericUnion extends SieveAbstractElement {

    /**
     *
     * @param {*} docshell
     * @param {*} id
     */
    constructor(docshell, id) {
      super(docshell, id);

      this._element = {
        current: null,
        default: null
      };
      this._items = [];

      this._prefix = null;
    }

    /**
     * @inheritDoc
     */
    nodeName() {

      if (this._element.current !== null)
        return this._element.current.nodeName();

      return this._element.default.nodeName();
    }

    /**
     * @inheritDoc
     */
    require(imports) {

      if (this._element.current !== null) {
        this._element.current.require(imports);
        return this;
      }

      if (this._element.default !== null) {
        this._element.default.require(imports);
        return this;
      }

      return this;
    }

    /**
     *
     * @param {String} token
     * @returns {SieveGenericUnion}
     *   a self reference
     */
    setToken(token) {

      if (token === null || typeof (token) === "undefined") {
        this._prefix = null;
        return this;
      }

      this._prefix = new SieveGenericLiteral(token, this).setPostfix(" ", false, false);
      return this;
    }

    /**
     *
     * @param {*} items
     * @returns {SieveGenericUnion}
     *   a self reference
     */
    addItems(items) {
      this._items = this._items.concat(items);

      return this;
    }

    /**
     * @returns {boolean}
     */
    hasDefaultValue() {

      if (this._element.default === null)
        return false;

      if (typeof (this._element.default) === "undefined")
        return false;

      return true;
    }

    /**
     * @returns {string}
     */
    getDefaultValue() {
      return this._element.default.toScript();
    }

    /**
     *
     * @param {*} value
     * @returns {SieveGenericUnion}
     *   a self reference
     */
    setDefaultValue(value) {

      if (value === null || typeof (value) === "undefined")
        return this;

      this._element.default = this.document().createByClass(this._items, value, this);

      return this;
    }

    /**
     * @returns {boolean}
     */
    isDefaultValue() {

      if (this.hasDefaultValue() === false)
        return false;

      if (this.hasCurrentValue() === false)
        return true;

      return false;
    }

    /**
     * Check if a current value was set.
     *
     * @returns {boolean}
     *  true in case the element has a current value set otherwise false
     */
    hasCurrentValue() {
      if (this._element.current === null)
        return false;

      if (typeof (this._element.current) === "undefined")
        return false;

      return true;
    }

    /**
     *
     */
    getCurrentValue() {

      if (this.isDefaultValue())
        return null;

      return this._element.current.toScript();
    }


    /**
     * Sets the unions current value.
     *
     * @param {String|SieveParser} [value]
     *  optional the new value which should be set. In case it is omitted it will
     *  fallback to the default value if present.
     * @returns {SieveGenericUnion}
     *  a self reference
     */
    setCurrentValue(value) {

      if (this.hasCurrentValue()) {
        // We delete elements by making them an orphan
        this._element.current.parent(null);
        this._element.current = null;
      }

      if (value === null || typeof (value) === "undefined")
        return this;

      this._element.current = this.document().createByClass(this._items, value, this);
      return this;
    }

    /**
     * Sets the elements value. It is aware of the default and current value.
     *
     * @param {String} value
     *  the value which should be set.
     * @returns {SieveGenericUnion}
     *  a self reference. To create chains.
     **/
    setValue(value) {

      // Skip if the value has not changed ...
      if (this.hasCurrentValue() && (this.getCurrentValue() === value))
        return this;

      // ... then check if it is the default value
      if (this.hasDefaultValue() && (this.getDefaultValue() === value)) {

        this.setCurrentValue(null);
        return this;
      }

      this.setCurrentValue(value);
      return this;
    }

    /**
     * Gets the value. In case no current value is set it falls back to the default value.
     *
     * @returns {String}
     *  the currently set value as string.
     **/
    getValue() {

      if (this.isDefaultValue() === false)
        return this.getCurrentValue();

      return this.getDefaultValue();
    }

    /**
     * @param {*} value
     * @returns {}
     */
    value(value) {

      console.warn("SieveGenericUnion.value is deprecated use getValue and setValue");

      if (typeof (value) !== "undefined") {
        return this.setValue(value);
      }

      return this.getValue();
    }

    /**
     * @inheritDoc
     */
    init(parser) {

      if (this._prefix)
        this._prefix.parse(parser);

      if (this._items.length === 0)
        return this;

      this.setCurrentValue(parser);

      return this;
    }

    /**
     * @inheritDoc
     */
    toScript() {

      let result = "";

      // We do not need to render the default value in a union...
      // ... it is an implicit fallback.
      if (this.hasCurrentValue() === false)
        return "";

      if (this._prefix)
        result += this._prefix.toScript();

      result += this._element.current.toScript();

      return result;
    }
  }

  exports.SieveGenericStructure = SieveGenericStructure;
  exports.SieveGenericUnion = SieveGenericUnion;

})(window);
