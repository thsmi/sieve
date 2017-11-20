"use strict";

const gulp = require('gulp');
const zip = require('gulp-zip');
const bump = require('gulp-bump');

const fs = require('fs');

const BUILD_DIR_APP = "./build/electron/resources";
const BUILD_DIR_ADDON = "";

/**
 * Delete all files from the given path.
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

gulp.task('clean', function () {
  deleteRecursive("./build");
});

gulp.task('app:package-jquery', function () {
  const BASE_PATH = "./node_modules/jquery/dist";

  gulp.src([
    BASE_PATH + "/jquery.min.js"
  ], { base: BASE_PATH }).pipe(gulp.dest(BUILD_DIR_APP+"/libs/jquery"));
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
  ], { base: BASE_PATH }).pipe(gulp.dest(BUILD_DIR_APP+"/libs/CodeMirror"));
});

gulp.task('app:package-bootstrap', function () {
  const BASE_PATH = "./node_modules/bootstrap/dist";

  gulp.src([
    BASE_PATH + "/css/*.min.css",
    BASE_PATH + "/js/*.bundle.min.js",
  ], { base: BASE_PATH }).pipe(gulp.dest(BUILD_DIR_APP+'/libs/bootstrap'));
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
    .pipe(gulp.dest(BUILD_DIR_APP+'/libs'));
});


gulp.task('app:package', ["app:package-src", "app:package-common", "app:package-jquery", "app:package-bootstrap", "app:package-codemirror"]);

gulp.task('app:package-win32', ["app:package"], function(cb) {

  let options = {
    dir : BUILD_DIR_APP,
    arch : "ia32",
    platform : "win32",
    download : {
      cache : "./build/electron/cache",
    },
    out : "./build/electron/out",
    overwrite : true,
    /*packageManager : "yarn",*/
    //packageManager : false,
    prune : true
  };

  let packager = require('electron-packager');
  packager(options, function done_callback (err, appPaths) {
    if (err)
      return cb(err);

    cb();
  });
} );

gulp.task('app:package-linux', ["app:package"], function(cb) {

    let options = {
      dir : BUILD_DIR_APP,
      arch : "x64",
      platform : "linux",
      download : {
        cache : "./build/electron/cache",
      },
      out : "./build/electron/out",
      overwrite : true,
      /*packageManager : "yarn",*/
      //packageManager : false,
      prune : true
    };

    let packager = require('electron-packager');
    packager(options, function done_callback (err, appPaths) {
      if (err)
        return cb(err);

      cb();
    });
  } );

/**
 * watches for changed files and reruns the build task.
 */
gulp.task('app:watch', function () {
  gulp.watch([
    './src/**/*.js',
    './src/**/*.jsm',
    './src/**/*.html',
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
  ], { base: BASE_PATH }).pipe(gulp.dest('./build/thunderbird/common/jQuery'));
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
  ], { base: BASE_PATH }).pipe(gulp.dest('./build/thunderbird/common/CodeMirror'));
});

gulp.task('addon:package-common', function () {
  const BASE_PATH = "./src/common";

  return gulp.src([
    BASE_PATH + "/**",

    // Filter out the rfc documents
    "!" + BASE_PATH + "/libSieve/**/rfc*.txt"
  ])
    .pipe(gulp.dest('./build/thunderbird/common'));
});

gulp.task('addon:package-src', function () {
  const BASE_PATH = "./src/addon";

  return gulp.src([
    BASE_PATH + "/**",
  ])
    .pipe(gulp.dest('./build/thunderbird/'));
});

gulp.task('addon:package', ["addon:package-src", "addon:package-common", "addon:package-jquery", "addon:package-codemirror"]);

/**
 * Packages the thunderbird addon.
 */
gulp.task('addon:package-xpi', ["addon:package"], function () {

  const version = getVersion();

  return gulp.src(["./build/thunderbird/**"])
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

function getVersion() {
  let fs = require('fs');
  return JSON.parse(fs.readFileSync('./package.json', 'utf8')).version;
}

function bumpVersion(type) {
  let semver = require('semver');

  if (type === "undefined") {
    type = "prerelease";
  }

  let pkgVersion = getVersion();

  let version = semver.inc("" + pkgVersion, type);

  console.log("Bumping from " + pkgVersion + " to " + version);

  gulp.src(
    ["./package.json"],
    { base: './' })
    .pipe(bump({ "version": "" + version }))
    .pipe(gulp.dest('./'));

  gulp.src(
    ['./src/sieve@mozdev.org/install.rdf'],
    { base: './' })
    .pipe(bump({ key: "em:version", "version": "" + version }))
    .pipe(gulp.dest('./'));
}

// we can only use major, minor and patch. Everything else
// clashes with mozilla's naming semantic.

// major, premajor, minor, preminor, patch, prepatch, prerelease
gulp.task('bump-major', function () {
  bumpVersion("major");
});

gulp.task('bump-premajor', function () {
  bumpVersion("premajor");
});

gulp.task('bump-minor', function () {
  bumpVersion("minor");
});

gulp.task('bump-preminor', function () {
  bumpVersion("preminor");
});

gulp.task('bump-patch', function () {
  bumpVersion("patch");
});

gulp.task('bump-prepatch', function () {
  bumpVersion("prepatch");
});

