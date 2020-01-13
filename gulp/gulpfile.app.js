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

const { src, dest, watch, parallel } = require('gulp');

const common = require("./gulpfile.common.js");
const path = require('path');

const BUILD_DIR_APP = path.join(common.BASE_DIR_BUILD, "electron/resources");
const BASE_DIR_APP = "./src/app/";

/**
 * Copies and updates the package.json inside the build directory.
 * It is typically used by other tools like the electron-packager.
 * @returns {undefined}
 */
async function packageDefinition() {

  "use strict";

  const BASE_PATH = ".";

  await src([
    BASE_PATH + "/package.json"
  ], { base: BASE_PATH }).pipe(dest(BUILD_DIR_APP));
}

/**
 * Copies the license file into the build directory.
 * @returns {undefined}
 */
async function packageLicense() {
  "use strict";

  await src([
    "./LICENSE.md"
  ]).pipe(dest(BUILD_DIR_APP));
}


/**
 * Copies the jquery sources into the build directory.
 * @returns {undefined}
 */
async function packageJQuery() {
  "use strict";

  await common.packageJQuery(
    BUILD_DIR_APP + "/libs/jquery");
}

/**
 * Copies the codemirror sources into the build directory.
 * @returns {undefined}
 */
async function packageCodeMirror() {
  "use strict";

  await common.packageCodeMirror(
    `${BUILD_DIR_APP}/libs/CodeMirror`);
}

/**
 * Copies the bootstrap sources into the build directory.
 * @returns {undefined}
 **/
async function packageBootstrap() {
  "use strict";

  await common.packageBootstrap(
    `${BUILD_DIR_APP}/libs/bootstrap`);
}

/**
 * Copies the material design icons into the build directory.
 * @returns {undefined}
 */
async function packageMaterialIcons() {
  "use strict";

  await common.packageMaterialIcons(
    `${BUILD_DIR_APP}/libs/material-icons`);
}

/**
 * Copies the source files into the app/ directory...
 * @returns {undefined}
 */
async function packageSrc() {
  "use strict";

  await src([
    BASE_DIR_APP + "/**"
  ]).pipe(dest(BUILD_DIR_APP));
}

/**
 * The common files need to go into the app/lib directory...
 * @returns {undefined}
 */
async function packageCommon() {
  "use strict";

  await src([
    common.BASE_DIR_COMMON + "/**",
    // Filter out the editor wrapper
    "!" + common.BASE_DIR_COMMON + "/editor",
    "!" + common.BASE_DIR_COMMON + "/editor/**",
    // Filter out the rfc documents
    "!" + common.BASE_DIR_COMMON + "/libSieve/**/rfc*.txt",
    "!" + common.BASE_DIR_COMMON + "/libSieve/**/tests/",
    "!" + common.BASE_DIR_COMMON + "/libSieve/**/tests/**"
  ]).pipe(dest(BUILD_DIR_APP + '/libs'));
}

/**
 * Packages the build directory and electron for windows.
 * @returns {undefined}
 */
async function packageWin32() {
  "use strict";

  const options = {
    dir: BUILD_DIR_APP,
    arch: "ia32",
    platform: "win32",
    download: {
      // cache: path.join(common.BASE_DIR_BUILD, "/electron/cache"),
      cacheRoot: path.join(common.BASE_DIR_BUILD, "/electron/cache")
    },
    out: path.join(common.BASE_DIR_BUILD, "/electron/out"),
    overwrite: true,
    // packageManager: "yarn",
    // packageManager : false,
    // icon: "./../test.ico",
    prune: true
  };

  const packager = require('electron-packager');
  await packager(options);
}

/**
 * Packages the build directory and electron for linux
 * @returns {undefined}
 */
async function packageLinux() {
  "use strict";

  const options = {
    dir: BUILD_DIR_APP,
    arch: "x64",
    platform: "linux",
    download: {
      cache: path.join(common.BASE_DIR_BUILD, "/electron/cache")
    },
    out: path.join(common.BASE_DIR_BUILD, "/electron/out"),
    overwrite: true,
    // packageManager : "yarn"
    // packageManager : false,
    prune: true
  };

  const packager = require('electron-packager');
  await packager(options);
}

/**
 * Packages the build directory and electron for macOS
 * @returns {undefined}
 */
async function packageMacOS() {
  "use strict";

  const options = {
    dir: BUILD_DIR_APP,
    arch: "x64",
    platform: "mas",
    download: {
      cache: path.join(common.BASE_DIR_BUILD, "/electron/cache")
    },
    out: path.join(common.BASE_DIR_BUILD, "/electron/out"),
    overwrite: true,
    // packageManager : "yarn"
    // packageManager : false,
    prune: true
    //app-bundle-id: "net.tschmid.sieve"
  };

  const packager = require('electron-packager');
  await packager(options);
}

/**
 * Updates the addon's version.
 * @returns {undefined}
 */
async function updateVersion() {
  "use strict";

  // there is no need to do anything here.
  // Electron packager will to it for us.
}

/**
 * Watches for changed source files and copies them into the build directory.
 * @returns {undefined}
 */
function watchSrc() {

  "use strict";

  watch(
    ['./src/**/*.js',
      './src/**/*.jsm',
      './src/**/*.html',
      './src/**/*.tpl',
      './src/**/*.css',
      './src/**/*.xul',
      './src/**/*.dtd',
      './src/**/*.properties'],
    parallel(
      packageSrc,
      packageCommon)
  );
}

exports["watch"] = watchSrc;

exports["updateVersion"] = updateVersion;

exports["packageDefinition"] = packageDefinition;
exports["packageJQuery"] = packageJQuery;
exports["packageCodeMirror"] = packageCodeMirror;
exports["packageBootstrap"] = packageBootstrap;
exports["packageMaterialIcons"] = packageMaterialIcons;
exports["packageLicense"] = packageLicense;
exports["packageSrc"] = packageSrc;
exports["packageCommon"] = packageCommon;

exports["packageWin32"] = packageWin32;
exports["packageLinux"] = packageLinux;
exports["packageMacOS"] = packageMacOS;

exports['package'] = parallel(
  packageDefinition,
  packageJQuery,
  packageCodeMirror,
  packageBootstrap,
  packageMaterialIcons,
  packageLicense,
  packageSrc,
  packageCommon
);

