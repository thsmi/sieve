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
 *  Inspired by ChatZilla code...
 */

// Enable Strict Mode
"use strict";

var EXPORTED_SYMBOLS = ["SieveProtocolHandlerComponent"];

/* global Components */

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;

const SIEVE_SCHEME = "x-sieve";
const SIEVE_MIMETYPE = "application/x-sieve";

/**
 * Implements an Protocol handler component for sieve. This is needed inorder
 * to obtain proxy information. As it has basically a stub, without any function,
 * it uses "x-sieve" as scheme instead of "sieve".
 *
 * @constructor
 */
function SieveProtocolHandler() { }

SieveProtocolHandler.prototype =
  {

    classID: Components.ID("{65f30660-14eb-11da-8351-0002a5d5c51b}"),
    classDescription: SIEVE_SCHEME + " protocol handler",
    contactID: "@mozilla.org/network/protocol;1?name=" + SIEVE_SCHEME,

    scheme: SIEVE_SCHEME,
    defaultPort: 4190,

    protocolFlags:
      Ci.nsIProtocolHandler.URI_NORELATIVE |
      Ci.nsIProtocolHandler.URI_NOAUTH |
      Ci.nsIProtocolHandler.ALLOWS_PROXY |
      (("URI_DANGEROUS_TO_LOAD" in Ci.nsIProtocolHandler) ? Ci.nsIProtocolHandler.URI_LOADABLE_BY_ANYONE : 0) |
      (("URI_NON_PERSISTABLE" in Ci.nsIProtocolHandler) ? Ci.nsIProtocolHandler.URI_NON_PERSISTABLE : 0) |
      (("URI_DOES_NOT_RETURN_DATA" in Ci.nsIProtocolHandler) ? Ci.nsIProtocolHandler.URI_DOES_NOT_RETURN_DATA : 0),

    allowPort: function (port, scheme) {
      if (scheme == this.scheme)
        return true;
      else
        return false;
    },

    newURI: function (spec, charset, baseURI) {
      let url = Cc["@mozilla.org/network/standard-url;1"].createInstance(Ci.nsIStandardURL);

      // Normalize URL to an standard URL
      url.init(Ci.nsIStandardURL.URLTYPE_AUTHORITY/*URLTYPE_STANDARD*/, this.defaultPort, spec, charset, baseURI);

      return url.QueryInterface(Ci.nsIURI);
    },

    newChannel: function (URI) {
      let ios = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);

      if (!ios.allowPort(URI.port, URI.scheme))
        throw Components.results.NS_ERROR_FAILURE;

      return new BogusChannel(URI);
    },

    QueryInterface: function (aIID) {
      if (aIID.equals(Ci.nsISupports))
        return this;

      // nsIProtocolHandler defines newURI(), newChannel(), allowPort, ...
      // ... protocolFlags, defaultPort and scheme
      if (aIID.equals(Ci.nsIProtocolHandler))
        return this;

      throw Cr.NS_ERROR_NO_INTERFACE;
    }
  };

/**
 * bogus channel implementation, based on chatzilla's IRCProtocolHandler
 * @param {URI} uri
 *   the channel's uri
 *
 * @constructor
 */
function BogusChannel(uri) {
  this.URI = uri;
  this.originalURI = uri;
  this.contentType = SIEVE_SCHEME;
}

BogusChannel.prototype = {

  /* nsIChannel */
  loadAttributes: null,
  contentLength: 0,
  owner: null,
  loadGroup: null,
  notificationCallbacks: null,
  securityInfo: null,

  open: function (observer, ctxt) {
    Components.returnCode = NS_ERROR_NO_CONTENT;
  },

  asyncOpen: function (observer, ctxt) {
    // We don't throw this (a number, not a real 'resultcode') because it
    // upsets xpconnect if we do (error in the js console).
    Components.returnCode = NS_ERROR_NO_CONTENT;
  },

  asyncRead: function (listener, ctxt) {
    throw Cr.NS_ERROR_NOT_IMPLEMENTED;
  },

  /* nsIRequest */
  isPending: function () {
    return true;
  },

  status: Components.results.NS_OK,

  cancel: function (status) {
    this.status = status;
  },

  suspend: function () {
    throw Cr.NS_ERROR_NOT_IMPLEMENTED;
  },

  resume: function () {
    throw Cr.NS_ERROR_NOT_IMPLEMENTED;
  },

  QueryInterface: function (iid) {

    if (iid.equals(Ci.nsIChannel))
      return this;

    if (iid.equals(Ci.nsIRequest))
      return this;

    if (iid.equals(Ci.nsISupports))
      return this;

    throw Cr.NS_ERROR_NO_INTERFACE;
  }
};


var SieveProtocolHandlerFactory =
  {
    createInstance: function (outer, iid) {
      if (outer != null)
        throw Cr.NS_ERROR_NO_AGGREGATION;

      return new SieveProtocolHandler().QueryInterface(iid);
    },

    QueryInterface: function (iid) {
      if (iid.equals(Ci.nsIFactory) || iid.equals(Ci.nsISupports))
        return this;

      throw Cr.NS_ERROR_NO_INTERFACE;
    }
  };

var SieveProtocolHandlerComponent = {};

SieveProtocolHandlerComponent.load = function () {
  let compMgr = Components.manager.QueryInterface(Ci.nsIComponentRegistrar);
  compMgr.registerFactory(
    SieveProtocolHandler.prototype.classID,
    SieveProtocolHandler.prototype.classDescription,
    SieveProtocolHandler.prototype.contactID,
    SieveProtocolHandlerFactory);
};

SieveProtocolHandlerComponent.unload = function () {
  let compMgr = Components.manager.QueryInterface(Ci.nsIComponentRegistrar);
  compMgr.unregisterFactory(
    SieveProtocolHandler.prototype.classID,
    SieveProtocolHandlerFactory);
};
