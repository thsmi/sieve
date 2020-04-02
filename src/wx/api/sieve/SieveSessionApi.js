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

(function (exports) {

  "use strict";

  /* global ExtensionCommon */
  /* global Components */
  /* global ChromeUtils */

  const Cc = Components.classes;
  const Ci = Components.interfaces;

  /**
   * Implements a webextension api for sieve session and connection management.
   */
  class SieveSessionApi extends ExtensionCommon.ExtensionAPI {
    /**
     * @inheritdoc
     */
    getAPI(context) {

      const rootUri = context.extension.rootURI;
      const url = context.extension.getURL();

      // The default case it loading from a jar file.
      let requireUrl = rootUri.resolve("/modules/SieveRequire.jsm");

      // But for debugging we are loading from a file url. Which is prohibited
      // so we need to convert the file url into an extension url.
      if (rootUri.schemeIs("file"))
        requireUrl = `${url}/modules/SieveRequire.jsm`;

      const { Modules } = ChromeUtils.import(requireUrl);
      const modules = new Modules(
        `${url}/libs/libManageSieve/`,
        // eslint-disable-next-line no-console
        function(msg) { console.log(msg); });

      const sessions = new Map();

      context.callOnClose({ close: () => {
        console.log("Unloading Sieve Session API");

        // First ensure we exit all active sessions.
        for (const item of sessions.values())
          item.disconnect(true);
        sessions.clear();

        // Then invalidate all the modules.
        modules.invalidate();

        // And finally unload the module loader.
        Components.utils.unload(rootUri.resolve("/modules/SieveRequire.jsm"));
      }});

      const { SieveSession } = modules.require("./SieveSession.js");

      return {
        sieve: {
          session: {

            onAuthenticate: new ExtensionCommon.EventManager({
              context,
              name: "sieve.session.onAuthenticate",
              register: (fire, id) => {

                const callback = async (hasPassword) => {
                  return await fire.async(hasPassword);
                };

                sessions.get(id).on("authenticate", callback);

                return () => {
                  if (sessions.has(id))
                    sessions.get(id).on("authenticate");
                };
              }
            }).api(),

            onAuthorize: new ExtensionCommon.EventManager({
              context,
              name: "sieve.session.onAuthorize",
              register: (fire, id) => {

                const callback = async () => {
                  return await fire.async();
                };

                sessions.get(id).on("authorize", callback);

                return () => {
                  if (sessions.has(id))
                    sessions.get(id).on("authorize");
                };
              }
            }).api(),

            onCertError: new ExtensionCommon.EventManager({
              context,
              name: "sieve.session.onCertError",
              register: (fire, id) => {

                // It is just a notification so no need to wait.
                const callback = (secInfo) => {
                  fire.async(secInfo);
                };

                sessions.get(id).on("certerror", callback);

                return () => {
                  if (sessions.has(id))
                    sessions.get(id).on("certerror");
                };
              }
            }).api(),

            onProxyLookup: new ExtensionCommon.EventManager({
              context,
              name: "sieve.session.onProxyLookup",
              register: (fire, id) => {

                const callback = async (host, port) => {
                  return await fire.async(host, port);
                };

                sessions.get(id).on("proxy", callback);

                return () => {
                  if (sessions.has(id))
                    sessions.get(id).on("proxy");
                };
              }
            }).api(),

            // eslint-disable-next-line require-await
            async create(id, options) {

              if (sessions.has(id))
                throw new Error("Id already in use");

              sessions.set(id,
                new SieveSession(id, options));
            },

            async destroy(id) {
              if (!sessions.has(id))
                return;

              await this.disconnect(id, true);
              sessions.delete(id);
            },

            async has(id) {
              return await sessions.has(id);
            },

            // eslint-disable-next-line require-await
            async addCertErrorOverride(hostname, port, rawDER, flags) {

              const overrideService = Cc["@mozilla.org/security/certoverride;1"]
                .getService(Ci.nsICertOverrideService);

              const certdb = Cc["@mozilla.org/security/x509certdb;1"]
                .getService(Ci.nsIX509CertDB);

              // The constructX509 has an incompatible change.
              // While newer version consume an array, older version use strings.
              // This magic is only needed for thunderbird 68
              let cert = null;
              try {
                // Try first with the new api..
                cert = certdb.constructX509(rawDER);
              } catch (ex) {

                if (ex.name !== "NS_ERROR_FAILURE")
                  throw ex;

                // ... other wise the use the old api.
                cert = "";
                for (const ch of rawDER)
                  cert += (String.fromCharCode(ch));

                cert = certdb.constructX509(cert);
              }

              overrideService.rememberValidityOverride(
                hostname, port,
                cert,
                flags,
                false);
            },

            async connect(id, host, port) {
              await sessions.get(id).connect(host, port);
            },

            async disconnect(id, force) {
              await sessions.get(id).disconnect(force);
            },

            async isConnected(id) {
              if (!sessions.has(id))
                return false;

              return await sessions.get(id).isConnected();
            },

            async capabilities(id) {
              return await sessions.get(id).capabilities();
            },

            async listScripts(id) {
              return await sessions.get(id).listScripts();
            },

            async putScript(id, name, body) {
              return await sessions.get(id).putScript(name, body);
            },

            async getScript(id, name) {
              return await sessions.get(id).getScript(name);
            },

            async renameScript(id, oldname, newname) {
              return await sessions.get(id).renameScript(oldname, newname);
            },

            async deleteScript(id, name) {
              return await sessions.get(id).deleteScript(name);
            },

            async activateScript(id, name) {
              return await sessions.get(id).activateScript(name);
            },

            async checkScript(id, body) {
              // TODO move the try catch into checkscript...
              try {
                await sessions.get(id).checkScript(body);
              } catch (ex) {
                // FIXME We need to rethrow incase checkscript returns a SieveServerException.
                return ex.getResponse().getMessage();
              }

              return "";
            },

            async probe(host, port) {

              const { Sieve } = modules.require("./SieveSession.js");
              const { SieveLogger } = modules.require("./SieveLogger.js");
              const { SieveInitRequest } = modules.require("./SieveRequest.js");

              const sieve = new Sieve(new SieveLogger());

              return await new Promise((resolve) => {

                const listener = {

                  onInitResponse: function () {
                    resolve(true);
                    sieve.disconnect();
                  },

                  onError: function () {
                    resolve(false);
                    sieve.disconnect();
                  },

                  onTimeout: function () {
                    resolve(false);
                    sieve.disconnect();
                  },

                  onDisconnect: function () {
                    // we are already disconnected....
                    resolve(false);
                  }
                };

                const request = new SieveInitRequest();
                request.addErrorListener(listener.onError);
                request.addResponseListener(listener.onInitResponse);
                sieve.addRequest(request);

                sieve.addListener(listener);

                sieve.connect(host, port, false);
              });
            }
          }
        }
      };
    }
  }

  exports.SieveSessionApi = SieveSessionApi;

})(this);
