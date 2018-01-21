<div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Security alert</h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <p>Your mail server's authenticity can not be verified!</p>
          <div class="alert alert-danger" role="alert">
            <p>Someone might tries to impersonate your mail server.</p>

            <p>You need to verify manually, if the fingerprint matches your mailserver's fingerprint.</p>
            <p class="sieve-dialog-fingerprint"></p>
          </div>

          <p>Continue only if the fingerprints match!</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-danger sieve-dialog-resolve">Continue</button>
        </div>
      </div>
    </div>
  </div>