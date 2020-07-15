<div id="dialog-settings-debug" class="modal fade bd-example-modal-lg" tabindex="-1" role="dialog"
  aria-labelledby="myLargeModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" data-i18n="settings.title"></h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <div class="modal-body">

        <div class="sieve-settings-debug">
          <p class="form-text text-muted">
            <small data-i18n="debug.transport.description"></small>
          </p>

          <div class="custom-control custom-switch">
            <input type="checkbox" class="custom-control-input" id="debugClientServer" />
            <label class="custom-control-label" for="debugClientServer"
              data-i18n="debug.transport.clientserver"></label>
          </div>
          <div class="custom-control custom-switch">
            <input type="checkbox" class="custom-control-input" id="debugServerClient" />
            <label class="custom-control-label" for="debugServerClient"
              data-i18n="debug.transport.serverclient"></label>
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
            <label class="custom-control-label" for="debugSessionManagement"
              data-i18n="debug.transport.session"></label>
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

      </div>
      <div class="modal-footer">
        <button data-i18n="settings.more" class="siv-settings-show-advanced btn btn-outline-secondary"></button>
        <button data-i18n="settings.less" class="siv-settings-hide-advanced btn btn-outline-secondary"></button>

        <button data-i18n="settings.accept" class="sieve-settings-apply btn btn-primary"></button>
      </div>
    </div>
  </div>
</div>