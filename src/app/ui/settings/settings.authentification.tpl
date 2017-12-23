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
        <a class="dropdown-item" data-sieve-authentication="SCRAM-MD-5" href="#">Force CRAM-MD5</a>
        <a class="dropdown-item" data-sieve-authentication="SCRAM-SHA-1" href="#">Force SCRAM-SHA-1</a>
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
      <div class="btn-group" data-toggle="buttons">
        <label class="btn btn-outline-secondary btn-sm">
          <input type="radio" name="autologin" autocomplete="off">Yes
        </label>
        <label class="btn btn-outline-secondary btn-sm">
          <input type="radio" name="autologin" autocomplete="off">No
        </label>
      </div>
    </div>
  </div>-->