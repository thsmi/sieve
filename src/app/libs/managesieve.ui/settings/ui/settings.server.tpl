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
  <p class="form-text text-muted">
    <small>
      Most server will disconnect a client after being inactive for a certain time span.
      To prevent this and keep the connection alive, idle messages are sent. To disable
      keep alive messages set the interval to zero.
    </small>
  </p>
  <div class="form-group row">
    <label class="col-sm-3 col-form-label">Send idle message after</label>
    <div class="col-sm-3">
      <input type="text" class="sieve-settings-keepalive-interval form-control" id="inputPassword">
    </div>
    <div class="col-sm-3 col-form-label">
      minutes of in activity.
    </div>
  </div>
</div>