<!-- template for the account -->
<div class="siv-tpl-account">
  <div class="card mt-4 mb-4">
    <div class="card-header">
      <span class="siv-account-name">Unnamed</span>

      <div class="dropdown float-right">
        <a class="btn btn-sm btn-outline-secondary dropdown-toggle" href="#" role="button" data-toggle="dropdown" aria-haspopup="true"
          aria-expanded="false">
          Settings
        </a>
        <div class="dropdown-menu dropdown-menu-right" aria-labelledby="dropdownMenuLink">
          <a class="dropdown-item sieve-account-edit-server" href="#">Edit Server Settings</a>
          <a class="dropdown-item sieve-account-delete-server" href="#">Delete Server</a>
          <div class="dropdown-divider"></div>
          <a class="dropdown-item sieve-account-disconnect-server" href="#">Disconnect</a>
          <a class="dropdown-item sieve-account-reconnect-server" href="#">Reconnect</a>
          <div class="dropdown-divider"></div>
          <a class="dropdown-item sieve-account-capabilities" href="#">Show Server Capabilities</a>
        </div>
      </div>
      <a class="btn btn-sm btn-outline-secondary float-right mr-1 siv-account-create" href="#" role="button">Create new script</a>
    </div>
    <ul class="list-group list-group-flush siv-tpl-scripts">
      <!--items go here -->
    </ul>
  </div>
</div>