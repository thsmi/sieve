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

"use strict";

const gulp = require('gulp');
const zip = require('gulp-zip');

const fs = require('fs');

const BUILD_DIR_APP = "./build/electron/resources";
const BUILD_DIR_ADDON = "./build/thunderbird/";

/**
 * Delete all files from the given path.
 *
 * @param  {String} path
 *   the base path which should be cleared.
 * @returns {void}
 */
function deleteRecursive(path) {

  if (!fs.existsSync(path))
    return;

  fs.readdirSync(path).forEach(function (file) {

    let curPath = path + "/" + file;
    if (!fs.lstatSync(curPath).isDirectory()) {
      fs.unlinkSync(curPath);
      return;
    }

    deleteRecursive(curPath);
    return;
  });

  fs.rmdirSync(path);
  return;
}

/**
 * Extracts the version from the package.json file
 *
 * @param {string} [file]
 *   the path to the package json file.
 * @returns {string}
 *   the version as string
 */
function getPackageVersion(file) {

  if ((typeof (file) === "undefined") || file === null)
    file = "./package.json";

  let fs = require('fs');
  return JSON.parse(fs.readFileSync(file, 'utf8')).version;
}

/**
 * Updates the version in a package json file.
 *
 * @param {string} version
 *   the new version string
 * @param {string} [file]
 *   the path to the package json file.
 * @returns {void}
 */
function setPackageVersion(version, file) {

  if ((typeof (file) === "undefined") || file === null)
    file = "./package.json";

  console.log("Bumping " + file);

  let fs = require('fs');
  let data = JSON.parse(fs.readFileSync(file, 'utf8'));

  data.version = version.join(".");

  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');

  return;
}

/**
 * Updates the version in an rdf file.
 *
 * @param {string} version
 *    the new version string.
 * @param {string} file
 *   the path to the rdf file
 * @returns {void}
 */
function setRdfVersion(version, file) {

  console.log("Bumping " + file);

  let fs = require('fs');

  let regexp = new RegExp("<em:version>(\\d)*\\.(\\d)*\\.(\\d)*<\\/em:version>", "g");

  let data = fs.readFileSync(file, 'utf8');
  data = data.replace(
    regexp,
    "<em:version>" + version.join(".") + "</em:version>");

  fs.writeFileSync(file, data, 'utf-8');

  return;
}


/**
 * Increase the release version.
 * It reads the version from the package.json bumps it and
 * updates other files with version numbers.
 *
 * @param {String} type
 *   the update type.
 *
 * @returns {void}
 */
function bumpVersion(type) {

  let pkgVersion = getPackageVersion('./package.json').split(".");

  console.log("Bumping from " + pkgVersion.join(".") );

  while (pkgVersion.length < 3)
    pkgVersion.push(0);

  // bump the version.
  if (type === "major") {
    pkgVersion[0] = parseInt(pkgVersion[0], 10) + 1;
    pkgVersion[1] = 0;
    pkgVersion[2] = 0;
  }

  if (type === "minor") {
    pkgVersion[1] = parseInt(pkgVersion[1], 10) + 1;
    pkgVersion[2] = 0;
  }

  if (type === "patch") {
    pkgVersion[2] = parseInt(pkgVersion[2], 10) + 1;
  }

  console.log("... to " + pkgVersion.join("."));

  setPackageVersion(pkgVersion, './package.json');
  setRdfVersion(pkgVersion, './src/addon/install.rdf');
}


gulp.task('clean', function () {
  deleteRecursive("./build");
});

gulp.task('app:package-jquery', function () {
  const BASE_PATH = "./node_modules/jquery/dist";

  gulp.src([
    BASE_PATH + "/jquery.min.js"
  ], { base: BASE_PATH }).pipe(gulp.dest(BUILD_DIR_APP + "/libs/jquery"));
});


gulp.task('app:package-codemirror', function () {
  const BASE_PATH = "./node_modules/codemirror";

  gulp.src([
    BASE_PATH + "/addon/edit/**",
    BASE_PATH + "/addon/search/**",
    BASE_PATH + "/lib/**",
    BASE_PATH + "/mode/sieve/**",
    BASE_PATH + "/theme/eclipse.css",
    BASE_PATH + "/LICENSE",
    BASE_PATH + "/package.json"
  ], { base: BASE_PATH }).pipe(gulp.dest(BUILD_DIR_APP + "/libs/CodeMirror"));
});

gulp.task('app:package-bootstrap', function () {
  const BASE_PATH = "./node_modules/bootstrap/dist";

  gulp.src([
    BASE_PATH + "/css/*.min.css",
    BASE_PATH + "/js/*.bundle.min.js",
  ], { base: BASE_PATH }).pipe(gulp.dest(BUILD_DIR_APP + '/libs/bootstrap'));
});

gulp.task('app:package-license', function() {

  gulp.src([
    "./LICENSE"
  ]).pipe(gulp.dest(BUILD_DIR_APP));
});

/**
 * The source files need to go into the app/ directory...
 */
gulp.task('app:package-src', function () {

  const BASE_PATH = "./src/app/";

  return gulp.src([
    BASE_PATH + "/**",
  ])
    .pipe(gulp.dest(BUILD_DIR_APP));
});

/**
 * The common files need to go into the app/lib directory...
 */
gulp.task('app:package-common', function () {

  const BASE_PATH = "./src/common/";

  return gulp.src([
    BASE_PATH + "/**",

    // Filter out the rfc documents
    "!" + BASE_PATH + "/common/libSieve/**/rfc*.txt"
  ])
    .pipe(gulp.dest(BUILD_DIR_APP + '/libs'));
});


gulp.task('addon:package-license', function() {

  gulp.src([
    "./LICENSE"
  ]).pipe(gulp.dest(BUILD_DIR_ADDON));
});

gulp.task('app:package', [
  "app:package-src", "app:package-common",
  "app:package-jquery", "app:package-bootstrap",
  "app:package-codemirror", "app:package-license"]);

gulp.task('app:package-win32', ["app:package"], function (cb) {

  let options = {
    dir: BUILD_DIR_APP,
    arch: "ia32",
    platform: "win32",
    download: {
      cache: "./build/electron/cache",
    },
    out: "./build/electron/out",
    overwrite: true,
    /*packageManager : "yarn",*/
    //packageManager : false,
    prune: true
  };

  let packager = require('electron-packager');
  packager(options, (err, appPaths) => {
    if (err)
      return cb(err);

    cb();
  });
});

gulp.task('app:package-linux', ["app:package"], function (cb) {

  let options = {
    dir: BUILD_DIR_APP,
    arch: "x64",
    platform: "linux",
    download: {
      cache: "./build/electron/cache",
    },
    out: "./build/electron/out",
    overwrite: true,
    /*packageManager : "yarn",*/
    //packageManager : false,
    prune: true
  };

  let packager = require('electron-packager');
  packager(options, (err, appPaths) => {
    if (err)
      return cb(err);

    cb();
  });
});

/**
 * watches for changed files and reruns the build task.
 */
gulp.task('app:watch', function () {
  gulp.watch([
    './src/**/*.js',
    './src/**/*.jsm',
    './src/**/*.html',
    './src/**/*.tpl',
    './src/**/*.css',
    './src/**/*.xul',
    './src/**/*.dtd',
    './src/**/*.properties'],
    ['app:package-src', "app:package-common"]);
});

/*
Use backager to build artifacts...
var packager = require('electron-packager')
packager(options, function done_callback (err, appPaths) { ... })
*/


gulp.task('addon:package-jquery', function () {
  const BASE_PATH = "./node_modules/jquery/dist";

  gulp.src([
    BASE_PATH + "/jquery.min.js"
  ], { base: BASE_PATH }).pipe(gulp.dest(BUILD_DIR_ADDON+"common/jQuery"));
});

gulp.task('addon:package-codemirror', function () {
  const BASE_PATH = "./node_modules/codemirror";

  gulp.src([
    BASE_PATH + "/addon/edit/**",
    BASE_PATH + "/addon/search/**",
    BASE_PATH + "/lib/**",
    BASE_PATH + "/mode/sieve/**",
    BASE_PATH + "/theme/eclipse.css",
    BASE_PATH + "/LICENSE",
    BASE_PATH + "/package.json"
  ], { base: BASE_PATH }).pipe(gulp.dest(BUILD_DIR_ADDON+'common/CodeMirror'));
});

gulp.task('addon:package-common', function () {
  const BASE_PATH = "./src/common";

  return gulp.src([
    BASE_PATH + "/**",

    // Filter out the rfc documents
    "!" + BASE_PATH + "/libSieve/**/rfc*.txt"
  ])
    .pipe(gulp.dest(BUILD_DIR_ADDON+'common'));
});

gulp.task('addon:package-src', function () {
  const BASE_PATH = "./src/addon";

  return gulp.src([
    BASE_PATH + "/**",

    "!" + BASE_PATH + "/chrome/chromeFiles/content/filterList",
    "!" + BASE_PATH + "/chrome/chromeFiles/content/filterList/**"
  ])
    .pipe(gulp.dest(BUILD_DIR_ADDON));
});

gulp.task('addon:package', [
  "addon:package-src", "addon:package-common",
  "addon:package-jquery", "addon:package-codemirror",
  "addon:package-license"]);

/**
 * Packages the thunderbird addon.
 */
gulp.task('addon:package-xpi', ["addon:package"], function () {

  const version = getPackageVersion();

  return gulp.src([BUILD_DIR_ADDON+"**"])
    .pipe(zip('sieve-' + version + '.xpi'))
    .pipe(gulp.dest('./release/thunderbird'));
  // place code for your default task here
});

/**
 * watches for changed files and reruns the build task.
 */
gulp.task('addon:watch', function () {
  gulp.watch([
    './src/**/*.js',
    './src/**/*.jsm',
    './src/**/*.html',
    './src/**/*.css',
    './src/**/*.xul',
    './src/**/*.dtd',
    './src/**/*.properties'],
    ['addon:package-src', "addon:package-common"]);
});


// we can only use major, minor and patch. Everything else
// clashes with mozilla's naming semantic.

gulp.task('bump-major', function () {
  bumpVersion("major");
});

gulp.task('bump-minor', function () {
  bumpVersion("minor");
});

gulp.task('bump-patch', function () {
  bumpVersion("patch");
});


