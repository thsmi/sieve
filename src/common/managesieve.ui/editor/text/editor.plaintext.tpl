<div>
  <div id="sieve-editor-toolbar" class="sticky py-2 bg-white">
    <div>
      <div class="btn-group mr-2" role="group">
        <button id="sieve-editor-cut" type="button" class="btn btn-sm btn-outline-secondary">Cut</button>
        <button id="sieve-editor-copy" type="button" class="btn btn-sm btn-outline-secondary">Copy</button>
        <button id="sieve-editor-paste" type="button" class="btn btn-sm btn-outline-secondary">Paste</button>
      </div>

      <div class="btn-group mr-2 " role="group">
        <button id="sieve-editor-undo" type="button" class="btn btn-sm btn-outline-secondary">Undo</button>
        <button id="sieve-editor-redo" type="button" class="btn btn-sm btn-outline-secondary">Redo</button>
      </div>

      <div class="btn-group mr-2 " role="group">
        <button id="sieve-editor-replace-replace" type="button" class="btn btn-sm btn-outline-secondary">Find &amp;
          Replace</button>
      </div>

      <a class="btn-group mr-2 btn btn-sm btn-outline-secondary"
         href="https://thsmi.github.io/sieve-reference/en/index.html"
         target="_blank" role="button">Reference</a>

    </div>
    <div id="sieve-editor-find-toolbar" style="display:none;">
      <hr />
      <div class="row">
        <div class="col-md-6">
          <div class="input-group mb-2">
            <input type="text" class="form-control form-control-sm" placeholder="Search for..."
              id="sieve-editor-txt-find"></input>
            <span class="input-group-btn">
              <button id="sieve-editor-find" class="btn btn-sm btn-outline-secondary" type="button">Find</button>
            </span>
          </div>
        </div>
        <div class="col-md-6">
          <div class="input-group mb-2">
            <input type="text" class="form-control form-control-sm" placeholder="Replace with..."
              id="sieve-editor-txt-replace"></input>
            <span class="input-group-btn">
              <button id="sieve-editor-replace" class="btn btn-sm btn-outline-secondary" type="button">Replace</button>
            </span>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-md-6">
          <div class="custom-control custom-checkbox">
            <input id="sieve-editor-casesensitive" type="checkbox" class="custom-control-input"></input>
            <label class="custom-control-label" for="sieve-editor-casesensitive">Match Case</label>
          </div>
        </div>
        <div class="col-md-6">
          <div class="custom-control custom-checkbox">
            <input id="sieve-editor-backward" type="checkbox" class="custom-control-input"></input>
            <label class="custom-control-label" for="sieve-editor-backward">Search Backward</label>
          </div>
        </div>
      </div>
    </div>

  </div>
  <form>
    <textarea id="code" name="code" class="form-control"></textarea>
  </form>
</div>