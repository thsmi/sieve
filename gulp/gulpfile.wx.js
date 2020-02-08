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

const zip = require('gulp-zip');
const path = require('path');

const BUILD_DIR_WX = path.join(common.BASE_DIR_BUILD, "thunderbird-wx");
const BASE_DIR_WX = "./src/wx/";

/**
 * Copies the license file into the build directory.
 * @returns {undefined}
 */
async function packageLicense() {
  "use strict";

  await src([
    "./LICENSE.md"
  ]).pipe(dest(BUILD_DIR_WX));
}

/**
 * Copies the jquery sources into the build directory.
 * @returns {undefined}
 */
async function packageJQuery() {
  "use strict";

  await common.packageJQuery(
    BUILD_DIR_WX + "/libs/jquery");
}

/**
 * Copies the codemirror sources into the build directory.
 * @returns {undefined}
 */
async function packageCodeMirror() {
  "use strict";

  await common.packageCodeMirror(
    `${BUILD_DIR_WX}/libs/CodeMirror`);
}

/**
 * Copies the bootstrap sources into the build directory.
 * @returns {undefined}
 **/
async function packageBootstrap() {
  "use strict";

  await common.packageBootstrap(
    `${BUILD_DIR_WX}/libs/bootstrap`);
}

/**
 * Copies the material design icons into the build directory.
 * @returns {undefined}
 */
async function packageMaterialIcons() {
  "use strict";

  await common.packageMaterialIcons(
    `${BUILD_DIR_WX}/libs/material-icons`);
}

/**
 * Copies the source files into the app/ directory...
 * @returns {undefined}
 */
async function packageSrc() {
  "use strict";

  await src([
    BASE_DIR_WX + "/**"
  ]).pipe(dest(BUILD_DIR_WX));
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
  ]).pipe(dest(BUILD_DIR_WX + '/libs'));
}


/**
 * Watches for changed source files and copies them into the build directory.
 * @returns {undefined}
 */
function watchSrc() {

  "use strict";

  watch(
    ['./src/**/*.js',
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
 * Updates the addon's version.
 * It reads the information from the npm package and updates the install.rdf as well as the manifest.json
 * @returns {undefined}
 */
async function updateVersion() {
  "use strict";

  const pkgVersion = await common.getPackageVersion();
  await common.setPackageVersion(pkgVersion, './src/wx/manifest.json');
}

/**
 * Zips the build directory and creates a XPI inside the release folder.
 * @returns {undefined}
 */
async function packageXpi() {
  "use strict";

  const version = (await common.getPackageVersion()).join(".");

  console.log(`Packaging sieve-${version}.xpi`);

  await src([`./${BUILD_DIR_WX}/**`], {buffer:false})
    .pipe(zip(`sieve-${version}.xpi`))
    .pipe(dest('./release/thunderbird'));
  // place code for your default task here
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

