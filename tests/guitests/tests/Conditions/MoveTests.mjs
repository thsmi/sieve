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

const NEW_LINE = "\r\n";

const IF = 'if ';
const ELSE = 'else ';
const ELSIF = 'elsif ';

const EXISTS = 'exists "From"';
const SIZE = 'size :over 1M';

const EMPTY_BODY = '{\r\n}';
const KEEP = "\r\nkeep;\r\n";
const KEEP_BODY = '{' + KEEP + '}';

const CONDITION_DROP_BOX = ".sivCondition > .sivSummaryContent > .sivDropBox";
const BLOCK_DROP_BOX = ".sivBlock > .sivDropBox";

const TEST_EXISTS = "#divOutput .sivConditionalChild > .siv-test-exists";
const TEST_SIZE = "#divOutput .sivConditionalChild > .siv-test-size";

const fixture = suite.add("Move Tests");

fixture.add("Move if test to block drop", async (simulator) => {

  let target;

  // Move exists test to block before if
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSIF + SIZE + EMPTY_BODY + NEW_LINE
    + ELSE + KEEP_BODY);

  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, FIRST_ELEMENT);
  await simulator.dragAndDrop(TEST_EXISTS, target);

  await simulator.assertScript(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + ELSE + KEEP_BODY);

  // Move exists test to block inside if body
  await simulator.init(""
     + IF + EXISTS + EMPTY_BODY + NEW_LINE
     + ELSIF + SIZE + EMPTY_BODY + NEW_LINE
     + ELSE + KEEP_BODY);

  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, SECOND_ELEMENT);
  await simulator.dragAndReject(TEST_EXISTS, target);


  // Move exists test to block inside elsif body
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSIF + SIZE + EMPTY_BODY + NEW_LINE
    + ELSE + KEEP_BODY);
  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, THIRD_ELEMENT);
  await simulator.dragAndDrop(TEST_EXISTS, target);

  await simulator.assertScript(""
    + IF + SIZE + "{" + NEW_LINE + IF + EXISTS + EMPTY_BODY + NEW_LINE + "}" + NEW_LINE
    + ELSE + KEEP_BODY);


  // Move exists test to else block before keep
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSIF + SIZE + EMPTY_BODY + NEW_LINE
    + ELSE + KEEP_BODY);

  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, FOURTH_ELEMENT);
  await simulator.dragAndDrop(TEST_EXISTS, target);

  await simulator.assertScript(""
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + ELSE + "{" + NEW_LINE + IF + EXISTS + EMPTY_BODY + KEEP + "}");


  // Move exists test to else block after keep
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSIF + SIZE + EMPTY_BODY + NEW_LINE
    + ELSE + KEEP_BODY);

  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, FIFTH_ELEMENT);
  await simulator.dragAndDrop(TEST_EXISTS, target);

  await simulator.assertScript(""
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + ELSE + "{" + KEEP + IF + EXISTS + EMPTY_BODY + NEW_LINE + "}");

  // Move exists test after else block
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSIF + SIZE + EMPTY_BODY + NEW_LINE
    + ELSE + KEEP_BODY);

  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, SIXTH_ELEMENT);
  await simulator.dragAndDrop(TEST_EXISTS, target);

  await simulator.assertScript( ""
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + ELSE + KEEP_BODY
    + IF + EXISTS + EMPTY_BODY + NEW_LINE);
});


fixture.add("Move if test to condition drop", async (simulator) => {

  let target;

  // Move exists test to condition box before condition
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSIF + SIZE + EMPTY_BODY + NEW_LINE
    + ELSE + KEEP_BODY);

  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, FIRST_ELEMENT);
  await simulator.dragAndReject(TEST_EXISTS, target);


  // Move exists test to condition box before elsif
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSIF + SIZE + EMPTY_BODY + NEW_LINE
    + ELSE + KEEP_BODY);

  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, SECOND_ELEMENT);
  await simulator.dragAndReject(TEST_EXISTS, target);


  // Move exists test to condition box before else
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSIF + SIZE + EMPTY_BODY + NEW_LINE
    + ELSE + KEEP_BODY);

  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, THIRD_ELEMENT);
  await simulator.dragAndDrop(TEST_EXISTS, target);

  await simulator.assertScript(""
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + ELSIF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSE + KEEP_BODY);


  // Move exists test to condition box after else
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSIF + SIZE + EMPTY_BODY + NEW_LINE
    + ELSE + KEEP_BODY);

  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, FOURTH_ELEMENT);
  await simulator.dragAndReject(TEST_EXISTS, target);
});

fixture.add("Move elsif test", async (simulator) => {
  let target;

  // Move size test to block before if
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSIF + SIZE + EMPTY_BODY + NEW_LINE
    + ELSE + KEEP_BODY);

  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, FIRST_ELEMENT);
  await simulator.dragAndDrop(TEST_SIZE, target);

  await simulator.assertScript( ""
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSE + KEEP_BODY);


  // Move size test to block inside if body
  await simulator.init(""
     + IF + EXISTS + EMPTY_BODY + NEW_LINE
     + ELSIF + SIZE + EMPTY_BODY + NEW_LINE
     + ELSE + KEEP_BODY);

  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, SECOND_ELEMENT);
  await simulator.dragAndDrop(TEST_SIZE, target);
  await simulator.assertScript(""
    + IF + EXISTS + "{" + NEW_LINE + IF + SIZE + EMPTY_BODY + NEW_LINE + "}" + NEW_LINE
    + ELSE + KEEP_BODY);


  // Move size test to block inside elsif body
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSIF + SIZE + EMPTY_BODY + NEW_LINE
    + ELSE + KEEP_BODY);
  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, THIRD_ELEMENT);
  await simulator.dragAndReject(TEST_SIZE, target);


  // Move size test to else block before keep
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSIF + SIZE + EMPTY_BODY + NEW_LINE
    + ELSE + KEEP_BODY);

  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, FOURTH_ELEMENT);
  await simulator.dragAndDrop(TEST_SIZE, target);

  await simulator.assertScript(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSE + "{" + NEW_LINE + IF + SIZE + EMPTY_BODY + KEEP + "}");


  // Move size test to else block after keep
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSIF + SIZE + EMPTY_BODY + NEW_LINE
    + ELSE + KEEP_BODY);

  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, FIFTH_ELEMENT);
  await simulator.dragAndDrop(TEST_SIZE, target);

  await simulator.assertScript(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSE + "{" + KEEP + IF + SIZE + EMPTY_BODY + NEW_LINE + "}");

  // Move size test after else block
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSIF + SIZE + EMPTY_BODY + NEW_LINE
    + ELSE + KEEP_BODY);

  target = await simulator.waitForNthElement(BLOCK_DROP_BOX, SIXTH_ELEMENT);
  await simulator.dragAndDrop(TEST_SIZE, target);

  await simulator.assertScript( ""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSE + KEEP_BODY
    + IF + SIZE + EMPTY_BODY + NEW_LINE);

});


fixture.add("Move elsif test to condition drop", async (simulator) => {

  let target;
  // Move size test to condition box before condition, this should swap if and elsif
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSIF + SIZE + EMPTY_BODY + NEW_LINE
    + ELSE + KEEP_BODY);

  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, FIRST_ELEMENT);
  await simulator.dragAndDrop(TEST_SIZE, target);

  await simulator.assertScript(""
    + IF + SIZE + EMPTY_BODY + NEW_LINE
    + ELSIF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSE + KEEP_BODY);

  // Move exists test to condition box before elsif
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSIF + SIZE + EMPTY_BODY + NEW_LINE
    + ELSE + KEEP_BODY);

  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, SECOND_ELEMENT);
  await simulator.dragAndReject(TEST_SIZE, target);


  // Move exists test to condition box before else
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSIF + SIZE + EMPTY_BODY + NEW_LINE
    + ELSE + KEEP_BODY);

  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, THIRD_ELEMENT);
  await simulator.dragAndReject(TEST_SIZE, target);


  // Move exists test to condition box after else
  await simulator.init(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSIF + SIZE + EMPTY_BODY + NEW_LINE
    + ELSE + KEEP_BODY);

  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, FOURTH_ELEMENT);
  await simulator.dragAndReject(TEST_SIZE, target);
});
