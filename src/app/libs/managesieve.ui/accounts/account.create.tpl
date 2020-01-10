<!-- Modal -->
<div id="sieve-create-account-dialog" class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
  <div class="modal-dialog modal-lg" role="document">
    <div class="modal-content">

      <div class="modal-header">
        <h5 class="modal-title">Create Account</h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>

      <div class="modal-body">
        <div class="form-group row">
          <label class="col-sm-3 col-form-label ">Display Name</label>
          <div class="col-sm-8">
            <input type="text" class="sieve-create-account-displayname form-control" placeholder="e.g. work or mail@example.com">
          </div>
        </div>

        <div class="form-group row">
          <label class="col-sm-3 col-form-label ">Hostname</label>
          <div class="col-sm-8">
            <input type="text" class="sieve-create-account-hostname form-control" placeholder="e.g. imap.example.com">
          </div>
        </div>

        <div class="form-group row">
          <label class="col-sm-3 col-form-label">Port</label>
          <div class="col-sm-3">
            <input type="text" class="sieve-create-account-port form-control" id="sieve-dialog-settings-port" placeholder="e.g. 4190 or 2000">
          </div>
        </div>

        <div class="form-group row">
          <label class="col-sm-3 col-form-label">Username</label>
          <div class="col-sm-8">
            <input type="text" class="sieve-create-account-username form-control" placeholder="Username">
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="sieve-create-account-btn btn btn-primary">Create</button>
      </div>

    </div>
  </div>
</div>