<!-- Modal -->
<div id="sieve-authorization-dialog" class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Authorization Required</h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-group row">
          <div class="col-sm-12">
            Please enter the user as which you would like to be authorized.</div>
        </div>
        <div class="form-group row">
          <label class="col-sm-3 col-form-label">Account</label>
          <div class="col-sm-8 col-form-label sieve-displayname"></div>
        </div>
        <div class="form-group row">
          <label class="col-sm-3 col-form-label">Username</label>
          <div class="col-sm-8">
            <input class="form-control sieve-authorization" placeholder="Authorization">
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-primary sieve-dialog-resolve">Authorize</button>
      </div>
    </div>
  </div>
</div>