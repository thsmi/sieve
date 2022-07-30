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

// TODO Implement shorthands for extending classes.

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
 *   the container.
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
 * @returns
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
 *   the optional structure.
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
 * @param {*} type
 * @param {*} value
 * @returns
 */
function field(key, type, value) {

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
 *
 * @param {string} key
 *   the fields unique name.
 * @param {*} value
 * @returns
 */
function numericField(key, value) {
  return field(key, "number", `${value}`);
}

/**
 *
 * @param {string} key
 *   the fields unique name.
 * @param {*} value
 * @returns
 */
function stringField(key, value = "") {
  // TODO properly escape value
  return field(key, "string", `"${value}"`);
}

/**
 *
 * @param {string} keys
 *   the fields unique name.
 * @param {*} values
 * @returns
 */
function stringListField(key, values = "") {

  // TODO properly escape values.

  if (Array.isArray(values)) {
    values = `[${values.map((value) => { return `"${value}"`; }).join(",")}]`;
  } else
    values = `"${values}"`;

  return field(key, "stringlist", values);
}

class Identifier {

  constructor(node, type) {

    if ((typeof(type) === "undefined") || (type === null)) {
      type = node;
    }

    this.node = node;
    this.type = type;
  }
}

// FIXME this is very idential with GenericCapabilities...
class Imports {

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


function tokenMatcher() {
  return { matcher : (scope, parser, lexer) => { return parser.startsWith(scope.token); } };
}


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

function any(...items) {
  return { "any" : items};
}

function all(...items) {
  return { "all" : items};
}

// Group
//   node
//   type
//   token
//   value
//   mandatory

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
  fields, optionals, parameters, tags, classMatcher,
  field, numericField, stringField, stringListField, tag, Identifier, Imports
};
