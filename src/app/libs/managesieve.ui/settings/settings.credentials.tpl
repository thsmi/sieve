<div class="form-group row">
  <label class="col-sm-3 col-form-label">Security</label>
  <div class="col-sm-9">

    <div class="sieve-settings-encryption btn-group btn-group-toggle" data-toggle="buttons">
      <label class="sieve-settings-encryption-enabled btn btn-outline-secondary btn-sm">
        <input type="radio" name="encrypted" autocomplete="off">Force Encrypted Connection
      </label>
      <label class="sieve-settings-encryption-disabled btn btn-outline-secondary btn-sm">
        <input type="radio" name="encrypted" autocomplete="off">None
      </label>
    </div>
  </div>
</div>

<hr />

<div class="form-group row">
  <label class="col-sm-3 col-form-label ">Authentication</label>
  <div class="col-sm-8">
    <div class="sieve-settings-authentication dropdown">
      <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
      </button>
      <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
        <a class="dropdown-item" data-sieve-authentication="default" href="#">Use suggested Mechanism</a>
        <div class="dropdown-divider"></div>
        <a class="dropdown-item" data-sieve-authentication="PLAIN" href="#">Force Plain</a>
        <a class="dropdown-item" data-sieve-authentication="LOGIN" href="#">Force Login (Deprecated)</a>
        <a class="dropdown-item" data-sieve-authentication="CRAM-MD5" href="#">Force CRAM-MD5</a>
        <a class="dropdown-item" data-sieve-authentication="SCRAM-SHA-1" href="#">Force SCRAM-SHA-1</a>
        <a class="dropdown-item" data-sieve-authentication="SCRAM-SHA-256" href="#">Force SCRAM-SHA-256</a>
        <a class="dropdown-item" data-sieve-authentication="EXTERNAL" href="#">Force External</a>
        <div class="dropdown-divider"></div>
        <a class="dropdown-item" data-sieve-authentication="none" href="#">No Authentication</a>
      </div>
    </div>
  </div>
</div>

<div class="form-group row">
  <label class="col-sm-3 col-form-label">Username</label>
  <div class="col-sm-8">
    <input type="text" class="sieve-settings-username form-control" placeholder="Username">
  </div>
</div>
<!--<div class="form-group row">
    <div class="col-sm-8 offset-md-3">
      <button type="button" class="btn btn-outline-secondary">Forget Password</button>
    </div>
  </div>
  <div class="form-group row">
    <label class="col-sm-3 col-form-label">Autologin</label>
    <div class="col-sm-8">
      <div class="btn-group btn-group-toggle" data-toggle="buttons">
        <label class="btn btn-outline-secondary btn-sm">
          <input type="radio" name="autologin" autocomplete="off">Yes
        </label>
        <label class="btn btn-outline-secondary btn-sm">
          <input type="radio" name="autologin" autocomplete="off">No
        </label>
      </div>
    </div>
  </div>-->

<div class="siv-settings-advanced">
  <hr />
  <!-- Authorization -->
  <p class="form-text text-muted">
  <small>
    Proxy authorization allows an authenticated user to act on behalf of another users.<br>
    Usually servers provide this feature only to special elevated administrator or root acccounts.</small>
  </p>
  <p class="form-text text-muted">
  <small>Keep in mind very few authentication mechanism support authorization. <br>
    So you should always force SASL Plain Authentication, when using this feature. </small>
  </p>
  <div class="form-group row">
    <label class="col-sm-3 col-form-label">Authorization as</label>
    <div class="col-sm-8">
      <div class="sieve-settings-authorization dropdown">
        <button class="btn btn-outline-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true"
          aria-expanded="false">
        </button>
        <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
          <a class="dropdown-item" data-sieve-authorization="0" href="#">Implicit, server descides (default)</a>
          <div class="dropdown-divider"></div>
          <a class="dropdown-item" data-sieve-authorization="1" href="#">Explicit, use current user</a>
          <a class="dropdown-item" data-sieve-authorization="2" href="#">Explicit, prompt for username</a>
          <a class="dropdown-item" data-sieve-authorization="3" href="#">Explicit, use different user</a>
        </div>
      </div>
    </div>
  </div>

  <div class="form-group row sieve-settings-authorization-username">
    <label class="col-sm-3 col-form-label">Username</label>
    <div class="col-sm-8">
      <input type="text" class="form-control sieve-settings-text-authorization-username" placeholder="Username">
    </div>
  </div>
</div>