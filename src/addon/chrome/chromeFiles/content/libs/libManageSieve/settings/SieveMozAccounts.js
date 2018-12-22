/*
 * The contents of this file are licensed. You may obtain a copy of
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

  /* global Components */
  /* global Services */

  const Cc = Components.classes;
  const Ci = Components.interfaces;
  const Cu = Components.utils;

  Cu.import("resource://gre/modules/Services.jsm");

  const HALF_A_MINUTE = 500;
  const ONE_MINUTE = 60 * 1000;
  const FIVE_MINUTES = 5 * ONE_MINUTE;

  const DEFAULT_TAB_WIDTH = 2;
  const DEFAULT_INDENTION_WIDTH = 2;


  let { SieveAuthorization } = require("./settings/SieveAuthorizationSettings.js");
  let { SieveAuthentication } = require("./settings/SieveAuthenticationSettings.js");
  let { SieveHost } = require("./settings/SieveHostSettings.js");
  let { SieveSecurity } = require("./settings/SieveSecuritySettings.js");
  let { SieveProxy } = require("./settings/SieveProxySettings.js");

  let { SievePrefManager } = require("./settings/SievePrefManager.js");



  // == SieveAccountSettings ====================================================//
  /**
   * This class manages general settings for the given sieve account.
   *
   * @param {string} sieveKey
   *   The unique internal pref key of the sieve account.
   * @constructor
   */
  function SieveAccountSettings(sieveKey) {
    if (!sieveKey)
      throw new Error("SieveAccountSettings: Sieve Key can't be null");

    this.sieveKey = sieveKey;
  }

  SieveAccountSettings.prototype.isKeepAlive
    = function () {
      if (Services.prefs.prefHasUserValue(this.sieveKey + ".keepalive"))
        return Services.prefs.getBoolPref(this.sieveKey + ".keepalive");

      return true;
    };

  SieveAccountSettings.prototype.enableKeepAlive
    = function (enabled) {
      Services.prefs.setBoolPref(this.sieveKey + ".keepalive", enabled);
    };


  SieveAccountSettings.prototype.getKeepAliveInterval
    = function () {
      if (Services.prefs.prefHasUserValue(this.sieveKey + ".keepalive.interval"))
        return Services.prefs.getCharPref(this.sieveKey + ".keepalive.interval");

      return "" + FIVE_MINUTES;
    };

  SieveAccountSettings.prototype.setKeepAliveInterval
    = function (ms) {
      ms = parseInt(ms, 10);

      if (isNaN(ms))
        ms = FIVE_MINUTES;

      // We limit the keep alive packet to 1 Minute.
      if (ms < ONE_MINUTE)
        ms = ONE_MINUTE;

      Services.prefs.setCharPref(this.sieveKey + ".keepalive.interval", ms);
    };

  SieveAccountSettings.prototype.hasCompileDelay
    = function () {
      if (Services.prefs.prefHasUserValue(this.sieveKey + ".compile"))
        return Services.prefs.getBoolPref(this.sieveKey + ".compile");

      return true;
    };

  SieveAccountSettings.prototype.enableCompileDelay
    = function (enabled) {
      Services.prefs.setBoolPref(this.sieveKey + ".compile", enabled);
    };

  /**
   * Returns the minimal delay between a keypress and a automatic syntax check.
   * This is used while editing a sieve script, it basically prevents useless
   * systax checks while the User is typing.
   *
   * @returns {Number}
   *  The delay in mili seconds
   */
  SieveAccountSettings.prototype.getCompileDelay
    = function () {
      if (Services.prefs.prefHasUserValue(this.sieveKey + ".compile.delay"))
        return Services.prefs.getIntPref(this.sieveKey + ".compile.delay");

      return HALF_A_MINUTE;
    };

  SieveAccountSettings.prototype.setCompileDelay
    = function (ms) {
      ms = parseInt(ms, 10);

      if (isNaN(ms))
        ms = HALF_A_MINUTE;

      Services.prefs.setIntPref(this.sieveKey + ".compile.delay", ms);
    };

  SieveAccountSettings.prototype.getDebugFlags
    = function () {
      if (Services.prefs.prefHasUserValue(this.sieveKey + ".debug.flags"))
        return Services.prefs.getIntPref(this.sieveKey + ".debug.flags");

      return 0;
    };

  SieveAccountSettings.prototype.hasDebugFlag
    = function (flag) {
      if (this.getDebugFlags() & (1 << flag))
        return true;

      return false;
    };

  SieveAccountSettings.prototype.setDebugFlag
    = function (flag, value) {
      if (value)
        Services.prefs.setIntPref(this.sieveKey + ".debug.flags", this.getDebugFlags() | (1 << flag));
      else
        Services.prefs.setIntPref(this.sieveKey + ".debug.flags", this.getDebugFlags() & ~(1 << flag));
    };


  /**
   * Currently the UI supports two very different sieve editors. The plain text editor and the graphical editor.
   *
   * @param {int} editor
   *   pass a 0 for the default editor or a 1 for the graphical editor.
   *
   */
  SieveAccountSettings.prototype.setDefaultEditor
    = function (editor) {
      Services.prefs.setIntPref(this.sieveKey + ".editor.default", editor);
    };

  SieveAccountSettings.prototype.getDefaultEditor
    = function () {
      if (Services.prefs.prefHasUserValue(this.sieveKey + ".editor.default"))
        return Services.prefs.getIntPref(this.sieveKey + ".editor.default");

      return 0;
    };

  /**
   * The plain text editor supports automatic indention.
   * The indention width can be configured and adopted to the needs.
   * It it totally independent from the tab width parameter
   *
   * @param {int} width
   *   the indention width, default to two.
   *
   */
  SieveAccountSettings.prototype.setIndentionWidth
    = function (width) {
      Services.prefs.setIntPref(this.sieveKey + ".editor.indention.width", width);
    };

  SieveAccountSettings.prototype.getIndentionWidth
    = function () {
      if (Services.prefs.prefHasUserValue(this.sieveKey + ".editor.indention.width"))
        return Services.prefs.getIntPref(this.sieveKey + ".editor.indention.width");

      return DEFAULT_INDENTION_WIDTH;
    };

  /**
   * Concerning automatic indention there are two strategies. One is to use tabs
   * the other one is using spaces.
   *
   * By default spaces are used for indention.
   *
   * @param {int} policy
   *   the indention policy. A zero means spaces, a one tabs
   *
   */
  SieveAccountSettings.prototype.setIndentionPolicy
    = function (policy) {
      Services.prefs.setIntPref(this.sieveKey + ".editor.indention.policy", policy);
    };

  SieveAccountSettings.prototype.getIndentionPolicy
    = function () {
      if (Services.prefs.prefHasUserValue(this.sieveKey + ".editor.indention.policy"))
        return Services.prefs.getIntPref(this.sieveKey + ".editor.indention.policy");

      return 0;
    };


  /**
   * The tab width specifies over how many spaces the tap will span.
   *
   * The default value is 2
   *
   * @param {int} width
   *   the tab width as integer.
   *
   */
  SieveAccountSettings.prototype.setTabWidth
    = function (width) {
      Services.prefs.setIntPref(this.sieveKey + ".editor.tab.width", width);
    };

  SieveAccountSettings.prototype.getTabWidth
    = function () {
      if (Services.prefs.prefHasUserValue(this.sieveKey + ".editor.tab.width"))
        return Services.prefs.getIntPref(this.sieveKey + ".editor.tab.width");

      return DEFAULT_TAB_WIDTH;
    };

  /**
   * Sieve depends on IMAP, so every Sieve Accounts is directly bound to an IMAP
   * accounts. IMAP accounts are idenfified by the "internal pref key", which is
   * guaranteed to be unique across all servers in a Thunderbird profile.
   *
   * The account object is only used in the constructor. It is not cached, this
   * ensures, that we use always the most recent settings!
   *
   * @param {nsIMsgIncomingServer} account
   *   The account settings of the associated IMAP account.
   * @constructor
   */
  function SieveAccount(account) {
    // Check parameters...
    if (!account)
      throw new Error("SieveAccount: Parameter missing...");

    this.Uri = account.rootMsgFolder.baseMessageURI.slice(15);

    this.sieveKey = "extensions.sieve.account." + this.Uri;
    this.imapKey = account.key;

    this.description = account.prettyName;

    this.authorization = new SieveAuthorization(this);
    this.authentication = new SieveAuthentication(this);
    this.security = new SieveSecurity(this);
    this.host = new SieveHost(this);
    this.proxy = new SieveProxy(this);

    this.prefs = new SievePrefManager(this.sieveKey);
  }

  /**
   * Every SIEVE Account needs to be bound to an IMAP Account. IMAP Accounts
   * are usually accessed via the so called IMAP Key. It is garanteed to uniquely
   * Identify the IMAP Account. Therefore it is used for binding SIEVE and IMAP
   * Account together.
   *
   * @returns {string}
   *   Returns the unique IMAP Key of the IMAP Account bound to this SIEVE Account.
   */
  SieveAccount.prototype.getKey
    = function () { return this.imapKey; };

  SieveAccount.prototype.getUri
    = function () { return this.Uri; };

  /**
   * As URIs are not very user friendly, Thunderbird uses for every IMAP account
   * a "PrettyName". It is either an userdefined string or the hostname of the
   * IMAP account.
   *
   * @returns {string}
   *   The description for this account.
   */
  SieveAccount.prototype.getDescription
    = function () { return this.description; };

  SieveAccount.prototype.getSecurity
    = function () { return this.security; };

  /**
   * Retrieves the Authentication Settings for this SieveAccount.
   *
   * @param {Int} type
   *   defines which Authentication Settings ({@link SieveNoAuth},
   *   {@link SieveCustomAuth}, {@link SieveImapAuth}) should be loaded. If this
   *   parameter is skipped the default Authentication settings will be returned.
   * @returns {SieveImapAuth|SieveNoAuth|SieveCustomAuth}
   *   Returns the Authentication Settings for this SieveAccount
   */
  SieveAccount.prototype.getAuthentication
    = function (type) {
      return this.authentication.get(type);
    };

  SieveAccount.prototype.setActiveLogin
    = function (type) {
      this.authentication.setMechanism(type);
    };

  SieveAccount.prototype.getHost
    = function (type) {
      return this.host.get(type);
    };

  SieveAccount.prototype.setActiveHost
    = function (type) {
      this.host.setMechanism(type);
    };

  SieveAccount.prototype.getAuthorization
    = function (type) {
      return this.authorization.get(type);
    };

  SieveAccount.prototype.setActiveAuthorization
    = function (type) {
      this.authorization.setMechanism(type);
    };

  SieveAccount.prototype.getProxy
    = function (type) {
      return this.proxy.get(type);
    };

  SieveAccount.prototype.setProxy
    = function (type) {
      this.proxy.setMechanism(type);
    };


  SieveAccount.prototype.isEnabled
    = function () {
      if (Services.prefs.prefHasUserValue(this.sieveKey + ".enabled"))
        return Services.prefs.getBoolPref(this.sieveKey + ".enabled");

      return false;
    };

  SieveAccount.prototype.setEnabled
    = function (enabled) {
      Services.prefs.setBoolPref(this.sieveKey + ".enabled", enabled);
    };

  SieveAccount.prototype.isFirstRun
    = function () {

      // if the host settings are set manually, we obiously don't need
      // to show the first run dialog
      if (this.getHost().getType() === 1) {
        this.setFirstRun();
        return false;
      }

      if (Services.prefs.prefHasUserValue(this.sieveKey + ".firstRunDone"))
        return !(Services.prefs.getBoolPref(this.sieveKey + ".firstRunDone"));

      return true;
    };

  SieveAccount.prototype.setFirstRun
    = function () {
      Services.prefs.setBoolPref(this.sieveKey + ".firstRunDone", true);
    };

  /**
   * XXX ...
   * @returns {SieveAccountSettings} returns the account settings.
   */
  SieveAccount.prototype.getSettings
    = function () {
      return new SieveAccountSettings(this.sieveKey);
    };


  // ****************************************************************************//

  function SieveAccounts() {
    this.accounts = null;
  }

  /**
   * Returns a list containing a SieveAccounts configured for every compatible
   * nsIMsgIncomingServer in Thunderbird's AccountManager. Compatible accounts
   * are POP3 and IMAP.
   *
   * @returns {SieveAccount[]}
   *   Array containing SieveAccounts
   */
  SieveAccounts.prototype.getAccounts
    = function () {
      // as cache the array containting the account information...
      // ... we check if we already enumerated the accounts.
      if (this.accounts)
        return this.accounts;

      let servers = Cc['@mozilla.org/messenger/account-manager;1']
        .getService(Ci.nsIMsgAccountManager)
        .allServers;

      this.accounts = [];

      // The new account manager's interface introduced in TB 20.0a1 uses nsIArray...
      if (servers instanceof Ci.nsIArray) {
        let enumerator = servers.enumerate();

        while (enumerator.hasMoreElements()) {
          let account = enumerator.getNext().QueryInterface(Ci.nsIMsgIncomingServer);

          if ((account.type !== "imap") && (account.type !== "pop3"))
            continue;

          this.accounts.push(new SieveAccount(account));
        }
      }

      return this.accounts;
    };

  /**
   * Loads and returns a SieveAccount for the specified nsIMsgIncomingServer.
   *
   * @param {nsIMsgIncomingServer} server
   *   the incoming server for which the sieve account should be returend
   *
   * @returns {SieveAccount}
   *   a SieveAccount for the incoming server
   */
  SieveAccounts.prototype.getAccountByServer
    = function (server) {
      return new SieveAccount(server);
    };

  /**
   * Loads and returns a Sieve Account by a nsIMsgIncomingServer's unique id
   *
   * @param {string} key
   *   The unique identifier of the associated nsIMsgIncomingServer account
   * @returns {SieveAccount}
   *   a SieveAccount for the unique id
   */
  SieveAccounts.prototype.getAccountByName
    = function (key) {
      let accountManager = Cc['@mozilla.org/messenger/account-manager;1']
        .getService(Ci.nsIMsgAccountManager);

      return new SieveAccount(accountManager.getIncomingServer(key));
    };

  exports.SieveAccountManager = new SieveAccounts();

})(module.exports);
