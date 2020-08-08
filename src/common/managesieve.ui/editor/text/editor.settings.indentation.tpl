<div>
  <hr />
  <h5 data-i18n="editor.indentation.title"></h5>
  <p class="form-text text-muted">
    <small data-i18n="editor.indentation.description"></small>
  </p>
  <div class="mb-3 row">
    <label data-i18n="editor.indentation.width" class="col-sm-3 col-form-label"></label>
    <div class="col-sm-2">
      <select id="editor-settings-indentation-width" class="form-control form-control-sm">
        <option value="0">0</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        <option value="5">5</option>
        <option value="6">6</option>
        <option value="7">7</option>
        <option value="8">8</option>
      </select>
    </div>
  </div>

  <div class="mb-3 row">
    <label class="col-sm-3 col-form-label" data-i18n="editor.indentation.policy"></label>
    <div class="col-sm-9">
      <div id="editor-settings-indentation-policy" class="btn-group">

        <input type="radio" class="btn-check" name="indentation-policy" id="editor-settings-indentation-policy-spaces"
          autocomplete="off">
        <label class="btn btn-outline-secondary btn-sm" for="editor-settings-indentation-policy-spaces"
          data-i18n="editor.indentation.spaces"></label>

        <input type="radio" class="btn-check" name="indentation-policy" id="editor-settings-indentation-policy-tabs"
          autocomplete="off">
        <label class="btn btn-outline-secondary btn-sm" for="editor-settings-indentation-policy-tabs"
          data-i18n="editor.indentation.tabs"></label>
      </div>
    </div>
  </div>
  <div class="mb-3 row">
    <label class="col-sm-3 col-form-label" data-i18n="editor.indentation.tabWidth"></label>
    <div class="col-sm-2">
      <select id="editor-settings-tabulator-width" class="form-control form-control-sm">
        <option value="0">0</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        <option value="5">5</option>
        <option value="6">6</option>
        <option value="7">7</option>
        <option value="8">8</option>
      </select>
    </div>
  </div>
</div>