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

import common from "./gulpfile.common.mjs";
import app from "./gulpfile.app.mjs";
import wx from "./gulpfile.wx.mjs";
import path from 'path';

const BUILD_DIR_TEST = path.join(common.BASE_DIR_BUILD, "test/");

/**
 *
 */
async function packageAppTests() {
  await gulp.src([
    common.BASE_DIR_COMMON + "/**",

    // Filter out the rfc documents
    "!" + common.BASE_DIR_COMMON + "/libSieve/**/rfc*.txt",
    "!**/*.html",
    "!**/appImage/**",
    "!**/doc/**",
    "!**/icons/**"
  ]).pipe(gulp.dest(`${BUILD_DIR_TEST}/app/`));

  await gulp.src([
    path.join(app.BASE_DIR_APP, "/libs") + "/**",

    // Filter out the rfc documents
    "!" + common.BASE_DIR_COMMON + "/libSieve/**/rfc*.txt",
    "!**/*.html",
    "!**/appImage/**",
    "!**/doc/**",
    "!**/icons/**"
  ]).pipe(gulp.dest(`${BUILD_DIR_TEST}/app/`));
}

/**
 *
 */
async function packageWxTests() {

  await gulp.src([
    path.join(common.BASE_DIR_COMMON, "/**"),

    // Filter out the rfc documents
    "!" + common.BASE_DIR_COMMON + "/libSieve/**/rfc*.txt",
    "!**/*.html",
    "!**/appImage/**",
    "!**/doc/**",
    "!**/icons/**"
  ]).pipe(gulp.dest(`${BUILD_DIR_TEST}/wx/common/`));

  await gulp.src([
    path.join(wx.BASE_DIR_WX, "/libs") + "/**",

    // Filter out the rfc documents
    "!" + common.BASE_DIR_COMMON + "/libSieve/**/rfc*.txt",
    "!**/*.html",
    "!**/appImage/**",
    "!**/doc/**",
    "!**/icons/**"
  ]).pipe(gulp.dest(`${BUILD_DIR_TEST}/wx/`));
}

/**
 * Copies the test suite files into the test folder.
 */
async function packageTestSuite() {

  const BASE_PATH = "./tests";

  await gulp.src([
    BASE_PATH + "/**"
  ]).pipe(gulp.dest(BUILD_DIR_TEST + '/'));
}

/**
 * Watches for changed source files and copies them into the build directory.
 */
function watchTests() {

  gulp.watch(
    ['./src/**/*.js',
      './src/**/*.mjs',
      './tests/**/*.json',
      './tests/**/*.js'],
    gulp.parallel(
      packageAppTests,
      packageTestSuite)
  );
}

const packageTests = gulp.parallel(
  packageTestSuite,
  packageAppTests,
  packageWxTests
);

export default {
  packageTests,
  watchTests
};
