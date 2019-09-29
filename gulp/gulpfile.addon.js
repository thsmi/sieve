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

const { src, dest, watch, parallel } = require('gulp');

const common = require("./gulpfile.common.js");

const zip = require('gulp-zip');
const fs = require('fs');
const path = require('path');

const BUILD_DIR_ADDON = path.join(common.BASE_DIR_BUILD, "/thunderbird/");
const BASE_DIR_ADDON = "./src/addon";

/**
 * Updates the version in an rdf file.
 *
 * @param {string} version
 *    the new version string.
 * @param {string} file
 *   the path to the rdf file
 *
 * @returns {undefined}
 */
async function setRdfVersion(version, file) {
  "use strict";

  version = version.join(".");

  console.log(`Updating ${file} to ${version}`);

  let regexp = new RegExp("<em:version>(\\d)*\\.(\\d)*\\.(\\d)*<\\/em:version>", "g");

  let data = await fs.promises.readFile(file, 'utf8');
  data = data.replace(
    regexp,
    `<em:version>${version}</em:version>`);

  await fs.promises.writeFile(file, data, 'utf-8');
}

/**
 * Packages the license file into the build directory.
 * @returns {undefined}
 */
async function packageLicense() {
  "use strict";

  await src([
    "./LICENSE.md"
  ]).pipe(dest(BUILD_DIR_ADDON));
}

/**
 * Packages jquery into the build directory.
 * @returns {undefined}
 */
async function packageJQuery() {
  "use strict";

  await common.packageJQuery(
    BUILD_DIR_ADDON + "/chrome/chromeFiles/content/libs/jQuery");
}

/**
 * Packages codemirror into the build directory.
 * @returns {undefined}
 */
async function packageCodeMirror() {
  "use strict";

  await common.packageCodeMirror(
    `${BUILD_DIR_ADDON}/chrome/chromeFiles/content/libs/CodeMirror`);
}

/**
 * Pacakges bootstrap into the build directory.
 * @returns {undefined}
 */
async function packageBootstrap() {
  "use strict";

  await common.packageBootstrap(
    `${BUILD_DIR_ADDON}/chrome/chromeFiles/content/libs/bootstrap`);
}

/**
 * Packages material design icons into the build directory.
 * @returns {undefined}
 */
async function packageMaterialIcons() {
  "use strict";

  await common.packageMaterialIcons(
    `${BUILD_DIR_ADDON}/chrome/chromeFiles/content/libs/material-icons`);
}

/**
 * Packages the source files into the build directory.
 * @returns {undefined}
 */
async function packageSrc() {
  "use strict";

  await src([
    BASE_DIR_ADDON + "/**",

    "!" + BASE_DIR_ADDON + "/chrome/chromeFiles/content/filterList",
    "!" + BASE_DIR_ADDON + "/chrome/chromeFiles/content/filterList/**"
  ]).pipe(dest(BUILD_DIR_ADDON));
}

/**
 * Packages common files into the build directory.
 * @returns {undefined}
 */
async function packageCommon() {
  "use strict";

  await src([
    common.BASE_DIR_COMMON + "/**",

    // Filter out the rfc documents
    "!" + common.BASE_DIR_COMMON + "/libSieve/**/rfc*.txt",
    "!" + common.BASE_DIR_COMMON + "/libSieve/**/tests/",
    "!" + common.BASE_DIR_COMMON + "/libSieve/**/tests/**"
  ]).pipe(dest(`${BUILD_DIR_ADDON}/chrome/chromeFiles/content/libs`));
}

/**
 * Zips the build directory and creates a XPI inside the release folder.
 * @returns {undefined}
 */
async function packageXpi() {
  "use strict";

  const version = (await common.getPackageVersion()).join(".");

  console.log(`Packaging sieve-${version}.xpi`);

  await src([`${BUILD_DIR_ADDON}/**`], {buffer:false})
    .pipe(zip(`sieve-${version}.xpi`))
    .pipe(dest('./release/thunderbird'));
  // place code for your default task here
}

/**
 * Thunderbirds allows loading addons from outside of
 * the extension directory. In our case this would be
 * the build directory. To do so you need to create
 * a file with the addons id which contains the path
 * to the extension directory.
 *
 * The rational behind this is that a addon:watch
 * automagically updates the addon.
 *
 * @returns {undefined}
 **/
async function deploy() {
  "use strict";

  let { SieveThunderbirdImport } = require("../src/app/utils/SieveThunderbirdImport.js");

  let target = (new SieveThunderbirdImport()).getDefaultUserProfile();

  target = path.join(target, "extensions");

  if (fs.existsSync(target) === false)
    throw new Error("Failed to locate extension directory " + target);

  target = path.join(target, "sieve@mozdev.org");

  let source = path.join(
    path.resolve(BUILD_DIR_ADDON),
    path.sep);

  // Bail out in case the directory already exists.
  if (await(fs.promises.exists(target))) {
    if ((await fs.promises.readFileSync(target, "utf-8")).trim() === source) {
      console.log("Skipping file already exists");
      return;
    }
  }

  // otherwise write or overwrite the existing file.
  await fs.promises.writeFile(target, source, "utf-8");
}

/**
 * Updates the addon's version.
 * It reads the information from the npm package and updates the install.rdf as well as the manifest.json
 * @returns {undefined}
 */
async function updateVersion() {
  "use strict";

  const pkgVersion = await common.getPackageVersion();

  // Older Thunderbird version use the install rdf.
  await setRdfVersion(pkgVersion, './src/addon/install.rdf');
  // Newer version use the json file
  await common.setPackageVersion(pkgVersion, './src/addon/manifest.json');
}

/**
 * Watches for changed source files and copies them into the build directory.
 * @returns {undefined}
 */
function watchSrc() {

  "use strict";

  watch(
    ['./src/**/*.js',
      './src/**/*.jsm',
      './src/**/*.html',
      './src/**/*.css',
      './src/**/*.xul',
      './src/**/*.dtd',
      './src/**/*.properties'],
    parallel(
      packageSrc,
      packageCommon)
  );
}

exports["packageSrc"] = packageSrc;
exports["packageCommon"] = packageCommon;
exports["packageJQuery"] = packageJQuery;
exports["packageBootstrap"] = packageBootstrap;
exports["packageLicense"] = packageLicense;
exports["packageCodeMirror"] = packageCodeMirror;
exports["packageMaterialIcons"] = packageMaterialIcons;

exports["packageXpi"] = packageXpi;


exports['package'] = parallel(
  packageSrc,
  packageCommon,
  packageJQuery,
  packageBootstrap,
  packageLicense,
  packageCodeMirror,
  packageMaterialIcons,
);

exports['updateVersion'] = updateVersion;

exports["deploy"] = deploy;

exports["watch"] = watchSrc;
