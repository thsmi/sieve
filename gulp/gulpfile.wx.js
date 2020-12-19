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

const common = require("./gulpfile.common.js");

const path = require('path');

const BUILD_DIR_WX = path.join(common.BASE_DIR_BUILD, "wx");
const BUILD_DIR_WX_LIBS = path.join(BUILD_DIR_WX, '/libs');

const BASE_DIR_WX = "./src/wx/";

const { Stream } = require('stream');

/**
 * A gulp helper to rename mjs modules into js.
 * This is needed due to a bug in thunderbird.
 *
 * It means renaming the files as well as all of their imports.
 */
class TransposeMjsToJs extends Stream.Transform {

  /**
   * Create a new instance
   */
  constructor() {
    super({ readableObjectMode: true, writableObjectMode: true });
  }

  /**
   * Implements the stream's transform method which does the actual
   * work. It renames all mjs files and adjusts the imports.
   *
   * @param {File} file
   *   the vinyl file object
   * @param {*} enc
   *   the encoding
   * @param {Function} cb
   *   the callback which is called when processing is completed.
   */
  _transform(file, enc, cb) {
    // HTML, js and mjs files can reference other imports
    if ((file.extname !== ".js") && (file.extname !== ".mjs") && file.extname !== ".html") {
      cb(null, file);
      return;
    }

    if (!file.isBuffer()) {
      cb(null, file);
      return;
    }

    // Rename mjs to js
    if (file.extname === ".mjs")
      file.extname = ".js";

    // Update their import sections.
    if (file.extname === ".js") {
      let content = file.contents.toString();
      content = content.replace(
        /(import\s*({[\s\w,]*}\s*from\s*)?)"([\w./-]*)\.mjs"/gm,
        '$1"$3.js"');
      file.contents = Buffer.from(content);
    }

    if (file.extname === ".html") {
      let content = file.contents.toString();

      content = content.replace(
        /(<script\s*type="module"\s*src=")([\w./-]*)\.mjs("\s*>)/gm,
        '$1$2.js$3');

      file.contents = Buffer.from(content);
    }

    cb(null, file);
  }
}


/**
 * A gulp helper to transpose import statements to requires.
 */
class TransposeImportToRequire extends Stream.Transform {

  /**
   * Create a new instance
   */
  constructor() {
    super({ readableObjectMode: true, writableObjectMode: true });
  }

  /**
   * Implements the stream's transform method which does the actual
   * work and transforms the ES6 imports and export statements into
   * commons modules require and export statements.
   *
   * @param {File} file
   *   the vinyl file object
   * @param {*} enc
   *   the encoding
   * @param {Function} cb
   *   the callback which is called when processing is completed.
   */
  _transform(file, enc, cb) {

    if (file.extname !== ".js") {
      cb(null, file);
      return;
    }

    if (!file.isBuffer()) {
      cb(null, file);
      return;
    }

    let content = file.contents.toString();

    // Convert all ES6 imports...
    content = content.replace(/import\s*{([\s\w,]*)}\s*from\s*("[\w./]*");/g, "const {$1} = require($2);");

    // ... and then all ES6 exports, but we have three styles here:
    // First one is "exports { something as somethingElse }"
    content = content.replace(/export\s*{\s*(\w*)\s*as\s*(\w*)\s*};/g, "module.exports.$2 = $1");
    // Second one is "exports { something }"
    content = content.replace(/export\s*{\s*(\w*)\s*};/g, "module.exports.$1 = $1");

    // And the most complex one is the third one "exports { something,\n  somethingElse }"
    const matches = content.matchAll(/export\s*{((?:\s*\w+[\s,]*)+)};/g);

    for (const match of matches) {
      const result = match[1].replace(/[^\S\n]*(\w+)(?:\s*,)?/g, "module.exports.$1 = $1;");
      content = content.replace(match[0], result);
    }

    file.contents = Buffer.from(content);

    cb(null, file);
  }
}


/**
 * Copies the license file into the build directory.
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageLicense() {
  return src([
    "./LICENSE.md"
  ]).pipe(dest(BUILD_DIR_WX));
}


/**
 * Copies the codemirror sources into the build directory.
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageCodeMirror() {
  return common.packageCodeMirror(
    `${BUILD_DIR_WX}/libs/CodeMirror`);
}

/**
 * Copies the bootstrap sources into the build directory.
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 **/
function packageBootstrap() {
  return common.packageBootstrap(
    `${BUILD_DIR_WX}/libs/bootstrap`);
}

/**
 * Copies the source files into the app/ directory...
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageSrc() {
  const options = {
    files : [
      "./**",
      "!./libs/libManageSieve/**",
      "!./api/**"
    ],
    transpose : new TransposeMjsToJs()
  };

  return common.pack(
    BASE_DIR_WX, BUILD_DIR_WX, options);
}

/**
 * Copies the application's icons into the lib folder.
 * We use it internally for windows decoration.
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageIcons() {

  return src([
    path.join(common.BASE_DIR_COMMON, "icons") + "/**"
  ], { base: common.BASE_DIR_COMMON }).pipe(dest(BUILD_DIR_WX_LIBS));
}

/**
 * Copies the all libManageSieve files into the app's lib folder.
 * It mixes the common files with the app specific.
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageLibManageSieve() {

  const BASE_LIB_DIR_WX = path.join(BASE_DIR_WX, "libs", "libManageSieve");
  const BASE_LIB_DIR_COMMON = path.join(common.BASE_DIR_COMMON, "libManageSieve");

  return common.pack(
    [BASE_LIB_DIR_WX, BASE_LIB_DIR_COMMON],
    path.join(BUILD_DIR_WX_LIBS, "libManageSieve"),
    { transpose: new TransposeMjsToJs() }
  );
}

/**
 * Packages the webextension api experiments.
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageExperiments() {

  return common.pack(
    path.join(BASE_DIR_WX, "api"),
    path.join(BUILD_DIR_WX, "api"));
}

/**
 * Copies the common libSieve files into the app's lib folder
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageLibSieve() {
  return common.packageLibSieve(
    BUILD_DIR_WX_LIBS,
    new TransposeMjsToJs());
}


/**
 * Copies the common managesieve.ui files into the app's lib folder
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageManageSieveUi() {
  return common.packageManageSieveUi(BUILD_DIR_WX_LIBS, new TransposeMjsToJs());
}


/**
 * Watches for changed source files and copies them into the build directory.
 */
function watchSrc() {

  watch(
    ['./src/**/*.js',
      './src/**/*.mjs',
      './src/**/*.html',
      './src/**/*.css',
      './src/**/*.json'],
    parallel(
      packageSrc,
      packageManageSieveUi,
      packageLibSieve,
      packageLibManageSieve)
  );
}

/**
 * Updates the WebExtension's version.
 * It reads the information from the npm package and updates the install.rdf as well as the manifest.json
 */
async function updateVersion() {

  const pkgVersion = await common.getPackageVersion();
  await common.setPackageVersion(pkgVersion, './src/wx/manifest.json');
}

/**
 * Zips the build directory and creates a XPI inside the release folder.
 */
async function packageXpi() {

  const version = (await common.getPackageVersion()).join(".");

  const destination = path.resolve(common.BASE_DIR_BUILD, `sieve-${version}.xpi`);
  const source = path.resolve(`./${BUILD_DIR_WX}/`);

  await common.compress(source, destination);
}


exports["watch"] = watchSrc;

exports["updateVersion"] = updateVersion;

exports["packageCodeMirror"] = packageCodeMirror;
exports["packageBootstrap"] = packageBootstrap;
exports["packageLicense"] = packageLicense;
exports["packageSrc"] = packageSrc;

exports['package'] = series(
  parallel(
    packageCodeMirror,
    packageBootstrap,
    packageLicense,
    packageIcons,
    packageLibManageSieve,
    packageLibSieve,
    packageManageSieveUi,
    packageExperiments
  ),
  packageSrc
);

exports["packageXpi"] = packageXpi;
