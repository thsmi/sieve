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


import { suite } from "./js/TestSuite.mjs";

import "./tests/Blocks.mjs";
import "./tests/Conditions/Conditions.mjs";
import "./tests/Conditions/MoveActions.mjs";
import "./tests/Conditions/MoveTests.mjs";
import "./tests/Conditions/MoveConditions.mjs";
import "./tests/Conditions/MoveNested.mjs";



/**
 * The main entry point
 */
function main() {

  document.getElementById("btnRun").addEventListener("click", async () => {
    suite.run();
  });

  document.getElementById("btnAll").addEventListener("click", async () => {
    suite.enable();
  });

  document.getElementById("btnNone").addEventListener("click", async () => {
    suite.disable();
  });

}

if (document.readyState !== 'loading')
  main();
else
  document.addEventListener('DOMContentLoaded', () => { main(); }, { once: true });
