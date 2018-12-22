/*
 * The contents of this file are licenced. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via
 * email from the author.
 *
 * Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 *
 */

(function () {

  "use strict";
  /* global SieveGrammar */

  if (!SieveGrammar)
    throw new Error("Could not register Convert");


  // Usage: convert  <quoted-from-media-type: string>
  //                 <quoted-to-media-type: string>
  //                 <transcoding-params: string-list>
  //
  // can be either a test or an action...


  let properties = [{
    id: "parameters",

    elements: [{
      id: "from",
      type: "string",
      value: '"image/tiff"'
    }, {
      id: "to",
      type: "string",
      value: '"image/jpeg"'
    }, {
      id: "transcoding",
      type: "stringlist",
      value: '["pix-x=320","pix-y=240"]'
    }]
  }];

  SieveGrammar.addTest({
    node: "test/convert",
    type: "test",

    requires: "convert",

    token: "convert",

    properties: properties
  });

  SieveGrammar.addAction({
    node: "action/convert",
    type: "action",

    requires: "convert",

    token: "convert",

    properties: properties
  });

})(window);
