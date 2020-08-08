<div class="container-sm">
  <h4 data-i18n="account.details.title"></h4>
  <div class="d-flex flex-row form-label">
    <div style="min-width:8em" data-i18n="account.details.server"></div>
      <span class="sieve-settings-hostname"></span>:
      <span class="sieve-settings-port"></span>
      <span class="sieve-settings-secure ml-1" data-i18n="account.details.secure"></span>
  </div>
  <div class="sieve-settings-fingerprint-item d-none">
    <div class="d-flex flex-row form-label ">
      <div style="min-width:8em" data-i18n="account.details.fingerprint"></div>
      <div class="sieve-settings-fingerprint"></div>
    </div>
  </div>
  <div class="d-flex flex-row form-label ">
    <div style="min-width:8em" data-i18n="account.details.username"></div>
    <div class="sieve-settings-username"></div>
  </div>
  <div class="d-flex flex-row form-label ">
    <div style="min-width:8em" data-i18n="account.details.sasl"></div>
    <div class="sieve-settings-mechanism"></div>
  </div>
  <div class="mt-3">
    <button type="button"
      data-i18n="account.details.server.edit"
      class="sieve-account-edit-server btn btn-sm btn-outline-secondary mr-1"></button>
    <button type="button"
      data-i18n="account.details.credentials.edit"
      class="sieve-account-edit-credentials btn btn-sm btn-outline-secondary mr-1"></button>
    <button type="button"
      data-i18n="account.details.debugging.edit"
      class="sieve-account-edit-debug btn btn-sm btn-outline-secondary"></button>
    <button type="button"
      data-i18n="account.details.export"
      class="sieve-account-export btn btn-sm btn-outline-secondary"></button>
  </div>
  <hr>
  <h4 data-i18n="account.details.delete.title"></h4>
  <div data-i18n="account.details.delete.description"></div>
  <button data-i18n="account.details.delete" type="button" class="mt-3 sieve-account-delete-server btn btn-sm btn-outline-danger" ></button>
</div>