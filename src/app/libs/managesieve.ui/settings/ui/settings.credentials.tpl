<div id="dialog-settings-credentials" class="modal fade bd-example-modal-lg" tabindex="-1" role="dialog"
  aria-labelledby="myLargeModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" data-i18n="credentials.title"></h5>
        <button type="button" class="btn-close" data-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <form>

        <div class="row mb-3">

          <label class="col-sm-3 col-form-label" data-i18n="credentials.security"></label>
          <div class="col-sm-9">

            <div class="btn-group">
              <input type="radio" class="btn-check" name="encrypted" id="sieve-settings-encryption-on" autocomplete="off">
              <label class="btn btn-outline-secondary" for="sieve-settings-encryption-on" data-i18n="credentials.forceEncryption"></label>

              <input type="radio" class="btn-check" name="encrypted" id="sieve-settings-encryption-off" autocomplete="off">
              <label class="btn btn-outline-secondary" for="sieve-settings-encryption-off" data-i18n="credentials.noEncryption"></label>
            </div>
          </div>
        </div>

        <div class="row mb-3">
          <label class="col-sm-3 col-form-label" data-i18n="credentials.authentication"></label>
          <div class="col-sm-8">
            <div class="sieve-settings-authentication dropdown">
              <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-toggle="dropdown"
                aria-haspopup="true" aria-expanded="false">
              </button>
              <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
                <a class="dropdown-item" data-i18n="credentials.sasl.default" data-sieve-authentication="default"
                  href="#"></a>
                <div class="dropdown-divider"></div>
                <a class="dropdown-item" data-i18n="credentials.sasl.plain" data-sieve-authentication="PLAIN"
                  href="#"></a>
                <a class="dropdown-item" data-i18n="credentials.sasl.login" data-sieve-authentication="LOGIN"
                  href="#"></a>
                <a class="dropdown-item" data-i18n="credentials.sasl.crammd5" data-sieve-authentication="CRAM-MD5"
                  href="#"></a>
                <a class="dropdown-item" data-i18n="credentials.sasl.scramsha1" data-sieve-authentication="SCRAM-SHA-1"
                  href="#"></a>
                <a class="dropdown-item" data-i18n="credentials.sasl.scramsha256"
                  data-sieve-authentication="SCRAM-SHA-256" href="#"></a>
                <a class="dropdown-item" data-i18n="credentials.sasl.external" data-sieve-authentication="EXTERNAL"
                  href="#"></a>
                <div class="dropdown-divider"></div>
                <a class="dropdown-item" data-i18n="credentials.sasl.none" data-sieve-authentication="none"
                  href="#"></a>
              </div>
            </div>
          </div>
        </div>

        <div class="row mb-3">
          <label class="col-sm-3 col-form-label" data-i18n="credentials.username"></label>
          <div class="col-sm-8">
            <input type="text" class="sieve-settings-username form-control">
          </div>
        </div>

        <div class="row sieve-settings-forget-password">
          <label class="col-sm-3 col-form-label"></label>
          <div class="col-sm-8">
            <button type="button" data-i18n="credentials.forget" class="btn btn-outline-secondary"></button>
          </div>
        </div>


        <div class="siv-settings-advanced">
          <hr />
          <!-- Authorization -->
          <p class="form-text text-muted">
            <small data-i18n="credentials.authorization1"></small>
          </p>
          <p class="form-text text-muted">
            <small data-i18n="credentials.authorization2"></small>
          </p>
          <div class="row">
            <label class="col-sm-3 col-form-label" data-i18n="credentials.authorization"></label>
            <div class="col-sm-8">
              <div class="sieve-settings-authorization dropdown">
                <button class="btn btn-outline-secondary dropdown-toggle" type="button" id="dropdownMenuButton"
                  data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                </button>
                <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
                  <a data-i18n="credentials.authorization.implicit" class="dropdown-item" data-sieve-authorization="0"
                    href="#"></a>
                  <div class="dropdown-divider"></div>
                  <a data-i18n="credentials.authorization.current" class="dropdown-item" data-sieve-authorization="1"
                    href="#"></a>
                  <a data-i18n="credentials.authorization.prompt" class="dropdown-item" data-sieve-authorization="2"
                    href="#"></a>
                  <a data-i18n="credentials.authorization.username" class="dropdown-item" data-sieve-authorization="3"
                    href="#"></a>
                </div>
              </div>
            </div>
          </div>

          <div class="mb-3 row sieve-settings-authorization-username">
            <label class="col-sm-3 col-form-label" data-i18n="credentials.authorization.username2"></label>
            <div class="col-sm-8">
              <input type="text" class="form-control sieve-settings-text-authorization-username">
            </div>
          </div>
        </div>

        </form>
      </div>
      <div class="modal-footer">
        <button data-i18n="settings.more" class="siv-settings-show-advanced btn btn-outline-secondary"></button>
        <button data-i18n="settings.less" class="siv-settings-hide-advanced btn btn-outline-secondary"></button>

        <button data-i18n="settings.accept" class="sieve-settings-apply btn btn-primary"></button>
      </div>
    </div>
  </div>
</div>