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
const { readFile, chmod, unlink, mkdir } = require('fs').promises;

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

const BUILD_DIR_APP_LIBS = path.join(BUILD_DIR_APP, '/libs');


const KEYTAR_NAME = "keytar";
const KEYTAR_OUTPUT_DIR = `/libs/${KEYTAR_NAME}`;
const KEYTAR_RELEASE_URL = "https://api.github.com/repos/atom/node-keytar/releases";

const WIN_ARCH = "x64";
const WIN_PLATFORM = "win32";
const LINUX_ARCH = "x64";
const LINUX_PLATFORM = "linux";
const MAC_ARCH = "x64";
const MAC_PLATFORM = "mas";

const RUNTIME_ELECTRON = "electron";

const APP_IMAGE_RELEASE_URL = "https://api.github.com/repos/AppImage/AppImageKit/releases/latest";
const APP_IMAGE_TOOL_NAME = "appimagetool-x86_64.AppImage";
const APP_IMAGE_DIR = path.join(OUTPUT_DIR_APP, "sieve.AppDir");

const OUTPUT_DIR_APP_WIN32 = path.join(OUTPUT_DIR_APP, `sieve-${WIN_PLATFORM}-${WIN_ARCH}`);
const OUTPUT_DIR_APP_LINUX = path.join(OUTPUT_DIR_APP, `sieve-${LINUX_PLATFORM}-${LINUX_ARCH}`);
const OUTPUT_DIR_APP_MACOS = path.join(OUTPUT_DIR_APP, `sieve-${MAC_PLATFORM}-${MAC_ARCH}`);

const PERMISSIONS_EXECUTABLE = 0o100770;
const PERMISSIONS_NORMAL = 0o100660;

/**
 * Extracts a tar or tar.gz file to the given destination.
 *
 * @param {string} filename
 *   the path to the tar file
 * @param {string} destination
 *   the destination folder into which the tar should be extracted.
 */
async function untar(filename, destination, filter, strip) {

  logger.debug(`Extracting ${filename} to ${destination}`);

  await tar.x({
    file: filename,
    cwd: destination,
    filter: filter,
    strip : strip,
    strict: true
  });

  return;
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

  return src([
    "./LICENSE.md"
  ]).pipe(dest(BUILD_DIR_APP));
}

/**
 * Copies the codemirror sources into the build directory.
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageCodeMirror() {
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

  return common.packageBootstrap(
    `${BUILD_DIR_APP}/libs/bootstrap`);
}

/**
 * Copies the source files into the app/ directory...
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageSrc() {
  return src([
    BASE_DIR_APP + "/**",
    `!${BASE_DIR_APP}/libs/libManageSieve/**`
  ]).pipe(dest(BUILD_DIR_APP));
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
  ], { base: common.BASE_DIR_COMMON }).pipe(dest(BUILD_DIR_APP_LIBS));
}

/**
 * Copies the common libManageSieve files into the app's lib folder
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageLibManageSieve() {

  const BASE_APP = path.join(BASE_DIR_APP, "libs", "libManageSieve");
  const BASE_COMMON = path.join(common.BASE_DIR_COMMON, "libManageSieve");

  return common.src2(BASE_APP)
    .pipe(common.src2(BASE_COMMON))
    .pipe(dest(path.join(BUILD_DIR_APP_LIBS, "libManageSieve")));
}


/**
 * Copies the common libSieve files into the app's lib folder
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageLibSieve() {
  return common.packageLibSieve(BUILD_DIR_APP_LIBS);
}


/**
 * Copies the common managesieve.ui files into the app's lib folder
 *
 * @returns {Stream}
 *   a stream to be consumed by gulp
 */
function packageManageSieveUi() {
  return common.packageManageSieveUi(BUILD_DIR_APP_LIBS);
}

/**
 * It checks all assets from a github release for a compatible artifact.
 * In case no compatible artifact was found an exception will be thrown.
 *
 * @param {string} url
 *   the github repository url.
 * @param {string} abi
 *   the electron abi compatibility
 * @param {string} platform
 *   the platform (e.g. win32, linux, darwin)
 * @param {string} arch
 *   the architecture either x86 or x64
 *
 * @returns {object}
 *   the asset url and the source url wrapped into an object.
 */
async function getLatestCompatibleRelease(url, abi, platform, arch) {

  const releases = await https.fetch(url);

  // Find the latest compatible version.
  for (const release of releases) {
    for (const asset of release.assets) {
      if (!asset.name.endsWith(`-${RUNTIME_ELECTRON}-v${abi}-${platform}-${arch}.tar.gz`))
        continue;

      return {
        "tag_name" : release.tag_name,
        "asset" : asset.browser_download_url,
        "tarball" : release.tarball_url
      };
    }
  }

  throw new Error("No Compatible keytar release found.");
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

  // Now we need to find a compatible keytar releases.
  // We just browse all available assets and check if their abi, platform and
  // architecture is compatible
  const latest = await getLatestCompatibleRelease(
    KEYTAR_RELEASE_URL, abi, platform, arch);

  const prebuiltSrc = path.join(CACHE_DIR_APP,
    `keytar-${latest.tag_name}-${RUNTIME_ELECTRON}-v${abi}-${platform}-${arch}.tar.gz`);
  const tarballSrc = path.join(CACHE_DIR_APP,
    `keytar-${latest.tag_name}-tarball.tar.gz`);

  // Then download the artifacts and tarball if needed.
  if (!existsSync(prebuiltSrc))
    await https.download(latest.asset, prebuiltSrc);

  if (!existsSync(tarballSrc))
    await https.download(latest.tarball, tarballSrc);

  await mkdir(prebuiltDest, { recursive: true });

  // Untar the prebuilt module...
  await untar(prebuiltSrc, prebuiltDest);

  // ... then the tarball containing the library.
  await untar(tarballSrc, prebuiltDest,
    (entry) => { return (/^.*\/((lib\/.*)|LICENSE.md|package.json)$/gi.test(entry)); }, 1);
}

/**
 * Packages the Keytar prebuilt modules into the win32 build output
 */
async function packageKeytarWin32() {
  await deployPrebuilt(OUTPUT_DIR_APP, KEYTAR_OUTPUT_DIR, KEYTAR_NAME, WIN_PLATFORM, WIN_ARCH);
}

/**
 * Packages the Keytar prebuilt modules into the linux build output
 */
async function packageKeytarLinux() {
  await deployPrebuilt(OUTPUT_DIR_APP, KEYTAR_OUTPUT_DIR, KEYTAR_NAME, LINUX_PLATFORM, LINUX_ARCH);
}

/**
 * Packages the Keytar prebuilt modules into the macOS build output
 */
async function packageKeytarMacOS() {
  await deployPrebuilt(OUTPUT_DIR_APP, KEYTAR_OUTPUT_DIR, KEYTAR_NAME, MAC_PLATFORM, MAC_ARCH);
}

/**
 * Packages the build directory and electron for windows.
 */
async function packageWin32() {

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

  // there is no need to do anything here.
  // Electron packager will to it for us.
}

/**
 * Watches for changed source files and copies them into the build directory.
 */
function watchSrc() {

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
      packageManageSieveUi,
      packageLibSieve,
      packageLibManageSieve)
  );
}

/**
 * Zip the windows electron app.
 */
async function zipWin32() {

  const version = (await common.getPackageVersion()).join(".");

  const source = path.resolve(OUTPUT_DIR_APP_WIN32);
  const destination = path.join(common.BASE_DIR_BUILD, `sieve-${version}-${WIN_PLATFORM}-${WIN_ARCH}.zip`);

  await common.compress(source, destination);
}

/**
 * Zip the linux electron app.
 */
async function zipLinux() {

  const version = (await common.getPackageVersion()).join(".");

  const source = path.resolve(path.join(OUTPUT_DIR_APP_LINUX));
  const destination = path.join(common.BASE_DIR_BUILD, `sieve-${version}-${LINUX_PLATFORM}-${LINUX_ARCH}.zip`);

  const options = {
    permissions: {
      "sieve": PERMISSIONS_EXECUTABLE,
      "*": PERMISSIONS_NORMAL
    }
  };

  await common.compress(source, destination, options);
}

/**
 * App Images enforce a very strict naming scheme, this means
 * we copy the staged files and do our adjustments
 *
 * @returns {stream}
 *   a stream to be consumed by gulp
 */
function packageAppImageDir() {

  return src([
    OUTPUT_DIR_APP_LINUX + "/**/*"
  ]).pipe(dest(APP_IMAGE_DIR));
}

/**
 * Packages the AppDir related files into the app image folder.
 *
 * @returns {stream}
 *   a stream to be consumed by gulp
 */
function packageAppImageFiles() {

  const appImageFiles = path.join(common.BASE_DIR_COMMON, "/appImage/");

  return src([
    appImageFiles + "/**/*"
  ], { base: appImageFiles}).pipe(dest(APP_IMAGE_DIR));
}

/**
 * Creates a linux appImage Container
 */
async function packageAppImage() {

  const latest = await https.fetch(APP_IMAGE_RELEASE_URL);

  let url = null;
  for (const asset of latest.assets) {
    if (asset.name === APP_IMAGE_TOOL_NAME)
      url = asset.browser_download_url;
  }

  if (!url)
    throw new Error("Could not download app image tool.");

  const tool = path.resolve(path.join(CACHE_DIR_APP, `appimagetool-v${latest.name}.AppImage`));

  if (!existsSync(tool))
    await https.download(url, tool);

  const RWX_RWX_RX = 0o775;
  await chmod(tool, RWX_RWX_RX);

  await chmod(path.resolve(path.join(APP_IMAGE_DIR, "AppRun")), RWX_RWX_RX);

  const version = (await common.getPackageVersion()).join(".");

  const source = path.resolve(APP_IMAGE_DIR);
  const destination = path.resolve(path.join(common.BASE_DIR_BUILD, `sieve-${version}-${LINUX_PLATFORM}-${LINUX_ARCH}.AppImage`));

  await exec(`${tool} "${source}" "${destination}"  2>&1`);
}

/**
 * Zip the macOS electron app.
 * On macOS we have to use zip, because yazl errors out at symbolic links.
 */
async function zipMacOS() {

  const version = (await common.getPackageVersion()).join(".");

  const source = path.resolve(OUTPUT_DIR_APP_MACOS);
  const destination = path.resolve(path.join(common.BASE_DIR_BUILD, `sieve-${version}-${MAC_PLATFORM}-${MAC_ARCH}.zip`));

  if (existsSync(destination)) {
    logger.info(`Deleting ${path.basename(destination)}`);
    await unlink(destination);
  }

  logger.info(`Compressing files ${source}/sieve.app`);
  logger.info(`Creating ${path.basename(destination)}`);

  process.chdir(`${source}/`);
  await exec(`zip -qry "${destination}" "sieve.app" 2>&1`);
}

exports["watch"] = watchSrc;

exports["updateVersion"] = updateVersion;

exports["packageDefinition"] = packageDefinition;
exports["packageCodeMirror"] = packageCodeMirror;
exports["packageBootstrap"] = packageBootstrap;
exports["packageLicense"] = packageLicense;
exports["packageSrc"] = packageSrc;
exports["packageLibManageSieve"] = packageLibManageSieve;
exports["packageLibSieve"] = packageLibSieve;
exports["packageManageSieveUi"] = packageManageSieveUi;

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
exports["zipMacOS"] = zipMacOS;

exports["appImageLinux"] = series(
  packageAppImageDir,
  packageAppImageFiles,
  packageAppImage
);

exports['package'] = series(
  packageDefinition,
  parallel(
    packageLicense,
    packageIcons,
    packageCodeMirror,
    packageBootstrap,
    packageLibManageSieve,
    packageLibSieve,
    packageManageSieveUi
  ),
  packageSrc
);
