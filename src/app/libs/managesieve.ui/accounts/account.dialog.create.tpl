<!-- Modal -->
<div id="sieve-create-account-dialog" class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
  <div class="modal-dialog modal-lg" role="document">
    <div class="modal-content">

      <div class="modal-header">
        <h5 class="modal-title" data-i18n="account.create.title"></h5>
        <button type="button" class="btn-close" data-dismiss="modal" aria-label="Close"></button>
      </div>

      <div class="modal-body">
        <div class="mb-3 row">
          <label class="col-sm-3 col-form-label" data-i18n="account.create.displayName"></label>
          <div class="col-sm-8">
            <input type="text" data-i18n="account.create.displayName.placeholder" class="sieve-create-account-displayname form-control">
          </div>
        </div>

        <div class="mb-3 row">
          <label class="col-sm-3 col-form-label" data-i18n="account.server.hostname"></label>
          <div class="col-sm-8">
            <input type="text" class="sieve-create-account-hostname form-control" data-i18n="account.server.hostname.placeholder">
          </div>
        </div>

        <div class="mb-3 row">
          <label class="col-sm-3 col-form-label" data-i18n="account.server.port"></label>
          <div class="col-sm-3">
            <input type="text" class="sieve-create-account-port form-control" data-i18n="account.server.port.placeholder" id="sieve-dialog-settings-port">
          </div>
        </div>

        <div class="mb-3 row">
          <label class="col-sm-3 col-form-label" data-i18n="account.server.username"></label>
          <div class="col-sm-8">
            <input type="text" class="sieve-create-account-username form-control">
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="sieve-create-account-btn btn btn-primary" data-i18n="account.create.accept"></button>
      </div>

    </div>
  </div>
</div>
