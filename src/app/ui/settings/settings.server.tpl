<div class="form-group row">
    <label class="col-sm-3 col-form-label ">Display Name</label>
    <div class="col-sm-8">
      <input type="text" class="sieve-settings-displayname form-control" placeholder="e.g. work or mail@example.com">
    </div>
  </div>

<div class="form-group row">
  <label class="col-sm-3 col-form-label ">Hostname</label>
  <div class="col-sm-8">
    <input type="text" class="sieve-settings-hostname form-control" placeholder="e.g. imap.example.com">
  </div>
</div>

<div class="form-group row">
  <label class="col-sm-3 col-form-label">Port</label>
  <div class="col-sm-3">
    <input type="text" class="sieve-settings-port form-control" id="sieve-dialog-settings-port" placeholder="e.g. 4190 or 2000">
  </div>
</div>

<div class="form-group row">
  <label class="col-sm-3 col-form-label">Security</label>
  <div class="col-sm-9">

    <div class="sieve-settings-encryption btn-group" data-toggle="buttons">
      <label class="sieve-settings-encryption-enabled btn btn-outline-secondary btn-sm">
        <input type="radio" name="encrypted" autocomplete="off">Use Encrypted Connection
      </label>
      <label class="sieve-settings-encryption-disabled btn btn-outline-secondary btn-sm">
        <input type="radio" name="encrypted" autocomplete="off">None
      </label>
    </div>
  </div>
</div>