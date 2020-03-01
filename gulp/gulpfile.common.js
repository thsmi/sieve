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

const fs = require('fs');
const { src, dest } = require('gulp');
const logger = require('gulplog');

const BASE_DIR_BOOTSTRAP = "./node_modules/bootstrap/dist";
const BASE_DIR_MATERIALICONS = "./node_modules/material-design-icons-iconfont/dist";
const BASE_DIR_JQUERY = "./node_modules/jquery/dist";
const BASE_DIR_CODEMIRROR = "./node_modules/codemirror";

const BASE_DIR_COMMON = "./src/common";
const BASE_DIR_BUILD = "./build";

const INDEX_MAJOR = 0;
const INDEX_MINOR = 1;
const INDEX_PATCH = 2;

/**
 * Delete all files from the given path.
 *
 * @param  {string} path
 *   the base path which should be cleared.
 */
async function deleteRecursive(path) {
  "use strict";

  if (! fs.existsSync(path))
    return;

  const files = await fs.promises.readdir(path);

  for (const file of files) {
    const curPath = path + "/" + file;
    if (!(await fs.promises.lstat(curPath)).isDirectory()) {
      await fs.promises.unlink(curPath);
      continue;
    }

    await deleteRecursive(curPath);
  }

  await fs.promises.rmdir(path);
}

/**
 * Clean the build environment including all build and packaging artifacts.
 */
async function clean() {
  "use strict";
  await deleteRecursive(BASE_DIR_BUILD);
}

/**
 * Copies the jquery sources into the given build directory.
 *
 * @param {string} destination
 *   where to place the jquery sources
 */
async function packageJQuery(destination) {
  "use strict";

  await src([
    BASE_DIR_JQUERY + "/jquery.min.js"
  ], { base: BASE_DIR_JQUERY }).pipe(
    dest(destination));
}

/**
 * Copies the codemirror sources into the build directory.
 *
 * @param {string} destination
 *   where to place the codemirror sources
 */
async function packageCodeMirror(destination) {
  "use strict";

  await src([
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
 **/
async function packageBootstrap(destination) {
  "use strict";

  await src([
    BASE_DIR_BOOTSTRAP + "/css/*.min.css",
    BASE_DIR_BOOTSTRAP + "/js/*.bundle.min.js"
  ], { base: BASE_DIR_BOOTSTRAP }).pipe(
    dest(destination));
}

/**
 * Copies the material design icons into the build directory.
 *
 * @param {string} destination
 *   where to place the material design sources
 */
async function packageMaterialIcons(destination) {
  "use strict";

  await src([
    BASE_DIR_MATERIALICONS + "/material-design-icons.css",
    BASE_DIR_MATERIALICONS + "/fonts/MaterialIcons-Regular.woff2"
  ], { base: BASE_DIR_MATERIALICONS }).pipe(dest(destination));
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

  let version = JSON.parse(await fs.promises.readFile(file, 'utf8')).version;

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

  const data = JSON.parse(await fs.promises.readFile(file, 'utf8'));
  data.version = version;

  await fs.promises.writeFile(file, JSON.stringify(data, null, 2), 'utf-8');
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

exports["clean"] = clean;

exports["packageJQuery"] = packageJQuery;
exports["packageCodeMirror"] = packageCodeMirror;
exports["packageBootstrap"] = packageBootstrap;
exports["packageMaterialIcons"] = packageMaterialIcons;

exports["getPackageVersion"] = getPackageVersion;
exports["setPackageVersion"] = setPackageVersion;

exports["bumpMajorVersion"] = bumpMajorVersion;
exports["bumpMinorVersion"] = bumpMinorVersion;
exports["bumpPatchVersion"] = bumpPatchVersion;

exports["BASE_DIR_BUILD"] = BASE_DIR_BUILD;
exports["BASE_DIR_COMMON"] = BASE_DIR_COMMON;
