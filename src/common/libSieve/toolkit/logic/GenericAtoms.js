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
     * @abstract
     *
     * @param  {SieveParser} parser
     *  the parser which should be used
     * @throws
     *   throws an exception in case the given buffer could not be parsed.
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
     * @abstract
     *
     * @returns {string}
     *   the sieve script as string
     */
    toScript() {
      throw new Error("Implement SieveAbstractGeneric::toScript");
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
     * @param {string} token
     *   the literal's token
     * @param {SieveAbstractElement} parent
     *   the parent element
     */
    constructor(token, parent) {

      super(parent);

      if (token === null || typeof (token) === "undefined" || typeof (token) !== "string")
        throw new Error("Token in a Literal as to be a string but is " + typeof (token));

      this._token = token;
      this._literal = null;

      this._pre = this.getParent().createByName("whitespace", "");
      this._post = null;
    }

    /**
     * Initializes the whitespace before the element.
     *
     * Defaults to an empty string if omitted.
     *
     * @param {string} [prefix]
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
     * @param {string} postfix
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
     * @inheritdoc
     */
    parse(parser) {

      if (this.getDocument().probeByClass("whitespace", parser))
        this._pre.init(parser);
      else
        this._pre.init("");

      // Preserve the original token's case.
      this._literal = parser.extract(this._token);

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
     * @inheritdoc
     */
    toScript() {
      let result = "";

      result += this._pre.toScript();

      // We prefer the user's way of writing the token
      if (this._literal !== null)
        result += this._literal;
      else
        result += this._token;

      if (this._post !== null)
        result += this._post.toScript();

      return result;
    }


  }

  /**
   * Models parameters. Parameters are a sequence of elements
   * in a fixed order. All elements have to exist.
   */
  class SieveGenericMandatoryItem extends SieveAbstractGeneric {

    /**
     * @inheritdoc
     */
    constructor(parent) {
      super(parent);
      this._elements = new Map();
    }

    /**
     * Checks it the given id is an child element of this item
     * @param {string} id
     *   the element's id
     * @returns {boolean}
     *   true in case the element exists otherwise false
     */
    hasElement(id) {
      return this._elements.has(id);
    }

    /**
     * Returns the child element with the given id.
     *
     * In case the item has no known child element with the id an
     * exception will be throws.
     *
     * @param {string} id
     *   the element's id
     * @returns {*}
     *   the child element with the given id.
     */
    getElement(id) {

      if (!this.hasElement(id))
        throw new Error("No Element with id " + id);

      return this._elements.get(id).element;
    }

    /**
     * Initializes the given parameter.
     * @param {object} parameter
     *  the parameter which should be set
     */
    addParameter(parameter) {

      if (parameter.type === null || typeof (parameter.type) === 'undefined')
        throw new Error("Parameter without a type ");

      const item = {};
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
     * @inheritdoc
     */
    require(capabilities) {

      this._elements.forEach((item) => {
        item.element.require(capabilities);
      });

      return this;
    }

    /**
     * @inheritdoc
     */
    parse(parser) {

      this._elements.forEach((item) => {
        item.whitespace.init(parser);
        item.element.init(parser);
      });

      return this;
    }

    /**
     * @inheritdoc
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
   * A dependent element can only exist if an other element they depend on exits.
   * It is used e.g with variables lists in has flag.
   */
  class SieveGenericDependentItem extends SieveGenericMandatoryItem {

    /**
     * Checks if this elements is a dependent element.
     * @returns {boolean}
     *   true in case the element is dependent otherwise false.
     */
    isDependent() {
      return true;
    }

    /**
     * @inheritdoc
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
     * @inheritdoc
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
     * @inheritdoc
     */
    constructor(parent) {
      super(parent);

      this._optionals = new Map();
      this._elements = new Set();

      this._tail = null;
    }

    /**
     * Checks if the given id is managed by this element.
     * @param {string} id
     *   the element's unique id
     * @returns {boolean}
     *   true in case the element is a child element otherwise false.s
     */
    hasElement(id) {
      return this._optionals.has(id);
    }

    /**
     * Returns the element for the given id.
     * @param {string} id
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
     * @param {string} id
     *   the child element's unique id.
     * @param {boolean} [status]
     *   the optional new status. If set to false the element will be disabled.
     *   true enables the element.
     *
     * @returns {boolean}
     *   the element's current status.
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
     * Adds a new tag to the element
     * @param {*} tag
     *   the tag which should be added.
     *
     */
    addTag(tag) {

      if (tag.type === null || typeof (tag.type) === 'undefined')
        throw new Error("Tag without a type");

      if (tag.id === null || typeof (tag.id) === 'undefined')
        throw new Error("Tag without an id");

      // Skip element if it is not supported by the current system
      if (SieveLexer.supportsByName(tag.type) === false)
        return;

      const item = {};
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
     * @param {object} tags
     * @returns {SieveGenericOptionalItem}
     *   a self reference
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
     * @inheritdoc
     */
    parse(parser) {

      // Skip in case this element has not tags
      if (!this._optionals)
        return this;

      this._elements = new Set();

      // Tags may be optional, which means they might be there nor not...
      const pos = parser.pos();

      // ... in any case it needs to be separated by a whitespace
      // if not we know are no tags.
      let whitespace = this.getParent().createByName("whitespace", "");
      if (this.getDocument().probeByClass("whitespace", parser))
        whitespace.init(parser);

      // then we clone the tags element to track duplicate elements.
      const ids = new Set(this._optionals.keys());
      let hasTags = true;

      // now we need to parse until there are no more tags.
      while (hasTags) {

        hasTags = false;

        for (const id of ids) {

          const item = this._optionals.get(id);

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
      if (!this._elements.size) {

        this._tail = null;
        parser.pos(pos);
        return this;
      }

      this._tail = whitespace;

      return this;
    }

    /**
     * @inheritdoc
     */
    require(imports) {

      for (const id of this._elements) {
        this._optionals.get(id).element.require(imports);
      }

      return this;
    }

    /**
     * @inheritdoc
     */
    isDefault() {
      // in case we have an element we can skip...
      if (this._elements.size)
        return false;

      // ... otherwise we need to check if one of our
      // optionals has a non default value.
      for (const item of this._optionals.values()) {
        if (!item.element.isDefault)
          continue;

        if (item.element.isDefault())
          return true;
      }

      return false;
    }

    /**
     * @inheritdoc
     */
    toScript() {

      let result = "";

      // We try to preserve all elemets entered by the user
      for (const id of this._elements) {

        const item = this._optionals.get(id);

        result += item.whitespace.toScript();
        result += item.element.toScript();
      }

      // Then add other optional elements.
      for (const [id, item] of this._optionals) {

        if (this._elements.has(id))
          continue;

        if (!item.element.isDefault)
          continue;

        if (item.element.isDefault())
          continue;

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
     * @inheritdoc
     */
    constructor(docshell, id, type) {
      super(docshell, id);

      this._elements = [];
      this._requirements = null;
      this._nodeName = type;
    }

    /**
     * @inheritdoc
     */
    nodeName() {
      if (this._nodeName === null)
        throw new Error("Uninitialized Element");

      return this._nodeName;
    }

    /**
     * @inheritdoc
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
     * @inheritdoc
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
     * @inheritdoc
     */
    toScript() {

      let result = "";

      this._elements.forEach(function (element) {
        result += element.toScript();
      }, this);

      return result;
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
     * @param {string} id
     *   the unique element's id
     * @param {boolean} [status]
     *   the new status in case it should be changed.
     * @returns {boolean}
     *   the elements status
     */
    enable(id, status) {

      for (const item of this._elements) {

        if (!item.enable || !item.hasElement)
          continue;

        if (!item.hasElement(id))
          continue;

        return item.enable(id, status);
      }

      throw new Error("No Element with id " + id + " found");
    }

    /**
     * Adds a literal to the generic element.
     * A literal is a fixed string.
     *
     * @param {string} token
     *   the literals token
     * @param {string} [postfix]
     *   an optional prefix
     * @param {string} [prefix]
     *   an optional postfix
     * @returns {SieveGenericStructure}
     *   a self reference
     */
    addLiteral(token, postfix, prefix) {

      const literal = new SieveGenericLiteral(token, this);
      literal.setPostfix(postfix);
      literal.setPrefix(prefix);

      this._elements.push(literal);

      return this;
    }


    /**
     * @param {Array.<object>|object} tags
     * @returns {SieveGenericStructure}
     *   a self reference
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
     *   the configuration and parameters for the dependent item
     * @returns {SieveGenericStructure}
     *   a self reference
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
     *   the configuration and parameter for the generic items.
     * @returns {SieveGenericStructure}
     *   a self reference
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
     * Checks if the generic struture contains an element with the given id.
     * @param {string} id
     *   the element's unique id
     * @returns {boolean}
     *   true in case the element exists otherwise false.
     */
    hasElement(id) {

      for (const item of this._elements) {

        if (!item.hasElement || !item.hasElement(id))
          continue;

        return true;
      }

      return false;
    }

    /**
     * Returns the child element with the given id.
     * @param {string} id
     *   the unique id as string.
     * @returns {*}
     *   the element or an exception in case the id is unknown.
     */
    getElement(id) {

      for (const item of this._elements) {

        if (!item.hasElement || !item.hasElement(id))
          continue;

        return item.getElement(id);
      }

      throw new Error("No element with id " + id);
    }
  }

  /**
   * A simple group at least one of the elements has to exist.
   * There are no hidden default value logics.
   */
  class SieveGroupElement extends SieveAbstractElement {

    /**
     * @inheritdoc
     */
    constructor(docshell, id, type) {
      super(docshell, id);

      this._items = [];
      this._prefix = null;
      this._nodeName = type;
      this._current = null;
    }

    /**
     * @inheritdoc
     */
    nodeName() {
      return this._nodeName;
    }

    /**
     * Checks if the active element's name matches
     * the given name.
     *
     * @param {string} name
     *   the name to check.
     * @returns {boolean}
     *   true in case the name matches otherwise false.
     */
    isNode(name) {
      if (!this.hasCurrentElement())
        return false;

      if (this.getCurrentElement().nodeName() !== name)
        return false;

      return true;
    }

    /**
     * @inheritdoc
     */
    require(imports) {
      if (this.hasCurrentElement())
        this.getCurrentElement().require(imports);

      return this;
    }

    /**
     * Checks is represented by an element.
     *
     * @returns {boolean}
     *   true in case the current element is defined otherwise false.
     */
    hasCurrentElement() {
      return (this.getCurrentElement() !== null);
    }

    /**
     * Returns the currently active element.
     *
     * @returns {SieveAbstractElement}
     *   the current element..
     */
    getCurrentElement() {
      return this._current;
    }

    /**
     * Updates the current element by the given string or parser.
     * It will throw in case no compatible element was found.
     *
     * @param {SieveParser|string} data
     *   the data which should be parsed.
     * @returns {SieveGroupElement}
     *   a self reference
     */
    setCurrentElement(data) {

      if (this.hasCurrentElement()) {
        // We delete elements by making them an orphan
        this.getCurrentElement().parent(null);
        this._current = null;
      }

      this._current = this.document().createByClass(this._items, data, this);
      return this;
    }

    /**
     * Sets a prefix for this union.
     *
     * @param {string} [token]
     *   the prefix as string. The token may be null to simplify parsing.
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
     * Adds new item definitions to the union.
     * Keep in mind at most one element of a union can match.
     * All elements are threated equally.
     *
     * @param {*} items
     *   the elements to add to this union.
     * @returns {SieveGenericUnion}
     *   a self reference
     */
    addItems(items) {

      this._items = this._items.concat(items);
      return this;
    }

    /**
     * @inheritdoc
     */
    init(parser) {

      if (this._prefix)
        this._prefix.parse(parser);

      if (!this._items.length) {
        this._current = null;
        return this;
      }

      this.setCurrentElement(parser);
      return this;
    }

    /**
     * @inheritdoc
     */
    toScript() {

      let result = "";
      if (this._prefix)
        result += this._prefix.toScript();

      if (this.hasCurrentElement())
        result += this.getCurrentElement().toScript();

      return result;
    }

    /**
     * All of your values are well defined so we do not have
     * any implicit default values.
     *
     * @returns {boolean}
     *   always false.
     */
    isDefault() {
      return false;
    }
  }

  /**
   * A group with an implicit default value.
   * The default value acts like an independent state and is not contained
   * in the possible elements.
   *
   * e.g. the vacation action defines the flags :days and :seconds
   * which are mutural exclusive. In case neiterone of the two states
   * is specified it falls back to an implicte third state. Which is the
   * server's default value.
   */
  class SieveImplicitGroupElement extends SieveGroupElement {

    /**
     * @inheritdoc
     */
    init(parser) {

      if (this._prefix)
        this._prefix.parse(parser);

      if (!this._items.length) {
        this._current = null;
        return this;
      }

      this.setCurrentElement(parser);
      return this;
    }

    /**
     * When data is null the current element will be reset to default
     * otherwise the value will be set as current element.
     *
     * @override
     */
    setCurrentElement(data) {

      if (typeof (data) !== "undefined" && data !== null) {
        super.setCurrentElement(data);
        return this;
      }

      if (!this.hasCurrentElement())
        return this;

      // We delete elements by making them an orphan
      this.getCurrentElement().parent(null);
      this._current = null;
      return this;
    }

    /**
     * Checks if the group has an active element.
     *
     * @param {string} [id]
     *   an optional id of the child elemenet to get
     * @returns {boolean}
     *   true in case the element can be rendered
     *   otherwise false.
     */
    hasElement(id) {

      if (!this.hasCurrentElement())
        return false;

      if ((typeof (id) !== "undefined") && (id !== null))
        return this.getCurrentElement().hasElement(id);

      return true;
    }

    /**
     * Returns the group's active element.
     *
     * It is similar to getCurrentElement but there are two
     * major differences.
     *
     * The first one is, it will throw instead of returning
     * null when accessing non existant element or when
     * no element is active.
     * The other difference is that you can access children
     * directly by their id.
     *
     * @param {string} [id]
     *   an optional id of the child elemenet to get
     * @returns {SieveAbstractElement}
     *   the active element.
     */
    getElement(id) {

      // In case we don't have an element we have to fail...
      if (!this.hasElement(id))
        throw new Error("No current element defined. Implicit server default used");

      // ... otherwise in case no id is specified we just
      // return the current element ...
      if ((typeof (id) === "undefined") || (id === null)) {
        return this.getCurrentElement();
      }

      // ... otherwise we return the current element's sub element.
      return this.getCurrentElement().getElement(id);
    }

    /**
     *
     * @param {*} data
     */
    setElement(data) {
      this.setCurrentElement(data);
      return this;
    }

    /**
     * The default value is the server side default. It is basically
     * an empty string, this signal the elment is only known to the
     * server.
     *
     * All other possible value are client side values and have
     * a well defined value.
     *
     * @returns {boolean}
     *   true in case it is the server side default otherwise false.
     */
    isDefault() {
      return !(this.hasCurrentElement());
    }

  }

  /**
   * A group with an explicit default value.
   * The default is equivalent to one of the possible element.
   *
   * e.g. in case no match type is specified sieve specifies an
   * fallback to an :is
   */
  class SieveExplicitGroupElement extends SieveImplicitGroupElement {

    /**
     * @inheritdoc
     */
    constructor(docshell, id, nodeName) {
      super(docshell, id, nodeName);
      this._default = null;
    }

    /**
     * The default value will be used whenever no other group
     * value is set.
     *
     * @returns {SieveAbstractElement}
     *    the default value for this group.
     */
    getDefaultElement() {
      return this._default;
    }

    /**
     * Parses the given data and sets the default element.
     *
     * @param {SieveParser|Sieve} data
     *   the data which should be parsed.
     * @returns {SieveExplicitGroupElement}
     *   a self reference
     */
    setDefaultElement(data) {

      if (this._default !== null)
        throw new Error("Default already defined. Can not be redefined.");

      this._default = this.document().createByClass(this._items, data, this);
      return this;
    }

    /**
     * @param {string} [id]
     *   an optional id of the child elemenet to get
     * @returns {SieveAbstractElement}
     *   the active element. This can be either the current or the default element.
     */
    getElement(id) {

      // In case the optional id is set...
      if ((typeof (id) !== "undefined") && (id !== null)) {
        // we call getElement without the optional id and then
        // request the child element with the given id from the result.
        return this.getElement().getElement(id);
      }

      // Check if there is a user specified value...
      if (this.hasCurrentElement())
        return this.getCurrentElement();

      // ... otherwise we use the default, it is guaranteed to exist.
      return this.getDefaultElement();
    }

    /**
     * Sets the current element.
     * This involves some guessing magic, to keep as much of the user structure as possible.
     *
     * @param {string} value
     *   the new value to set.
     * @returns {SieveExplicitGroupElement}
     *   a self reference
     */
    setElement(value) {

      // We can skip in case nothing was changed...
      if (this.hasCurrentElement() && (this.getCurrentElement().toScript() === value))
        return this;

      // ... if possible we prefer the default value...
      if (this.getDefaultElement().toScript() === value) {

        // which means removing the current value if needed.
        if (this.hasCurrentElement()) {
          this._current.parent(null);
          this._current = null;
        }

        return this;
      }

      // in any other case we need to update the current value.
      this.setCurrentElement(value);
      return this;
    }


    /**
     * @inheritdoc
     */
    isDefault() {

      // in case we do not have a current element we know
      // it is the default value.
      if (!this.hasCurrentElement())
        return true;

      // in case the current element is of the same type as
      // the default value we keep the current element.
      return false;
    }

    /**
     * @inheritdoc
     */
    require(imports) {

      this.getElement().require(imports);
      return this;
    }

    /**
     * @inheritdoc
     */
    toScript() {

      if (this.isDefault())
        return "";

      return super.toScript();
    }
  }

  exports.SieveGenericStructure = SieveGenericStructure;
  exports.SieveExplicitGroupElement = SieveExplicitGroupElement;
  exports.SieveImplicitGroupElement = SieveImplicitGroupElement;
  exports.SieveGroupElement = SieveGroupElement;

})(window);
