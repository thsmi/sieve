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

const BUILD_DIR_TEST = path.join(common.BASE_DIR_BUILD, "test/");

/**
 * Copies jquery into the test folder.
 * @returns {undefined}
 */
async function packageJQuery() {
  "use strict";

  await common.packageJQuery(
    `${BUILD_DIR_TEST}/common/jQuery/`);
}

/**
 * Copies the common files into the test folder.
 * @returns {undefined}
 */
async function packageCommon() {
  "use strict";

  await src([
    common.BASE_DIR_COMMON + "/**",

    // Filter out the rfc documents
    "!" + common.BASE_DIR_COMMON + "/libSieve/**/rfc*.txt"
  ]).pipe(dest(common.BUILD_DIR_TEST + '/common/'));
}

/**
 * Copies the test suite files into the test folder.
 * @returns {undefined}
 */
async function packageTestSuite() {
  "use strict";

  const BASE_PATH = "./tests";

  await src([
    BASE_PATH + "/**"
  ]).pipe(dest(BUILD_DIR_TEST + '/'));
}

/**
 * Copies the addons source files into the test folder.
 * @returns {undefined}
 */
async function packageAddonSrc() {
  "use strict";

  const BASE_PATH = "./src/addon/chrome/chromeFiles/content";

  await src([
    BASE_PATH + "/**",

    "!" + BASE_PATH + "/filterList",
    "!" + BASE_PATH + "/filterList/**"
  ]).pipe(dest(BUILD_DIR_TEST + "/addon/"));
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
      './tests/**/*.json',
      './tests/**/*.js'],
    parallel(
      packageCommon,
      packageTestSuite)
  );
}

exports["package"] = parallel(
  packageCommon,
  packageAddonSrc,
  packageJQuery,
  packageTestSuite
);

exports["watch"] = watchSrc;
