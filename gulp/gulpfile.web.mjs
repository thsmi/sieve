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

import path from 'path';

const BUILD_DIR_WEB = path.join(common.BASE_DIR_BUILD, "web/");

const BASE_DIR_WEB = "./src/web/";
const BASE_DIR_WX = "./src/wx/";
const BASE_DIR_APP = "./src/app/";


/**
 * Copies the license file into the build directory.
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageLicense() {
  return gulp.src([
    "./LICENSE.md"
  ]).pipe(gulp.dest(BUILD_DIR_WEB));
}


/**
 * Copies the codemirror sources into the build directory.
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageCodeMirror() {

  return common.packageCodeMirror(
    path.join(BUILD_DIR_WEB, "/static/libs/CodeMirror"));
}

/**
 * Copies the bootstrap sources into the build directory.
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 **/
function packageBootstrap() {

  return common.packageBootstrap(
    path.join(BUILD_DIR_WEB, "/static/libs/bootstrap"));
}
/**
 * Copies the source files into the app/ directory...
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageSrc() {

  return gulp.src([
    BASE_DIR_WEB + "/**",
    `!${BASE_DIR_WEB}/static/libs/libManageSieve/**`
  ]).pipe(gulp.dest(BUILD_DIR_WEB));
}

/**
 * Copies the favicon into the web root folder.
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageIcons() {

  return gulp.src(
    [path.join(common.BASE_DIR_COMMON, "icons") + "/*.ico"],
    { base: common.BASE_DIR_COMMON })
    .pipe(gulp.dest(path.join(BUILD_DIR_WEB, 'static')));
}


/**
 * Copies the libManageSieve files into the app's lib folder.
 * It merges files from common, webextension, the app and the web app.
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageLibManageSieve() {

  const BASE_WX = path.join(BASE_DIR_WX, "libs/libManageSieve");
  const BASE_WEB = path.join(BASE_DIR_WEB, "static/libs/libManageSieve");
  const BASE_COMMON = path.join(common.BASE_DIR_COMMON, "libManageSieve");

  return common.src2(BASE_WEB)
    .pipe(common.src2(BASE_WX, ["SieveTimer.mjs", "SieveCrypto.mjs", "SieveBase64.mjs"]))
    .pipe(common.src2(BASE_COMMON))
    .pipe(gulp.dest(path.join(BUILD_DIR_WEB, 'static/libs/libManageSieve')));
}

/**
 * Copies the common libSieve files into the app's lib folder
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageLibSieve() {
  return common.packageLibSieve(path.join(BUILD_DIR_WEB, 'static/libs'));
}

/**
 * Copies the common managesieve.ui files into the app's lib folder
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageManageSieveUi() {
  return common.packageManageSieveUi(path.join(BUILD_DIR_WEB, 'static/libs'));
}

/**
 * Copies the common managesieve.ui files into the app's lib folder
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageManageSieveUiApp() {

  const destination = path.join(BUILD_DIR_WEB, 'static/libs/managesieve.ui');
  const base = path.join(BASE_DIR_APP, "libs/managesieve.ui");

  return gulp.src([
    path.join(base, "/tabs/*.mjs"),
    path.join(base, "/tabs/*.html"),
    path.join(base, "/utils/SieveIpcClient.mjs")
  ], { base: base }).pipe(gulp.dest(destination));
}

/**
 * Watches for changed source files and copies them into the build directory.
 */
function watch() {

  gulp.watch(
    ['./src/**/*.js',
      './src/**/*.mjs',
      './src/**/*.html',
      './src/**/*.css',
      './src/**/*.json'],
    gulp.parallel(
      packageSrc,
      packageManageSieveUi,
      packageManageSieveUiApp,
      packageLibSieve,
      packageLibManageSieve)
  );
}

export default {
  watch,

  packageCodeMirror : packageCodeMirror,
  packageBootstrap : packageBootstrap,
  packageLicense : packageLicense,
  packageSrc : packageSrc,

  packageWeb: gulp.series(
    gulp.parallel(
      packageCodeMirror,
      packageBootstrap,
      packageLicense,
      packageLibManageSieve,
      packageLibSieve,
      packageManageSieveUi,
      packageManageSieveUiApp,
      packageIcons
    ),
    packageSrc
  )

};
