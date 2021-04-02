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

import gulp from 'gulp';

import common from './gulp/gulpfile.common.mjs';
import app from './gulp/gulpfile.app.mjs';
import wx from './gulp/gulpfile.wx.mjs';
import testing from './gulp/gulpfile.testing.mjs';

// App Related Tasks

app.packageApp.displayName = "app:package";
app.packageApp.description = "Packages the standalone application";

export const { watch : appWatch, packageApp : appPackage} = app;

const appPackageWin32 = gulp.series(
  app.packageApp,
  app.packageWin32
);
appPackageWin32.displayName = "app:package-win32";

const appZipWin32 = gulp.series(
  appPackageWin32,
  app.zipWin32
);
appZipWin32.displayName = "app:zip-win32";

const appPackageLinux = gulp.series(
  app.packageApp,
  app.packageLinux
);
appPackageLinux.displayName = 'app:package-linux';

const appZipLinux = gulp.series(
  appPackageLinux,
  app.zipLinux
);
appZipLinux.displayName = 'app:zip-linux';

const appAppImageLinux = gulp.series(
  appPackageLinux,
  app.appImageLinux
);
appAppImageLinux.displayName = 'app:appimage-linux';

const appPackageMacOS = gulp.series(
  app.packageApp,
  app.packageMacOS
);
appPackageMacOS.displayName = 'app:package-macos';

const appZipMacOS = gulp.series(
  appPackageMacOS,
  app.zipMacOS
);
appZipMacOS.displayName = 'app:zip-macos';

app.watch.displayName = "app:watch";
app.watch.description = "Watches the app's source files for changes";

export {
  appPackageWin32,
  appZipWin32,
  appPackageLinux,
  appZipLinux,
  appAppImageLinux,
  appPackageMacOS,
  appZipMacOS
};

// Web Extensions Related Tasks...
wx.watch.displayName = "wx:watch";
wx.packageWx.displayName = "wx:package";

export const { watch : wxWatch, packageWx: wxPackage } = wx;

const wxPackageXpi = gulp.series(
  wx.packageWx,
  wx.packageXpi
);
wxPackageXpi.displayName = "wx:package-xpi";

export {
  wxPackageXpi
};

// Testing Related Tasks...
testing.watchTests.displayName = "test:watch";
testing.packageTests.displayName = "test:package";

export const { watchTests : testWatch, packageTests : testPackage } = testing;

// Generic Tasks...
common.clean.displayName = "clean";
export const { clean } = common;

const commonBumpMajor = gulp.series(
  common.bumpMajorVersion,
  gulp.parallel(
    app.updateVersion,
    wx.updateVersion
  )
);
commonBumpMajor.displayName = "bump-major";

const commonBumpMinor = gulp.series(
  common.bumpMinorVersion,
  gulp.parallel(
    app.updateVersion,
    wx.updateVersion
  )
);
commonBumpMinor.displayName = "bump-minor";

const commonBumpPatch = gulp.series(
  common.bumpPatchVersion,
  gulp.parallel(
    app.updateVersion,
    wx.updateVersion,
    common.updateVersion
  )
);
commonBumpPatch.displayName = "bump-patch";

export {
  commonBumpMajor,
  commonBumpMinor,
  commonBumpPatch
};
