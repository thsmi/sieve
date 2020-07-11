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

const { src, dest } = require('gulp');
const logger = require('gulplog');

const { readdir, unlink, rmdir, readFile, writeFile } = require('fs').promises;
const { createWriteStream, existsSync } = require('fs');

const path = require('path');
const yazl = require('yazl');

const JSON_INDENTATION = 2;

const BASE_DIR_BOOTSTRAP = "./node_modules/bootstrap/dist";
const BASE_DIR_CODEMIRROR = "./node_modules/codemirror";

const BASE_DIR_COMMON = "./src/common";
const BASE_DIR_BUILD = "./build";

const BASE_DIR_LIBMANAGESIEVE = path.join(BASE_DIR_COMMON, "libManageSieve");
const BASE_DIR_LIBSIEVE = path.join(BASE_DIR_COMMON, "libSieve");
const BASE_DIR_MANAGESIEVEUI = path.join(BASE_DIR_COMMON, "managesieve.ui");

const INDEX_MAJOR = 0;
const INDEX_MINOR = 1;
const INDEX_PATCH = 2;

/**
 * Delete all files from the given path.
 *
 * @param  {string} dir
 *   the base path which should be cleared.
 */
async function deleteRecursive(dir) {
  "use strict";

  if (!existsSync(dir))
    return;

  const items = await readdir(dir, { withFileTypes: true });

  for (const item of items) {
    const curPath = path.join(dir, item.name);

    if (!item.isDirectory()) {
      await unlink(curPath);
      continue;
    }

    await deleteRecursive(curPath);
  }

  await rmdir(dir);
}

/**
 * Clean the build environment including all build and packaging artifacts.
 */
async function clean() {
  "use strict";
  await deleteRecursive(BASE_DIR_BUILD);
}

/**
 * Copies the codemirror sources into the build directory.
 *
 * @param {string} destination
 *   where to place the codemirror sources
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageCodeMirror(destination) {
  "use strict";

  return src([
    BASE_DIR_CODEMIRROR + "/addon/edit/**",
    BASE_DIR_CODEMIRROR + "/addon/search/**",
    BASE_DIR_CODEMIRROR + "/lib/**",
    BASE_DIR_CODEMIRROR + "/mode/sieve/**",
    BASE_DIR_CODEMIRROR + "/theme/eclipse.css",
    BASE_DIR_CODEMIRROR + "/LICENSE",
    BASE_DIR_CODEMIRROR + "/package.json"
  ], { base: BASE_DIR_CODEMIRROR }).pipe(
    dest(destination));
}

/**
 * Copies the bootstrap sources into the build directory.
 *
 * @param {string} destination
 *   where to place the bootstrap sources
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 **/
function packageBootstrap(destination) {
  "use strict";

  return src([
    BASE_DIR_BOOTSTRAP + "/css/*.min.css",
    BASE_DIR_BOOTSTRAP + "/js/*.bundle.min.js"
  ], { base: BASE_DIR_BOOTSTRAP }).pipe(
    dest(destination));
}

/**

/**
 * Packages the common libManageSieve files
 *
 * @param {string} destination
 *   where to place the common libManageSieve files
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageLibManageSieve(destination) {
  "use strict";

  return src([
    BASE_DIR_LIBMANAGESIEVE + "/**"
  ], { base: BASE_DIR_COMMON }).pipe(dest(destination));
}

/**
 * Packages the common libSieve files
 *
 * @param {string} destination
 *   where to place the common libSieve files
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageLibSieve(destination) {
  "use strict";

  return src([
    BASE_DIR_LIBSIEVE + "/**",
    "!" + BASE_DIR_LIBSIEVE + "/libSieve/**/rfc*.txt",
    "!" + BASE_DIR_LIBSIEVE + "/libSieve/**/tests/",
    "!" + BASE_DIR_LIBSIEVE + "/libSieve/**/tests/**"
  ], { base: BASE_DIR_COMMON }).pipe(dest(destination));
}

/**
 * Packages the common managesieve.ui files
 *
 * @param {string} destination
 *   where to place the common managesieve.ui files
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageManageSieveUi(destination) {
  "use strict";

  return src([
    BASE_DIR_MANAGESIEVEUI + "/**"
  ], { base: BASE_DIR_COMMON }).pipe(dest(destination));
}

/**
 * Extracts the version from the package.json file
 *
 * @param {string} [file]
 *   the path to the package json file.
 * @returns {int[]}
 *   the version as a triple of integer
 */
async function getPackageVersion(file) {
  "use strict";

  if ((typeof (file) === "undefined") || file === null)
    file = "./package.json";

  let version = JSON.parse(await readFile(file, 'utf8')).version;

  version = version.split(".");

  while (version.length < 3)
    version.push(0);

  return version;
}

/**
 * Updates the version in a package json file.
 *
 * @param {string} version
 *   the new version string
 * @param {string} [file]
 *   the path to the npm package json file.
 */
async function setPackageVersion(version, file) {
  "use strict";

  if ((typeof (file) === "undefined") || file === null)
    file = "./package.json";

  version = version.join(".");

  logger.info(`Updating ${file} to ${version}`);

  const data = JSON.parse(await readFile(file, 'utf8'));
  data.version = version;

  await writeFile(file, JSON.stringify(data, null, JSON_INDENTATION), 'utf-8');
}

// We can only use major, minor and patch. Everything else
// clashes with mozilla's naming semantic.

/**
 * Bumps the package.json version info to the next major version.
 * The minor and patch level is reset to zero
 */
async function bumpMajorVersion() {
  "use strict";

  const pkgVersion = await getPackageVersion('./package.json');

  logger.info("Major bump from " + pkgVersion.join(".") + " ...");

  pkgVersion[INDEX_MAJOR] = parseInt(pkgVersion[INDEX_MAJOR], 10) + 1;
  pkgVersion[INDEX_MINOR] = 0;
  pkgVersion[INDEX_PATCH] = 0;

  logger.info("... to " + pkgVersion.join("."));

  await setPackageVersion(pkgVersion, './package.json');
}

/**
 * Bumps the package.json version info to the next minor version.
 * The major version remains untouched but the patch level is reset to zero
 */
async function bumpMinorVersion() {
  "use strict";

  const pkgVersion = await getPackageVersion('./package.json');

  logger.info("Minor bump from " + pkgVersion.join("."));

  pkgVersion[INDEX_MINOR] = parseInt(pkgVersion[INDEX_MINOR], 10) + 1;
  pkgVersion[INDEX_PATCH] = 0;

  logger.info("... to " + pkgVersion.join("."));

  await setPackageVersion(pkgVersion, './package.json');
}

/**
 * Pumps the package.json version info to the next patch level.
 * Neither the major nor the minor version will be changed.
 */
async function bumpPatchVersion() {
  "use strict";

  const pkgVersion = await getPackageVersion('./package.json');

  logger.info("Patch bump from " + pkgVersion.join("."));

  pkgVersion[INDEX_PATCH] = parseInt(pkgVersion[INDEX_PATCH], 10) + 1;

  logger.info("... to " + pkgVersion.join("."));

  await setPackageVersion(pkgVersion, './package.json');
}

/**
 * Compresses the given file or directory recursively.
 *
 * You can set special file permissions via the options.
 * See the parent compress method for more details.
 *
 * The path's of zipped files are stored relative to an
 * root directory. By default the root directory is set to
 * the source directory. But you can override it by setting
 * "options.root".
 *
 * @param {ZipFile} zip
 *   the yazl object
 * @param {string} dir
 *   the directory or file which should be compressed.
 * @param {object} options
 *   extended instructions for compressing.
 */
async function compressDirectory(zip, dir, options) {
  "use strict";

  if (typeof (options) === "undefined" || options === null)
    options = {};

  if (!options.root)
    options.root = dir;

  const dirs = await readdir(dir, { withFileTypes: true });

  for (const item of dirs) {

    const realPath = path.join(dir, item.name);
    const metaPath = path.relative(options.root, realPath);

    if (item.isDirectory()) {
      zip.addEmptyDirectory(metaPath);
      await compressDirectory(zip, realPath, options);
      continue;
    }

    let fileOptions = null;
    if (options.permissions) {
      if (options.permissions[metaPath])
        fileOptions = { mode: options.permissions[metaPath] };

      if (options.permissions["*"]) {
        fileOptions = { mode: options.permissions["*"] };
      }
    }

    zip.addFile(realPath, metaPath, fileOptions);
  }
}

/**
 * Stores and compresses all data from the source directory
 * into the destination file
 *
 * You can change the default permissions for all files by setting
 * the option "permissions[*]" to the desired permission.
 *
 * To change the permission for a single file just specify the
 * meta file name instead of the asterisk.
 *
 * @param {string} source
 *   the source directory or file.
 * @param {string} destination
 *   the destination file. In case it exists it will be overwritten.
 * @param {object} options
 *   extended instructions for compressing.
 */
async function compress(source, destination, options) {

  "use strict";

  if (existsSync(destination)) {
    logger.info(`Deleting ${path.basename(destination)}`);
    await unlink(destination);
  }

  logger.info(`Collecting files ${source}`);

  const zip = new yazl.ZipFile();

  await compressDirectory(zip, source, options);

  logger.info(`Compressing files ${path.basename(destination)}`);

  await new Promise((resolve) => {
    zip.outputStream
      .pipe(createWriteStream(destination))
      .on("close", () => { resolve(); });

    zip.end();
  });
}

exports["clean"] = clean;
exports["compress"] = compress;

exports["packageCodeMirror"] = packageCodeMirror;
exports["packageBootstrap"] = packageBootstrap;

exports["packageLibManageSieve"] = packageLibManageSieve;
exports["packageLibSieve"] = packageLibSieve;
exports["packageManageSieveUi"] = packageManageSieveUi;

exports["getPackageVersion"] = getPackageVersion;
exports["setPackageVersion"] = setPackageVersion;

exports["bumpMajorVersion"] = bumpMajorVersion;
exports["bumpMinorVersion"] = bumpMinorVersion;
exports["bumpPatchVersion"] = bumpPatchVersion;

exports["BASE_DIR_BUILD"] = BASE_DIR_BUILD;
exports["BASE_DIR_COMMON"] = BASE_DIR_COMMON;
