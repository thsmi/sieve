<!-- Modal -->
<div id="sieve-authorization-dialog" class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 data-i18n="authorization.title" class="modal-title"></h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <div class="modal-body">
        <div class="mb-3 row">
          <div class="col-sm-12" data-i18n="authorization.description"></div>
        </div>
        <div class="mb-3 row">
          <label class="col-sm-3 col-form-label" data-i18n="authorization.account"></label>
          <div class="col-sm-8 col-form-label sieve-displayname"></div>
        </div>
        <div class="mb-3 row">
          <label class="col-sm-3 col-form-label" data-i18n="authorization.username"></label>
          <div class="col-sm-8">
            <input class="form-control sieve-authorization" data-i18n="authorization.placeholder">
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button data-i18n="authorization.accept" type="button" class="btn btn-primary sieve-dialog-resolve"></button>
      </div>
    </div>
  </div>
</div>