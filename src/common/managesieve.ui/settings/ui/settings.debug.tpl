<div class="sieve-settings-debug">
  <p class="form-text text-muted">
    <small data-i18n="debug.transport.description"></small>
  </p>

  <div class="custom-control custom-switch">
    <input type="checkbox" class="custom-control-input" id="debugClientServer" />
    <label class="custom-control-label" for="debugClientServer" data-i18n="debug.transport.clientserver"></label>
  </div>
  <div class="custom-control custom-switch">
    <input type="checkbox" class="custom-control-input" id="debugServerClient" />
    <label class="custom-control-label" for="debugServerClient" data-i18n="debug.transport.serverclient"></label>
  </div>
  <div class="custom-control custom-switch">
    <input type="checkbox" class="custom-control-input" id="debugStateMachine" />
    <label class="custom-control-label" for="debugStateMachine" data-i18n="debug.transport.states"></label>
  </div>
  <div class="custom-control custom-switch">
    <input type="checkbox" class="custom-control-input" id="debugRawDump" />
    <label class="custom-control-label" for="debugRawDump" data-i18n="debug.transport.rawdump"></label>
  </div>
  <div class="custom-control custom-switch">
    <input type="checkbox" class="custom-control-input" id="debugSessionManagement" />
    <label class="custom-control-label" for="debugSessionManagement" data-i18n="debug.transport.session"></label>
  </div>
  <div class="siv-settings-advanced">
    <hr />
    <h5 data-i18n="debug.global.title"></h5>

    <p class="form-text text-muted">
      <small data-i18n="debug.global.description"></small>
    </p>

    <div class="custom-control custom-switch">
      <input type="checkbox" class="custom-control-input" id="debugActions" />
      <label data-i18n="debug.global.actions" class="custom-control-label" for="debugActions"></label>
    </div>

    <div class="custom-control custom-switch">
      <input type="checkbox" class="custom-control-input" id="debugIpcMessages" />
      <label data-i18n="debug.global.ipc" class="custom-control-label" for="debugIpcMessages"></label>
    </div>

    <div class="custom-control custom-switch">
      <input type="checkbox" class="custom-control-input" id="debugWidgets" />
      <label data-i18n="debug.global.widgets" class="custom-control-label" for="debugWidgets"></label>
    </div>

    <div class="custom-control custom-switch">
      <input type="checkbox" class="custom-control-input" id="debugI18n" />
      <label data-i18n="debug.global.i18n" class="custom-control-label" for="debugI18n"></label>
    </div>
  </div>

</div>