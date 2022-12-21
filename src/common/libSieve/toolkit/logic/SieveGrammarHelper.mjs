/*
 * The contents of this file are licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via
 * email from the author.
 *
 * Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

import * as Matcher from "./Matcher.mjs";

/**
 * Implements syntactic sugar to make the AST files more readable.
 */

/**
 *
 * @param {object} spec
 *   the elements specification.
 * @param {*} before
 * @returns {object}
 */
function insert(spec, before) {

  return { property : (properties) => {
    const property = properties.find((item) => {
      return ((item.id) && (item.id === spec.id));
    });

    if (property) {
      property.elements.push(...spec.elements);
      return;
    }

    if (!before)
      throw new Error("No such property");

    const idx = properties.findIndex((item) => {
      return ((item.id) && (item.id === before));
    });

    properties.splice(idx, 0, spec);
  }};
}

/**
 *
 * @param {*} item
 * @returns
 */
function before(item) {
  return item.id;
}

/**
 * Wraps an identifier with node and type information.
 */
class Identifier {

  /**
   * Creates a new instance.
   *
   * @param {string} node
   *   the unique node name.
   * @param {string} [type]
   *   the type name, if omitted it will use the node name.
   */
  constructor(node, type) {

    if (node.startsWith("@"))
      throw Error("Invalid node name");

    this.node = node;

    if ((typeof(type) === "undefined") || (type === null))
      type = `@${this.node}`;

    if (!type.startsWith("@"))
      throw Error(`Invalid type ${type}`);

    this.type = type;
  }
}

// FIXME this is very identical with GenericCapabilities...
/**
 *
 */
class Imports {

  /**
   * Creates a new instance.
   *
   * @param {*} requires
   *   the requirements needed by the element.
   */
  constructor(requires) {
    this.requires = null;

    if ((typeof(requires) !== "undefined") && requires !== null)
      this.requires = requires;
  }

  /**
   * Checks if the import is supported by the capabilities.
   *
   * @param {*} capabilities
   *   the server's capabilities.
   * @returns {boolean}
   *   true in case is it supported otherwise false.
   */
  isCapable(capabilities) {
    return capabilities.isCapable(this.requires);
  }

  /**
   *
   * @returns {object}
   */
  getImports() {
    return this.requires;
  }
}

/**
 * Specified the elements unique identifiers.
 *
 * @param {string} node
 *   the node name, used when creating or referring to this element.
 *
 * @param {string} [type]
 *   the optional type name, used to group elements with similar capabilities,
 *   like actions tests, match-types, comparators.
 *
 *   If omitted the node name will be used.
 *
 * @param {string|object} [requires]
 *   the optional capabilities which are needed for this element.
 *
 * @returns {Identifier}
 *   a the unique object identifier.
 */
function id(node, type, requires) {
  return {
    id : new Identifier(node, type),
    requires : new Imports(requires)
  };
}

/**
 * Defines token which need to be an exact match..
 *
 * @param {string} literal
 *   the unique token used for matching
 * @param {string} [postfix]
 *   the token's optional postfix used consume e.g. whitespace.
 *
 * @returns {object}
 *   the structure for parsing the token.
 */
function token(literal, postfix) {
  return {
    "token": literal,
    "postfix" : postfix,
    ...Matcher.tokenMatcher(),
    "initializer" : (element, spec) => {
      // FIXME: we should throw here as soon as all elements are converted.
      if (element.addToken)
        element.addToken(spec.token, spec.postfix);
    }
  };
}

/**
 *
 * @param  {...any} items
 * @returns {object}
 */
function any(...items) {
  return { "any" : items};
}

/**
 *
 * @param  {...any} items
 * @returns {object}
 */
function all(...items) {
  return { "all" : items};
}

/**
 * Sets the elements default value.
 *
 * There are three kinds of default value.
 *
 * The easiest is when the value is mandatory. Omitting it results in a syntax
 * error. But we need to know what value to use when creating a new element.
 * You model this by setting the value which and mandatory to true.
 *
 * The next kind is an explicit default value. This the value is optional and
 * a missing value means we fall back to the well specified default value.
 * You model this by setting a value and mandatory to false.
 *
 * And finally there is an implicit default, in case the tag is omitted, the
 * server just uses his default. Thus we as a client do not know what the
 * default is. YOu model this by not setting a default value at all.
 *
 * @param {string} value
 *   the default value
 * @param {boolean} [mandatory]
 *   if true the value is mandatory and only used a initializer.
 *
 * @returns {object}
 *   the value specification.
 */
function value(value, mandatory) {

  if ((typeof(mandatory) === "undefined") || (mandatory === null))
    mandatory = false;

  return {
    "initializer" : function(element, elm) {
      if (elm.mandatory)
        element.setCurrentElement(elm.value);
      else
        element.setDefaultElement(elm.value);
    },
    "value" : value,
    "mandatory" : mandatory
  };
}

/**
 * Specifies an element which is of any of the given types
 *
 * @param  {...string} types
 *   the types which are accepted by the property.
 * @returns {object}
 *   the property definition.
 */
function items(...types) {

  if (!types.length)
    throw new Error("One or more types expected");

  for (const type of types)
    if (!type.startsWith("@"))
      throw new Error(`Invalid type ${type}`);

  return {
    "initializer" : function(element, elm) {
      // FIXME: we should throw here as soon as all elements are converted.
      if (element.addItems)
        element.addItems(...elm.types);
    },
    ...Matcher.classMatcher(),
    "types" : types
  };
}

export {
  fields, optionals, tags, parameters
} from "./Properties.mjs";

export {
  attribute, optional, tag,
  number, string, stringList
} from "./Attributes.mjs";

export {
  any, all,
  id, token,
  Identifier, Imports,
  before, insert,
  items, value
};
