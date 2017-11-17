(function () {

  /* global $ */
  "use strict";

  let listeners = {};

  // We communicate with our backend like with messages 
  // as in a cors application

  window.onmessage = function (e) {
    if (e.source === window)
      return;

    let m = JSON.parse(e.data);

    Object.keys(listeners).forEach((listener) => {
      listeners[listener](m);
    });

    console.log("On Callback");
  };

  async function sendMessage(action, data) {
    let msg = {};
    msg.id = "" + (new Date).getTime().toString(36) + "-" + Math.random().toString(36).substr(2, 16);
    msg.action = action;
    msg.data = data;


    parent.postMessage(JSON.stringify(msg), "*");


    return await new Promise((resolve) => {

      let listener = function (m) {
        if (msg.id !== m.id)
          return;

        delete listeners[msg.id];
        resolve(m.data);
      };

      listeners[msg.id] = listener;
    });
  }


  class SieveAccounts {

    async render() {

      let items = await sendMessage("accounts-list");

      $(".siv-accounts").empty();
      console.log("Rendering Accounts...");

      items.forEach((element) => {
        console.log(" + Accounts " + element);
        new SieveAccount(this, element).render();
      });
    }
  }

  class SieveAccount {

    constructor(accounts, id) {
      this.accounts = accounts;
      this.id = id;
    }

    async send(action, data) {
      let msg = {
        "id": this.id,
        "data": data
      };

      return await sendMessage(action, msg);
    }

    /**
     * Checks if the current account has an active connection to the server
     * 
     * @returns {boolean} true in case tha account is connected otherwise false
     */
    async isConnected() {
      let status = await this.send("account-connected", this.id);
      return status.connected;
    }

    async connect() {
      await this.send("account-connect", this.id);
      await this.accounts.render();
    }

    async render() {
      console.log("Rendering Account " + this.id);

      let item = $("#siv-account-" + this.id);
      // Check if the element exists...
      if (item.length === 0) {
        item = $("#template .siv-tpl-account").children().first().clone();
        item.attr("id", "siv-account-" + this.id);
        item.find(".siv-account-create").click(() => { this.createScript(); });

        item.find(".sieve-account-edit-server").click(() => { this.edit(); });
        item.find(".sieve-account-delete-server").click(() => { this.remove(); });
        item.find(".sieve-account-capabilities").click(() => { this.showCapabilities(); });

        $(".siv-accounts").append(item);
      }

      let status = await this.isConnected();

      if (status === false) {
        $("#siv-account-" + this.id + " .siv-tpl-scripts")
          .empty()
          .text("Not connected");

        return;
      }


      let data = await this.send("account-list", this.id);

      console.log("Data received " + JSON.stringify(data));

      $("#siv-account-" + this.id + " .siv-tpl-scripts").empty();

      data.forEach(async (item) => {

        console.log("Rendering " + this.id + "/" + item.script + " ");
        await (new SieveScript(this, item.script, item.active)).render();
      });

    }

    /**
     * Shows a dialog with the current accounts setting.
     * @returns {void}
     */
    edit() {
      alert("server edit");
    }

    /**
     * Asks the user if he is sure to delete the account. 
     * If yes it triggers expurging the account settings.
     * This can not be undone. 
     * 
     * @returns {void}
     */
    remove() {
      $('#sieve-dialog-account-remove').modal('show');

      $('#sieve-dialog-account-remove-name').text(this.id);

      $('#sieve-dialog-account-remove-btn').off().one("click", async () => {

        await this.send("account-delete", this.id);

        await this.accounts.render();
        $('#sieve-dialog-account-remove').modal('hide');
      });
    }

    /**
     * Shows the accounts capabilities
     * @returns{void}
     */
    showCapabilities() {
      $("#sieve-capabilities-server").empty();
      $("#sieve-capabilities-version").empty();
      $("#sieve-capabilities-sasl").empty();
      $("#sieve-capabilities-extensions").empty();
      $("#sieve-capabilities-language").empty();

      $('#sieve-dialog-capabilities').modal('show');

      // TODO show wait indicator...
      (async () => {
        let capabilities = await this.send("account-capabilities", this.id);

        $("#sieve-capabilities-server").text(capabilities.implementation);
        $("#sieve-capabilities-version").text(capabilities.version);
        $("#sieve-capabilities-sasl").text(
          Object.values(capabilities.sasl).join(" "));
        $("#sieve-capabilities-extensions").text(
          Object.keys(capabilities.extensions).join(" "));
        $("#sieve-capabilities-language").text(capabilities.language);
      })();
    }

    async getCapabilities() {
      return await this.send("account-capabilities", this.id);
    }

    async getScript(name) {
      return await this.send("script-get", name);
    }


    createScript() {
      $("#sieve-create-dialog").modal('show');

      $('#sieve-create-dialog-btn').off().one("click", async () => {
        let name = $('#sieve-create-dialog-name').val();

        await this.send("script-create", name);

        await this.render();
        $('#sieve-create-dialog').modal('hide');
      });
    }
  }

  /**
   * An UI elements which handles displaying details for a sieve script.
   * It does not provied any support for editing the scripts content.
   */
  class SieveScript {

    constructor(account, name, active) {
      this.name = name;
      this.isActive = active;
      this.account = account;
    }

    render() {

      let id = this.account.id + "-" + toHex(this.name);

      let item = $("#siv-script-" + id);
      // Check if the element exists...
      if (item.length === 0) {
        item = $("#template .siv-tpl-script").clone();
        item.attr("id", "siv-script-" + id);

        $("#siv-account-" + this.account.id + " .siv-tpl-scripts").append(item);

        $(item).find(".sieve-list-script-name").text(this.name);

        $(item).find(".sieve-script-rename").click(() => { this.rename(); });
        $(item).find(".sieve-script-delete").click(() => { this.remove(); });
        $(item).find(".sieve-script-edit").click(() => { this.edit(); });
        $(item).find(".sieve-script-activate").click(() => { this.activate(); });
        $(item).find(".sieve-script-deactivate").click(() => { this.deactivate(); });
      }

      if (this.isActive === false) {
        item.addClass("list-group-item-light");
        $("#siv-script-" + id + " .sieve-list-script-active").addClass("invisible");
        $("#siv-script-" + id + " .sieve-script-activate").removeClass("d-none");
        $("#siv-script-" + id + " .sieve-script-deactivate").addClass("d-none");
      }
      else {
        item.removeClass("list-group-item-light");
        $("#siv-script-" + id + " .sieve-list-script-active").removeClass("invisible");
        $("#siv-script-" + id + " .sieve-script-activate").addClass("d-none");
        $("#siv-script-" + id + " .sieve-script-deactivate").removeClass("d-none");
      }
    }

    /**
     * Renames the script. 
     * A propmpt will be show which ask the user about the new name
     * 
     * @returns {void}
     */
    rename() {

      $('#sieve-rename-dialog').modal('show');
      $('#sieve-rename-dialog-newname').val(this.name);

      $('#sieve-rename-dialog-btn').off().click(async () => {
        let newname = $('#sieve-rename-dialog-newname').val();
        await this.account.send("script-rename", { "old": this.name, "new": newname });

        await this.account.render();
        $('#sieve-rename-dialog').modal('hide');
      });
    }

    /**
     * Removes the script
     * A verification prompt will be shown before the script is deleted
     * 
     * @returns {void}
     */
    remove() {
      
      $('#sieve-delete-dialog').modal('show');
      $('#sieve-delete-dialog-name').text(this.name);

      $('#sieve-delete-dialog-btn').off().click( async () => {

        await this.account.send("script-delete", this.name);

        await this.account.render();
        $('#sieve-delete-dialog').modal('hide');
      });
    }

    edit() {
      alert("Edit " + element);
    }

    async activate() {
      await this.account.send("script-activate", this.name);
      await this.account.render();
    }

    async deactivate() {
      await this.account.send("script-deactivate", this.name);
      await this.account.render();
    }
  }

  function loadAccounts() {
    (new SieveAccounts()).render();
  }

  async function main() {

    $("#reload").click(() => { window.location.reload(true); });

    console.log("ready!");
    //var tmp = await (new SieveAccounts()).list();
    //console.log("Wait returned " + tmp);

    await loadAccounts();

  }

  function toHex(tmp) {
    let str = "";

    for (let i = 0; i < tmp.length; i++)
      str += ("0" + tmp.charCodeAt(i).toString(16)).slice(-2);

    return str;
  }

  $("#ping").click(async () => {
    await loadAccounts();
  });

  $(document).ready(function () {
    (async () => { main(); })();
  });

})();

