<!-- template for the account -->
<div class="siv-tpl-account">
  <div class="card mt-4 mb-4">
    <div class="card-header d-flex justify-content-between py-0">
      <ul class="nav nav-tabs card-header-tabs my-0 pt-3" role="tablist">
        <li class="nav-item">
          <a class="sieve-accounts-tab nav-link active" data-toggle="tab" role="tab">
            <span class="siv-account-name"></span>
          </a>
        </li>
        <li class="nav-item">
          <a class="sieve-settings-tab nav-link" data-i18n="account.settings" data-toggle="tab" role="tab"></a>
        </li>
      </ul>
      <div class="align-self-center">
        <button type="button" class="btn btn-sm btn-outline-secondary mr-1 siv-account-create" data-i18n="account.newscript"></button>
        <a class="btn btn-sm btn-outline-info mr-1 "
            href="https://www.paypal.com/paypalme2/thsmi"
            target="_blank" role="button" data-i18n="account.donate"></a>

        <div id="sieve-editor-settings" class="btn-group dropdown">
          <button class="btn btn-sm btn-outline-secondary dropdown-toggle" data-toggle="dropdown" aria-haspopup="true"
            aria-expanded="false">
            ☰
          </button>
          <div class="dropdown-menu dropdown-menu-right" aria-labelledby="dropdownMenuLink">
            <a class="dropdown-item sieve-account-edit-settings" data-i18n="account.settings.edit"></a>
            <div class="dropdown-divider"></div>
            <a class="dropdown-item sieve-account-disconnect-server" data-i18n="account.disconnect"></a>
            <a class="dropdown-item sieve-account-reconnect-server" data-i18n="account.reconnect"></a>
            <div class="dropdown-divider"></div>
            <a class="dropdown-item sieve-account-capabilities" data-i18n="account.capabilities.show"></a>
          </div>
        </div>

      </div>
    </div>
    <div class="list-group list-group-flush tab-content border-top-0">
      <div class="sieve-accounts-content tab-pane fade show active" role="tabpanel">
        <ul class="list-group list-group-flush siv-tpl-scripts">
          <!--items go here -->
        </ul>
      </div>
      <div class="sieve-settings-content tab-pane fade m-4" role="tabpanel"></div>
    </div>
  </div>
</div>