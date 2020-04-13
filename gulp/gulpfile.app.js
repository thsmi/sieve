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

const WIN_ARCH = "x64";
const WIN_PLATFORM = "win32";
const LINUX_ARCH = "x64";
const LINUX_PLATFORM = "linux";
const MAC_ARCH = "x64";
const MAC_PLATFORM = "mas";

/**
 * Copies and updates the package.json inside the build directory.
 * It is typically used by other tools like the electron-packager.
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageDefinition() {

  "use strict";

  const BASE_PATH = ".";

  return src([
    BASE_PATH + "/package.json"
  ], { base: BASE_PATH }).pipe(dest(BUILD_DIR_APP));
}

/**
 * Copies the license file into the build directory.
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageLicense() {
  "use strict";

  return src([
    "./LICENSE.md"
  ]).pipe(dest(BUILD_DIR_APP));
}


/**
 * Copies the jquery sources into the build directory.
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageJQuery() {
  "use strict";

  return common.packageJQuery(
    BUILD_DIR_APP + "/libs/jquery");
}

/**
 * Copies the codemirror sources into the build directory.
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageCodeMirror() {
  "use strict";

  return common.packageCodeMirror(
    `${BUILD_DIR_APP}/libs/CodeMirror`);
}

/**
 * Copies the bootstrap sources into the build directory.
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 **/
function packageBootstrap() {
  "use strict";

  return common.packageBootstrap(
    `${BUILD_DIR_APP}/libs/bootstrap`);
}

/**
 * Copies the material design icons into the build directory.
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageMaterialIcons() {
  "use strict";

  return common.packageMaterialIcons(
    `${BUILD_DIR_APP}/libs/material-icons`);
}

/**
 * Copies the source files into the app/ directory...
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageSrc() {
  "use strict";

  return src([
    BASE_DIR_APP + "/**"
  ]).pipe(dest(BUILD_DIR_APP));
}

/**
 * The common files need to go into the app/lib directory...
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageCommon() {
  "use strict";

  return src([
    common.BASE_DIR_COMMON + "/**",
    // Filter out the rfc documents
    "!" + common.BASE_DIR_COMMON + "/libSieve/**/rfc*.txt",
    "!" + common.BASE_DIR_COMMON + "/libSieve/**/tests/",
    "!" + common.BASE_DIR_COMMON + "/libSieve/**/tests/**"
  ]).pipe(dest(BUILD_DIR_APP + '/libs'));
}

/**
 * Packages the build directory and electron for windows.
 */
async function packageWin32() {
  "use strict";

  const options = {
    dir: BUILD_DIR_APP,
    arch: WIN_ARCH,
    platform: WIN_PLATFORM,
    download: {
      cacheRoot: path.join(common.BASE_DIR_BUILD, "/electron/cache")
    },
    out: path.join(common.BASE_DIR_BUILD, "/electron/out"),
    overwrite: true,
    icon: path.join(common.BASE_DIR_COMMON, "icons/win.ico"),
    prune: true
  };

  const packager = require('electron-packager');
  await packager(options);
}

/**
 * Packages the build directory and electron for linux
 */
async function packageLinux() {
  "use strict";

  const options = {
    dir: BUILD_DIR_APP,
    arch: LINUX_ARCH,
    platform: LINUX_PLATFORM,
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
 */
async function packageMacOS() {
  "use strict";

  const options = {
    dir: BUILD_DIR_APP,
    arch: MAC_ARCH,
    platform: MAC_PLATFORM,
    download: {
      cache: path.join(common.BASE_DIR_BUILD, "/electron/cache")
    },
    out: path.join(common.BASE_DIR_BUILD, "/electron/out"),
    overwrite: true,
    icon: path.join(common.BASE_DIR_COMMON, "icons/mac.icns"),
    prune: true
    // app-bundle-id: "net.tschmid.sieve"
  };

  const packager = require('electron-packager');
  await packager(options);
}

/**
 * Updates the addons version.
 */
// eslint-disable-next-line require-await
async function updateVersion() {
  "use strict";

  // there is no need to do anything here.
  // Electron packager will to it for us.
}

/**
 * Watches for changed source files and copies them into the build directory.
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

/**
 * Zip the windows electron app.
 */
async function zipWin32() {
  "use strict";

  const version = (await common.getPackageVersion()).join(".");

  const source = path.resolve(path.join(common.BASE_DIR_BUILD, `/electron/out/sieve-${WIN_PLATFORM}-${WIN_ARCH}`));
  const destination = path.join(common.BASE_DIR_BUILD, `sieve-${version}-${WIN_PLATFORM}-${WIN_ARCH}.zip`);

  await common.compress(source, destination);
}

/**
 * Zip the linux electron app.
 */
async function zipLinux() {
  "use strict";

  const version = (await common.getPackageVersion()).join(".");

  const source = path.resolve(path.join(common.BASE_DIR_BUILD, `/electron/out/sieve-${LINUX_PLATFORM}-${LINUX_ARCH}`));
  const destination = path.join(common.BASE_DIR_BUILD, `sieve-${version}-${LINUX_PLATFORM}-${LINUX_ARCH}.zip`);

  const options = {
    permissions: {
      "sieve": 0o100770,
      "*": 0o100660
    }
  };

  await common.compress(source, destination, options);
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

exports["zipWin32"] = zipWin32;
exports["zipLinux"] = zipLinux;

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

