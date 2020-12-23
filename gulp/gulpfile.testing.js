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
const app = require("./gulpfile.app.js");
const wx = require("./gulpfile.wx.js");
const path = require('path');

const BUILD_DIR_TEST = path.join(common.BASE_DIR_BUILD, "test/");

async function packageAppTests() {
  await src([
    common.BASE_DIR_COMMON + "/**",

    // Filter out the rfc documents
    "!" + common.BASE_DIR_COMMON + "/libSieve/**/rfc*.txt",
    "!**/*.html",
    "!**/appImage/**",
    "!**/doc/**",
    "!**/icons/**"
  ]).pipe(dest(`${BUILD_DIR_TEST}/app/`));

  await src([
    path.join(app.BASE_DIR_APP, "/libs") + "/**",

    // Filter out the rfc documents
    "!" + common.BASE_DIR_COMMON + "/libSieve/**/rfc*.txt",
    "!**/*.html",
    "!**/appImage/**",
    "!**/doc/**",
    "!**/icons/**"
  ]).pipe(dest(`${BUILD_DIR_TEST}/app/`));
}

async function packageWxTests() {

  await src([
    path.join(common.BASE_DIR_COMMON, "/**"),

    // Filter out the rfc documents
    "!" + common.BASE_DIR_COMMON + "/libSieve/**/rfc*.txt",
    "!**/*.html",
    "!**/appImage/**",
    "!**/doc/**",
    "!**/icons/**"
  ]).pipe(dest(`${BUILD_DIR_TEST}/wx/common/`));

  await src([
    path.join(wx.BASE_DIR_WX, "/libs") + "/**",

    // Filter out the rfc documents
    "!" + common.BASE_DIR_COMMON + "/libSieve/**/rfc*.txt",
    "!**/*.html",
    "!**/appImage/**",
    "!**/doc/**",
    "!**/icons/**"
  ]).pipe(dest(`${BUILD_DIR_TEST}/wx/`));
}

/**
 * Copies the test suite files into the test folder.
 */
async function packageTestSuite() {

  const BASE_PATH = "./tests";

  await src([
    BASE_PATH + "/**"
  ]).pipe(dest(BUILD_DIR_TEST + '/'));
}

/**
 * Watches for changed source files and copies them into the build directory.
 */
function watchSrc() {

  watch(
    ['./src/**/*.js',
      './src/**/*.mjs',
      './tests/**/*.json',
      './tests/**/*.js'],
    parallel(
      packageAppTests,
      packageTestSuite)
  );
}

exports["package"] = parallel(
  packageTestSuite,
  packageAppTests
  //packageWxTests
);

exports["watch"] = watchSrc;
