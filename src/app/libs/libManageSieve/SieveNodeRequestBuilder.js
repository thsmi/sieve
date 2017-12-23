/*
 * The contents of this file is licenced. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via email
 * from the author. Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

// Enable Strict Mode
"use strict";

(function (exports) {

    /* global require */
    /* global Buffer */

    const { SieveAbstractRequestBuilder } = require("./SieveAbstractRequestBuilder.js");

    /**
     * Realizes a Request builder which uses native node commands
     * @constructor
     */
    function SieveNodeRequestBuilder() {
        this.data = "";
    }

    SieveNodeRequestBuilder.prototype = Object.create(SieveAbstractRequestBuilder.prototype);
    SieveNodeRequestBuilder.prototype.constructor = SieveNodeRequestBuilder;

    SieveNodeRequestBuilder.prototype.calculateByteLength = function (data) {
        return Buffer.byteLength(data, 'utf8');
    };

    SieveNodeRequestBuilder.prototype.convertStringToBase64 = function (decoded) {
        return Buffer.from(decoded).toString('base64');
    };

    SieveNodeRequestBuilder.prototype.convertStringFromBase64 = function (encoded) {
        return Buffer.from(encoded, 'base64').toString();
    };

    exports.SieveNodeRequestBuilder = SieveNodeRequestBuilder;

})(this);