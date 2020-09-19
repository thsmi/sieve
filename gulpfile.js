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

const common = require('./gulp/gulpfile.common.js');
const app = require('./gulp/gulpfile.app.js');
const wx = require('./gulp/gulpfile.wx.js');
const web = require('./gulp/gulpfile.web.js');

const testing = require('./gulp/gulpfile.testing.js');

// WX related gulp tasks

exports["wx:watch"] = wx.watch;
exports["wx:package"] = wx.package;

exports['wx:package-xpi'] = series(
  wx.package,
  wx.packageXpi
);

// Web related gulp tats
exports["web:watch"] = web.watch;
exports["web:package"] = web.package;

// App related gulp tasks
exports["app:watch"] = app.watch;
exports['app:package'] = app.package;

exports['app:package-win32'] = series(
  app.package,
  app.packageWin32
);

exports['app:zip-win32'] = series(
  exports['app:package-win32'],
  app.zipWin32
);

exports['app:package-linux'] = series(
  app.package,
  app.packageLinux
);

exports['app:zip-linux'] = series(
  exports['app:package-linux'],
  app.zipLinux
);

exports['app:appimage-linux'] = series(
  exports['app:package-linux'],
  app.appImageLinux
);

exports['app:package-macos'] = series(
  app.package,
  app.packageMacOS
);

exports['app:zip-macos'] = series(
  exports['app:package-macos'],
  app.zipMacOS
);

// Test related gulp tasks
exports["test:package"] = testing.package;
exports["test:watch"] = testing.watch;

// General gulp tasks

exports["clean"] = common.clean;

exports["bump-major"] = series(
  common.bumpMajorVersion,
  parallel(
    app.updateVersion,
    wx.updateVersion
  )
);

exports["bump-minor"] = series(
  common.bumpMinorVersion,
  parallel(
    app.updateVersion,
    wx.updateVersion
  )
);

exports["bump-patch"] = series(
  common.bumpPatchVersion,
  parallel(
    app.updateVersion,
    wx.updateVersion,
    common.updateVersion
  )
);
