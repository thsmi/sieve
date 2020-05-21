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
const { existsSync } = require('fs');
const { readFile, chmod } = require('fs').promises;

const util = require('util');
const exec = util.promisify(require('child_process').exec);

const logger = require('gulplog');

const common = require("./gulpfile.common.js");
const https = require("./gulpfile.common.https.js");

const path = require('path');
const tar = require('tar');
const { getAbi } = require('node-abi');


const CACHE_DIR_APP = path.join(common.BASE_DIR_BUILD, "electron/cache");
const BUILD_DIR_APP = path.join(common.BASE_DIR_BUILD, "electron/resources");
const OUTPUT_DIR_APP = path.join(common.BASE_DIR_BUILD, "electron/out");
const BASE_DIR_APP = "./src/app/";


const KEYTAR_NAME = "keytar";
const KEYTAR_OUTPUT_DIR = `/libs/${KEYTAR_NAME}`;
const BASE_DIR_KEYTAR = `./node_modules/${KEYTAR_NAME}/`;
const PREBUILT_URL_KEYTAR = `https://github.com/atom/node-keytar/releases/download`;

const WIN_ARCH = "x64";
const WIN_PLATFORM = "win32";
const LINUX_ARCH = "x64";
const LINUX_PLATFORM = "linux";
const MAC_ARCH = "x64";
const MAC_PLATFORM = "mas";

const RUNTIME_ELECTRON = "electron";

const APP_IMAGE_RELEASE_URL = "https://api.github.com/repos/AppImage/AppImageKit/releases/latest";
const APP_IMAGE_TOOL_NAME = "appimagetool-x86_64.AppImage";

/**
 * Extracts a tar or tar.gz file to the given destination.
 *
 * @param {string} filename
 *   the path to the tar file
 * @param {string} destination
 *   the destination folder into which the tar should be extracted.
 */
async function untar(filename, destination) {
  "use strict";

  logger.debug(`Extracting ${filename} to ${destination}`);

  return await tar.x({
    file: filename,
    cwd: destination,
    strict: true
  });
}

/**
 * Gets electron's release as well as the abi version.
 * Throws in case the electron runtime could not be found.
 *
 * @param {string} dir
 *   the path to the electron runtime.
 * @returns {{ version : string, abi : string}}
 *   electrons release as well as the abi version.
 */
async function getElectronVersion(dir) {

  "use strict";

  const versionFile = path.join(dir + '/version');

  if (!existsSync(versionFile))
    throw new Error(`Failed to detect version, no electron runtime in ${dir}`);

  const version = (await readFile(versionFile)).toString();
  const abi = await getAbi(version, RUNTIME_ELECTRON);

  return {
    "version": version,
    "abi": abi
  };
}


/**
 * Copies and updates the package.json inside the build directory.
 * It is typically used by other tools like the electron-packager.
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageDefinition() {

  "use strict";

  const BASE_PATH = ".";

  return src([
    BASE_PATH + "/package.json"
  ], { base: BASE_PATH }).pipe(dest(BUILD_DIR_APP));
}

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
  ]).pipe(dest(BUILD_DIR_APP));
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
    BUILD_DIR_APP + "/libs/jquery");
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
    `${BUILD_DIR_APP}/libs/CodeMirror`);
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
    `${BUILD_DIR_APP}/libs/bootstrap`);
}

/**
 * Copies the material design icons into the build directory.
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageMaterialIcons() {
  "use strict";

  return common.packageMaterialIcons(
    `${BUILD_DIR_APP}/libs/material-icons`);
}

/**
 * Copies the source files into the app/ directory...
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageSrc() {
  "use strict";

  return src([
    BASE_DIR_APP + "/**"
  ]).pipe(dest(BUILD_DIR_APP));
}

/**
 * The common files need to go into the app/lib directory...
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageCommon() {
  "use strict";

  return src([
    common.BASE_DIR_COMMON + "/**",
    // Filter out the rfc documents
    "!" + common.BASE_DIR_COMMON + "/libSieve/**/rfc*.txt",
    "!" + common.BASE_DIR_COMMON + "/libSieve/**/tests/",
    "!" + common.BASE_DIR_COMMON + "/libSieve/**/tests/**"
  ]).pipe(dest(BUILD_DIR_APP + '/libs'));
}

/**
 * The keytar files need to go into the app/lib directory.
 * After packaging electron the you need to add the native
 * prebuilt libraries.
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageKeytar() {
  "use strict";

  return src([
    BASE_DIR_KEYTAR + "/**",
    // Filter out the rfc documents
    "!" + BASE_DIR_KEYTAR + "/*.gyp",
    "!" + BASE_DIR_KEYTAR + "/*.ts",
    "!" + BASE_DIR_KEYTAR + "/src/**",
    "!" + BASE_DIR_KEYTAR + "/build/**",
    "!" + BASE_DIR_KEYTAR + "/node_modules/**"
  ]).pipe(dest(path.join(BUILD_DIR_APP, KEYTAR_OUTPUT_DIR)));
}

/**
 * Deploys the native prebuilt node modules into an electron application.
 * Typically you first package the module without any prebuilt files.
 * Then invoke electron packager with the target operating system and
 * architecture. Then call this method to deploy the matching prebuilt modules
 * to the electron packager output.
 *
 * Keep in mind a prebuilt is a binary. It needs to be binary
 * compatible and the abi has to match. An Windows Electron requires
 * a windows prebuilt, a Linux electron a linux prebuilt, etc
 *
 * @param {string} electronDest
 *   the location of the electron framework which should be repackaged
 * @param {string} prebuiltDest
 *   the location (inside the electron application) where the prebuilt
 *   binaries should be stored.
 * @param {string} pkgName
 *   the the package name
 * @param {string} platform
 *   the platform for which the prebuilt packages
 * @param {string} arch
 *   the architecture for the prebuilt packages
 */
async function deployPrebuilt(electronDest, prebuiltDest, pkgName, platform, arch) {
  "use strict";

  logger.debug(`Packaging Prebuilt ${pkgName} for ${platform}-${arch}`);

  // Step one, extract the electron version
  electronDest = path.resolve(path.join(electronDest, `/sieve-${platform}-${arch}`));

  if (!existsSync(electronDest))
    throw new Error(`Could not find a compatible electron release in ${electronDest}`);

  const abi = (await getElectronVersion(electronDest)).abi;

  // Step two, extract the package version

  // Prebuilt and electron packager use a different naming for mac.
  if (platform.toLowerCase() === "mas")
    platform = "darwin";

  if (platform === "darwin")
    prebuiltDest = path.join(electronDest, "sieve.app/Contents/Resources/app", prebuiltDest);
  else
    prebuiltDest = path.join(electronDest, "/resources/app/", prebuiltDest);

  const pkg = JSON.parse(
    await readFile(path.join(prebuiltDest, '/package.json')));

  // Step three, download the package,

  const filename = `${pkgName}-v${pkg.version}-${RUNTIME_ELECTRON}-v${abi}-${platform}-${arch}.tar.gz`;
  const prebuiltSrc = path.join(CACHE_DIR_APP, filename);

  if (!existsSync(prebuiltSrc)) {
    const url = `${PREBUILT_URL_KEYTAR}/v${pkg.version}/${filename}`;
    await https.download(url, prebuiltSrc);
  }

  // Step four, deploy the prebuilt.
  await untar(prebuiltSrc, prebuiltDest);

  return;
}

/**
 * Packages the Keytar prebuilt modules into the win32 build output
 */
async function packageKeytarWin32() {
  "use strict";
  return await deployPrebuilt(OUTPUT_DIR_APP, KEYTAR_OUTPUT_DIR, KEYTAR_NAME, WIN_PLATFORM, WIN_ARCH);
}

/**
 * Packages the Keytar prebuilt modules into the linux build output
 */
async function packageKeytarLinux() {
  "use strict";
  return await deployPrebuilt(OUTPUT_DIR_APP, KEYTAR_OUTPUT_DIR, KEYTAR_NAME, LINUX_PLATFORM, LINUX_ARCH);
}

/**
 * Packages the Keytar prebuilt modules into the macOS build output
 */
async function packageKeytarMacOS() {
  "use strict";
  return await deployPrebuilt(OUTPUT_DIR_APP, KEYTAR_OUTPUT_DIR, KEYTAR_NAME, MAC_PLATFORM, MAC_ARCH);
}

/**
 * Packages the build directory and electron for windows.
 */
async function packageWin32() {
  "use strict";

  const options = {
    dir: BUILD_DIR_APP,
    arch: WIN_ARCH,
    platform: WIN_PLATFORM,
    download: {
      cacheRoot: CACHE_DIR_APP
    },
    out: OUTPUT_DIR_APP,
    overwrite: true,
    icon: path.join(common.BASE_DIR_COMMON, "icons/win.ico")
  };

  const packager = require('electron-packager');
  await packager(options);
}

/**
 * Packages the build directory and electron for linux
 */
async function packageLinux() {
  "use strict";

  const options = {
    dir: BUILD_DIR_APP,
    arch: LINUX_ARCH,
    platform: LINUX_PLATFORM,
    download: {
      cacheRoot: CACHE_DIR_APP
    },
    out: OUTPUT_DIR_APP,
    overwrite: true,
    prune: true
  };

  const packager = require('electron-packager');
  await packager(options);
}

/**
 * Packages the build directory and electron for macOS
 */
async function packageMacOS() {
  "use strict";

  const options = {
    dir: BUILD_DIR_APP,
    arch: MAC_ARCH,
    platform: MAC_PLATFORM,
    download: {
      cacheRoot: CACHE_DIR_APP
    },
    out: OUTPUT_DIR_APP,
    overwrite: true,
    icon: path.join(common.BASE_DIR_COMMON, "icons/mac.icns"),
    prune: true
    // app-bundle-id: "net.tschmid.sieve"
  };

  const packager = require('electron-packager');
  await packager(options);
}

/**
 * Updates the addons version.
 */
// eslint-disable-next-line require-await
async function updateVersion() {
  "use strict";

  // there is no need to do anything here.
  // Electron packager will to it for us.
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
      './src/**/*.xul',
      './src/**/*.dtd',
      './src/**/*.properties'],
    parallel(
      packageSrc,
      packageCommon)
  );
}

/**
 * Zip the windows electron app.
 */
async function zipWin32() {
  "use strict";

  const version = (await common.getPackageVersion()).join(".");

  const source = path.resolve(path.join(OUTPUT_DIR_APP, `sieve-${WIN_PLATFORM}-${WIN_ARCH}`));
  const destination = path.join(common.BASE_DIR_BUILD, `sieve-${version}-${WIN_PLATFORM}-${WIN_ARCH}.zip`);

  await common.compress(source, destination);
}

/**
 * Zip the linux electron app.
 */
async function zipLinux() {
  "use strict";

  const version = (await common.getPackageVersion()).join(".");

  const source = path.resolve(path.join(OUTPUT_DIR_APP, `sieve-${LINUX_PLATFORM}-${LINUX_ARCH}`));
  const destination = path.join(common.BASE_DIR_BUILD, `sieve-${version}-${LINUX_PLATFORM}-${LINUX_ARCH}.zip`);

  const options = {
    permissions: {
      "sieve": 0o100770,
      "*": 0o100660
    }
  };

  await common.compress(source, destination, options);
}

/**
 * Creates a linux appImage Container
 */
async function appImageLinux() {
  "use strict";

  const latest = await https.fetch(APP_IMAGE_RELEASE_URL);

  let url = null;
  for (const asset of latest.assets) {
    if (asset.name === APP_IMAGE_TOOL_NAME)
      url = asset.browser_download_url;
  }

  if (!url)
    throw new Error("Could not download app image tool.");

  const tool = path.join(CACHE_DIR_APP, `appimagetool-v${latest.name}.AppImage`);

  if (!existsSync(tool))
    await https.download(url, tool);

  const RWX_RWX_RX = 0o775;
  await chmod(tool, RWX_RWX_RX);

  const version = (await common.getPackageVersion()).join(".");

  const source = path.resolve(path.join(OUTPUT_DIR_APP, `sieve-${LINUX_PLATFORM}-${LINUX_ARCH}`));
  const destination = path.resolve(path.join(common.BASE_DIR_BUILD, `sieve-${version}-${LINUX_PLATFORM}-${LINUX_ARCH}.AppImage`));

  exec(`${tool} "${source}" "${destination}" 2>&1`);
}


/**
 * Zip the macOS electron app.
 */
async function zipMacOs() {
  "use strict";

  const version = (await common.getPackageVersion()).join(".");

  const source = path.resolve(path.join(OUTPUT_DIR_APP, `sieve-${MAC_PLATFORM}-${MAC_ARCH}`));
  const destination = path.join(common.BASE_DIR_BUILD, `sieve-${version}-${MAC_PLATFORM}-${MAC_ARCH}.zip`);

  const options = {
    permissions: {
      "sieve": 0o100770,
      "*": 0o100660
    }
  };

  await common.compress(source, destination, options);
}

exports["watch"] = watchSrc;

exports["updateVersion"] = updateVersion;

exports["packageDefinition"] = packageDefinition;
exports["packageJQuery"] = packageJQuery;
exports["packageCodeMirror"] = packageCodeMirror;
exports["packageBootstrap"] = packageBootstrap;
exports["packageMaterialIcons"] = packageMaterialIcons;
exports["packageLicense"] = packageLicense;
exports["packageSrc"] = packageSrc;
exports["packageCommon"] = packageCommon;

exports["packageWin32"] = series(
  packageWin32,
  packageKeytarWin32
);

exports["packageLinux"] = series(
  packageLinux,
  packageKeytarLinux
);

exports["packageMacOS"] = series(
  packageMacOS,
  packageKeytarMacOS
);

exports["zipWin32"] = zipWin32;
exports["zipLinux"] = zipLinux;
exports["zipMacOs"] = zipMacOs;

exports["appImageLinux"] = appImageLinux;

exports['package'] = parallel(
  packageDefinition,
  packageJQuery,
  packageCodeMirror,
  packageBootstrap,
  packageMaterialIcons,
  packageLicense,
  packageSrc,
  packageCommon,
  packageKeytar
);
