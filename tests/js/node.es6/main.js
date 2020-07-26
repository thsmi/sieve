// https://medium.com/@NorbertdeLangen/communicating-between-nodejs-processes-4e68be42b917

const path = require('path');

/*const spawn = require('child_process').spawn;

const command = 'node';
const parameters = [path.resolve('program.js')];

const child = spawn(command, parameters, {
  stdio: [ 'pipe', 'pipe', 'pipe', 'ipc' ]
});*/

const fork = require('child_process').fork;
const program = path.resolve(path.dirname(process.argv[1]), "child.mjs");
const args = [];
debugger;

const options = {
  stdio: [ 'pipe', 'pipe', 'pipe', 'ipc' ]
};

const child = fork(program, args, options);
child.on('message', message => {
  console.log('message from child:', message);
  child.send('Hi');
});

sleep = async (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

child.on("exit", () => {
  console.log("Child exited.");
});
