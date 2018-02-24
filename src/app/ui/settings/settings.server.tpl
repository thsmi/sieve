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

<hr/>

<p class="form-text text-muted">
    <small>
      The fingerprint is used to trust certificates which can not be validated automatically.<br/>
      You will need this only if you are using with selfsigned certificates.
    </small>
</p>
<div class="form-group row">

  <label class="col-sm-3 col-form-label">Fingerprint</label>
  <div class="col-sm-8">
    <input type="text" class="sieve-settings-fingerprint form-control" placeholder="The server's certificates fingerprint.">
  </div>
</div>

<div class="siv-settings-advanced">
  <hr/>

  <div class="form-group row">
    <label class="col-sm-3 col-form-label">Send Keep Alive</label>
    <div class="col-sm-8">
      <div class="sieve-settings-keepalive btn-group btn-group-toggle" data-toggle="buttons">
        <label class="sieve-settings-keepalive-enabled btn btn-outline-secondary btn-sm">
          <input type="radio" name="keepalive" autocomplete="off">Yes
        </label>
        <label class="sieve-settings-keepalive-disabled btn btn-outline-secondary btn-sm">
          <input type="radio" name="keepalive" autocomplete="off">No
        </label>
      </div>
    </div>
  </div>

  <div class="form-group row">
    <label class="col-sm-3 col-form-label">Send every</label>
    <div class="col-sm-3">
      <input type="text" class="sieve-settings-keepalive-interval form-control" id="inputPassword">
    </div>
    <div class="col-sm-3 col-form-label">
      min
    </div>
  </div>
</div>