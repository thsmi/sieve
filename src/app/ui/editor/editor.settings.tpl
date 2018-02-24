<div>
  <h5>Syntax check</h5>
  <p>While editing script they can be checked for validity. The syntax check is performed by the server. In order to keep network
    traffic low, syntax check are grouped.
  </p>
  <div class="form-group row">
    <label class="col-sm-3 col-form-label">Syntax check</label>
    <div class="col-sm-9">
      <div class="btn-group btn-group-toggle" data-toggle="buttons">
        <label class="btn btn-outline-secondary btn-sm" id="sieve-editor-settings-synatxcheck-on">
          <input type="radio" name="tabulator-policy" autocomplete="off">Enabled
        </label>
        <label class="btn btn-outline-secondary btn-sm" id="sieve-editor-settings-synatxcheck-off">
          <input type="radio" name="tabulator-policy" autocomplete="off">Disabled
        </label>
      </div>
    </div>
  </div>

  <hr>
  <h5>Indentation</h5>
  <p>The plain text editor supports automatic indenting</p>
  <div class="form-group row">
    <label class="col-sm-3 col-form-label">Indention width</label>
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
    <label class="col-sm-3 col-form-label">Indention Policy</label>
    <div class="col-sm-9">
      <div id="editor-settings-indentation-policy" class="btn-group btn-group-toggle" data-toggle="buttons">
        <label id="editor-settings-indentation-policy-spaces" class="btn btn-outline-secondary btn-sm">
          <input type="radio" name="indentation-policy" autocomplete="off">Use Spaces
        </label>
        <label id="editor-settings-indentation-policy-tabs" class="btn btn-outline-secondary btn-sm">
          <input type="radio" name="indentation-policy" autocomplete="off">Use Tab
        </label>
      </div>
    </div>
  </div>

  <hr>
  <h5>Tabulator</h5>
  <p>
    Text editors with automatic indenting replacted the need for the tab key, but there are still many editor which default to
    tabs due to historic reason.
  </p>
  <div class="form-group row">
    <label class="col-sm-3 col-form-label">Tab width</label>
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
  <div class="form-group row">
    <label class="col-sm-3 col-form-label">Tab Policy</label>
    <div class="col-sm-9">
      <div id="editor-settings-tabulator-policy" class="btn-group btn-group-toggle" data-toggle="buttons">
        <label id="editor-settings-tabulator-policy-spaces" class="btn btn-outline-secondary btn-sm">
          <input type="radio" name="tabulator-policy" autocomplete="off">Insert Spaces
        </label>
        <label id="editor-settings-tabulator-policy-tabs" class="btn btn-outline-secondary btn-sm">
          <input type="radio" name="tabulator-policy" autocomplete="off">Insert Tabs
        </label>
      </div>
    </div>
  </div>

  <hr>
  <h5>Defaults</h5>
  <p>
    Use the current settings as default for all editor instances or load the default values.
  </p>
  <div class="float-right">
    <a id="editor-settings-save-defaults" class="btn btn-sm btn-outline-secondary" role="button">Save as defaults</a>
    <a id="editor-settings-load-defaults" class="btn btn-sm btn-outline-secondary mr-1" role="button">Load defaults</a>
  </div>
</div>