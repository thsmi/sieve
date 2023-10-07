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

debugger;
import {
  validate,
  sivCondition,
  sivIf,
  sivTest
} from "./../../validators/validators.mjs";

const FIRST_ELEMENT = 0;
const SECOND_ELEMENT = 1;
const THIRD_ELEMENT = 2;
const FOURTH_ELEMENT = 3;
const FIFTH_ELEMENT = 4;
const SIXTH_ELEMENT = 5;

const NEW_LINE = "\r\n";

const CONDITION_DROP_BOX = ".sivCondition > .sivSummaryContent > .sivDropBox";
const BLOCK_DROP_BOX = ".sivBlock > .sivDropBox";

const IF = 'if ';
const ELSIF = 'elsif ';

const EXISTS = 'exists "From"';
const SIZE = 'size :over 1M';
const ADDRESS = 'address "To" "me@example.com"';

const CONDITION = "#divOutput div.sivCondition";
const TEST_ADDRESS = "#divOutput .sivConditionalChild > .siv-test-address";
const TEST_EXISTS = "#divOutput .sivConditionalChild > .siv-test-exists";
const TEST_SIZE = "#divOutput .sivConditionalChild > .siv-test-size";


const fixture = suite.add("Move - Shallow Nesting");

fixture.add("Move to 1st block drop", async (simulator) => {
  let target;
  let source;

  // Move the condition containing the address test...
  await simulator.init(""
    + IF + ADDRESS + "{" + NEW_LINE
    + IF + EXISTS + "{" + NEW_LINE
    + "}" + NEW_LINE
    + "}" + NEW_LINE);

  source = await simulator.waitForNthElement(CONDITION, FIRST_ELEMENT);
  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, FIRST_ELEMENT);

  await simulator.assertIsChild(source, TEST_ADDRESS);
  await simulator.dragAndReject(source, target);


  // Move the address test...
  await simulator.init(""
    + IF + ADDRESS + "{" + NEW_LINE
    + IF + EXISTS + "{" + NEW_LINE
    + "}" + NEW_LINE
    + "}" + NEW_LINE);

  source = await simulator.waitForNthElement(TEST_ADDRESS, FIRST_ELEMENT);
  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, FIRST_ELEMENT);

  await simulator.dragAndReject(source, target);

  // Move the condition containing the exists test...
  await simulator.init(""
    + IF + ADDRESS + "{" + NEW_LINE
    + IF + EXISTS + "{" + NEW_LINE
    + "}" + NEW_LINE
    + "}" + NEW_LINE);

  source = await simulator.waitForNthElement(CONDITION, SECOND_ELEMENT);
  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, FIRST_ELEMENT);

  await simulator.assertIsChild(source, TEST_EXISTS);
  await simulator.dragAndDrop(source, target);

  await simulator.assertScript(""
    + IF + EXISTS + "{" + NEW_LINE + "}" + NEW_LINE
    + IF + ADDRESS + "{" + NEW_LINE + "}" + NEW_LINE);


  // Move the exists test...
  await simulator.init(""
    + IF + ADDRESS + "{" + NEW_LINE
    + IF + EXISTS + "{" + NEW_LINE
    + "}" + NEW_LINE
    + "}" + NEW_LINE);

  source = await simulator.waitForNthElement(TEST_EXISTS, FIRST_ELEMENT);
  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, FIRST_ELEMENT);

  await simulator.dragAndDrop(source, target);

  await simulator.assertScript(""
    + IF + EXISTS + "{" + NEW_LINE + "}" + NEW_LINE
    + IF + ADDRESS + "{" + NEW_LINE + "}" + NEW_LINE);
});


fixture.add("Move to 2nd block drop", async (simulator) => {
  let target;
  let source;

  // Move the condition containing the address test...
  await simulator.init(""
    + IF + ADDRESS + "{" + NEW_LINE
    + IF + EXISTS + "{" + NEW_LINE
    + "}" + NEW_LINE
    + "}" + NEW_LINE);

  source = await simulator.waitForNthElement(CONDITION, FIRST_ELEMENT);
  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, SECOND_ELEMENT);

  await simulator.assertIsChild(source, TEST_ADDRESS);
  await simulator.dragAndReject(source, target);


  // Move the address test...
  await simulator.init(""
    + IF + ADDRESS + "{" + NEW_LINE
    + IF + EXISTS + "{" + NEW_LINE
    + "}" + NEW_LINE
    + "}" + NEW_LINE);

  source = await simulator.waitForNthElement(TEST_ADDRESS, FIRST_ELEMENT);
  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, SECOND_ELEMENT);

  await simulator.dragAndReject(source, target);


  // Move the condition containing the exists test...
  await simulator.init(""
    + IF + ADDRESS + "{" + NEW_LINE
    + IF + EXISTS + "{" + NEW_LINE
    + "}" + NEW_LINE
    + "}" + NEW_LINE);

  source = await simulator.waitForNthElement(CONDITION, SECOND_ELEMENT);
  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, SECOND_ELEMENT);

  await simulator.assertIsChild(source, TEST_EXISTS);
  await simulator.dragAndReject(source, target);

  // Move the exists test...
  await simulator.init(""
    + IF + ADDRESS + "{" + NEW_LINE
    + IF + EXISTS + "{" + NEW_LINE
    + "}" + NEW_LINE
    + "}" + NEW_LINE);

  source = await simulator.waitForNthElement(TEST_EXISTS, FIRST_ELEMENT);
  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, SECOND_ELEMENT);

  await simulator.dragAndReject(source, target);
});


fixture.add("Move to 3rd block drop", async (simulator) => {
  let target;
  let source;

  // Move the condition containing the address test...
  await simulator.init(""
    + IF + ADDRESS + "{" + NEW_LINE
    + IF + EXISTS + "{" + NEW_LINE
    + "}" + NEW_LINE
    + "}" + NEW_LINE);

  source = await simulator.waitForNthElement(CONDITION, FIRST_ELEMENT);
  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, THIRD_ELEMENT);

  await simulator.assertIsChild(source, TEST_ADDRESS);
  await simulator.dragAndReject(source, target);


  // Move the address test...
  await simulator.init(""
    + IF + ADDRESS + "{" + NEW_LINE
    + IF + EXISTS + "{" + NEW_LINE
    + "}" + NEW_LINE
    + "}" + NEW_LINE);

  source = await simulator.waitForNthElement(TEST_ADDRESS, FIRST_ELEMENT);
  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, THIRD_ELEMENT);

  await simulator.dragAndReject(source, target);


  // Move the condition containing the exists test...
  await simulator.init(""
    + IF + ADDRESS + "{" + NEW_LINE
    + IF + EXISTS + "{" + NEW_LINE
    + "}" + NEW_LINE
    + "}" + NEW_LINE);

  source = await simulator.waitForNthElement(CONDITION, SECOND_ELEMENT);
  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, THIRD_ELEMENT);

  await simulator.assertIsChild(source, TEST_EXISTS);
  await simulator.dragAndReject(source, target);

  // Move the exists test...
  await simulator.init(""
    + IF + ADDRESS + "{" + NEW_LINE
    + IF + EXISTS + "{" + NEW_LINE
    + "}" + NEW_LINE
    + "}" + NEW_LINE);

  source = await simulator.waitForNthElement(TEST_EXISTS, FIRST_ELEMENT);
  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, THIRD_ELEMENT);

  await simulator.dragAndReject(source, target);
});


fixture.add("Move to 4th block drop", async (simulator) => {
  let target;
  let source;

  // Move the condition containing the address test...
  await simulator.init(""
    + IF + ADDRESS + "{" + NEW_LINE
    + IF + EXISTS + "{" + NEW_LINE
    + "}" + NEW_LINE
    + "}" + NEW_LINE);

  source = await simulator.waitForNthElement(CONDITION, FIRST_ELEMENT);
  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, FOURTH_ELEMENT);

  await simulator.assertIsChild(source, TEST_ADDRESS);
  await simulator.dragAndReject(source, target);


  // Move the address test...
  await simulator.init(""
    + IF + ADDRESS + "{" + NEW_LINE
    + IF + EXISTS + "{" + NEW_LINE
    + "}" + NEW_LINE
    + "}" + NEW_LINE);

  source = await simulator.waitForNthElement(TEST_ADDRESS, FIRST_ELEMENT);
  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, FOURTH_ELEMENT);

  await simulator.dragAndReject(source, target);


  // Move the condition containing the exists test...
  await simulator.init(""
    + IF + ADDRESS + "{" + NEW_LINE
    + IF + EXISTS + "{" + NEW_LINE
    + "}" + NEW_LINE
    + "}" + NEW_LINE);

  source = await simulator.waitForNthElement(CONDITION, SECOND_ELEMENT);
  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, FOURTH_ELEMENT);

  await simulator.assertIsChild(source, TEST_EXISTS);
  await simulator.dragAndReject(source, target);

  // Move the exists test...
  await simulator.init(""
    + IF + ADDRESS + "{" + NEW_LINE
    + IF + EXISTS + "{" + NEW_LINE
    + "}" + NEW_LINE
    + "}" + NEW_LINE);

  source = await simulator.waitForNthElement(TEST_EXISTS, FIRST_ELEMENT);
  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, FOURTH_ELEMENT);

  await simulator.dragAndReject(source, target);
});


fixture.add("Move to 5th block drop", async (simulator) => {
  let target;
  let source;

  // Move the condition containing the address test...
  await simulator.init(""
    + IF + ADDRESS + "{" + NEW_LINE
    + IF + EXISTS + "{" + NEW_LINE
    + "}" + NEW_LINE
    + "}" + NEW_LINE);

  source = await simulator.waitForNthElement(CONDITION, FIRST_ELEMENT);
  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, FIFTH_ELEMENT);

  await simulator.assertIsChild(source, TEST_ADDRESS);
  await simulator.dragAndReject(source, target);


  // Move the address test...
  await simulator.init(""
    + IF + ADDRESS + "{" + NEW_LINE
    + IF + EXISTS + "{" + NEW_LINE
    + "}" + NEW_LINE
    + "}" + NEW_LINE);

  source = await simulator.waitForNthElement(TEST_ADDRESS, FIRST_ELEMENT);
  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, FIFTH_ELEMENT);

  await simulator.dragAndReject(source, target);


  // Move the condition containing the exists test...
  await simulator.init(""
    + IF + ADDRESS + "{" + NEW_LINE
    + IF + EXISTS + "{" + NEW_LINE
    + "}" + NEW_LINE
    + "}" + NEW_LINE);

  source = await simulator.waitForNthElement(CONDITION, SECOND_ELEMENT);
  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, FIFTH_ELEMENT);

  await simulator.assertIsChild(source, TEST_EXISTS);
  await simulator.dragAndDrop(source, target);

  await simulator.assertScript(""
    + IF + ADDRESS + "{" + NEW_LINE + "}" + NEW_LINE
    + IF + EXISTS + "{" + NEW_LINE + "}" + NEW_LINE);


  // Move the exists test...
  await simulator.init(""
    + IF + ADDRESS + "{" + NEW_LINE
    + IF + EXISTS + "{" + NEW_LINE
    + "}" + NEW_LINE
    + "}" + NEW_LINE);

  source = await simulator.waitForNthElement(TEST_EXISTS, FIRST_ELEMENT);
  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, FIFTH_ELEMENT);

  await simulator.dragAndDrop(source, target);

  await simulator.assertScript(""
    + IF + ADDRESS + "{" + NEW_LINE + "}" + NEW_LINE
    + IF + EXISTS + "{" + NEW_LINE + "}" + NEW_LINE);

  debugger;
  validate(
    await simulator.waitForElement("#divOutput > div > div.sivBlock"),
    sivCondition(
      sivIf(sivTest("headers"))),
    sivCondition(
      sivIf(sivTest("exists")))
  );

});


fixture.add("Move to 1st condition drop", async (simulator) => {
  let target;
  let source;

  // Move the condition containing the address test...
  await simulator.init(""
    + IF + ADDRESS + "{" + NEW_LINE
    + IF + EXISTS + "{" + NEW_LINE
    + "}" + NEW_LINE
    + "}" + NEW_LINE);

  source = await simulator.waitForNthElement(CONDITION, FIRST_ELEMENT);
  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, FIRST_ELEMENT);

  await simulator.assertIsChild(source, TEST_ADDRESS);
  await simulator.dragAndReject(source, target);


  // Move the address test...
  await simulator.init(""
    + IF + ADDRESS + "{" + NEW_LINE
    + IF + EXISTS + "{" + NEW_LINE
    + "}" + NEW_LINE
    + "}" + NEW_LINE);

  source = await simulator.waitForNthElement(TEST_ADDRESS, FIRST_ELEMENT);
  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, FIRST_ELEMENT);

  await simulator.dragAndReject(source, target);


  // Move the condition containing the exists test...
  await simulator.init(""
    + IF + ADDRESS + "{" + NEW_LINE
    + IF + EXISTS + "{" + NEW_LINE
    + "}" + NEW_LINE
    + "}" + NEW_LINE);

  source = await simulator.waitForNthElement(CONDITION, SECOND_ELEMENT);
  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, FIRST_ELEMENT);

  await simulator.assertIsChild(source, TEST_EXISTS);
  await simulator.dragAndReject(source, target);


  // Move the exists test...
  await simulator.init(""
    + IF + ADDRESS + "{" + NEW_LINE
    + IF + EXISTS + "{" + NEW_LINE
    + "}" + NEW_LINE
    + "}" + NEW_LINE);

  source = await simulator.waitForNthElement(TEST_EXISTS, FIRST_ELEMENT);
  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, FIRST_ELEMENT);

  await simulator.dragAndDrop(source, target);

  await simulator.assertScript(""
    + IF + EXISTS + "{" + NEW_LINE + "}" + NEW_LINE
    + ELSIF + ADDRESS + "{" + NEW_LINE + "}" + NEW_LINE);

  debugger;
  await simulator.wait(30*1000);
});


fixture.add("Move to 2nd condition drop", async (simulator) => {
  let target;
  let source;

  // Move the condition containing the address test...
  await simulator.init(""
    + IF + ADDRESS + "{" + NEW_LINE
    + IF + EXISTS + "{" + NEW_LINE
    + "}" + NEW_LINE
    + "}" + NEW_LINE);

  source = await simulator.waitForNthElement(CONDITION, FIRST_ELEMENT);
  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, SECOND_ELEMENT);

  await simulator.assertIsChild(source, TEST_ADDRESS);
  await simulator.dragAndReject(source, target);


  // Move the address test...
  await simulator.init(""
    + IF + ADDRESS + "{" + NEW_LINE
    + IF + EXISTS + "{" + NEW_LINE
    + "}" + NEW_LINE
    + "}" + NEW_LINE);

  source = await simulator.waitForNthElement(TEST_ADDRESS, FIRST_ELEMENT);
  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, SECOND_ELEMENT);

  await simulator.dragAndReject(source, target);


  // Move the condition containing the exists test...
  await simulator.init(""
    + IF + ADDRESS + "{" + NEW_LINE
    + IF + EXISTS + "{" + NEW_LINE
    + "}" + NEW_LINE
    + "}" + NEW_LINE);

  source = await simulator.waitForNthElement(CONDITION, SECOND_ELEMENT);
  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, SECOND_ELEMENT);

  await simulator.assertIsChild(source, TEST_EXISTS);
  await simulator.dragAndReject(source, target);


  // Move the exists test...
  await simulator.init(""
    + IF + ADDRESS + "{" + NEW_LINE
    + IF + EXISTS + "{" + NEW_LINE
    + "}" + NEW_LINE
    + "}" + NEW_LINE);

  source = await simulator.waitForNthElement(TEST_EXISTS, FIRST_ELEMENT);
  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, SECOND_ELEMENT);

  await simulator.dragAndDrop(source, target);

  await simulator.assertScript(""
    + IF + EXISTS + "{" + NEW_LINE + "}" + NEW_LINE
    + ELSIF + ADDRESS + "{" + NEW_LINE + "}" + NEW_LINE);


  await simulator.wait(30*1000);
  debugger;
});



/*
suite.add("Deep Nesting - Move to 1st block drop", async (simulator) => {
  let target;
  let source;

  // Move the condition containing the exists test...
  await simulator.init(""
    + IF + ADDRESS + "{" + NEW_LINE
    + IF + EXISTS + "{" + NEW_LINE
    + IF + SIZE + "{" + NEW_LINE
    + "}" + NEW_LINE
    + "}" + NEW_LINE
    + "}" + NEW_LINE);

  source = await simulator.waitForNthElement(TEST_EXISTS, FIRST_ELEMENT);
  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, FIRST_ELEMENT);

  debugger;
});

suite.add("Deep Nesting - Move to 1st condition drop", async (simulator) => {
  let target;
  let source;

  // Move the condition containing the exists test...
  await simulator.init(""
    + IF + ADDRESS + "{" + NEW_LINE
    + IF + EXISTS + "{" + NEW_LINE
    + IF + SIZE + "{" + NEW_LINE
    + "}" + NEW_LINE
    + "}" + NEW_LINE
    + "}" + NEW_LINE);

  source = await simulator.waitForNthElement(TEST_EXISTS, FIRST_ELEMENT);
  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, FIRST_ELEMENT);

  debugger;
});

*/

/*if address "To" "me@example.com"{
  if exists "From"{
  }
  }

 ... move inner to elsif leaves drop targets.address
*/


// Move first If
// Move address test
// move second if
// move exists
// move third if
// move header

 /*if address "To" "me@example.com"{
  if exists "From"{
  if header "Subject" "Example"{
  }
  }
  }


  move exists to elsif of headr  causes too much recursion

  */