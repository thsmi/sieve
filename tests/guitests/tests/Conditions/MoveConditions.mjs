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
const FOURTH_ELEMENT = 3;
const FIFTH_ELEMENT = 4;
const SIXTH_ELEMENT = 5;
const SEVENTH_ELEMENT = 6;


const SIX_ELEMENTS = 6;
const SEVEN_ELEMENTS = 7;

const IF = 'if ';

const EXISTS = 'exists "From"';
const SIZE = 'size :over 1M';
const ADDRESS = 'address "To" "me@example.com"';

const EMPTY_BODY = '{\r\n}';
const NEW_LINE = "\r\n";

const CONDITION_DROP_BOX = ".sivCondition > .sivSummaryContent > .sivDropBox";
const BLOCK_DROP_BOX = ".sivBlock > .sivDropBox";

const CONDITION = "#divOutput div.sivCondition";
const TEST_EXISTS = "#divOutput .sivConditionalChild > .siv-test-exists";
const TEST_SIZE = "#divOutput .sivConditionalChild > .siv-test-size";
const TEST_ADDRESS = "#divOutput .sivConditionalChild > .siv-test-address";


const fixture = suite.add("Move - Conditions");

fixture.add("Move to 1st block drop", async (simulator) => {
  let target;
  let source;

  // Move the condition containing the exists test...
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, FIRST_ELEMENT);
  source = await simulator.waitForNthElement(CONDITION, FIRST_ELEMENT);

  await simulator.assertIsChild(source, TEST_EXISTS);
  await simulator.dragAndReject(source, target);

  await simulator.assertNElements(BLOCK_DROP_BOX, SEVEN_ELEMENTS);
  await simulator.assertNElements(CONDITION_DROP_BOX, SIX_ELEMENTS);


  // Move the condition containing the size test...
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, FIRST_ELEMENT);
  source = await simulator.waitForNthElement(CONDITION, SECOND_ELEMENT);

  await simulator.assertIsChild(source, TEST_SIZE);
  await simulator.dragAndDrop(source, target);

  await simulator.assertScript(""
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  await simulator.assertNElements(BLOCK_DROP_BOX, SEVEN_ELEMENTS);
  await simulator.assertNElements(CONDITION_DROP_BOX, SIX_ELEMENTS);


  // Move the condition containing the address test...
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, FIRST_ELEMENT);
  source = await simulator.waitForNthElement(CONDITION, THIRD_ELEMENT);

  await simulator.assertIsChild(source, TEST_ADDRESS);
  await simulator.dragAndDrop(source, target);

  await simulator.assertScript(""
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE);

  await simulator.assertNElements(BLOCK_DROP_BOX, SEVEN_ELEMENTS);
  await simulator.assertNElements(CONDITION_DROP_BOX, SIX_ELEMENTS);
});

fixture.add("Move to 2nd block drop", async (simulator) => {
  let target;
  let source;

  // Move the condition containing the exists test...
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, SECOND_ELEMENT);
  source = await simulator.waitForNthElement(CONDITION, FIRST_ELEMENT);

  await simulator.assertIsChild(source, TEST_EXISTS);
  await simulator.dragAndReject(source, target);

  await simulator.assertNElements(BLOCK_DROP_BOX, SEVEN_ELEMENTS);
  await simulator.assertNElements(CONDITION_DROP_BOX, SIX_ELEMENTS);


  // Move the condition containing the size test...
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, SECOND_ELEMENT);
  source = await simulator.waitForNthElement(CONDITION, SECOND_ELEMENT);

  await simulator.assertIsChild(source, TEST_SIZE);
  await simulator.dragAndDrop(source, target);

  await simulator.assertScript(""
    + IF + EXISTS + "{" + NEW_LINE + IF + SIZE + EMPTY_BODY + NEW_LINE + "}" + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  await simulator.assertNElements(BLOCK_DROP_BOX, SEVEN_ELEMENTS);
  await simulator.assertNElements(CONDITION_DROP_BOX, SIX_ELEMENTS);


  // Move the condition containing the address test...
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, SECOND_ELEMENT);
  source = await simulator.waitForNthElement(CONDITION, THIRD_ELEMENT);

  await simulator.assertIsChild(source, TEST_ADDRESS);
  await simulator.dragAndDrop(source, target);

  await simulator.assertScript(""
    + IF + EXISTS + "{" + NEW_LINE + IF + ADDRESS + EMPTY_BODY + NEW_LINE + "}" + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE);

  await simulator.assertNElements(BLOCK_DROP_BOX, SEVEN_ELEMENTS);
  await simulator.assertNElements(CONDITION_DROP_BOX, SIX_ELEMENTS);
});

fixture.add("Move to 3rd block drop", async (simulator) => {
  let target;
  let source;

  // Move the condition containing the exists test...
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, THIRD_ELEMENT);
  source = await simulator.waitForNthElement(CONDITION, FIRST_ELEMENT);

  await simulator.assertIsChild(source, TEST_EXISTS);
  await simulator.dragAndReject(source, target);

  await simulator.assertNElements(BLOCK_DROP_BOX, SEVEN_ELEMENTS);
  await simulator.assertNElements(CONDITION_DROP_BOX, SIX_ELEMENTS);


  // Move the condition containing the size test...
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, THIRD_ELEMENT);
  source = await simulator.waitForNthElement(CONDITION, SECOND_ELEMENT);

  await simulator.assertIsChild(source, TEST_SIZE);
  await simulator.dragAndReject(source, target);

  await simulator.assertNElements(BLOCK_DROP_BOX, SEVEN_ELEMENTS);
  await simulator.assertNElements(CONDITION_DROP_BOX, SIX_ELEMENTS);


  // Move the condition containing the address test...
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, THIRD_ELEMENT);
  source = await simulator.waitForNthElement(CONDITION, THIRD_ELEMENT);

  await simulator.assertIsChild(source, TEST_ADDRESS);
  await simulator.dragAndDrop(source, target);

  await simulator.assertScript(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE);

  await simulator.assertNElements(BLOCK_DROP_BOX, SEVEN_ELEMENTS);
  await simulator.assertNElements(CONDITION_DROP_BOX, SIX_ELEMENTS);
});

fixture.add("Move to 4th block drop", async (simulator) => {

  let target;
  let source;

  // Move condition containing the exists test...
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, FOURTH_ELEMENT);
  source = await simulator.waitForNthElement(CONDITION, FIRST_ELEMENT);

  await simulator.assertIsChild(source, TEST_EXISTS);
  await simulator.dragAndDrop(source, target);

  await simulator.assertScript(""
    + IF + SIZE + "{" + NEW_LINE + IF + EXISTS + EMPTY_BODY + NEW_LINE + "}" + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  await simulator.assertNElements(BLOCK_DROP_BOX, SEVEN_ELEMENTS);
  await simulator.assertNElements(CONDITION_DROP_BOX, SIX_ELEMENTS);


  // Move the condition containing the size test...
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, FOURTH_ELEMENT);
  source = await simulator.waitForNthElement(CONDITION, SECOND_ELEMENT);

  await simulator.assertIsChild(source, TEST_SIZE);
  await simulator.dragAndReject(source, target);

  await simulator.assertNElements(BLOCK_DROP_BOX, SEVEN_ELEMENTS);
  await simulator.assertNElements(CONDITION_DROP_BOX, SIX_ELEMENTS);


  // Move the condition containing the address test...
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, FOURTH_ELEMENT);
  source = await simulator.waitForNthElement(CONDITION, THIRD_ELEMENT);

  await simulator.assertIsChild(source, TEST_ADDRESS);
  await simulator.dragAndDrop(source, target);

  await simulator.assertScript(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + "{" + NEW_LINE + IF + ADDRESS + EMPTY_BODY + NEW_LINE + "}" + NEW_LINE);

  await simulator.assertNElements(BLOCK_DROP_BOX, SEVEN_ELEMENTS);
  await simulator.assertNElements(CONDITION_DROP_BOX, SIX_ELEMENTS);
});


fixture.add("Move to 5th block drop", async (simulator) => {

  let target;
  let source;

  // Move the condition containing the exists test...
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, FIFTH_ELEMENT);
  source = await simulator.waitForNthElement(CONDITION, FIRST_ELEMENT);

  await simulator.assertIsChild(source, TEST_EXISTS);
  await simulator.dragAndDrop(source, target);

  await simulator.assertScript(""
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  await simulator.assertNElements(BLOCK_DROP_BOX, SEVEN_ELEMENTS);
  await simulator.assertNElements(CONDITION_DROP_BOX, SIX_ELEMENTS);


  // Move the condition containing the size test...
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, FIFTH_ELEMENT);
  source = await simulator.waitForNthElement(CONDITION, SECOND_ELEMENT);

  await simulator.assertIsChild(source, TEST_SIZE);
  await simulator.dragAndReject(source, target);

  await simulator.assertNElements(BLOCK_DROP_BOX, SEVEN_ELEMENTS);
  await simulator.assertNElements(CONDITION_DROP_BOX, SIX_ELEMENTS);


  // Move the condition containing the address test...
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, FIFTH_ELEMENT);
  source = await simulator.waitForNthElement(CONDITION, THIRD_ELEMENT);

  await simulator.assertIsChild(source, TEST_ADDRESS);
  await simulator.dragAndReject(source, target);

  await simulator.assertNElements(BLOCK_DROP_BOX, SEVEN_ELEMENTS);
  await simulator.assertNElements(CONDITION_DROP_BOX, SIX_ELEMENTS);
});

fixture.add("Move to 6th block drop", async (simulator) => {

  let target;
  let source;

  // Move the exists around the condition containing the exists test...
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, SIXTH_ELEMENT);
  source = await simulator.waitForNthElement(CONDITION, FIRST_ELEMENT);

  await simulator.assertIsChild(source, TEST_EXISTS);
  await simulator.dragAndDrop(source, target);

  await simulator.assertScript(""
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + "{" + NEW_LINE + IF + EXISTS + EMPTY_BODY + NEW_LINE + "}" + NEW_LINE);

  await simulator.assertNElements(BLOCK_DROP_BOX, SEVEN_ELEMENTS);
  await simulator.assertNElements(CONDITION_DROP_BOX, SIX_ELEMENTS);


  // Move the exists around the condition containing the size test...
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, SIXTH_ELEMENT);
  source = await simulator.waitForNthElement(CONDITION, SECOND_ELEMENT);

  await simulator.assertIsChild(source, TEST_SIZE);
  await simulator.dragAndDrop(source, target);

  await simulator.assertNElements(BLOCK_DROP_BOX, SEVEN_ELEMENTS);
  await simulator.assertNElements(CONDITION_DROP_BOX, SIX_ELEMENTS);


  await simulator.assertScript(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + "{" + NEW_LINE + IF + SIZE + EMPTY_BODY + NEW_LINE + "}" + NEW_LINE);

  // Move the condition containing the address test...
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, SIXTH_ELEMENT);
  source = await simulator.waitForNthElement(CONDITION, THIRD_ELEMENT);

  await simulator.assertIsChild(source, TEST_ADDRESS);
  await simulator.dragAndReject(source, target);

  await simulator.assertNElements(BLOCK_DROP_BOX, SEVEN_ELEMENTS);
  await simulator.assertNElements(CONDITION_DROP_BOX, SIX_ELEMENTS);
});

fixture.add("Move to 7th block drop", async (simulator) => {

  let target;
  let source;

  // Move the exists around the condition containing the exists test...
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, SEVENTH_ELEMENT);
  source = await simulator.waitForNthElement(CONDITION, FIRST_ELEMENT);

  await simulator.assertIsChild(source, TEST_EXISTS);
  await simulator.dragAndDrop(source, target);

  await simulator.assertScript(""
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE
    + IF + EXISTS + EMPTY_BODY + NEW_LINE);

  await simulator.assertNElements(BLOCK_DROP_BOX, SEVEN_ELEMENTS);
  await simulator.assertNElements(CONDITION_DROP_BOX, SIX_ELEMENTS);


  // Move the exists around the condition containing the size test...
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, SEVENTH_ELEMENT);
  source = await simulator.waitForNthElement(CONDITION, SECOND_ELEMENT);

  await simulator.assertIsChild(source, TEST_SIZE);
  await simulator.dragAndDrop(source, target);

  await simulator.assertScript(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE);

  await simulator.assertNElements(BLOCK_DROP_BOX, SEVEN_ELEMENTS);
  await simulator.assertNElements(CONDITION_DROP_BOX, SIX_ELEMENTS);


  // Move the condition containing the address test...
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, SEVENTH_ELEMENT);
  source = await simulator.waitForNthElement(CONDITION, THIRD_ELEMENT);

  await simulator.assertIsChild(source, TEST_ADDRESS);
  await simulator.dragAndReject(source, target);

  await simulator.assertNElements(BLOCK_DROP_BOX, SEVEN_ELEMENTS);
  await simulator.assertNElements(CONDITION_DROP_BOX, SIX_ELEMENTS);
});

fixture.add("Move to 1st condition drop", async (simulator) => {
  let target;
  let source;

  // Move the condition containing the exists test...
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, FIRST_ELEMENT);
  source = await simulator.waitForNthElement(CONDITION, FIRST_ELEMENT);

  await simulator.assertIsChild(source, TEST_EXISTS);
  await simulator.dragAndReject(source, target);

  await simulator.assertNElements(BLOCK_DROP_BOX, SEVEN_ELEMENTS);
  await simulator.assertNElements(CONDITION_DROP_BOX, SIX_ELEMENTS);


  // Move the condition containing the size test...
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, FIRST_ELEMENT);
  source = await simulator.waitForNthElement(CONDITION, SECOND_ELEMENT);

  await simulator.assertIsChild(source, TEST_SIZE);
  await simulator.dragAndReject(source, target);

  await simulator.assertNElements(BLOCK_DROP_BOX, SEVEN_ELEMENTS);
  await simulator.assertNElements(CONDITION_DROP_BOX, SIX_ELEMENTS);


  // Move the condition containing the address test...
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, FIRST_ELEMENT);
  source = await simulator.waitForNthElement(CONDITION, THIRD_ELEMENT);

  await simulator.assertIsChild(source, TEST_ADDRESS);
  await simulator.dragAndReject(source, target);

  await simulator.assertNElements(BLOCK_DROP_BOX, SEVEN_ELEMENTS);
  await simulator.assertNElements(CONDITION_DROP_BOX, SIX_ELEMENTS);
});

fixture.add("Move to 2nd condition drop", async (simulator) => {
  let target;
  let source;

  // Move the condition containing the exists test...
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, SECOND_ELEMENT);
  source = await simulator.waitForNthElement(CONDITION, FIRST_ELEMENT);

  await simulator.assertIsChild(source, TEST_EXISTS);
  await simulator.dragAndReject(source, target);

  await simulator.assertNElements(BLOCK_DROP_BOX, SEVEN_ELEMENTS);
  await simulator.assertNElements(CONDITION_DROP_BOX, SIX_ELEMENTS);


  // Move the condition containing the size test...
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, SECOND_ELEMENT);
  source = await simulator.waitForNthElement(CONDITION, SECOND_ELEMENT);

  await simulator.assertIsChild(source, TEST_SIZE);
  await simulator.dragAndReject(source, target);

  await simulator.assertNElements(BLOCK_DROP_BOX, SEVEN_ELEMENTS);
  await simulator.assertNElements(CONDITION_DROP_BOX, SIX_ELEMENTS);


  // Move the condition containing the address test...
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, SECOND_ELEMENT);
  source = await simulator.waitForNthElement(CONDITION, THIRD_ELEMENT);

  await simulator.assertIsChild(source, TEST_ADDRESS);
  await simulator.dragAndReject(source, target);

  await simulator.assertNElements(BLOCK_DROP_BOX, SEVEN_ELEMENTS);
  await simulator.assertNElements(CONDITION_DROP_BOX, SIX_ELEMENTS);
});

fixture.add("Move to 3rd condition drop", async (simulator) => {
  let target;
  let source;

  // Move the condition containing the exists test...
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, THIRD_ELEMENT);
  source = await simulator.waitForNthElement(CONDITION, FIRST_ELEMENT);

  await simulator.assertIsChild(source, TEST_EXISTS);
  await simulator.dragAndReject(source, target);

  await simulator.assertNElements(BLOCK_DROP_BOX, SEVEN_ELEMENTS);
  await simulator.assertNElements(CONDITION_DROP_BOX, SIX_ELEMENTS);


  // Move the condition containing the size test...
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, THIRD_ELEMENT);
  source = await simulator.waitForNthElement(CONDITION, SECOND_ELEMENT);

  await simulator.assertIsChild(source, TEST_SIZE);
  await simulator.dragAndReject(source, target);

  await simulator.assertNElements(BLOCK_DROP_BOX, SEVEN_ELEMENTS);
  await simulator.assertNElements(CONDITION_DROP_BOX, SIX_ELEMENTS);


  // Move the condition containing the address test...
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, THIRD_ELEMENT);
  source = await simulator.waitForNthElement(CONDITION, THIRD_ELEMENT);

  await simulator.assertIsChild(source, TEST_ADDRESS);
  await simulator.dragAndReject(source, target);

  await simulator.assertNElements(BLOCK_DROP_BOX, SEVEN_ELEMENTS);
  await simulator.assertNElements(CONDITION_DROP_BOX, SIX_ELEMENTS);
});

fixture.add("Move to 4th condition drop", async (simulator) => {
  let target;
  let source;

  // Move the condition containing the exists test...
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, FOURTH_ELEMENT);
  source = await simulator.waitForNthElement(CONDITION, FIRST_ELEMENT);

  await simulator.assertIsChild(source, TEST_EXISTS);
  await simulator.dragAndReject(source, target);

  await simulator.assertNElements(BLOCK_DROP_BOX, SEVEN_ELEMENTS);
  await simulator.assertNElements(CONDITION_DROP_BOX, SIX_ELEMENTS);


  // Move the condition containing the size test...
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, FOURTH_ELEMENT);
  source = await simulator.waitForNthElement(CONDITION, SECOND_ELEMENT);

  await simulator.assertIsChild(source, TEST_SIZE);
  await simulator.dragAndReject(source, target);

  await simulator.assertNElements(BLOCK_DROP_BOX, SEVEN_ELEMENTS);
  await simulator.assertNElements(CONDITION_DROP_BOX, SIX_ELEMENTS);


  // Move the condition containing the address test...
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, FOURTH_ELEMENT);
  source = await simulator.waitForNthElement(CONDITION, THIRD_ELEMENT);

  await simulator.assertIsChild(source, TEST_ADDRESS);
  await simulator.dragAndReject(source, target);

  await simulator.assertNElements(BLOCK_DROP_BOX, SEVEN_ELEMENTS);
  await simulator.assertNElements(CONDITION_DROP_BOX, SIX_ELEMENTS);
});

fixture.add("Move to 5th condition drop", async (simulator) => {
  let target;
  let source;

  // Move the condition containing the exists test...
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, FIFTH_ELEMENT);
  source = await simulator.waitForNthElement(CONDITION, FIRST_ELEMENT);

  await simulator.assertIsChild(source, TEST_EXISTS);
  await simulator.dragAndReject(source, target);

  await simulator.assertNElements(BLOCK_DROP_BOX, SEVEN_ELEMENTS);
  await simulator.assertNElements(CONDITION_DROP_BOX, SIX_ELEMENTS);


  // Move the condition containing the size test...
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, FIFTH_ELEMENT);
  source = await simulator.waitForNthElement(CONDITION, SECOND_ELEMENT);

  await simulator.assertIsChild(source, TEST_SIZE);
  await simulator.dragAndReject(source, target);

  await simulator.assertNElements(BLOCK_DROP_BOX, SEVEN_ELEMENTS);
  await simulator.assertNElements(CONDITION_DROP_BOX, SIX_ELEMENTS);


  // Move the condition containing the address test...
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, FIFTH_ELEMENT);
  source = await simulator.waitForNthElement(CONDITION, THIRD_ELEMENT);

  await simulator.assertIsChild(source, TEST_ADDRESS);
  await simulator.dragAndReject(source, target);

  await simulator.assertNElements(BLOCK_DROP_BOX, SEVEN_ELEMENTS);
  await simulator.assertNElements(CONDITION_DROP_BOX, SIX_ELEMENTS);
});


fixture.add("Move to 6th condition drop", async (simulator) => {
  let target;
  let source;

  // Move the condition containing the exists test...
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, SIXTH_ELEMENT);
  source = await simulator.waitForNthElement(CONDITION, FIRST_ELEMENT);

  await simulator.assertIsChild(source, TEST_EXISTS);
  await simulator.dragAndReject(source, target);

  await simulator.assertNElements(BLOCK_DROP_BOX, SEVEN_ELEMENTS);
  await simulator.assertNElements(CONDITION_DROP_BOX, SIX_ELEMENTS);


  // Move the condition containing the size test...
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, SIXTH_ELEMENT);
  source = await simulator.waitForNthElement(CONDITION, SECOND_ELEMENT);

  await simulator.assertIsChild(source, TEST_SIZE);
  await simulator.dragAndReject(source, target);

  await simulator.assertNElements(BLOCK_DROP_BOX, SEVEN_ELEMENTS);
  await simulator.assertNElements(CONDITION_DROP_BOX, SIX_ELEMENTS);


  // Move the condition containing the address test...
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + ADDRESS + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, SIXTH_ELEMENT);
  source = await simulator.waitForNthElement(CONDITION, THIRD_ELEMENT);

  await simulator.assertIsChild(source, TEST_ADDRESS);
  await simulator.dragAndReject(source, target);

  await simulator.assertNElements(BLOCK_DROP_BOX, SEVEN_ELEMENTS);
  await simulator.assertNElements(CONDITION_DROP_BOX, SIX_ELEMENTS);
});
