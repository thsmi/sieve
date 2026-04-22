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

const IF = 'if ';
const ELSE = 'else';
const ELSIF = 'elsif ';

const NEW_LINE = "\r\n";
const EMPTY_BODY = '{\r\n}';
const KEEP = "keep;";
const KEEP_BODY = '{' + KEEP + NEW_LINE + '}';

const CONDITION_DROP_BOX = ".sivCondition > .sivSummaryContent > .sivDropBox";

const EXISTS = 'exists "From"';
const SIZE = 'size :over 1M';

const ACTION_KEEP = "#divOutput .sivBlock > .siv-action-keep";


const fixture = suite.add("Move - Actions");

fixture.add("Move action to if", async(simulator) => {
  let target;

  // Reject moving keep action to first condition drop.
  await simulator.init(""
    + KEEP + NEW_LINE
    + IF + EXISTS + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, FIRST_ELEMENT);
  await simulator.dragAndReject(ACTION_KEEP, target);

  // Accept moving to else
  await simulator.init(""
    + KEEP + NEW_LINE
    + IF + EXISTS + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, SECOND_ELEMENT);
  await simulator.dragAndDrop(ACTION_KEEP, target);

  await simulator.assertScript(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSE + NEW_LINE + KEEP_BODY + NEW_LINE);
});

fixture.add("Move action to if/elsif", async(simulator) => {
  let target;

  // Reject moving keep action to first condition drop.
  await simulator.init(""
    + KEEP + NEW_LINE
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSIF + SIZE + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, FIRST_ELEMENT);
  await simulator.dragAndReject(ACTION_KEEP, target);

  // Reject moving keep action to second condition drop.
  await simulator.init(""
    + KEEP + NEW_LINE
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSIF + SIZE + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, SECOND_ELEMENT);
  await simulator.dragAndReject(ACTION_KEEP, target);

  // Accept moving to else
  await simulator.init(""
    + KEEP + NEW_LINE
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSIF + SIZE + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, THIRD_ELEMENT);
  await simulator.dragAndDrop(ACTION_KEEP, target);

  await simulator.assertScript(""
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSIF + SIZE + EMPTY_BODY + NEW_LINE
    + ELSE + NEW_LINE + KEEP_BODY + NEW_LINE);
});


fixture.add("Move action to if/else", async(simulator) => {
  let target;

  // Reject moving keep action to first condition drop.
  await simulator.init(""
    + KEEP + NEW_LINE
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSE + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, FIRST_ELEMENT);
  await simulator.dragAndReject(ACTION_KEEP, target);

  // Reject moving to explicit else
  await simulator.init(""
    + KEEP + NEW_LINE
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSE + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, SECOND_ELEMENT);
  await simulator.dragAndReject(ACTION_KEEP, target);

  // Reject moving to implicit else
  await simulator.init(""
    + KEEP + NEW_LINE
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSE + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, THIRD_ELEMENT);
  await simulator.dragAndReject(ACTION_KEEP, target);
});

fixture.add("Move action to if/elsif/else", async(simulator) => {

  let target;

  // Reject moving keep action to first condition drop.
  await simulator.init(""
    + KEEP + NEW_LINE
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSIF + SIZE + EMPTY_BODY + NEW_LINE
    + ELSE + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, FIRST_ELEMENT);
  await simulator.dragAndReject(ACTION_KEEP, target);

  // Reject moving keep action to first condition drop.
  await simulator.init(""
    + KEEP + NEW_LINE
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSIF + SIZE + EMPTY_BODY + NEW_LINE
    + ELSE + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, SECOND_ELEMENT);
  await simulator.dragAndReject(ACTION_KEEP, target);

  // Reject moving keep action to first condition drop.
  await simulator.init(""
    + KEEP + NEW_LINE
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSIF + SIZE + EMPTY_BODY + NEW_LINE
    + ELSE + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, THIRD_ELEMENT);
  await simulator.dragAndReject(ACTION_KEEP, target);

  // Reject moving keep action to first condition drop.
  await simulator.init(""
    + KEEP + NEW_LINE
    + IF + EXISTS + EMPTY_BODY + NEW_LINE
    + ELSIF + SIZE + EMPTY_BODY + NEW_LINE
    + ELSE + EMPTY_BODY + NEW_LINE);

  target = await simulator.waitForNthElement(CONDITION_DROP_BOX, FOURTH_ELEMENT);
  await simulator.dragAndReject(ACTION_KEEP, target);

});
