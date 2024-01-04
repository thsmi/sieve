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

/* global net */
const suite = net.tschmid.yautt.test;

if (!suite)
  throw new Error("Could not initialize test suite");

import {
  SieveThunderbirdProfiles,
  SieveThunderbirdProfile,
  SieveThunderbirdAccounts,
  SieveThunderbirdServer
} from "../logic/SieveThunderbirdProfile.mjs";

import path from 'path';
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ONE_ITEM = 1;
const TWO_ITEMS = 2;

const FIRST_ITEM = 0;
const SECOND_ITEM = 1;

suite.add("Get server, has real username and real hostname", function () {

  const prefs = "\r\n"
    + 'user_pref("mail.server.server1.realhostname", "realhostname1.example.net");\r\n'
    + 'user_pref("mail.server.server1.hostname", "hostname1.example.net");\r\n'
    + 'user_pref("mail.server.server1.realuserName", "Real username for server 1");\r\n'
    + 'user_pref("mail.server.server1.userName", "username for server 1");\r\n'
    + '\r\n'
    + 'user_pref("mail.server.server3.realhostname", "realhostname3.example.net");\r\n'
    + 'user_pref("mail.server.server3.hostname", "hostname3.example.net");\r\n'
    + 'user_pref("mail.server.server3.realuserName", "Real username for server 3");\r\n'
    + 'user_pref("mail.server.server3.userName", "Name for server 3");\r\n';

  const server1 = (new SieveThunderbirdServer(prefs, "server1"));
  suite.assertEquals("Real username for server 1", server1.getUserName());
  suite.assertEquals("realhostname1.example.net", server1.getHostName());

  const server3 = (new SieveThunderbirdServer(prefs, "server3"));
  suite.assertEquals("Real username for server 3", server3.getUserName());
  suite.assertEquals("realhostname3.example.net", server3.getHostName());
});

suite.add("Get server, has hostname and username but no real username and real hostname", function () {

  const prefs = "\r\n"
    + 'user_pref("mail.server.server1.hostname", "hostname1.example.net");\r\n'
    + 'user_pref("mail.server.server1.userName", "username for server 1");\r\n'
    + '\r\n'
    + 'user_pref("mail.server.server3.hostname", "hostname3.example.net");\r\n'
    + 'user_pref("mail.server.server3.userName", "username for server 3");\r\n';

  const server1 = (new SieveThunderbirdServer(prefs, "server1"));
  suite.assertEquals("username for server 1", server1.getUserName());
  suite.assertEquals("hostname1.example.net", server1.getHostName());

  const server3 = (new SieveThunderbirdServer(prefs, "server3"));
  suite.assertEquals("username for server 3", server3.getUserName());
  suite.assertEquals("hostname3.example.net", server3.getHostName());
});

suite.add("Get server, no username and hostname, no real username and real hostname", function () {

  const prefs = "\r\n"
    + 'user_pref("mail.server.server1.name", "Account name for server 1");\r\n'
    + 'user_pref("mail.server.server1.type", "imap");\r\n'
    + '\r\n'
    + 'user_pref("mail.server.server3.name", "Account name for server3");\r\n'
    + 'user_pref("mail.server.server3.type", "imap");\r\n';

  const server1 = new SieveThunderbirdServer(prefs, "server1");
  suite.assertThrows(
    () => { server1.getUserName(); },
    "Could not find a username for server server1");
  suite.assertThrows(
    () => { server1.getHostName(); },
    "Could not find a hostname for server server1");

  const server3 = new SieveThunderbirdServer(prefs, "server3");
  suite.assertThrows(
    () => { server3.getUserName(); },
    "Could not find a username for server server3");
  suite.assertThrows(
    () => { server3.getHostName(); },
    "Could not find a hostname for server server3");
});

suite.add("Get server, has name and type", function () {

  const prefs = "\r\n"
    + 'user_pref("mail.server.server1.name", "Account name for server 1");\r\n'
    + 'user_pref("mail.server.server1.type", "imap1");\r\n'
    + '\r\n'
    + 'user_pref("mail.server.server3.name", "Account name for server 3");\r\n'
    + 'user_pref("mail.server.server3.type", "imap2");\r\n';

  const server1 = new SieveThunderbirdServer(prefs, "server1");
  suite.assertEquals("Account name for server 1", server1.getName());
  suite.assertEquals("imap1", server1.getType());

  const server3 = new SieveThunderbirdServer(prefs, "server3");
  suite.assertEquals("Account name for server 3", server3.getName());
  suite.assertEquals("imap2", server3.getType());
});

suite.add("Get server, no name and type", function () {

  const prefs = "\r\n"
    + 'user_pref("mail.server.server1.realuserName", "Real username for server 1");\r\n'
    + 'user_pref("mail.server.server1.userName", "username for server 1");\r\n'
    + '\r\n'
    + 'user_pref("mail.server.server3.realuserName", "Real username for server 3");\r\n'
    + 'user_pref("mail.server.server3.userName", "Name for server 3");\r\n';

  const server1 = (new SieveThunderbirdServer(prefs, "server1"));
  suite.assertThrows(
    () => { server1.getName(); },
    "Could not find a name for the server server1");
  suite.assertNull(server1.getType());

  const server3 = (new SieveThunderbirdServer(prefs, "server3"));
  suite.assertThrows(
    () => { server3.getName(); },
    "Could not find a name for the server server3");
  suite.assertNull(server3.getType());
});

suite.add("Get server by account id", function () {
  const prefs = "\r\n"
    + 'user_pref("mail.account.account1.identities", "id1");\r\n'
    + 'user_pref("mail.account.account1.server", "server1");\r\n'
    + 'user_pref("mail.account.account3.identities", "id2");\r\n'
    + 'user_pref("mail.account.account3.server", "server3");\r\n'
    + '\r\n'
    + 'user_pref("mail.server.server1.realuserName", "Real username for server 1");\r\n'
    + 'user_pref("mail.server.server1.userName", "username for server 1");\r\n'
    + 'user_pref("mail.server.server1.name", "Account name for server 1");\r\n'
    + '\r\n'
    + 'user_pref("mail.server.server3.realuserName", "Real username for server 3");\r\n'
    + 'user_pref("mail.server.server3.userName", "Name for server 3");\r\n'
    + 'user_pref("mail.server.server3.name", "Account name for server 3");\r\n';

  const accounts = new SieveThunderbirdAccounts(prefs);

  const server1 = accounts.getServer("account1");
  suite.assertEquals("Account name for server 1", server1.getName());

  suite.assertThrows(
    () => { suite.assertEquals(accounts.getServer("account2"), "No server configured for account >>account2<<"); },
    "No server configured for account >>account2<<");

  const server3 = accounts.getServer("account3");
  suite.assertEquals("Account name for server 3", server3.getName());
});


suite.add("Get account ids", function () {
  const prefs = "\r\n"
    + 'user_pref("mail.accountmanager.accounts", "account1,account3");\r\n'
    + 'user_pref("mail.account.account1.identities", "id1");\r\n'
    + 'user_pref("mail.account.account1.server", "server1");\r\n'
    + 'user_pref("mail.account.account3.identities", "id2");\r\n'
    + 'user_pref("mail.account.account3.server", "server3");\r\n';

  const accounts = new SieveThunderbirdAccounts(prefs);

  const ids = accounts.getAccountIds();

  suite.assertEquals(TWO_ITEMS, ids.length);
  suite.assertEquals("account1", ids[FIRST_ITEM]);
  suite.assertEquals("account3", ids[SECOND_ITEM]);
});

suite.add("Get account ids, not existing", function () {
  const prefs = "\r\n"
    + 'user_pref("mail.account.account1.identities", "id1");\r\n'
    + 'user_pref("mail.account.account1.server", "server1");\r\n'
    + 'user_pref("mail.account.account3.identities", "id2");\r\n'
    + 'user_pref("mail.account.account3.server", "server3");\r\n';

  const accounts = new SieveThunderbirdAccounts(prefs);

  const ids = accounts.getAccountIds();
  suite.assertEmptyArray(ids);
});

suite.add("Get accounts", function () {
  const prefs = "\r\n"
    + 'user_pref("mail.accountmanager.accounts", "account1,account3");\r\n'
    + 'user_pref("mail.account.account1.identities", "id1");\r\n'
    + 'user_pref("mail.account.account1.server", "server1");\r\n'
    + 'user_pref("mail.account.account3.identities", "id2");\r\n'
    + 'user_pref("mail.account.account3.server", "server3");\r\n'
    + '\r\n'
    + 'user_pref("mail.server.server1.realuserName", "Real username for server 1");\r\n'
    + 'user_pref("mail.server.server1.userName", "username for server 1");\r\n'
    + 'user_pref("mail.server.server1.name", "Account name for server 1");\r\n'
    + 'user_pref("mail.server.server1.type", "imap");\r\n'
    + 'user_pref("mail.server.server1.realhostname", "realhostname1.example.net");\r\n'
    + 'user_pref("mail.server.server1.hostname", "hostname1.example.net");\r\n'
    + '\r\n'
    + 'user_pref("mail.server.server3.realuserName", "Real username for server 3");\r\n'
    + 'user_pref("mail.server.server3.userName", "Name for server 3");\r\n'
    + 'user_pref("mail.server.server3.name", "Account name for server 3");\r\n'
    + 'user_pref("mail.server.server3.type", "imap");\r\n'
    + 'user_pref("mail.server.server3.realhostname", "realhostname3.example.net");\r\n'
    + 'user_pref("mail.server.server3.hostname", "hostname3.example.net");\r\n';

  const accounts = new SieveThunderbirdAccounts(prefs);
  const items = accounts.getAccounts();

  suite.assertEquals(items.length, TWO_ITEMS);
  suite.assertEquals("Account name for server 1", items[FIRST_ITEM].name);
  suite.assertEquals("Account name for server 3", items[SECOND_ITEM].name);

  suite.assertEquals("Real username for server 1", items[FIRST_ITEM].username);
  suite.assertEquals("Real username for server 3", items[SECOND_ITEM].username);

  suite.assertEquals("realhostname1.example.net", items[FIRST_ITEM].hostname);
  suite.assertEquals("realhostname3.example.net", items[SECOND_ITEM].hostname);
});

suite.add("Get accounts, no accounts", function () {
  const prefs = "\r\n"
    + 'user_pref("mail.account.account1.identities", "id1");\r\n'
    + 'user_pref("mail.account.account1.server", "server1");\r\n'
    + 'user_pref("mail.account.account3.identities", "id2");\r\n'
    + 'user_pref("mail.account.account3.server", "server3");\r\n'
    + '\r\n'
    + 'user_pref("mail.server.server1.realuserName", "Real username for server 1");\r\n'
    + 'user_pref("mail.server.server1.userName", "username for server 1");\r\n'
    + 'user_pref("mail.server.server1.name", "Account name for server 1");\r\n'
    + 'user_pref("mail.server.server1.type", "imap");\r\n'
    + 'user_pref("mail.server.server1.realhostname", "realhostname1.example.net");\r\n'
    + 'user_pref("mail.server.server1.hostname", "hostname1.example.net");\r\n'
    + '\r\n'
    + 'user_pref("mail.server.server3.realuserName", "Real username for server 3");\r\n'
    + 'user_pref("mail.server.server3.userName", "Name for server 3");\r\n'
    + 'user_pref("mail.server.server3.name", "Account name for server 3");\r\n'
    + 'user_pref("mail.server.server3.type", "imap");\r\n'
    + 'user_pref("mail.server.server3.realhostname", "realhostname3.example.net");\r\n'
    + 'user_pref("mail.server.server3.hostname", "hostname3.example.net");\r\n';

  const accounts = new SieveThunderbirdAccounts(prefs);
  const items = accounts.getAccounts();

  suite.assertEmptyArray(items);
});

suite.add("Get accounts, no server", function () {
  const prefs = "\r\n"
    + 'user_pref("mail.accountmanager.accounts", "account1,account3");\r\n'
    + 'user_pref("mail.account.account1.identities", "id1");\r\n'
    + 'user_pref("mail.account.account3.identities", "id2");\r\n'
    + 'user_pref("mail.account.account3.server", "server3");\r\n'
    + '\r\n'
    + 'user_pref("mail.server.server1.realuserName", "Real username for server 1");\r\n'
    + 'user_pref("mail.server.server1.userName", "username for server 1");\r\n'
    + 'user_pref("mail.server.server1.name", "Account name for server 1");\r\n'
    + 'user_pref("mail.server.server1.type", "imap");\r\n'
    + 'user_pref("mail.server.server1.realhostname", "realhostname1.example.net");\r\n'
    + 'user_pref("mail.server.server1.hostname", "hostname1.example.net");\r\n'
    + '\r\n'
    + 'user_pref("mail.server.server3.realuserName", "Real username for server 3");\r\n'
    + 'user_pref("mail.server.server3.userName", "Name for server 3");\r\n'
    + 'user_pref("mail.server.server3.name", "Account name for server 3");\r\n'
    + 'user_pref("mail.server.server3.type", "imap");\r\n'
    + 'user_pref("mail.server.server3.realhostname", "realhostname3.example.net");\r\n'
    + 'user_pref("mail.server.server3.hostname", "hostname3.example.net");\r\n';

  const accounts = new SieveThunderbirdAccounts(prefs);
  const items = accounts.getAccounts();

  suite.assertEquals(ONE_ITEM, items.length);
  suite.assertEquals("Account name for server 3", items[FIRST_ITEM].name);
  suite.assertEquals("Real username for server 3", items[FIRST_ITEM].username);
  suite.assertEquals("realhostname3.example.net", items[FIRST_ITEM].hostname);
});

suite.add("Get accounts, unknown type", function () {
  const prefs = "\r\n"
    + 'user_pref("mail.accountmanager.accounts", "account1,account3");\r\n'
    + 'user_pref("mail.account.account1.identities", "id1");\r\n'
    + 'user_pref("mail.account.account1.server", "server1");\r\n'
    + 'user_pref("mail.account.account3.identities", "id2");\r\n'
    + 'user_pref("mail.account.account3.server", "server3");\r\n'
    + '\r\n'
    + 'user_pref("mail.server.server1.realuserName", "Real username for server 1");\r\n'
    + 'user_pref("mail.server.server1.userName", "username for server 1");\r\n'
    + 'user_pref("mail.server.server1.name", "Account name for server 1");\r\n'
    + 'user_pref("mail.server.server1.type", "pop3");\r\n'
    + 'user_pref("mail.server.server1.realhostname", "realhostname1.example.net");\r\n'
    + 'user_pref("mail.server.server1.hostname", "hostname1.example.net");\r\n'
    + '\r\n'
    + 'user_pref("mail.server.server3.realuserName", "Real username for server 3");\r\n'
    + 'user_pref("mail.server.server3.userName", "Name for server 3");\r\n'
    + 'user_pref("mail.server.server3.name", "Account name for server 3");\r\n'
    + 'user_pref("mail.server.server3.type", "imap");\r\n'
    + 'user_pref("mail.server.server3.realhostname", "realhostname3.example.net");\r\n'
    + 'user_pref("mail.server.server3.hostname", "hostname3.example.net");\r\n';

  const accounts = new SieveThunderbirdAccounts(prefs);
  const items = accounts.getAccounts();

  suite.assertEquals(ONE_ITEM, items.length);
  suite.assertEquals("Account name for server 3", items[FIRST_ITEM].name);
  suite.assertEquals("Real username for server 3", items[FIRST_ITEM].username);
  suite.assertEquals("realhostname3.example.net", items[FIRST_ITEM].hostname);
});

suite.add("Get accounts, no username", function () {
  const prefs = "\r\n"
    + 'user_pref("mail.accountmanager.accounts", "account1,account3");\r\n'
    + 'user_pref("mail.account.account1.identities", "id1");\r\n'
    + 'user_pref("mail.account.account1.server", "server1");\r\n'
    + 'user_pref("mail.account.account3.identities", "id2");\r\n'
    + 'user_pref("mail.account.account3.server", "server3");\r\n'
    + '\r\n'
    + 'user_pref("mail.server.server1.name", "Account name for server 1");\r\n'
    + 'user_pref("mail.server.server1.type", "imap");\r\n'
    + 'user_pref("mail.server.server1.realhostname", "realhostname1.example.net");\r\n'
    + 'user_pref("mail.server.server1.hostname", "hostname1.example.net");\r\n'
    + '\r\n'
    + 'user_pref("mail.server.server3.realuserName", "Real username for server 3");\r\n'
    + 'user_pref("mail.server.server3.userName", "Name for server 3");\r\n'
    + 'user_pref("mail.server.server3.name", "Account name for server 3");\r\n'
    + 'user_pref("mail.server.server3.type", "imap");\r\n'
    + 'user_pref("mail.server.server3.realhostname", "realhostname3.example.net");\r\n'
    + 'user_pref("mail.server.server3.hostname", "hostname3.example.net");\r\n';

  const accounts = new SieveThunderbirdAccounts(prefs);
  const items = accounts.getAccounts();

  suite.assertEquals(ONE_ITEM, items.length);
  suite.assertEquals("Account name for server 3", items[FIRST_ITEM].name);
  suite.assertEquals("Real username for server 3", items[FIRST_ITEM].username);
  suite.assertEquals("realhostname3.example.net", items[FIRST_ITEM].hostname);
});


suite.add("Get accounts, no hostname", function () {
  const prefs = "\r\n"
    + 'user_pref("mail.accountmanager.accounts", "account1,account3");\r\n'
    + 'user_pref("mail.account.account1.identities", "id1");\r\n'
    + 'user_pref("mail.account.account1.server", "server1");\r\n'
    + 'user_pref("mail.account.account3.identities", "id2");\r\n'
    + 'user_pref("mail.account.account3.server", "server3");\r\n'
    + '\r\n'
    + 'user_pref("mail.server.server1.realuserName", "Real username for server 1");\r\n'
    + 'user_pref("mail.server.server1.userName", "username for server 1");\r\n'
    + 'user_pref("mail.server.server1.name", "Account name for server 1");\r\n'
    + 'user_pref("mail.server.server1.type", "imap");\r\n'
    + '\r\n'
    + 'user_pref("mail.server.server3.realuserName", "Real username for server 3");\r\n'
    + 'user_pref("mail.server.server3.userName", "Name for server 3");\r\n'
    + 'user_pref("mail.server.server3.name", "Account name for server 3");\r\n'
    + 'user_pref("mail.server.server3.type", "imap");\r\n'
    + 'user_pref("mail.server.server3.realhostname", "realhostname3.example.net");\r\n'
    + 'user_pref("mail.server.server3.hostname", "hostname3.example.net");\r\n';

  const accounts = new SieveThunderbirdAccounts(prefs);
  const items = accounts.getAccounts();

  suite.assertEquals(ONE_ITEM, items.length);
  suite.assertEquals("Account name for server 3", items[FIRST_ITEM].name);
  suite.assertEquals("Real username for server 3", items[FIRST_ITEM].username);
  suite.assertEquals("realhostname3.example.net", items[FIRST_ITEM].hostname);
});

suite.add("Get accounts, no name", function () {
  const prefs = "\r\n"
    + 'user_pref("mail.accountmanager.accounts", "account1,account3");\r\n'
    + 'user_pref("mail.account.account1.identities", "id1");\r\n'
    + 'user_pref("mail.account.account1.server", "server1");\r\n'
    + 'user_pref("mail.account.account3.identities", "id2");\r\n'
    + 'user_pref("mail.account.account3.server", "server3");\r\n'
    + '\r\n'
    + 'user_pref("mail.server.server1.realuserName", "Real username for server 1");\r\n'
    + 'user_pref("mail.server.server1.userName", "username for server 1");\r\n'
    + 'user_pref("mail.server.server1.type", "imap");\r\n'
    + 'user_pref("mail.server.server1.realhostname", "realhostname1.example.net");\r\n'
    + 'user_pref("mail.server.server1.hostname", "hostname1.example.net");\r\n'
    + '\r\n'
    + 'user_pref("mail.server.server3.realuserName", "Real username for server 3");\r\n'
    + 'user_pref("mail.server.server3.userName", "Name for server 3");\r\n'
    + 'user_pref("mail.server.server3.name", "Account name for server 3");\r\n'
    + 'user_pref("mail.server.server3.type", "imap");\r\n'
    + 'user_pref("mail.server.server3.realhostname", "realhostname3.example.net");\r\n'
    + 'user_pref("mail.server.server3.hostname", "hostname3.example.net");\r\n';

  const accounts = new SieveThunderbirdAccounts(prefs);
  const items = accounts.getAccounts();

  suite.assertEquals(ONE_ITEM, items.length);
  suite.assertEquals("Account name for server 3", items[FIRST_ITEM].name);
  suite.assertEquals("Real username for server 3", items[FIRST_ITEM].username);
  suite.assertEquals("realhostname3.example.net", items[FIRST_ITEM].hostname);
});

suite.add("Get profile, parse empty profile", function () {
  const profile = new SieveThunderbirdProfile(__dirname);
  profile.init("");

  profile.createAccount = (prefs) => {
    suite.assertEquals("", prefs);
    return { getAccounts: () => { return []; } };
  };

  suite.assertEquals(false, profile.isRelative());
  suite.assertEquals(false, profile.isDefault());
  suite.assertEquals("Unnamed", profile.getName());
  suite.assertEquals("", profile.getProfileDirectory());
  suite.assertEquals("", profile.getPreferences());
  suite.assertEmptyArray(profile.getAccounts());

  const json = profile.toJson();
  suite.assertEquals("Unnamed", json.name);
  suite.assertEquals("", json.path);
  suite.assertEquals(false, json.isDefault);
  suite.assertEmptyArray(json.accounts);
});

suite.add("Get profile, parse relative default", function () {

  const section = "\r\n"
    + "default=1\r\n"
    + "path=Thunderbird\r\n"
    + "isRelative=1\r\n"
    + "name=Blubb\r\n";

  const profile = new SieveThunderbirdProfile(__dirname);
  profile.init(section);
  profile.createAccount = (prefs) => {
    suite.assertEquals("// Here would be preferences\n", prefs);
    return { getAccounts: () => { return ["AAA", "BBB"]; } };
  };

  suite.assertEquals(true, profile.isRelative());
  suite.assertEquals(true, profile.isDefault());
  suite.assertEquals("Blubb", profile.getName());
  suite.assertEquals(path.join(__dirname, "Thunderbird"), profile.getProfileDirectory());
  suite.assertEquals("// Here would be preferences\n", profile.getPreferences());

  const accounts = profile.getAccounts();
  suite.assertEquals(TWO_ITEMS, accounts.length);
  suite.assertEquals("AAA", accounts[FIRST_ITEM]);
  suite.assertEquals("BBB", accounts[SECOND_ITEM]);

  const json = profile.toJson();
  suite.assertEquals("Blubb", json.name);
  suite.assertEquals(path.join(__dirname, "Thunderbird"), json.path);
  suite.assertEquals(true, json.isDefault);
  suite.assertEquals(TWO_ITEMS, json.accounts.length);
  suite.assertEquals("AAA", json.accounts[FIRST_ITEM]);
  suite.assertEquals("BBB", json.accounts[SECOND_ITEM]);
});

suite.add("Get profile, parse absolute default", function () {
  const section = "\r\n"
    + "default=1\r\n"
    + `path=${path.join(__dirname, "Thunderbird")}\r\n`
    + "isRelative=0\r\n"
    + "name=Blubb\r\n";

  const profile = new SieveThunderbirdProfile("Somewhere");
  profile.init(section);
  profile.createAccount = (prefs) => {
    suite.assertEquals("// Here would be preferences\n", prefs);
    return { getAccounts: () => { return ["AAA", "BBB"]; } };
  };

  suite.assertEquals(false, profile.isRelative());
  suite.assertEquals(true, profile.isDefault());
  suite.assertEquals("Blubb", profile.getName());
  suite.assertEquals(path.join(__dirname, "Thunderbird"), profile.getProfileDirectory());
  suite.assertEquals("// Here would be preferences\n", profile.getPreferences());

  const accounts = profile.getAccounts();
  suite.assertEquals(TWO_ITEMS, accounts.length);
  suite.assertEquals("AAA", accounts[FIRST_ITEM]);
  suite.assertEquals("BBB", accounts[SECOND_ITEM]);

  const json = profile.toJson();
  suite.assertEquals("Blubb", json.name);
  suite.assertEquals(path.join(__dirname, "Thunderbird"), json.path);
  suite.assertEquals(true, json.isDefault);
  suite.assertEquals(TWO_ITEMS, json.accounts.length);
  suite.assertEquals("AAA", json.accounts[FIRST_ITEM]);
  suite.assertEquals("BBB", json.accounts[SECOND_ITEM]);
});


suite.add("Get profile directory on unsupported Platform", function () {

  const process = {};
  process.platform = "Something";

  const profile = new SieveThunderbirdProfiles();
  profile.getProcessInfo = () => { return process; };

  suite.assertThrows(
    () => { profile.getProfileDirectory(); },
    "Unsupported Platform");
});

suite.add("Get profile directory on Linux", function () {

  const process = {};
  process.platform = "linux";
  process.env = { HOME: __dirname };

  const profile = new SieveThunderbirdProfiles();
  profile.getProcessInfo = () => { return process; };

  suite.assertEquals(
    path.join(__dirname, ".thunderbird"),
    profile.getProfileDirectory());
});

suite.add("Get profile directory on Windows", function () {

  const process = {};
  process.platform = "win32";
  process.env = { APPDATA: __dirname };

  const profile = new SieveThunderbirdProfiles();
  profile.getProcessInfo = () => { return process; };

  suite.assertEquals(
    path.join(__dirname, "Thunderbird"),
    profile.getProfileDirectory());
});

suite.add("Get profiles, no profiles.ini in profile directory", function () {
  suite.assertThrows(() => {
    (new SieveThunderbirdProfiles()).getProfiles(
      path.join(__dirname, "Thunderbird", "nonexistent.ini"));
  }, `Could not find a profiles.ini at >>${__dirname}`);
});

suite.add("Get Profiles, empty profiles.ini in profile directory", function () {
  const profiles = (new SieveThunderbirdProfiles())
    .getProfiles(path.join(__dirname, "Thunderbird", "empty.ini"));

  suite.assertEmptyArray(profiles);
});

suite.add("Get Profiles, has accounts", function () {

  // Our expectations for our parametrized test.
  const sections = ["",
    "\nName=default\nIsRelative=1\nPath=Profiles/12345\nDefault=1\n\n",
    "\nName=default-nightly\nIsRelative=1\nPath=Profiles/7890\n\n",
    "\nStartWithLastProfile=1\nVersion=2\n"];
  const accounts = [[], ["AAA", "BBB"], ["CCC", "DDD"], []];

  const profiles = (new SieveThunderbirdProfiles());

  // We need to mock out object to be testable
  profiles.createProfile = (dirname, section) => {
    suite.assertEquals(path.join(__dirname, "Thunderbird"), dirname);
    suite.assertEquals(sections.shift(), section.replace("\r\n", "\n"));

    const account = accounts.shift();

    return {
      getAccounts: () => { return account; }
    };
  };

  const data = profiles
    .getProfiles(path.join(__dirname, "Thunderbird", "profiles.ini"));

  suite.assertEquals(TWO_ITEMS, data.length);

  suite.assertEquals(TWO_ITEMS, data[FIRST_ITEM].getAccounts().length);
  suite.assertEquals("AAA", data[FIRST_ITEM].getAccounts()[FIRST_ITEM]);
  suite.assertEquals("BBB", data[FIRST_ITEM].getAccounts()[SECOND_ITEM]);

  suite.assertEquals(TWO_ITEMS, data[SECOND_ITEM].getAccounts().length);
  suite.assertEquals("CCC", data[SECOND_ITEM].getAccounts()[FIRST_ITEM]);
  suite.assertEquals("DDD", data[SECOND_ITEM].getAccounts()[SECOND_ITEM]);
});

suite.add("Get Profiles, has no accounts", function () {

  // Our expectations for our parametrized test.
  const sections = ["",
    "\nName=default\nIsRelative=1\nPath=Profiles/12345\nDefault=1\n\n",
    "\nName=default-nightly\nIsRelative=1\nPath=Profiles/7890\n\n",
    "\nStartWithLastProfile=1\nVersion=2\n"];
  const accounts = [[], [], [], []];

  const profiles = (new SieveThunderbirdProfiles());

  // We need to mock out object to be testable
  profiles.createProfile = (dirname, section) => {
    suite.assertEquals(path.join(__dirname, "Thunderbird"), dirname);
    suite.assertEquals(sections.shift(), section.replace("\r\n", "\n"));

    const account = accounts.shift();

    return {
      getAccounts: () => { return account; }
    };
  };

  const data = profiles
    .getProfiles(path.join(__dirname, "Thunderbird", "profiles.ini"));

  suite.assertEmptyArray(data);
});

suite.add("Get Accounts by Profiles, has Accounts", function () {

  // Our expectations for our parametrized test.
  const sections = ["",
    "\nName=default\nIsRelative=1\nPath=Profiles/12345\nDefault=1\n\n",
    "\nName=default-nightly\nIsRelative=1\nPath=Profiles/7890\n\n",
    "\nStartWithLastProfile=1\nVersion=2\n"];
  const accounts = [[], ["AAA", "BBB"], ["CCC", "DDD"], []];
  const jsons = ["J1", "J2", "J3", "J4"];

  const profiles = (new SieveThunderbirdProfiles());

  // We need to mock out object to be testable
  profiles.getProfileDirectory = () => { return path.join(__dirname, "Thunderbird"); };
  profiles.createProfile = (dirname, section) => {
    suite.assertEquals(path.join(__dirname, "Thunderbird"), dirname);
    suite.assertEquals(sections.shift(), section.replace("\r\n", "\n"));

    const account = accounts.shift();
    const json = jsons.shift();

    return {
      getAccounts: () => { return account; },
      toJson: () => { return json; }
    };
  };

  const data = profiles.getAccounts();

  suite.assertEquals(TWO_ITEMS, data.length);
  suite.assertEquals("J2", data[FIRST_ITEM]);
  suite.assertEquals("J3", data[SECOND_ITEM]);
});

suite.add("Get Accounts by Profiles, has no accounts", function () {

  // Our expectations for our parametrized test.
  const sections = ["",
    "\nName=default\nIsRelative=1\nPath=Profiles/12345\nDefault=1\n\n",
    "\nName=default-nightly\nIsRelative=1\nPath=Profiles/7890\n\n",
    "\nStartWithLastProfile=1\nVersion=2\n"];
  const accounts = [[], [], [], []];
  const jsons = ["J1", "J2", "J3", "J4"];

  const profiles = (new SieveThunderbirdProfiles());

  // We need to mock out object to be testable
  profiles.getProfileDirectory = () => { return path.join(__dirname, "Thunderbird"); };
  profiles.createProfile = (dirname, section) => {
    suite.assertEquals(path.join(__dirname, "Thunderbird"), dirname);
    suite.assertEquals(sections.shift(), section.replace("\r\n", "\n"));

    const account = accounts.shift();
    const json = jsons.shift();

    return {
      getAccounts: () => { return account; },
      toJson: () => { return json; }
    };
  };

  const data = profiles.getAccounts();

  suite.assertEmptyArray(data);
});

