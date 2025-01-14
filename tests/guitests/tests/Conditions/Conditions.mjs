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

import { suite } from "./../../js/TestSuite.mjs";

const FIRST_ELEMENT = 0;
const SECOND_ELEMENT = 1;
const THIRD_ELEMENT = 2;

const IF = 'if ';
const ELSE = 'else ';
const ELSIF = 'elsif ';

const EXISTS = 'exists "From"';
const SIZE = 'size :over 1M';

const EMPTY_BODY = '{\r\n}';
const KEEP = "\r\nkeep;\r\n";
const KEEP_BODY = '{' + KEEP + '}';
const NEW_LINE = "\r\n";

const DROP_BOX = "#divOutput > div > div.sivBlock > div.sivDropBox";
const CONDITION_DROP_BOX = ".sivCondition > .sivSummaryContent > .sivDropBox";

const SIDEBAR_EXISTS = "#sivTests div.siv-test-exists";
const SIDEBAR_SIZE = "#sivTests div.siv-test-size";
const SIDEBAR_KEEP = "#sivActions div.siv-action-keep";

const TEST_EXISTS = "#divOutput .sivConditionalChild > .siv-test-exists";
const TEST_SIZE = "#divOutput .sivConditionalChild > .siv-test-size";
const ACTION_KEEP = "#divOutput .sivConditional > .sivBlock > .siv-action-keep";


const fixture = suite.add("Conditions");

/**
 * Start with empty script
 *
 * add if test
 * add else action
 * add elsif test
 */
fixture.add("Construct if, then else then elif", async(simulator) => {
  let target = null;

  // Start with an empty script
  await simulator.init();

  // Add an exists test
  // Drop a test which creates an if
  target = await simulator.waitForNthElement(DROP_BOX, FIRST_ELEMENT);
  await simulator.dragAndDrop(SIDEBAR_EXISTS, target);
  await simulator.assertScript(IF + EXISTS + EMPTY_BODY + NEW_LINE);

  // Add a keep action
  // Dropping an action onto the first drop target is rejected
  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, FIRST_ELEMENT);
  await simulator.dragAndReject(SIDEBAR_KEEP, target);

  // Dropping an action onto the second drop target creates an else
  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, SECOND_ELEMENT);
  await simulator.dragAndDrop(SIDEBAR_KEEP, target);
  await simulator.assertScript(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSE + KEEP_BODY);

  // Add a size test
  // Dropping an test onto the first drop target is possible but uninteresting
  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, FIRST_ELEMENT);
  await simulator.dragAndAbort(SIDEBAR_SIZE, target);

  // Dropping an test onto the third drop target is rejected
  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, THIRD_ELEMENT);
  await simulator.dragAndReject(SIDEBAR_SIZE, target);

  // Drops a test on the second drop target creates an elsif
  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, SECOND_ELEMENT);
  await simulator.dragAndDrop(SIDEBAR_SIZE, target);
  await simulator.assertScript( ""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSIF + SIZE + EMPTY_BODY + NEW_LINE
    + ELSE + KEEP_BODY);
});

/**
 * Start with empty script
 *
 * add if test
 * add elsif test
 * add else action
 */
fixture.add("Construct if, then elif then else", async(simulator) => {
  let target = null;

  // Start with an empty script
  await simulator.init();

  // Add an exists test
  // Drop a test which creates an if
  target = await simulator.waitForNthElement(DROP_BOX, FIRST_ELEMENT);
  await simulator.dragAndDrop(SIDEBAR_EXISTS, target);
  await simulator.assertScript(IF + EXISTS + EMPTY_BODY + NEW_LINE);

  // Add a size test
  // Dropping an test onto the first drop target is possible but uninteresting
  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, FIRST_ELEMENT);
  await simulator.dragAndAbort(SIDEBAR_SIZE, target);

  // Drops a test on the second drop target create an elsif
  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, SECOND_ELEMENT);
  await simulator.dragAndDrop(SIDEBAR_SIZE, target);
  await simulator.assertScript( ""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSIF + SIZE + EMPTY_BODY + NEW_LINE);

  // Add a keep action
  // Dropping an test onto the first drop target is rejected
  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, FIRST_ELEMENT);
  await simulator.dragAndReject(SIDEBAR_KEEP, target);

  // Dropping an test onto the second drop target is rejected
  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, SECOND_ELEMENT);
  await simulator.dragAndReject(SIDEBAR_KEEP, target);

  // Drops a test on the second drop target create an elsif
  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, THIRD_ELEMENT);
  await simulator.dragAndDrop(SIDEBAR_KEEP, target);
  await simulator.assertScript( ""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSIF + SIZE + EMPTY_BODY + NEW_LINE
    + ELSE + KEEP_BODY);
});


/**
 * Start with empty script
 *
 * add if test
 * add elsif before if -> if gets converted to elsif
 * add else action
 */
fixture.add("Construct if, then if then else", async(simulator) => {
  let target = null;

  // Start with an empty script
  await simulator.init();

  // Add an exists test
  // Drop a test which creates an if
  target = await simulator.waitForNthElement(DROP_BOX, FIRST_ELEMENT);
  await simulator.dragAndDrop(SIDEBAR_EXISTS, target);
  await simulator.assertScript(IF + EXISTS + EMPTY_BODY + NEW_LINE);

  // Add a size test
  // Dropping an test onto the second drop target is possible but uninteresting
  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, SECOND_ELEMENT);
  await simulator.dragAndAbort(SIDEBAR_SIZE, target);

  // Drops a test on the first drop target create an if and convert the existing
  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, FIRST_ELEMENT);
  await simulator.dragAndDrop(SIDEBAR_SIZE, target);
  await simulator.assertScript( ""
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + ELSIF + EXISTS + EMPTY_BODY + NEW_LINE);

  // Add a keep action
  // Dropping an test onto the first drop target is rejected
  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, FIRST_ELEMENT);
  await simulator.dragAndReject(SIDEBAR_KEEP, target);

  // Dropping an test onto the second drop target is rejected
  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, SECOND_ELEMENT);
  await simulator.dragAndReject(SIDEBAR_KEEP, target);

  // Drops a test on the second drop target create an elsif
  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, THIRD_ELEMENT);
  await simulator.dragAndDrop(SIDEBAR_KEEP, target);
  await simulator.assertScript( ""
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + ELSIF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSE + KEEP_BODY);

});

/**
 * Start with empty script
 *
 * add if test
 * add else action
 * add elsif before if -> if gets converted to elsif
 */
fixture.add("Construct if, then else then if", async(simulator) => {
  let target = null;

  // Start with an empty script
  await simulator.init();

  // Add an exists test
  // Drop a test which creates an if
  target = await simulator.waitForNthElement(DROP_BOX, FIRST_ELEMENT);
  await simulator.dragAndDrop(SIDEBAR_EXISTS, target);
  await simulator.assertScript(IF + EXISTS + EMPTY_BODY + NEW_LINE);


  // Add a keep action
  // Dropping an action onto the first drop target is rejected
  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, FIRST_ELEMENT);
  await simulator.dragAndReject(SIDEBAR_KEEP, target);

  // Dropping an action onto the second drop target creates an else
  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, SECOND_ELEMENT);
  await simulator.dragAndDrop(SIDEBAR_KEEP, target);
  await simulator.assertScript(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSE + KEEP_BODY);


  // Add a size test
  // Dropping an test onto the second drop target is possible but uninteresting
  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, SECOND_ELEMENT);
  await simulator.dragAndAbort(SIDEBAR_SIZE, target);

  // Dropping an test onto the third drop target is rejected
  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, THIRD_ELEMENT);
  await simulator.dragAndReject(SIDEBAR_SIZE, target);

  // Drops a test on the first drop target creates an if and converts the existing
  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, FIRST_ELEMENT);
  await simulator.dragAndDrop(SIDEBAR_SIZE, target);
  await simulator.assertScript( ""
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + ELSIF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSE + KEEP_BODY);
});

fixture.add("Deconstruct else, then elsif then if", async (simulator) => {

  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSIF + SIZE + EMPTY_BODY + NEW_LINE
    + ELSE + KEEP_BODY);


  await simulator.dragAndDrop(
    ACTION_KEEP,
    "div.sivDropBox,sivTrashBin");
  await simulator.assertScript( ""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSIF + SIZE + EMPTY_BODY + NEW_LINE);


  await simulator.dragAndDrop(
    TEST_SIZE,
    "div.sivDropBox,sivTrashBin");
  await simulator.assertScript( ""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE);


  await simulator.dragAndDrop(
    TEST_EXISTS,
    "div.sivDropBox,sivTrashBin");
  await simulator.assertScript("");
});

fixture.add("Deconstruct elseif, then else then if", async (simulator) => {

  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSIF + SIZE + EMPTY_BODY + NEW_LINE
    + ELSE + KEEP_BODY);

  await simulator.dragAndDrop(
    TEST_SIZE,
    "div.sivDropBox,sivTrashBin");
  await simulator.assertScript( ""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSE + KEEP_BODY);


  await simulator.dragAndDrop(
    ACTION_KEEP,
    "div.sivDropBox,sivTrashBin");
  await simulator.assertScript( ""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE);


  await simulator.dragAndDrop(
    TEST_EXISTS,
    "div.sivDropBox,sivTrashBin");
  await simulator.assertScript("");
});

fixture.add("Deconstruct elseif, then if", async (simulator) => {

  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSIF + SIZE + EMPTY_BODY + NEW_LINE
    + ELSE + KEEP_BODY);


  await simulator.dragAndDrop(
    TEST_EXISTS,
    "div.sivDropBox,sivTrashBin");
  await simulator.assertScript( ""
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + ELSE + KEEP_BODY);


  await simulator.dragAndDrop(
    TEST_SIZE,
    "div.sivDropBox,sivTrashBin");
  await simulator.assertScript(KEEP);
});




// Test moving condition around.

// TODO move test between ifs

// !! IFs and also movable only tests are movable

// FIXME:
// Following sequence leaves artifacts:
// move elsif to drop target before if
// move test back to elsif

// move if condition (not test) after elsif creates an else if instead of an elsif

// TODO Check:
// Action on end of elsif -> create else
// Action on end of else -> reject
