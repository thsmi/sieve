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

const { src, dest, watch, parallel, series } = require('gulp');
const path = require('path');

const common = require("./gulpfile.common.js");

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
  "use strict";

  return src([
    "./LICENSE.md"
  ]).pipe(dest(BUILD_DIR_WEB));
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
    path.join(BUILD_DIR_WEB, "static/libs/jquery"));
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
    path.join(BUILD_DIR_WEB, "/static/libs/CodeMirror"));
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
    path.join(BUILD_DIR_WEB, "/static/libs/bootstrap"));
}
/**
 * Copies the source files into the app/ directory...
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageSrc() {

  return src([
    BASE_DIR_WEB + "/**",
    `!${BASE_DIR_WEB}/static/libs/libManageSieve/**`
  ]).pipe(dest(BUILD_DIR_WEB));
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
  const BASE_APP = path.join(BASE_DIR_APP, "libs/libManageSieve");
  const BASE_WEB = path.join(BASE_DIR_WEB, "static/libs/libManageSieve");
  const BASE_COMMON = path.join(common.BASE_DIR_COMMON, "libManageSieve");

  return common.src2(BASE_WEB)
    .pipe(common.src2(BASE_WX, ["SieveResponseParser.js", "SieveRequestBuilder.js"]))
    .pipe(common.src2(BASE_APP, "SieveLogger.js"))
    .pipe(common.src2(BASE_COMMON))
    .pipe(dest(path.join(BUILD_DIR_WEB, 'static/libs/libManageSieve')));
}

/**
 * Copies the common libSieve files into the app's lib folder
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageLibSieve() {
  "use strict";
  return common.packageLibSieve(path.join(BUILD_DIR_WEB, 'static/libs'));
}

/**
 * Copies the common managesieve.ui files into the app's lib folder
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageManageSieveUi() {
  "use strict";

  return common.packageManageSieveUi(path.join(BUILD_DIR_WEB, 'static/libs'));
}

/**
 * Copies the common managesieve.ui files into the app's lib folder
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageManageSieveUiApp() {

  "use strict";

  const destination = path.join(BUILD_DIR_WEB, 'static/libs/managesieve.ui');
  const base = path.join(BASE_DIR_APP, "libs/managesieve.ui");

  return src([
    path.join(base, "/tabs/*.js"),
    path.join(base, "/utils/SieveIpcClient.js")
  ], { base: base }).pipe(dest(destination));
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
      packageManageSieveUi,
      packageManageSieveUiApp,
      packageLibSieve,
      packageLibManageSieve)
  );
}

exports["watch"] = watchSrc;

exports["packageJQuery"] = packageJQuery;
exports["packageCodeMirror"] = packageCodeMirror;
exports["packageBootstrap"] = packageBootstrap;
exports["packageLicense"] = packageLicense;
exports["packageSrc"] = packageSrc;

exports['package'] = series(
  parallel(
    packageJQuery,
    packageCodeMirror,
    packageBootstrap,
    packageLicense,
    packageLibManageSieve,
    packageLibSieve,
    packageManageSieveUi,
    packageManageSieveUiApp
  ),
  packageSrc
);
