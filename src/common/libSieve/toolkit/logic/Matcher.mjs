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
 * Creates a new token matcher specification.
 * A token matcher tests if the the given token matches.
 *
 * @returns {object}
 *   the matcher specification
 */
function tokenMatcher() {
  return {
    matcher: (property, spec, parser) => {
      if ((typeof(property.token) === "undefined") || (property.token === null))
        throw new Error(`Invalid token matcher for ${spec.id.node}`);

      return parser.startsWith(property.token);
    }
  };
}

/**
 * Creates a new class matcher specification.
 * A class matcher probes if any of the given types matches.
 *
 * @returns {object}
 *   the matcher specification
 */
function classMatcher() {
  return {
    matcher: (property, spec, parser, document) => {
      if (!property.types)
        throw new Error(`No types specified for ${spec.id.node}`);

      return document.probeByClass(property.types, parser);
    }
  };
}

export {
  classMatcher, tokenMatcher
};
