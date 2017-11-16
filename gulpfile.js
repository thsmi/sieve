"use strict";

var gulp = require('gulp');
var zip = require('gulp-zip');
var bump = require('gulp-bump');

const fs = require('fs');

function deleteRecursive(path) {

  if( !fs.existsSync(path) )
    return;

    fs.readdirSync(path).forEach(function(file,index) {

      var curPath = path + "/" + file;
      if(!fs.lstatSync(curPath).isDirectory()) {
        fs.unlinkSync(curPath);
        return;
      }

      deleteRecursive(curPath);
      return;
    });

    fs.rmdirSync(path);
    return;
}

gulp.task('clean', function() {
  deleteRecursive("./build");
});

gulp.task('addon:package-jquery', function() {
  const BASE_PATH = "./node_modules/jquery/dist";

  gulp.src([
    BASE_PATH+"/jquery.min.js"
  ],{base: BASE_PATH}).pipe(gulp.dest('./build/thunderbird/common/jQuery'));
});

gulp.task('addon:package-codemirror', function() {
  const BASE_PATH = "./node_modules/codemirror";

  gulp.src([
    BASE_PATH+"/addon/edit/**",
    BASE_PATH+"/addon/search/**",
    BASE_PATH+"/lib/**",
    BASE_PATH+"/mode/sieve/**",
    BASE_PATH+"/theme/eclipse.css",
    BASE_PATH+"/LICENSE",
    BASE_PATH+"/package.json"
  ],{base: BASE_PATH}).pipe(gulp.dest('./build/thunderbird/common/CodeMirror'));
});

gulp.task('addon:package-common', function() {
  const BASE_PATH = "./src/common";

  return gulp.src([
    BASE_PATH+"/**",

    // Filter out the rfc documents
    "!"+BASE_PATH+"/libSieve/**/rfc*.txt"
  ])
    .pipe(gulp.dest('./build/thunderbird/common'));
});

gulp.task('addon:package-src', function() {
  const BASE_PATH = "./src/addon";

  return gulp.src([
    BASE_PATH+"/**",
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
    .pipe(zip('sieve-'+version+'.xpi'))
    .pipe(gulp.dest('./release/thunderbird'));
  // place code for your default task here
});

/**
 * watches for changed files and reruns the build task.
 */
gulp.task('addon:watch', function() {
  gulp.watch([
    './src/**/*.js',
    './src/**/*.jsm',
    './src/**/*.html',
    './src/**/*.css',
    './src/**/*.xul',
    './src/**/*.dtd',
    './src/**/*.properties'],
     ['addon:package-src',"addon:package-common"]);
});

function getVersion() {
  var fs = require('fs');
  return JSON.parse(fs.readFileSync('./package.json', 'utf8')).version;
}

function bumpVersion(type) {
  var semver = require('semver');

  if (type === "undefined") {
    type = "prerelease";
  }

  var pkgVersion = getVersion();

  var version = semver.inc(""+pkgVersion, type);

  console.log("Bumping from "+pkgVersion+" to "+version);

  gulp.src(
    ["./package.json"],
    {base: './'})
  .pipe(bump({"version": ""+version}))
  .pipe(gulp.dest('./'));

  gulp.src(
    ['./src/sieve@mozdev.org/install.rdf'],
    {base: './'})
  .pipe(bump({key:"em:version", "version": ""+version}))
  .pipe(gulp.dest('./'));
}

// we can only use major, minor and patch. Everything else
// clashes with mozilla's naming semantic.

// major, premajor, minor, preminor, patch, prepatch, prerelease
gulp.task('bump-major', function() {
  bumpVersion("major");
});

gulp.task('bump-premajor', function() {
  bumpVersion("premajor");
});

gulp.task('bump-minor', function() {
  bumpVersion("minor");
});

gulp.task('bump-preminor', function() {
  bumpVersion("preminor");
});

gulp.task('bump-patch', function() {
  bumpVersion("patch");
});

gulp.task('bump-prepatch', function() {
  bumpVersion("prepatch");
});

