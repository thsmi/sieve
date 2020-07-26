debugger;

import { addTwo } from './addTwo.mjs';

//import "SandboxedTestFixture.js";

if (process.send) {
  process.send("Hello");
}

process.on('message', message => {
  console.log(addTwo(4));
  console.log('message from parent:', message);
});

const sleep = async (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

(async () => {
  await sleep(15000);
  process.exit();
})();
