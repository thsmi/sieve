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
 * Attributes are added to parameters.
 */


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
function attribute(key, type, value) {

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
function number(key, value) {
  return attribute(key, "number", `${value}`);
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
function string(key, value = "") {
  // TODO properly escape value
  return attribute(key, "string", `"${value}"`);
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
function stringList(key, values = "") {

  // TODO properly escape values.

  if (Array.isArray(values)) {
    values = `[${values.map((value) => { return `"${value}"`; }).join(",")}]`;
  } else
    values = `"${values}"`;

  return attribute(key, "stringlist", values);
}

export {
  attribute, optional, tag,
  number, string, stringList
};
