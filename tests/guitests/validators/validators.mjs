
/**
 *
 * @param {*} elm
 * @param {*} name
 * @param {*} items
 */
function validateElements(elm, name, items) {
  if (!elm)
    throw new Error(`${name} expected but not found`);

  if (!elm.classList.contains(name))
    throw new Error(`${name} expected but got ${elm.outerHTML.substring(0, 40)}...`);

  const children = [...elm.children];

  for (const item of items)
    item(children);

  if (!children.length)
    throw new Error("Invalid structure too many elements...");
}

/**
 *
 * @param {*} type
 * @returns
 */
function sivSpacer(type) {
  return (elms) => {

    if (!elms.length)
      throw new Error(`Spacer ${type} expected but not found`);

    const elm = elms.shift();

    if (elm.children.length !== 0)
      throw new Error("No Children expected");

    if (!elm.classList.contains("sivDropBox") )
      throw new Error("Dropbox expected");

    if (!elm.classList.contains(type))
      throw new Error(type + " spacer expected");
  };
}

/**
 *
 * @returns
 */
function sivConditionSpacer() {
  return sivSpacer("sivConditionSpacer");
}

/**
 *
 * @returns
 */
function sivBlockSpacer() {
  return sivSpacer("sivBlockSpacer");
}

/**
 *
 */
function sivCondition(...items) {
  const structure = [sivConditionSpacer()];

  for (const item of items) {
    structure.push(item);
    structure.push(sivConditionSpacer());
  }

  return (elms) => {
    return validateElements(elms.shift(), "sivCondition", structure);
  };
}

/**
 *
 * @param  {...any} items
 * @returns
 */
function sivBlock(...items) {

  const structure = [sivBlockSpacer()];
  for (const item of items) {
    structure.push(item);
    structure.push(sivBlockSpacer());
  }

  return (elms) => {
    return validateElements(elms.shift(), "sivBlock", structure);
  };
}

/**
 *
 * @param {*} type
 * @returns
 */
function sivTest(type) {
  return (elm) => {
    if (!elm.classList.contains("sivConditionalChild"))
      throw new Error(`conditionalChild expected but got ${elm.outerHTML.substring(0, 40)}...`);

    if (elm.length !== 1)
      throw new Error("Invalid children.");

    elm = elm.children[0];

    if (!elm.classList.contains("sivTest"))
      throw new Error(`test expected but got ${elm.outerHTML.substring(0, 40)}...`);

    if (!elm.classList.contains(`siv-test-${type}`))
      throw new Error(`${type} expected but got ${elm.outerHTML.substring(0, 40)}...`);
  };
}

/**
 *
 * @param {*} condition
 * @returns
 */
function sivNot(condition) {
  return (elm) => {
  };
}

/**
 *
 * @param {*} condition
 * @returns
 */
function sivAnyOf(condition) {
  return (elm) => {
  };
}

/**
 *
 * @param {*} condition
 * @returns
 */
function sivAllOf(condition) {
  return (elm) => {
  };
}

/**
 *
 * @param {function} condition
 * @param  {...function} [body]
 * @returns
 */
function sivIf(condition, ...body) {
  return (elms) => {
    if ((typeof body === "undefined") || (body === null))
      body = [];

    if (!elms.length < 2)
      throw new Error(`If expected but not found`);

    let elm = elms.shift();
    if (!elm.classList.contains("sivConditionIf"))
      throw new Error(`If expected  but got ${elm.outerHTML.substring(0, 40)}...`);

    elm = elms.shift();
    if (!elm.classList.contains("sivConditionChild"))
      throw new Error(`If condition expected  but got ${elm.outerHTML.substring(0, 40)}...`);

    let children = [...elm.children];

    if (elm.children.length !== 1)
      throw new Error("sivConditional expected but not found.");

    if (!elm.children[0].classList.contains("sivConditional"))
      throw new Error(`sivConditional expected but got ${elm.outerHTML.substring(0, 40)}...`);

    children = [...elm.children];

    if (elm.children !== 2)
      throw new Error("sivConditional expected but not found.");

    condition(children.shift());

    (sivBlock(body))(children.shift());
  };
}

/**
 *
 * @param {*} test
 * @param {*} body
 * @returns
 */
function sivElseIf(test, body) {
  return (elms) => {
    if (!elms.length < 2)
      throw new Error(`Elseif expected but not found`);

    let elm = elms.shift();
    if (!elm.classList.contains("sivConditionElseIf"))
      throw new Error(`elseif expected  but got ${elm.outerHTML.substring(0, 40)}...`);

    // TODO test the if

    elm = elms.shift();
    if (!elm.classList.contains("sivConditionChild"))
      throw new Error(`elseif expected  but got ${elm.outerHTML.substring(0, 40)}...`);

    // TODO test the body...
  };
}

/**
 *
 * @param {*} test
 * @param {*} body
 * @returns
 */
function sivElse(test, body) {
  return (elms) => {
    if (!elms.length < 1)
      throw new Error(`Else expected but not found`);

    const elm = elms.shift();
    if (!elm.classList.contains("sivConditionChild"))
      throw new Error(`Else expected  but got ${elm.outerHTML.substring(0, 40)}...`);

    // TODO test the body...
  };
}


/**
 *
 **/
function validate(root, ...items) {
  (sivBlock(...items))([root]);
}

export {
  validate,
  sivCondition,
  sivTest,
  sivIf
};
