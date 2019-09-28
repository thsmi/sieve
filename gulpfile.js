/*
 * The content of this file is licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via
 * email from the author.
 *
 * Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

const { series, parallel } = require('gulp');

const common = require('./gulpfile.common.js');
const addon = require('./gulpfile.addon.js');
const app = require('./gulpfile.app.js');
const testing = require('./gulpfile.testing.js');

// App related gulp tasks
exports["app:watch"] = app.watch;
exports['app:package'] = app.package;

exports['app:package-win32'] = series(
  app.package,
  app.packageWin32
);

exports['app:package-linux'] = series(
  app.package,
  app.packageLinux
);

// Addon related gulp tasks
exports['addon:watch'] = addon.watch;
exports['addon:package'] = addon.package;

exports['addon:package-xpi'] = series(
  addon.package,
  addon.packageXpi
);

exports['addon:deploy'] = addon.deploy;

// Test related gulp tasks
exports["test:package"] = testing.package;
exports["test:watch"] = testing.watch;

// General gulp tasks

exports["clean"] = common.clean;

exports["bump-major"] = series(
  common.bumpMajorVersion,
  parallel(
    app.updateVersion,
    addon.updateVersion
  )
);

exports["bump-minor"] = series(
  common.bumpMinorVersion,
  parallel(
    app.updateVersion,
    addon.updateVersion
  )
);

exports["bump-patch"] = series(
  common.bumpPatchVersion,
  parallel(
    app.updateVersion,
    addon.updateVersion
  )
);
