<div id="dialog-settings-server" class="modal fade bd-example-modal-lg" tabindex="-1" role="dialog"
  aria-labelledby="myLargeModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" data-i18n="server.title"></h5>
        <button type="button" class="btn-close" data-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <form>
          <div class="mb-3 row">
            <label class="col-sm-3 col-form-label" data-i18n="server.displayname"></label>
            <div class="col-sm-8">
              <input type="text" data-i18n="server.displayname.placeholder"
                class="sieve-settings-displayname form-control">
            </div>
          </div>

          <div class="mb-3 row">
            <label class="col-sm-3 col-form-label" data-i18n="server.hostname"></label>
            <div class="col-sm-8">
              <input type="text" data-i18n="server.hostname.placeholder" class="sieve-settings-hostname form-control">
            </div>
          </div>

          <div class="mb-3 row">
            <label class="col-sm-3 col-form-label" data-i18n="server.port"></label>
            <div class="col-sm-3">
              <input type="text" data-i18n="server.port.placeholder" class="sieve-settings-port form-control"
                id="sieve-dialog-settings-port">
            </div>
          </div>

          <hr />

          <p class="form-text text-muted">
            <small data-i18n="server.fingerprint.description"></small>
          </p>
          <div class="mb-3 row">

            <label class="col-sm-3 col-form-label" data-i18n="server.fingerprint"></label>
            <div class="col-sm-8">
              <input type="text" data-i18n="server.fingerprint.placeholder"
                class="sieve-settings-fingerprint form-control">
            </div>
          </div>

          <div class="siv-settings-advanced">
            <hr />
            <p class="form-text text-muted">
              <small data-i18n="server.idle.description"></small>
            </p>
            <div class="mb-3 row">
              <label class="col-sm-3 col-form-label" data-i18n="server.idle1"></label>
              <div class="col-sm-3">
                <input type="text" class="sieve-settings-keepalive-interval form-control" id="inputPassword">
              </div>
              <div class="col-sm-3 col-form-label" data-i18n="server.idle2"></div>
            </div>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button data-i18n="settings.more" class="siv-settings-show-advanced btn btn-outline-secondary"></button>
        <button data-i18n="settings.less" class="siv-settings-hide-advanced btn btn-outline-secondary"></button>

        <button data-i18n="settings.accept" class="sieve-settings-apply btn btn-primary"></button>
      </div>
    </div>
  </div>
</div>