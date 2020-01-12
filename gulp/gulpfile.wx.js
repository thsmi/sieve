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

const BUILD_DIR_APP = path.join(common.BASE_DIR_BUILD, "thunderbird-wx");
const BASE_DIR_APP = "./src/wx/";

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

// TODO
//exports["updateVersion"] = updateVersion;

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

