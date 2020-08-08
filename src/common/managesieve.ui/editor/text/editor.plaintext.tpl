<div>
  <div id="sieve-editor-toolbar" class="sticky py-2 bg-white">
    <div>
      <div class="btn-group mr-2" role="group">
        <button id="sieve-editor-cut" type="button" class="btn btn-sm btn-outline-secondary" data-i18n="texteditor.cut"></button>
        <button id="sieve-editor-copy" type="button" class="btn btn-sm btn-outline-secondary" data-i18n="texteditor.copy"></button>
        <button id="sieve-editor-paste" type="button" class="btn btn-sm btn-outline-secondary" data-i18n="texteditor.paste"></button>
      </div>

      <div class="btn-group mr-2 " role="group">
        <button id="sieve-editor-undo" type="button" class="btn btn-sm btn-outline-secondary" data-i18n="texteditor.undo"></button>
        <button id="sieve-editor-redo" type="button" class="btn btn-sm btn-outline-secondary" data-i18n="texteditor.redo"></button>
      </div>

      <div class="btn-group mr-2 " role="group">
        <button id="sieve-editor-replace-replace" type="button" class="btn btn-sm btn-outline-secondary"
        data-i18n="texteditor.findAndReplace"></button>
      </div>

      <a class="btn-group mr-2 btn btn-sm btn-outline-secondary"
         href="https://thsmi.github.io/sieve-reference/en/index.html"
         data-i18n="texteditor.reference"
         target="_blank" role="button"></a>

    </div>
    <div id="sieve-editor-find-toolbar" class="d-none mt-2">
      <div class="row">
        <div class="col-md-6">
          <div class="input-group mb-2">
            <input type="text" class="form-control form-control-sm" data-i18n="texteditor.find.text"
              id="sieve-editor-txt-find"></input>
            <span class="input-group-btn">
              <button id="sieve-editor-find" class="btn btn-sm btn-outline-secondary" type="button" data-i18n="texteditor.find"></button>
            </span>
          </div>
        </div>
        <div class="col-md-6">
          <div class="input-group mb-2">
            <input type="text" class="form-control form-control-sm" data-i18n="texteditor.replace.text"
              id="sieve-editor-txt-replace"></input>
            <span class="input-group-btn">
              <button id="sieve-editor-replace" class="btn btn-sm btn-outline-secondary" type="button" data-i18n="texteditor.replace"></button>
            </span>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-md-6">
          <div class="form-check">
            <input id="sieve-editor-casesensitive" type="checkbox" class="form-check-input"></input>
            <label class="form-check-label" for="sieve-editor-casesensitive" data-i18n="texteditor.matchCase"></label>
          </div>
        </div>
        <div class="col-md-6">
          <div class="form-check">
            <input id="sieve-editor-backward" type="checkbox" class="form-check-input"></input>
            <label class="form-check-label" for="sieve-editor-backward" data-i18n="texteditor.backwards"></label>
          </div>
        </div>
      </div>
    </div>

  </div>
  <form>
    <textarea id="code" name="code" class="form-control"></textarea>
  </form>
</div>