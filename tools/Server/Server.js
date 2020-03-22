/*
 * The contents of this file are licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via
 * email from the author.
 *
 * Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 *
 */

// https://developer.mozilla.org/en-US/docs/Learn/Server-side/Node_server_without_framework

(function () {

  "use strict";

  const http = require('http');
  const fs = require('fs');
  const path = require('path');
  const util = require('util');

  const SERVER_PORT = 8125;

  const GUI_URL = "gui/";
  const GUI_PATH = "./build/electron/resources/libs";

  const TEST_URL = "test/";
  const TEST_PATH = "./build/test";

  const HTTP_SUCCESS = 200;
  const HTTP_FILE_NOT_FOUND = 404;
  const HTTP_INTERNAL_ERROR = 500;

  const CONTENT_TYPE_HTML = "text/html";

  /**
   *
   * @param {*} filePath
   */
  function getContentType(filePath) {
    const extname = path.extname(filePath);

    switch (extname) {
      case '.js':
        return 'text/javascript';
      case '.css':
        return 'text/css';
      case '.json':
        return 'application/json';
      case '.png':
        return 'image/png';
      case '.jpg':
        return 'image/jpg';
    }

    return '';
  }

  /**
   * Compares  the given path elements.
   *
   * A directory always wins the comparison.
   * Otherwise in case two directories or two
   * files are compared alphabetically.
   *
   * @param {*} a
   *   the first path
   * @param {*} b
   *   the second path.
   *
   * @returns {int}
   *   the comparisons result.
   */
  function sortDirectory(a, b) {

    if (a.isDirectory() && b.isDirectory())
      return a.name.localeCompare(b.name);

    if (a.isDirectory())
      return -1;

    if (b.isDirectory())
      return 1;

    return a.name.localeCompare(b.name);
  }

  http.createServer(async function (request, response) {

    let filePath = "";

    if (request.url.startsWith(`/${GUI_URL}`)) {
      filePath = GUI_PATH + request.url.substr(GUI_URL.length);
    } else if (request.url.startsWith(`/${TEST_URL}`)) {
      filePath = TEST_PATH + request.url.substr(TEST_URL.length);
    } else {

      response.writeHead(HTTP_FILE_NOT_FOUND, { 'Content-Type': CONTENT_TYPE_HTML });

      let content = "";

      content += "<h1>Welcome to the debug server</h1>";
      content += "<p>This server is used to bypass cross site scripting problems during development.</p>";
      content += "<ul>";
      content += `<li><a href="http://127.0.0.1:${SERVER_PORT}/${GUI_URL}libSieve/SieveGui.html">&#128448;&nbsp;Run GUI Editor</a></li>`;
      content += `<li><a href="http://127.0.0.1:${SERVER_PORT}/${TEST_URL}index.html">&#128448;&nbsp;Run Unit Tests</a></li>`;
      content += "</ul>";
      response.end(content, 'utf-8');
      return;
    }

    console.log('Request for ' + filePath);


    try {

      if (!fs.existsSync(filePath)) {
        response.writeHead(HTTP_FILE_NOT_FOUND);
        response.end(`File not found (404) ${filePath}\n`);
        response.end();

        return;
      }

      const stat = await (util.promisify(fs.lstat))(filePath);

      if (stat.isDirectory()) {

        const items = await (util.promisify(fs.readdir))(filePath, { withFileTypes: true });

        let url = request.url;

        if (!url.endsWith("/"))
          url += "/";

        response.writeHead(HTTP_SUCCESS, { 'Content-Type': CONTENT_TYPE_HTML });

        let content = "";
        content += `<h1> Index of ${request.url}</h1>`;

        items.sort(sortDirectory);

        content += `<div><a href="${url}../">&#11168; &nbsp;..</a></div>`;

        for (const item of items) {
          if (item.isDirectory())
            content += `<div><a href="${url}${item.name}">&#128448;&nbsp;${item.name}/</a></div>`;
          else
            content += `<div><a href="${url}${item.name}">&#128462;&nbsp;${item.name}</a></div>`;
        }

        response.end(content, 'utf-8');

        return;
      }

      if (stat.isFile()) {

        const content = await fs.promises.readFile(filePath);
        response.writeHead(HTTP_SUCCESS, { 'Content-Type': getContentType(filePath) });
        response.end(content, 'utf-8');

        return;
      }

      console.log("Unsupported file type for" + filePath);

    } catch (ex) {
      console.log(ex);
    }

    response.writeHead(HTTP_INTERNAL_ERROR);
    response.end('Internal server error ' + filePath + ' ...\n');
    response.end();


  }).listen(SERVER_PORT);
  console.log(`Server running at http://127.0.0.1:${SERVER_PORT}/${GUI_URL}libSieve/SieveGui.html or http://127.0.0.1:${SERVER_PORT}/${TEST_URL}index.html`);

})();
