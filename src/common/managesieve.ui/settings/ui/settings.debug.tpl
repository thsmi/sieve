<div class="sieve-settings-debug">
  <p class="form-text text-muted">
    <small>
      Used to log and debug the communication between this app and the server.
      All of the settings apply to this accounts after a reconnect.
    </small>
  </p>

  <div class="custom-control custom-switch">
    <input type="checkbox" class="custom-control-input" id="debugClientServer" />
    <label class="custom-control-label" for="debugClientServer">
      Client to Server communication (requests)</label>
  </div>
  <div class="custom-control custom-switch">
    <input type="checkbox" class="custom-control-input" id="debugServerClient" />
    <label class="custom-control-label" for="debugServerClient">
      Server to Client communication (responses)</label>
  </div>
  <div class="custom-control custom-switch">
    <input type="checkbox" class="custom-control-input" id="debugStateMachine" />
    <label class="custom-control-label" for="debugStateMachine">
      Exceptions and State Machine Information</label>
  </div>
  <div class="custom-control custom-switch">
    <input type="checkbox" class="custom-control-input" id="debugRawDump" />
    <label class="custom-control-label" for="debugRawDump">
      Raw Dump/Dump Byte Stream</label>
  </div>
  <div class="custom-control custom-switch">
    <input type="checkbox" class="custom-control-input" id="debugSessionManagement" />
    <label class="custom-control-label" for="debugSessionManagement">
      Session management</label>
  </div>
  <div class="siv-settings-advanced">
    <hr />
    <h5>Global</h5>

    <p class="form-text text-muted">
      <small>
        Used to log and debug the app's UI and rendering.
        The settings are global and apply to all accounts after restarting the app.
      </small>
    </p>

    <div class="custom-control custom-switch">
      <input type="checkbox" class="custom-control-input" id="debugActions" />
      <label class="custom-control-label" for="debugActions">User Events and Actions</label>
    </div>

    <div class="custom-control custom-switch">
      <input type="checkbox" class="custom-control-input" id="debugIpcMessages" />
      <label class="custom-control-label" for="debugIpcMessages">IPC Messages</label>
    </div>

    <div class="custom-control custom-switch">
      <input type="checkbox" class="custom-control-input" id="debugWidgets" />
      <label class="custom-control-label" for="debugWidgets">Widgets</label>
    </div>
  </div>

</div>