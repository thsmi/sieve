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

const BUILD_DIR_WX = path.join(common.BASE_DIR_BUILD, "thunderbird-wx");
const BASE_DIR_WX = "./src/wx/";

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
  ]).pipe(dest(BUILD_DIR_WX));
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
    BUILD_DIR_WX + "/libs/jquery");
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
    `${BUILD_DIR_WX}/libs/CodeMirror`);
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
    `${BUILD_DIR_WX}/libs/bootstrap`);
}

/**
 * Copies the material design icons into the build directory.
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageMaterialIcons() {
  "use strict";

  return common.packageMaterialIcons(
    `${BUILD_DIR_WX}/libs/material-icons`);
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
    BASE_DIR_WX + "/**"
  ]).pipe(dest(BUILD_DIR_WX));
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
  ]).pipe(dest(BUILD_DIR_WX + '/libs'));
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
      './src/**/*.json'],
    parallel(
      packageSrc,
      packageCommon)
  );
}

/**
 * Updates the WebExtension's version.
 * It reads the information from the npm package and updates the install.rdf as well as the manifest.json
 */
async function updateVersion() {
  "use strict";

  const pkgVersion = await common.getPackageVersion();
  await common.setPackageVersion(pkgVersion, './src/wx/manifest.json');
}

/**
 * Zips the build directory and creates a XPI inside the release folder.
 */
async function packageXpi() {
  "use strict";

  const version = (await common.getPackageVersion()).join(".");

  const destination = path.resolve(common.BASE_DIR_BUILD, `sieve-${version}.xpi`);
  const source = path.resolve(`./${BUILD_DIR_WX}/`);

  await common.compress(source, destination);
}


exports["watch"] = watchSrc;

exports["updateVersion"] = updateVersion;

exports["packageJQuery"] = packageJQuery;
exports["packageCodeMirror"] = packageCodeMirror;
exports["packageBootstrap"] = packageBootstrap;
exports["packageMaterialIcons"] = packageMaterialIcons;
exports["packageLicense"] = packageLicense;
exports["packageSrc"] = packageSrc;
exports["packageCommon"] = packageCommon;

exports['package'] = parallel(
  packageJQuery,
  packageCodeMirror,
  packageBootstrap,
  packageMaterialIcons,
  packageLicense,
  packageSrc,
  packageCommon
);

exports["packageXpi"] = packageXpi;

