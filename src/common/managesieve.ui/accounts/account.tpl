<!-- template for the account -->
<div class="siv-tpl-account">
  <div class="card mt-4 mb-4">
    <div class="card-header d-flex justify-content-between py-0">
      <ul class="nav nav-tabs card-header-tabs my-0 pt-3" role="tablist">
        <li class="nav-item">
          <a class="sieve-accounts-tab nav-link active" data-toggle="tab" role="tab">
            <span class="siv-account-name">Unnamed</span>
          </a>
        </li>
        <li class="nav-item">
          <a class="sieve-settings-tab nav-link" data-toggle="tab" role="tab">Settings</a>
        </li>
      </ul>
      <div class="align-self-center">
        <button type="button" class="btn btn-sm btn-outline-secondary mr-1 siv-account-create">New script</button>
        <a class="btn btn-sm btn-outline-info mr-1 "
            href="https://www.paypal.com/paypalme2/thsmi"
            target="_blank" role="button">Donate</a>

        <div id="sieve-editor-settings" class="btn-group dropdown">
          <button class="btn btn-sm btn-outline-secondary dropdown-toggle" data-toggle="dropdown" aria-haspopup="true"
            aria-expanded="false">
            ☰
          </button>
          <div class="dropdown-menu dropdown-menu-right" aria-labelledby="dropdownMenuLink">
            <a class="dropdown-item sieve-account-edit-settings">Edit Settings</a>
            <div class="dropdown-divider"></div>
            <a class="dropdown-item sieve-account-disconnect-server">Disconnect</a>
            <a class="dropdown-item sieve-account-reconnect-server">Reconnect</a>
            <div class="dropdown-divider"></div>
            <a class="dropdown-item sieve-account-capabilities">Show Server Capabilities</a>
          </div>
        </div>

      </div>
    </div>
    <div class="list-group list-group-flush tab-content">
      <div class="sieve-accounts-content tab-pane fade show active" role="tabpanel">
        <ul class="list-group list-group-flush siv-tpl-scripts">
          <!--items go here -->
        </ul>
      </div>
      <div class="sieve-settings-content tab-pane fade m-4" role="tabpanel"></div>
    </div>
  </div>
</div>