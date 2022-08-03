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

/**
 * Implements syntactic sugar to make the AST files more readable.
 */

/**
 * Creates a container for mandatory fields.
 *
 * @param {string} identifier
 *   the container's unique id.
 * @param  {...any} items
 *   the fields which should be added to this container.
 * @returns {object}
 *   the container.
 */
function fields(identifier, ...items) {
  return {
    "id" : identifier,
    "elements" : items,
    "initializer" : (element, spec) => { element.addParameters(spec.elements); }
  };
}

/**
 * Creates a container for optional fields.
 *
 * @param {string} identifier
 *   the container's unique id.
 * @param  {...any} items
 *   the fields which should be added to this container.
 * @returns {object}
 *   the container.
 */
function optionals(identifier, ...items) {
  return {
    ...{ "optional" : true},
    ...fields(identifier, ...items),
    "initializer": (element, spec) => { element.addTags(spec.elements); }
  };
}

/**
 * Creates a container for tag fields.
 *
 * Tags are by definition optional and the container is named 'tags'.
 *
 * @param  {...any} items
 *   the field which should be added to this tags container.
 * @returns {object}
 *   the container.
 */
function tags(...items) {
  return optionals("tags", ...items);
}

/**
 * Creates a container for parameter field.
 *
 * Parameters are by definition mandatory and the container is named 'parameters'.
 * @param  {...any} items
 *   the field which should be added to this parameters container.
 * @returns {object}
 *   the parameter specification.
 */
function parameters(...items) {
  return fields("parameters", ...items);
}


// Items which can be added to a field

/**
 * References a previously defined tag.
 *
 * Tags are by definition optional and start with a colon.
 *
 * @param {string} key
 *   the tags unique key in the element tree. It is used to identify the
 *   element's children.
 *
 * @param {string} [type]
 *   the optional type of the tag, in case it is omitted the key is used.
 *   Typically type and key are identical.
 *
 * @param {string} [imports]
 *   the optional imports needed for this tag.
 *
 * @returns {object}
 *   the tag specification.
 */
function tag(key, type, imports) {


  if ((typeof(type) === "undefined") || type === null)
    type = key;

  // TODO we should use the identifier and imports object here

  return {
    "id": key,
    "type": type,
    "requires" : imports
  };
}


/**
 * Wraps a field definitions and marks the field as optional.
 * Optional means that a missing element is not a parser error.
 *
 * @param {object} field
 *   the field structure which should be marked as optional
 * @param {string|object} [requires]
 *   the imports required by this optional element.
 * @returns {object}
 *   the optional structure specification.
 */
function optional(field, requires) {
  return {
    ...field,
    "requires": requires,
    "optional" : true
  };
}


/**
 * Defines a new property
 *
 * @param {string} key
 *   the fields unique name.
 * @param {string} type
 *   the fields type.
 * @param {string} [value]
 *   the fields optional default value
 *
 * @returns {object}
 *   the field specification.
 */
function field(key, type, value) {

  // TODO we should use an Identifier to key and type...

  if ((typeof(value) === "undefined") || (value === null)) {
    return {
      "id" : key,
      "type" : type
    };
  }

  return {
    "id" : key,
    "type" : type,
    "value" : value
  };
}


// TODO rename this to stringProperty, numericProperty and stringListProperty.

/**
 * Defines a numeric property.
 *
 * @param {string} key
 *   the fields unique name.
 * @param {number} value
 *   the default value
 *
 * @returns {object}
 *   the numeric field specification.
 */
function numericField(key, value) {
  return field(key, "number", `${value}`);
}

/**
 * Defines a string property
 *
 * @param {string} key
 *   the fields unique name.
 * @param {string} value
 *   the default value, if omitted an empty string will be used.
 *
 * @returns {object}
 *   the string field specification.
 */
function stringField(key, value = "") {
  // TODO properly escape value
  return field(key, "string", `"${value}"`);
}

/**
 * Defines a string list property
 *
 * @param {string} key
 *   the fields unique name.
 * @param {string|string[]} values
 *   the default values, if omitted a single empty string will be used.
 *
 * @returns {object}
 *   the string list specification
 */
function stringListField(key, values = "") {

  // TODO properly escape values.

  if (Array.isArray(values)) {
    values = `[${values.map((value) => { return `"${value}"`; }).join(",")}]`;
  } else
    values = `"${values}"`;

  return field(key, "stringlist", values);
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

// FIXME this is very idential with GenericCapabilities...
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
 * Creates a new token matcher specification.
 * A token matcher tests if the the given token matches.
 *
 * @returns {object}
 *   the matcher specification
 */
function tokenMatcher() {
  // return { matcher : (scope, parser, lexer) => { return parser.startsWith(scope.properties[0].token); } };
  return { matcher : (scope, parser) => { return parser.startsWith(scope.token); } };
}

/**
 * Creates a new class matcher specification.
 * A class matcher probes if any of the given types matches.
 *
 * @returns {object}
 *   the matcher specification
 */
function classMatcher() {
  return { matcher : (scope, parser, lexer) => { return lexer.probeByClass(scope.items, parser); } };
}

/**
 * Defines token which need to be an exact match..
 *
 * @param {string} token
 *   the unique token used for matching
 * @param {string} [postfix]
 *   the token's optional postfix used consume e.g. whitespace.
 *
 * @returns {object}
 *   the structure for parsing the token.
 */
function token(token, postfix) {
  return {
    "token": token,
    "postfix" : postfix,
    ...tokenMatcher(),
    "initializer" : (element, spec) => { element.addLiteral(spec.token, spec.postfix); }
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

// Group
//   node
//   type
//   token
//   value
//   mandatory

/**
 *
 * @param {*} item
 * @param {*} value
 * @returns {object}
 */
function group(item, value) {

  const rv = {
    "item" : [item]
  };

  if ((typeof(value) === "undefined") || value === null)
    rv["value"] = value;

  return rv;
}

export {
  any, all,
  id, token, group, optional,
  fields, optionals, parameters, tags,
  classMatcher, tokenMatcher,
  field, numericField, stringField, stringListField, tag, Identifier, Imports
};
