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

gulp.task('clean-addon', function() {
  deleteRecursive("./build");
});

gulp.task('package-addon-jquery', function() {
  const BASE_PATH = "./node_modules/jquery/dist";

  gulp.src([
    BASE_PATH+"/jquery.min.js"
  ],{base: BASE_PATH}).pipe(gulp.dest('./build/thunderbird/common/jQuery'));
});

gulp.task('package-addon-codemirror', function() {
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

gulp.task('package-addon-src', function() {
  const BASE_PATH = "./src/sieve@mozdev.org";

  return gulp.src([
    BASE_PATH+"/**",
    "!"+BASE_PATH+"/manifest.json",
    "!"+BASE_PATH+"/webapp/**",
    "!"+BASE_PATH+"/webapp/",
    "!"+BASE_PATH+"/webapp.js",

    "!"+BASE_PATH+"/common/CodeMirror/**",
    "!"+BASE_PATH+"/common/CodeMirror/",

    "!"+BASE_PATH+"/common/jQuery/**",
    "!"+BASE_PATH+"/common/jQuery/",

    // Filter out the rfc documents
    "!"+BASE_PATH+"/common/libSieve/**/rfc*.txt"
  ])
    .pipe(gulp.dest('./build/thunderbird/'));
});

gulp.task('package-addon', ["package-addon-src", "package-addon-jquery", "package-addon-codemirror"]);

/**
 * Packages the thunderbird addon.
 */
gulp.task('package-xpi', ["package-addon"], function () {

  const version = getVersion();

  return gulp.src(["./build/thunderbird/**"])
    .pipe(zip('sieve-'+version+'.xpi'))
    .pipe(gulp.dest('./release/thunderbird'));
  // place code for your default task here
});

/**
 * watches for changed files and reruns the build task.
 */
gulp.task('watch-addon', function() {
  gulp.watch([
    './src/sieve@mozdev.org/**/*.js',
    './src/sieve@mozdev.org/**/*.jsm',
    './src/sieve@mozdev.org/**/*.html',
    './src/sieve@mozdev.org/**/*.css',
    './src/sieve@mozdev.org/**/*.xul',
    './src/sieve@mozdev.org/**/*.dtd',
    './src/sieve@mozdev.org/**/*.properties'],
     ['package-src']);
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

