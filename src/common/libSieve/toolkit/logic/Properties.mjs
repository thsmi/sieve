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
    "initializer" : (element, spec) => { element.addProperties(spec.elements, true); }
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
    "initializer": (element, spec) => { element.addProperties(spec.elements, false); }
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

export {
  fields,
  optionals,
  tags,
  parameters
};
