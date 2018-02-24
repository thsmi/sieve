<!-- Modal -->
<div id="sieve-password-dialog" class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Password Required</h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-group row">
          <div class="col-sm-12">
            Please enter the password for your Sieve account.</div>
        </div>
        <div class="form-group row">
          <label class="col-sm-3 col-form-label">Account</label>
          <div class="col-sm-8 col-form-label sieve-displayname"></div>
        </div>
        <div class="form-group row">
          <label class="col-sm-3 col-form-label">Username</label>
          <div class="col-sm-8 col-form-label sieve-username"></div>
        </div>
        <div class="form-group row">
          <label class="col-sm-3 col-form-label">Password</label>
          <div class="col-sm-8">
            <input type="password" class="form-control sieve-password" placeholder="Password">
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-primary sieve-dialog-resolve">Login</button>
      </div>
    </div>
  </div>
</div>