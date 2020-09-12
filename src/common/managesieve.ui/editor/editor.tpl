<div>
  <div class="container">
    <div class="card mt-4 mb-2">
      <div class="sticky">
        <div class="card-header d-flex justify-content-between py-0">
          <ul class="nav nav-tabs card-header-tabs my-0 pt-3" role="tablist">
            <li class="nav-item">
              <a class="nav-link" data-i18n="editor.script" data-toggle="tab" href="#sieve-widget-editor"
                role="tab"></a>
            </li>
            <li class="nav-item">
              <a class="nav-link active" data-i18n="editor.source" data-toggle="tab" href="#sieve-plaintext-editor"
                role="tab"></a>
            </li>
            <li class="nav-item">
              <a id="sieve-tab-settings" data-i18n="editor.settings" class="nav-link" data-toggle="tab"
                href="#sieve-content-settings" role="tab"></a>
            </li>
          </ul>
          <div class="align-self-center">
            <button type="button" class="btn btn-sm btn-outline-secondary mr-1" id="sieve-editor-save">
              <span id="sieve-editor-saving" class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
              <span data-i18n="editor.save"></span>
            </button>
            <a class="btn btn-sm btn-outline-info mr-1 " href="https://www.paypal.com/paypalme2/thsmi" target="_blank"
              role="button" data-i18n="editor.donate"></a>

            <div id="sieve-editor-settings" class="btn-group dropdown">
              <a class="btn btn-sm btn-outline-secondary dropdown-toggle" role="button" data-toggle="dropdown"
                aria-haspopup="true" aria-expanded="false">
                ☰
              </a>
              <div class="dropdown-menu dropdown-menu-right" aria-labelledby="dropdownMenuLink">
                <a data-i18n="editor.menu.settings" class="dropdown-item sieve-editor-settings-show"></a>
                <a data-i18n="editor.menu.reload" class="dropdown-item"
                  href="javascript:window.location.reload(true)"></a>
                <div class="dropdown-divider"></div>
                <a data-i18n="editor.menu.import" class="dropdown-item sieve-editor-import"></a>
                <a data-i18n="editor.menu.export" class="dropdown-item sieve-editor-export"></a>
              </div>
            </div>
          </div>
        </div>
        <div id="sieve-editor-toolbar" class="p-2" style="border-bottom: 1px solid #eee;">
          <!-- insert toolbars here -->
        </div>
        <div id="sieve-editor-errors" class="p-2"></div>
      </div>

      <div id="sieve-tab-content"
        class="list-group list-group-flush siv-tpl-scripts tab-content mx-2 mb-2 border-top-0">
        <div id="sieve-content-settings" class="tab-pane m-4" role="tabpanel"></div>
        <iframe id="sieve-widget-editor" class="tab-pane" role="tabpanel"
          src="./../../libs/libSieve/SieveGui.html"></iframe>
        <div id="sieve-plaintext-editor" class="tab-pane show active" role="tabpanel">
          <!-- insert editor here ... -->
        </div>
      </div>

    </div>

    <div id="sieve-editor-msg">
      <!-- We do some magic here. First we render the real content-->
      <div class="footer fixed-bottom container">
        <div>
          <div class="alert alert-warning mx-2" role="alert">
            <h4 class="alert-heading" data-i18n="editor.error"></h4>
            <p class="sieve-editor-msg-details"></p>
          </div>
        </div>
      </div>

      <!-- An invisible element which ensures there is alway enough -->
      <!-- so that the message never overlays the textbox -->
      <!-- it is like a dynamically sized space -->
      <div class="footer container invisible">
        <div style="margin: 1px;">
          <div class="alert alert-warning mx-2" role="alert">
            <h4 class="alert-heading" data-i18n="editor.error"></h4>
            <p class="sieve-editor-msg-details"></p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>