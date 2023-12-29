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

/* global bootstrap */
import { SieveTemplate } from "./../utils/SieveTemplate.mjs";
import { SieveIpcClient } from "./../utils/SieveIpcClient.mjs";

/**
 * Imports sieve settings from mailers.
 */
class SieveImportUI {

  /**
   * Adds a import ui widget for the given account.
   *
   * @param {object} profile
   *   the profile information.
   * @param {object} account
   *   the account information.
   */
  async addAccount(profile, account) {
    const item = await (new SieveTemplate()).load("./importer/account.import.item.html");

    item.querySelector(".sieve-import-username").textContent = account["username"];
    item.querySelector(".sieve-import-hostname").textContent = account["hostname"];
    item.querySelector(".sieve-import-name").textContent = account["name"];

    item.querySelector(".sieve-import-profile").textContent = profile["path"];
    item.querySelector(".sieve-import-source").textContent = profile.name;

    item.querySelector(".sieve-import-btn").addEventListener("click", async () => {
      try {
        await this.import(account);
        this.close();
      } catch (ex) {
        await this.showError(ex);
      }
    });

    const dialog = document.querySelector("#sieve-import-dialog");
    dialog.querySelector(".sieve-import-items").append(item);

  }

  /**
   * Adds an import widget for each accout contained in the profile.
   *
   * @param {object} profile
   *   the profile information, which includes the account information.
   */
  async addProfile(profile) {
    for (const account of profile.accounts)
      this.addAccount(profile, account);
  }

  /**
   * Imports the account.
   * It will first try to connect to the server and guess the port.
   * Then it will create a new account for the given details.
   *
   * @param {object} account
   *   the account to be imported.
   */
  async import(account) {
    const dialog = document.querySelector("#sieve-import-dialog");

    dialog.querySelector(".sieve-import-progress").classList.remove("d-none");
    dialog.querySelector(".sieve-import-items").classList.add("d-none");
    dialog.querySelector(".sieve-import-error").classList.add("d-none");

    const account2 = await SieveIpcClient.sendMessage("core", "account-probe", account);
    await SieveIpcClient.sendMessage("core", "account-create", account2);
  }

  /**
   * Shows an error message.
   *
   * @param {Error} ex
   *   the exception which caused the error messag to be displayed.
   */
  async showError(ex) {
    const dialog = document.querySelector("#sieve-import-dialog");

    dialog.querySelector(".sieve-import-items").classList.add("d-none");
    dialog.querySelector(".sieve-import-progress").classList.add("d-none");
    dialog.querySelector(".sieve-import-error").classList.remove("d-none");

    dialog.querySelector(".sieve-import-error-description").textContent = ex.toString();

    // import.error.description=Failed to import account
    await new Promise((resolve) => {
      dialog.querySelector(".sieve-import-error-resolve").addEventListener("click", () => {
        resolve();
      });
    });

    dialog.querySelector(".sieve-import-items").classList.remove("d-none");
    dialog.querySelector(".sieve-import-progress").classList.add("d-none");
    dialog.querySelector(".sieve-import-error").classList.add("d-none");
  }

  /**
   * Closes the dialog and removes it from the dom.
   */
  close() {
    bootstrap.Modal.getInstance("#sieve-import-dialog").hide();
    document.querySelector("#sieve-import-dialog").remove();

    if (this.resolve)
      this.resolve();

    this.resolve = null;
  }

  /**
   * Shows the import account dialog.
   */
  async show() {

    const dialog = await (new SieveTemplate()).load("./importer/account.import.html");
    dialog.querySelector(".sieve-import-progress").classList.add("d-none");
    document.querySelector("#ctx").append(dialog);

    // we need to call it on the main thread because we don't have
    // to all the libraries we need right here.
    const profiles = await SieveIpcClient.sendMessage("core", "import-thunderbird");

    const modal = new bootstrap.Modal(dialog);

    for (const profile of profiles) {
      if ((!profile.accounts) || (!profile.accounts.length))
        continue;

      this.addProfile(profile, dialog);
    }

    dialog.addEventListener('hidden.bs.modal', () => {
      this.close();
    });

    await new Promise((resolve) => {
      this.resolve = resolve;
      modal.show();
    });
  }
}

export { SieveImportUI };
