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

const gulp = require('gulp');
const zip = require('gulp-zip');

const fs = require('fs');

const BUILD_DIR_APP = "./build/electron/resources";
const BUILD_DIR_ADDON = "./build/thunderbird/";
const BUILD_DIR_TEST = "./build/test/";

const BASE_DIR_BOOTSTRAP = "./node_modules/bootstrap/dist";
const BASE_DIR_MATERIALICONS = "./node_modules/material-design-icons-iconfont/dist";
const BASE_DIR_JQUERY = "./node_modules/jquery/dist";
const BASE_DIR_CODEMIRROR = "./node_modules/codemirror";
const BASE_DIR_COMMON = "./src/common";
const BASE_DIR_ADDON = "./src/addon";
const BASE_DIR_APP = "./src/app/";

const INDEX_MAJOR = 0;
const INDEX_MINOR = 1;
const INDEX_PATCH = 2;

/**
 * Delete all files from the given path.
 *
 * @param  {String} path
 *   the base path which should be cleared.
 *
 */
function deleteRecursive(path) {
  "use strict";

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
  "use strict";

  if ((typeof (file) === "undefined") || file === null)
    file = "./package.json";

  return JSON.parse(fs.readFileSync(file, 'utf8')).version;
}

/**
 * Updates the version in a package json file.
 *
 * @param {string} version
 *   the new version string
 * @param {string} [file]
 *   the path to the npm package json file.
 *
 */
function setPackageVersion(version, file) {
  "use strict";

  if ((typeof (file) === "undefined") || file === null)
    file = "./package.json";

  console.log("Bumping " + file);

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
 *
 */
function setRdfVersion(version, file) {
  "use strict";

  console.log("Bumping Thunderbird RDF" + file);

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
 * @param {string} type
 *   the update type.
 *
 *
 */
function bumpVersion(type) {
  "use strict";

  let pkgVersion = getPackageVersion('./package.json').split(".");

  console.log("Bumping from " + pkgVersion.join("."));

  while (pkgVersion.length < 3)
    pkgVersion.push(0);

  // bump the version.
  if (type === "major") {
    pkgVersion[INDEX_MAJOR] = parseInt(pkgVersion[INDEX_MAJOR], 10) + 1;
    pkgVersion[INDEX_MINOR] = 0;
    pkgVersion[INDEX_PATCH] = 0;
  }

  if (type === "minor") {
    pkgVersion[INDEX_MINOR] = parseInt(pkgVersion[INDEX_MINOR], 10) + 1;
    pkgVersion[INDEX_PATCH] = 0;
  }

  if (type === "patch") {
    pkgVersion[INDEX_PATCH] = parseInt(pkgVersion[INDEX_PATCH], 10) + 1;
  }

  console.log("... to " + pkgVersion.join("."));

  // NPM & Electron Versioning.
  setPackageVersion(pkgVersion, './package.json');

  // Old and new Thunderbird Versions.
  setRdfVersion(pkgVersion, './src/addon/install.rdf');
  setPackageVersion(pkgVersion, './src/addon/manifest.json');
}


gulp.task('clean', async () => {
  "use strict";

  deleteRecursive("./build");
});

gulp.task('app:package-definition', () => {
  "use strict";

  const BASE_PATH = ".";

  return gulp.src([
    BASE_PATH + "/package.json"
  ], { base: BASE_PATH }).pipe(gulp.dest(BUILD_DIR_APP));
});

gulp.task('app:package-jquery', () => {
  "use strict";

  return gulp.src([
    BASE_DIR_JQUERY + "/jquery.min.js"
  ], { base: BASE_DIR_JQUERY }).pipe(gulp.dest(BUILD_DIR_APP + "/libs/jquery"));
});


gulp.task('app:package-codemirror', () => {
  "use strict";

  return gulp.src([
    BASE_DIR_CODEMIRROR + "/addon/edit/**",
    BASE_DIR_CODEMIRROR + "/addon/search/**",
    BASE_DIR_CODEMIRROR + "/lib/**",
    BASE_DIR_CODEMIRROR + "/mode/sieve/**",
    BASE_DIR_CODEMIRROR + "/theme/eclipse.css",
    BASE_DIR_CODEMIRROR + "/LICENSE",
    BASE_DIR_CODEMIRROR + "/package.json"
  ], { base: BASE_DIR_CODEMIRROR }).pipe(gulp.dest(BUILD_DIR_APP + "/libs/CodeMirror"));
});

gulp.task('app:package-bootstrap', () => {
  "use strict";

  return gulp.src([
    BASE_DIR_BOOTSTRAP + "/css/*.min.css",
    BASE_DIR_BOOTSTRAP + "/js/*.bundle.min.js"
  ], { base: BASE_DIR_BOOTSTRAP }).pipe(gulp.dest(BUILD_DIR_APP + '/libs/bootstrap'));
});

gulp.task('app:package-material-icons', () => {
  "use strict";

  return gulp.src([
    BASE_DIR_MATERIALICONS + "/material-design-icons.css",
    BASE_DIR_MATERIALICONS + "/fonts/MaterialIcons-Regular.woff2"
  ], { base: BASE_DIR_MATERIALICONS }).pipe(gulp.dest(BUILD_DIR_APP + '/libs/material-icons'));
});

gulp.task('app:package-license', () => {
  "use strict";

  return gulp.src([
    "./LICENSE.md"
  ]).pipe(gulp.dest(BUILD_DIR_APP));
});

/**
 * The source files need to go into the app/ directory...
 */
gulp.task('app:package-src', () => {
  "use strict";

  return gulp.src([
    BASE_DIR_APP + "/**"
  ]).pipe(gulp.dest(BUILD_DIR_APP));
});

/**
 * The common files need to go into the app/lib directory...
 */
gulp.task('app:package-common', () => {
  "use strict";

  return gulp.src([
    BASE_DIR_COMMON + "/**",
    // Filter out the editor wrapper
    "!" + BASE_DIR_COMMON + "/editor",
    "!" + BASE_DIR_COMMON + "/editor/**",
    // Filter out the rfc documents
    "!" + BASE_DIR_COMMON + "/libSieve/**/rfc*.txt",
    "!" + BASE_DIR_COMMON + "/libSieve/**/tests/",
    "!" + BASE_DIR_COMMON + "/libSieve/**/tests/**"
  ]).pipe(gulp.dest(BUILD_DIR_APP + '/libs'));
});


gulp.task('addon:package-license', function () {
  "use strict";

  return gulp.src([
    "./LICENSE.md"
  ]).pipe(gulp.dest(BUILD_DIR_ADDON));
});

gulp.task('app:package', gulp.parallel([
  "app:package-definition",
  "app:package-src", "app:package-common",
  "app:package-jquery", "app:package-bootstrap",
  "app:package-material-icons", "app:package-codemirror",
  "app:package-license"]));

gulp.task(
  'app:package-win32',
  gulp.series(
    "app:package",
    function (done) {

      "use strict";

      let options = {
        dir: BUILD_DIR_APP,
        arch: "ia32",
        platform: "win32",
        download: {
          cache: "./build/electron/cache"
        },
        out: "./build/electron/out",
        overwrite: true,
        packageManager: "yarn",
        // packageManager : false,
        prune: true,
        icon: "./../test.ico"
      };

      let packager = require('electron-packager');
      packager(options, (err) => {
        done(err);
      });
    }
  )
);

gulp.task(
  'app:package-linux',
  gulp.series(
    "app:package",
    function (done) {

      "use strict";

      let options = {
        dir: BUILD_DIR_APP,
        arch: "x64",
        platform: "linux",
        download: {
          cache: "./build/electron/cache"
        },
        out: "./build/electron/out",
        overwrite: true,
        // packageManager : "yarn"
        // packageManager : false,
        prune: true
      };
      let packager = require('electron-packager');
      packager(options, (err) => {
        done(err);
      });
    }
  )
);

/**
 * watches for changed files and reruns the build task.
 */
gulp.task('app:watch', () => {
  "use strict";

  return gulp.watch(
    ['./src/**/*.js',
      './src/**/*.jsm',
      './src/**/*.html',
      './src/**/*.tpl',
      './src/**/*.css',
      './src/**/*.xul',
      './src/**/*.dtd',
      './src/**/*.properties'],
    gulp.parallel(
      'app:package-src',
      "app:package-common")
  );
});

gulp.task('addon:package-jquery', () => {
  "use strict";

  return gulp.src([
    BASE_DIR_JQUERY + "/jquery.min.js"
  ], { base: BASE_DIR_JQUERY }).pipe(gulp.dest(BUILD_DIR_ADDON + "/chrome/chromeFiles/content/libs/jQuery"));
});

gulp.task('addon:package-codemirror', () => {
  "use strict";

  return gulp.src([
    BASE_DIR_CODEMIRROR + "/addon/edit/**",
    BASE_DIR_CODEMIRROR + "/addon/search/**",
    BASE_DIR_CODEMIRROR + "/lib/**",
    BASE_DIR_CODEMIRROR + "/mode/sieve/**",
    BASE_DIR_CODEMIRROR + "/theme/eclipse.css",
    BASE_DIR_CODEMIRROR + "/LICENSE",
    BASE_DIR_CODEMIRROR + "/package.json"
  ], { base: BASE_DIR_CODEMIRROR }).pipe(gulp.dest(BUILD_DIR_ADDON + '/chrome/chromeFiles/content/libs/CodeMirror'));
});


gulp.task('addon:package-bootstrap', () => {
  "use strict";

  return gulp.src([
    BASE_DIR_BOOTSTRAP + "/css/*.min.css",
    BASE_DIR_BOOTSTRAP + "/js/*.bundle.min.js"
  ], { base: BASE_DIR_BOOTSTRAP }).pipe(gulp.dest(BUILD_DIR_ADDON + '/chrome/chromeFiles/content/libs/bootstrap'));
});

gulp.task('addon:package-material-icons', () => {
  "use strict";

  return gulp.src([
    BASE_DIR_MATERIALICONS + "/material-design-icons.css",
    BASE_DIR_MATERIALICONS + "/fonts/MaterialIcons-Regular.woff2"
  ], { base: BASE_DIR_MATERIALICONS }).pipe(gulp.dest(BUILD_DIR_ADDON + '/chrome/chromeFiles/content/libs/material-icons'));
});

gulp.task('addon:package-common', () => {
  "use strict";

  return gulp.src([
    BASE_DIR_COMMON + "/**",

    // Filter out the rfc documents
    "!" + BASE_DIR_COMMON + "/libSieve/**/rfc*.txt",
    "!" + BASE_DIR_COMMON + "/libSieve/**/tests/",
    "!" + BASE_DIR_COMMON + "/libSieve/**/tests/**"
  ]).pipe(gulp.dest(BUILD_DIR_ADDON + '/chrome/chromeFiles/content/libs'));
});

gulp.task(
  'addon:package-src',
  function () {
    "use strict";

    return gulp.src([
      BASE_DIR_ADDON + "/**",

      "!" + BASE_DIR_ADDON + "/chrome/chromeFiles/content/filterList",
      "!" + BASE_DIR_ADDON + "/chrome/chromeFiles/content/filterList/**"
    ]).pipe(gulp.dest(BUILD_DIR_ADDON));
  }
);

gulp.task(
  'addon:package',
  gulp.parallel(
    "addon:package-src",
    "addon:package-common",
    "addon:package-jquery",
    "addon:package-bootstrap",
    "addon:package-material-icons",
    "addon:package-codemirror",
    "addon:package-license"
  )
);

/**
 * Packages the thunderbird addon.
 */
gulp.task(
  'addon:package-xpi',
  gulp.series(
    "addon:package",
    function () {

      const version = getPackageVersion();

      return gulp.src([BUILD_DIR_ADDON + "**"])
        .pipe(zip('sieve-' + version + '.xpi'))
        .pipe(gulp.dest('./release/thunderbird'));
      // place code for your default task here
    }
  )
);

/**
 * watches for changed files and reruns the build task.
 */
gulp.task('addon:watch', () => {
  "use strict";

  return gulp.watch([
    './src/**/*.js',
    './src/**/*.jsm',
    './src/**/*.html',
    './src/**/*.css',
    './src/**/*.xul',
    './src/**/*.dtd',
    './src/**/*.properties'],
    gulp.parallel('addon:package-src', "addon:package-common"));
});


// we can only use major, minor and patch. Everything else
// clashes with mozilla's naming semantic.

gulp.task('bump-major', async () => {
  "use strict";

  bumpVersion("major");
});

gulp.task('bump-minor', async () => {
  "use strict";

  bumpVersion("minor");
});

gulp.task('bump-patch', async () => {
  "use strict";

  bumpVersion("patch");
});

/**
 * Thunderbirds allows loading addons from outside of
 * the extension directory. In our case this would be
 * the build directory. To do so you need to create
 * a file with the addons id which contains the path
 * to the extension directory.
 *
 * The rational behind this is that a addon:watch
 * automagically updates the addon.
 */
gulp.task('addon:deploy', async () => {
  "use strict";

  const path = require('path');
  let { SieveThunderbirdImport } = require("./src/app/utils/SieveThunderbirdImport.js");

  let target = (new SieveThunderbirdImport()).getDefaultUserProfile();

  target = path.join(target, "extensions");

  if (fs.existsSync(target) === false)
    throw new Error("Failed to locate extension directory " + target);

  target = path.join(target, "sieve@mozdev.org");

  let source = path.join(
    path.resolve("./build/thunderbird/"),
    path.sep);

  // Bail out in case the directory already exists.
  if (fs.existsSync(target)) {
    if (fs.readFileSync(target, "utf-8").trim() === source) {
      console.log("Skipping file already exists");
      return;
    }
  }

  // otherwise write or overwrite the existing file.
  fs.writeFileSync(target, source, "utf-8");
});


gulp.task('test:package-jquery', function () {
  "use strict";

  return gulp.src([
    BASE_DIR_JQUERY + "/jquery.min.js"
  ], { base: BASE_DIR_JQUERY }).pipe(gulp.dest(BUILD_DIR_TEST + "/common/jQuery/"));
});

gulp.task('test:package-common', () => {
  "use strict";

  return gulp.src([
    BASE_DIR_COMMON + "/**",

    // Filter out the rfc documents
    "!" + BASE_DIR_COMMON + "/libSieve/**/rfc*.txt"
  ]).pipe(gulp.dest(BUILD_DIR_TEST + '/common/'));
});

gulp.task(
  'test:package-test-suite',
  function () {

    "use strict";

    const BASE_PATH = "./tests";

    return gulp.src([
      BASE_PATH + "/**"
    ]).pipe(gulp.dest(BUILD_DIR_TEST + '/'));
  }
);

gulp.task('test:package-addon-src', () => {
  "use strict";

  const BASE_PATH = "./src/addon/chrome/chromeFiles/content";

  return gulp.src([
    BASE_PATH + "/**",

    "!" + BASE_PATH + "/filterList",
    "!" + BASE_PATH + "/filterList/**"
  ]).pipe(gulp.dest(BUILD_DIR_TEST + "/addon/"));
});

gulp.task(
  'test:package',
  gulp.parallel(
    "test:package-common",
    "test:package-addon-src",
    "test:package-jquery",
    "test:package-test-suite"
  )
);

gulp.task('test:watch', async () => {
  "use strict";

  return gulp.watch([
    './src/**/*.js',
    './src/**/*.jsm',
    './tests/**/*.json',
    './tests/**/*.js'],
    gulp.parallel("test:package-common", "test:package-test-suite"));
});
