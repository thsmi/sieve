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

const logger = require('gulplog');

const https = require('https');
const fs = require('fs');

const HTTP_SUCCESS_MIN = 200;
const HTTP_SUCCESS_MAX = 299;

const HTTP_REDIRECT_MIN = 300;
const HTTP_REDIRECT_MAX = 399;

/**
 * Checks if the http status code indicates a redirection.
 *
 * @param {int} status
 *   the status to be checked,
 *
 * @returns {boolean}
 *   the true in case the server requested a redirection otherwise false.
 */
function isRedirection(status) {
  return (status >= HTTP_REDIRECT_MIN) && (status <= HTTP_REDIRECT_MAX);
}

/**
 * Checks if the http status code indicates a success.
 *
 * @param {int} status
 *   the status to be checked,
 *
 * @returns {boolean}
 *   the true in case the server signaled a success otherwise false.
 */
function isSuccess(status) {
  return (status >= HTTP_SUCCESS_MIN) && (status <= HTTP_SUCCESS_MAX);
}

/**
 * Fetches a json file from a https url.
 * E.g. used to download github releases via the api.
 *
 * @param {string} url
 *   the json file to be loaded.
 * @returns {string}
 *   the bytes received.
 */
async function fetch(url) {

  logger.debug(`Fetching ${url}`);


  return await new Promise((resolve, reject) => {

    // Github requires to have a user agents set.
    // It should be the username plus the application name.
    //
    // https://developer.github.com/v3/#user-agent-required

    const options = {headers: { 'User-Agent': 'thsmi-sieve' }};
    https.get(url, options, async function (response) {

      try {

        if (isRedirection(response.statusCode)) {
          logger.debug(`Following redirect to ${response.headers.location}`);
          resolve(await fetch(response.headers.location));
          return;
        }

        if (!isSuccess(response.statusCode))
          throw Error(`Fetching ${url} failed with status code ${response.statusCode}.`);

        let data = "";

        response.on("data", (bytes) => {
          data += bytes;
        });

        response.on('end', () => {
          resolve(JSON.parse(data));
        });

      } catch (ex) {
        reject(new Error(ex));
      }
    });
  });
}

/**
 * Downloads a file from an https url and stores the data into the given file.
 * It follows redirects. Upon a non 200 status code an error is thrown.
 *
 * @param {string} url
 *   the download url.
 * @param {string} destination
 *   the file into which the downloaded data should be stored.
 *   In case the file exists it will be silently overwritten.
 * @returns {undefined}
 */
async function download(url, destination) {

  logger.debug(`Downloading ${url} to ${destination}`);

  return await new Promise((resolve, reject) => {
    // Github requires to have a user agents set.
    // It should be the username plus the application name.
    //
    // https://developer.github.com/v3/#user-agent-required

    const options = {headers: { 'User-Agent': 'thsmi-sieve' }};

    https.get(url, options, async function (response) {

      try {
        if (isRedirection(response.statusCode)) {
          logger.debug(`Following redirect to ${response.headers.location}`);
          await download(response.headers.location, destination);

          resolve();
          return;
        }

        if (!isSuccess(response.statusCode))
          throw Error(`Downloading ${url} failed with status code ${response.statusCode}.`);

        const file = fs.createWriteStream(destination);

        response.pipe(file);

        file.on('finish', function () {
          file.close(function () {
            resolve();
          });
        });
      } catch (ex) {
        reject(new Error(ex));
      }
    });
  });
}


exports["download"] = download;
exports["fetch"] = fetch;
