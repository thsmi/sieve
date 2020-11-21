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

const DIR_LIBSIEVE = "./libSieve";
const DIR_MANAGESIEVEUI = "./managesieve.ui";

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

  return src([
    BASE_DIR_BOOTSTRAP + "/css/*.min.css",
    BASE_DIR_BOOTSTRAP + "/js/*.bundle.min.js"
  ], { base: BASE_DIR_BOOTSTRAP }).pipe(
    dest(destination));
}

/**
 * An src clone which reasonable default values which avoid code duplication
 *
 * @param {string} dir
 *   the source directory which contains the files
 * @param {string|string[]} [files]
 *   the globs to be applied to the directory. If omitted it will select
 *   everything except a "doc" folder.
 * @returns {Stream}
 *   a vinyl file stream.
 */
function src2(dir, files) {

  if (!files)
    files = [`./**`, `!./doc/**`];

  if (!Array.isArray(files))
    files = [files];

  return src(
    files, { base: dir, root: dir, cwd:dir, passthrough: true });
}

/**
 * Packages the given source directory into the destination directory.
 * It optically transforms files.
 *
 * @param {string|string[]} sources
 *   a list of files directories.
 * @param {string} destination
 *   the folder to which the source files should be copied
 *
 * @param {object} options
 *   additional packaging options. Currently only files and transpose can be set.
 *
 *   Files is used to define files to be included or excluded.
 *
 *   Transpose point to a vinyl Stream.Transform or an array of Stream.Transform
 *   object which manipulate the files while streaming.
 *
 * @returns {Stream}
 *   a vinyl file stream.
 */
function pack(sources, destination, options) {

  if (!Array.isArray(sources))
    sources = [sources];

  if (!options)
    options = {};

  if (!options.transpose)
    options.transpose = [];

  if (!Array.isArray(options.transpose))
    options.transpose = [options.transpose];

  let rv;

  for (const source of sources) {
    const files = src2(source, options.files);

    if (!rv)
      rv = files;
    else
      rv = rv.pipe(files);
  }

  for (const transpose of options.transpose)
    rv = rv.pipe(transpose);

  return rv.pipe(dest(destination, "libSieve"));
}

/**
 * Packages the common libSieve files
 *
 * @param {string} destination
 *   where to place the common libSieve files
 *
 * @param {Stream.Transform | Stream.Transform[]} [transpose]
 *   an optional viyl stream transformed to be called while processing
 *   the files.
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageLibSieve(destination, transpose) {
  const options = {
    files: [
      "./**",
      "!./**/rfc*.txt",
      "!./**/tests/",
      "!./**/tests/**"
    ],
    transpose : transpose
  };

  return pack(
    path.join(BASE_DIR_COMMON, DIR_LIBSIEVE),
    path.join(destination, DIR_LIBSIEVE),
    options);
}

/**
 * Packages the common managesieve.ui files
 *
 * @param {string} destination
 *   where to place the common managesieve.ui files
 *
 * @param {Stream.Transform | Stream.Transform[]} [transpose]
 *   an optional viyl stream transformed to be called while processing
 *   the files.
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageManageSieveUi(destination, transpose) {

  return pack(
    path.join(BASE_DIR_COMMON, DIR_MANAGESIEVEUI),
    path.join(destination, DIR_MANAGESIEVEUI),
    { transpose : transpose }
  );
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

  const pkgVersion = await getPackageVersion('./package.json');

  logger.info("Patch bump from " + pkgVersion.join("."));

  pkgVersion[INDEX_PATCH] = parseInt(pkgVersion[INDEX_PATCH], 10) + 1;

  logger.info("... to " + pkgVersion.join("."));

  await setPackageVersion(pkgVersion, './package.json');
}

/**
 * Updates the manifest which is used by the apps as well as the WXs
 * automatic update checker.
 */
async function updateVersion() {

  const version = (await getPackageVersion()).join(".");

  const data = JSON.parse(await readFile("./docs/update.json", 'utf8'));

  data["addons"]["sieve@mozdev.org"]["updates"].unshift({
    "version" : version,
    "update_link": `https://github.com/thsmi/sieve/releases/download/${version}/sieve-${version}.xpi`,
    "update_info_url": `https://github.com/thsmi/sieve/releases/tag/${version}`,
    "browser_specific_settings": {
      "gecko": { "strict_min_version": "68.0a1" }
    }
  });

  await writeFile("./docs/update.json", JSON.stringify(data, null, JSON_INDENTATION), 'utf-8');
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

exports["packageLibSieve"] = packageLibSieve;
exports["packageManageSieveUi"] = packageManageSieveUi;

exports["getPackageVersion"] = getPackageVersion;
exports["setPackageVersion"] = setPackageVersion;

exports["bumpMajorVersion"] = bumpMajorVersion;
exports["bumpMinorVersion"] = bumpMinorVersion;
exports["bumpPatchVersion"] = bumpPatchVersion;

exports["updateVersion"] = updateVersion;

exports["pack"] = pack;

exports["BASE_DIR_BUILD"] = BASE_DIR_BUILD;
exports["BASE_DIR_COMMON"] = BASE_DIR_COMMON;

exports["DIR_LIBSIEVE"] = DIR_LIBSIEVE;
exports["DIR_MANAGESIEVEUI"] = DIR_MANAGESIEVEUI;

exports["src2"] = src2;
