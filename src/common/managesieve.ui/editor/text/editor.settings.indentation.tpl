<div>
  <hr />
  <h5 data-i18n="editor.indentation.title"></h5>
  <p class="form-text text-muted">
    <small data-i18n="editor.indentation.description"></small>
  </p>
  <div class="form-group row">
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
  <div class="form-group row">
    <label class="col-sm-3 col-form-label" data-i18n="editor.indentation.policy"></label>
    <div class="col-sm-9">
      <div id="editor-settings-indentation-policy" class="btn-group btn-group-toggle" data-toggle="buttons">
        <label id="editor-settings-indentation-policy-spaces" class="btn btn-outline-secondary btn-sm">
          <input type="radio" name="indentation-policy" autocomplete="off"/>
          <span data-i18n="editor.indentation.spaces"></span>
        </label>
        <label id="editor-settings-indentation-policy-tabs" class="btn btn-outline-secondary btn-sm">
          <input type="radio" name="indentation-policy" autocomplete="off"/>
          <span data-i18n="editor.indentation.tabs"></span>
        </label>
      </div>
    </div>
  </div>
  <div class="form-group row">
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