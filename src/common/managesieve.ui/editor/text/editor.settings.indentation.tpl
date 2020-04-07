<div>
  <hr />
  <h5>Indentation</h5>
  <p class="form-text text-muted">
    <small>
      While editing script they can be checked for validity. The syntax check
      is performed by the server. In order to keep network traffic low, syntax
      check are grouped.
    </small>
  </p>
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
          <input type="radio" name="indentation-policy" autocomplete="off" />Use Spaces
        </label>
        <label id="editor-settings-indentation-policy-tabs" class="btn btn-outline-secondary btn-sm">
          <input type="radio" name="indentation-policy" autocomplete="off" />Use Tab
        </label>
      </div>
    </div>
  </div>
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
</div>