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

/* global Components */
/* global SieveInitRequest */

// Enable Strict Mode
"use strict";

let EXPORTED_SYMBOLS = ["SieveAutoConfig"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Components.utils.import("chrome://sieve/content/modules/sieve/SieveRequire.jsm");

const { SieveLogger } = require("./SieveMozLogger.js");
const { Sieve } = require("./SieveMozClient.js");
const { SieveInitRequest } = require("./SieveRequest.js");

function SieveAutoConfigHost(host, port, proxy, listener, logger) {
  this.port = port;
  this.host = host;
  this.proxy = proxy;
  this.listener = listener;

  this.sieve = new Sieve(logger);

  this.sieve.addListener(this);

  let request = new SieveInitRequest();
  request.addErrorListener(this);
  request.addInitListener(this);
  this.sieve.addRequest(request);
}

SieveAutoConfigHost.prototype =
  {
    onInitResponse: function (response) {
      this.listener.onSuccess(this);
      this.cancel();
    },

    onIdle: function (response) {
      // just an empty stub...
    },

    onError: function (response) {
      if (this.listener)
        this.listener.onError(this);

      this.cancel();
    },

    onTimeout: function (message) {
      this.onError();
    },

    onDisconnect: function () {
      this.onError();
    },

    cancel: function () {
      this.callback = null;
      this.sieve.disconnect();
    },

    run: function () {
      this.sieve.connect(this.host, this.port, false, null, this.proxy);
    }
  };

function SieveAutoConfig() {
  this.logger = new SieveLogger();
  this.hosts = [];
}

SieveAutoConfig.prototype =
  {
    addHost: function (host, port, proxy) {
      if (this.activeHosts > 0)
        throw new Error("Auto config already running");

      this.hosts.push(new SieveAutoConfigHost(host, port, proxy, this, this.logger));
    },

    run: function (listener) {
      if (this.activeHosts > 0)
        throw new Error("Auto config already running");

      this.listener = listener;
      this.activeHosts = this.hosts.length;

      for (let i = 0; i < this.hosts.length; i++)
        this.hosts[i].run();
    },

    cancel: function () {
      for (let i = 0; i < this.hosts.length; i++)
        this.hosts[i].cancel();

      this.hosts = [];
      this.activeHosts = this.hosts.length;
    },

    onError: function (sender) {
      this.activeHosts--;

      // the error listener is only invoked, when all tests failed...
      if (this.activeHosts > 0)
        return;

      this.cancel();
      this.listener.onError();
    },

    onSuccess: function (sender) {
      // decrement our ref counter;
      this.activeHosts--;

      // the first successfull test wins...
      // ... so cancel all pending ones...
      this.cancel();

      // ... and invoke the callback
      this.listener.onSuccess(sender.host, sender.port, sender.proxy);
    }
  };
