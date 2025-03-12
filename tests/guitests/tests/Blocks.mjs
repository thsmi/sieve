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

import { suite } from "./../js/TestSuite.mjs";

const BLOCK_SPACER = "#divOutput > div > div.sivBlock > div.sivDropBox.sivBlockSpacer";
const DROP_BOX = "#divOutput > div > div.sivBlock > div.sivDropBox";

const DISCARD_ELEMENTS = "#divOutput > div > div.sivBlock > div.siv-action-discard";
const KEEP_ELEMENTS = "#divOutput > div > div.sivBlock > div.siv-action-keep";
const STOP_ELEMENTS = "#divOutput > div > div.sivBlock > div.siv-action-stop";

const SIDEBAR_DISCARD = "#sivActions div.siv-action-discard";
const SIDEBAR_REDIRECT = "#sivActions div.siv-action-redirect";

const FIRST_ELEMENT = 0;
const SECOND_ELEMENT = 1;
const THIRD_ELEMENT = 2;
const FOURTH_ELEMENT = 3;

const DISCARD = "discard;\r\n";
const KEEP = "keep;\r\n";
const STOP = "stop;\r\n";
const REDIRECT = "redirect \"username@example.com\";\r\n";

const TRASH = "div.sivDropBox,sivTrashBin";

const fixture = suite.add("Blocks");

fixture.add("Add Action to Block", async (simulator) => {

  let target = null;

  // Add to an empty block
  await simulator.init();

  target = await simulator.waitForNthElement(DROP_BOX, FIRST_ELEMENT);

  await simulator.dragAndDrop(SIDEBAR_REDIRECT, target);
  await simulator.assertScript(REDIRECT);

  // Add before first element
  await simulator.init(DISCARD + KEEP + STOP);
  target = await simulator.waitForNthElement(BLOCK_SPACER, FIRST_ELEMENT);

  await simulator.dragAndDrop(SIDEBAR_REDIRECT, target);
  await simulator.assertScript(REDIRECT + DISCARD + KEEP + STOP);

  // Add between first and second element
  await simulator.init(DISCARD + KEEP + STOP);
  target = await simulator.waitForNthElement(BLOCK_SPACER, SECOND_ELEMENT);

  await simulator.dragAndDrop(SIDEBAR_REDIRECT, target);
  await simulator.assertScript(DISCARD + REDIRECT + KEEP + STOP);

  // Add between second and third element
  await simulator.init(DISCARD + KEEP + STOP);
  target = await simulator.waitForNthElement(BLOCK_SPACER, THIRD_ELEMENT);

  await simulator.dragAndDrop(SIDEBAR_REDIRECT, target);
  await simulator.assertScript(DISCARD + KEEP + REDIRECT + STOP);

  // Add to the end
  await simulator.init(DISCARD + KEEP + STOP);
  target = await simulator.waitForNthElement(BLOCK_SPACER, FOURTH_ELEMENT);

  await simulator.dragAndDrop(SIDEBAR_REDIRECT, target);
  await simulator.assertScript(DISCARD + KEEP + STOP + REDIRECT);
});

fixture.add("Add Action to Empty Block but abort", async (simulator) => {
  await simulator.init();

  await simulator.dragAndAbort(SIDEBAR_DISCARD, DROP_BOX);

  await simulator.assertScript("");
});


fixture.add("Move first Element in Block", async (simulator) => {

  let source = null;
  let target = null;

  // Move the discard action (First Element)
  // action[0] -> spacer[0] -> no change
  await simulator.init(DISCARD + KEEP + STOP);

  source = await simulator.waitForElement(DISCARD_ELEMENTS);
  target = await simulator.waitForNthElement(BLOCK_SPACER, FIRST_ELEMENT);

  await simulator.dragAndReject(source, target);
  await simulator.assertScript("discard;\nkeep;\nstop;\n");


  // action[0] -> spacer[1] -> no change
  await simulator.init(DISCARD + KEEP + STOP);

  source = await simulator.waitForElement(DISCARD_ELEMENTS);
  target = await simulator.waitForNthElement(BLOCK_SPACER, SECOND_ELEMENT);

  await simulator.dragAndReject(source, target);
  await simulator.assertScript("discard;\nkeep;\nstop;\n");


  // action[0] -> spacer[2] -> swap
  await simulator.init(DISCARD + KEEP + STOP);

  source = await simulator.waitForElement(DISCARD_ELEMENTS);
  target = await simulator.waitForNthElement(BLOCK_SPACER, THIRD_ELEMENT);

  await simulator.dragAndDrop(source, target);
  await simulator.assertScript("keep;\ndiscard;\nstop;\n");


  // action[0] -> spacer[3] -> swap
  await simulator.init(DISCARD + KEEP + STOP);

  source = await simulator.waitForElement(DISCARD_ELEMENTS);
  target = await simulator.waitForNthElement(BLOCK_SPACER, FOURTH_ELEMENT);

  await simulator.dragAndDrop(source, target);
  await simulator.assertScript("keep;\nstop;\ndiscard;\n");
});

fixture.add("Move median Element in Block", async (simulator) => {

  let source = null;
  let target = null;

  // Move the keep action (Second element)
  // action[1] -> spacer[0] -> swap
  await simulator.init(DISCARD + KEEP + STOP);

  source = await simulator.waitForElement(KEEP_ELEMENTS);
  target = await simulator.waitForNthElement(BLOCK_SPACER, FIRST_ELEMENT);

  await simulator.dragAndDrop(source, target);
  await simulator.assertScript(KEEP + DISCARD + STOP);

  // action[1] -> spacer[1] -> no change
  await simulator.init(DISCARD + KEEP + STOP);

  source = await simulator.waitForElement(KEEP_ELEMENTS);
  target = await simulator.waitForNthElement(BLOCK_SPACER, SECOND_ELEMENT);

  await simulator.dragAndReject(source, target);
  await simulator.assertScript(DISCARD + KEEP + STOP);

  // action[1] -> spacer[2] ->  no change
  await simulator.init(DISCARD + KEEP + STOP);

  source = await simulator.waitForElement(KEEP_ELEMENTS);
  target = await simulator.waitForNthElement(BLOCK_SPACER, THIRD_ELEMENT);

  await simulator.dragAndReject(source, target);
  await simulator.assertScript(DISCARD + KEEP + STOP);


  // action[1] -> spacer[3] -> swap
  await simulator.init(DISCARD + KEEP + STOP);

  source = await simulator.waitForElement(KEEP_ELEMENTS);
  target = await simulator.waitForNthElement(BLOCK_SPACER, FOURTH_ELEMENT);

  await simulator.dragAndDrop(source, target);
  await simulator.assertScript(DISCARD + STOP + KEEP);
});

fixture.add("Move last Element in Block", async (simulator) => {
  const script = "discard;\r\nkeep;\r\nstop;\r\n";

  let target = null;

  // Move the stop action
  // action[2] -> spacer[0] -> swap
  await simulator.init(DISCARD + KEEP + STOP);

  target = await simulator.waitForNthElement(BLOCK_SPACER, FIRST_ELEMENT);

  await simulator.dragAndDrop(STOP_ELEMENTS, target);
  await simulator.assertScript(STOP + DISCARD + KEEP);


  // action[2] -> spacer[1] -> swap
  await simulator.init(script);

  target = await simulator.waitForNthElement(BLOCK_SPACER, SECOND_ELEMENT);

  await simulator.dragAndDrop(STOP_ELEMENTS, target);
  await simulator.assertScript(DISCARD + STOP + KEEP);


  // action[2] -> spacer[3] -> no change
  await simulator.init(script);

  target = await simulator.waitForNthElement(BLOCK_SPACER, THIRD_ELEMENT);

  await simulator.dragAndReject(STOP_ELEMENTS, target);
  await simulator.assertScript(DISCARD + KEEP + STOP);


  // action[2] -> spacer[3] -> no change
  await simulator.init(script);

  target = await simulator.waitForNthElement(BLOCK_SPACER, FOURTH_ELEMENT);

  await simulator.dragAndReject(STOP_ELEMENTS, target);
  await simulator.assertScript(DISCARD + KEEP + STOP);
});


fixture.add("Remove Element from Block", async (simulator) => {

  await simulator.init(DISCARD + KEEP + STOP);

  await simulator.dragAndDrop(DISCARD_ELEMENTS, TRASH);
  await simulator.assertScript(KEEP + STOP);

  await simulator.dragAndDrop(KEEP_ELEMENTS, TRASH);
  await simulator.assertScript(STOP);

  await simulator.dragAndDrop(STOP_ELEMENTS, TRASH);
  await simulator.assertScript("");


  await simulator.init(DISCARD + KEEP + STOP);

  await simulator.dragAndDrop(KEEP_ELEMENTS, TRASH);
  await simulator.assertScript(DISCARD + STOP);

  await simulator.dragAndDrop(STOP_ELEMENTS, TRASH);
  await simulator.assertScript(DISCARD);

  await simulator.dragAndDrop(DISCARD_ELEMENTS, TRASH);
  await simulator.assertScript("");


  await simulator.init(DISCARD + KEEP + STOP);

  await simulator.dragAndDrop(STOP_ELEMENTS, TRASH);
  await simulator.assertScript(DISCARD + KEEP);

  await simulator.dragAndDrop(KEEP_ELEMENTS, TRASH);
  await simulator.assertScript(DISCARD);

  await simulator.dragAndDrop(DISCARD_ELEMENTS, TRASH);
  await simulator.assertScript("");
});
