<!-- Modal -->
<div id="sieve-import-dialog" class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
  <div class="modal-dialog" role="document">
    <div class="modal-content">

      <div class="modal-header">
        <h5 class="modal-title">Import Accounts</h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>

      <div class="modal-body">
        <div class="sieve-import-progress">
          <p>Verifying configuration, please wait...</p>
          <div class="progress">
            <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" aria-valuenow="100" aria-valuemin="0"
              aria-valuemax="100" style="width: 100%"></div>
          </div>
        </div>

        <div class="sieve-import-items"></div>

      </div>
    </div>
  </div>
</div>