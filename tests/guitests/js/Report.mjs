/*
 * The contents of this file are licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via
 * email from the author.
 *
 * Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 *
 */


/**
 * Implements a graphical report for a test case
 */
class TestCaseReport {

  /**
   * Creates a new instance.
   *
   * @param {TestCaseFixture} fixture
   *   the parent fixture which host this test.
   * @param {string} id
   *   the tests unique id.
   * @param {string} name
   *   the human readable test name.
   */
  constructor(fixture, id, name) {
    this.fixture = fixture;
    this.id = id;
    this.name = name;
  }

  /**
   * Returns the test's unique id.
   * @returns {string}
   *   the unique id.
   */
  getId() {
    return this.id;
  }

  /**
   * Returns the test' name.
   *
   * @returns {string}
   *  the test's name
   */
  getName() {
    return this.name;
  }

  /**
   * Checks if the given task is enabled.
   *
   * @returns {boolean}
   *   true in case the task is enabled otherwise false.
   */
  isEnabled() {
    const elm = document.querySelector(`#${this.id}`);

    if (!elm.checked)
      return false;

    return true;
  }

  /**
   * Toggles the test's enabled/disabled state.
   */
  toggle() {
    if (this.isEnabled())
      this.disable();
    else
      this.enable();
  }

  /**
   * Disables the test.
   */
  disable() {
    document.querySelector(`#${this.id}`).checked = false;
  }

  /**
   * Enabled the test.
   */
  enable() {
    document.querySelector(`#${this.id}`).checked = true;
  }

  /**
   * Initializes the test case report.
   *
   * @returns {TestCaseReport}
   *   a self reference.
   */
  init() {
    const template =
      `<!DOCTYPE html>
       <html>
         <head><meta charset="utf-8"></head>
         <body>
           <div class="form-check form-switch">
             <input type="checkbox" id="${this.getId()}" role="switch" class="form-check-input" checked>
             <label for="${this.getId()}" class="form-check-label">
               ${this.getName()}
             </label>
           </div>
         </body>
       </html>`;

    const elm = (new DOMParser())
      .parseFromString(template, "text/html").body.firstElementChild;

    this.fixture.getElement().appendChild(elm);

    return this;
  }

  /**
   * Marks the test as started.
   */
  start() {
    document
      .querySelector(`#${this.getId()}`)
      .parentNode.classList.add("text-primary");
  }

  /**
   * Marks the test as completed.
   */
  complete() {
    document
      .querySelector(`#${this.getId()}`)
      .parentNode.classList.remove("text-primary");

    document
      .querySelector(`#${this.getId()}`)
      .parentNode.classList.add("text-success");
  }

  /**
   * Marks the test a failed.
   *
   * @param {Exception} ex
   *   the exception which caused this error.
   */
  error(ex) {

    console.error(ex);

    document
      .querySelector(`#${this.getId()}`)
      .parentNode.classList.remove("text-primary");

    document
      .querySelector(`#${this.getId()}`)
      .parentNode.classList.add("text-danger");

    const alert = document.createElement("div");
    alert.classList.add("alert", "alert-danger");
    alert.role = "alert";
    alert.setAttribute("style", "font-size:0.8rem !important; padding: 0.8rem 0.8rem;");
    alert.textContent = ex.toString();

    document
      .querySelector(`#${this.getId()}`)
      .parentElement.appendChild(alert);
  }
}

/**
 * Implements a graphical report for a fixture which group multiple test cases.
 */
class TestFixtureReport {

  /**
   * Create a new instance.
   *
   * @param {TestSuiteReport} suite
   *   the test suite which owns this reports.
   * @param {string} id
   *   the reports unique id.
   * @param {string} name
   *   the fixtures human readable name.
   */
  constructor(suite, id, name) {
    this.id = id;
    this.name = name;
    this.suite = suite;
  }

  /**
   * Gets the fixtures unique id.
   *
   * @returns {string}
   *   the fixtures unique id.
   */
  getId() {
    return this.id;
  }

  /**
   * Gets the fixtures name.
   *
   * @returns {string}
   *   the fixtures name.
   */
  getName() {
    return this.name;
  }

  /**
   * The the root element which hosts the tests cases
   *
   * @returns {HTMLElement}
   *   the root element.
   */
  getElement() {
    return document.getElementById(`${this.getId()}-tests`);
  }

  /**
   * Initializes the test fixture report.
   *
   * @returns {TestFixtureReport}
   *   a self reference
   */
  init() {

    const template =
      `<!DOCTYPE html>
       <html>
         <head><meta charset="utf-8"></head>
         <body>
           <div class="card m-2 test-fixture" id="${this.getId()}">
             <div class="card-header">
               <span>${this.getName()}</span>
               <div class="form-check form-switch float-end test-fixture-toggle">
                 <input type="checkbox"
                   id="${this.getId()}-input"
                   role="switch" class="form-check-input" checked>
               </div>
             </div>
             <div class="card-body collapse show" id="${this.getId()}-tests">
             </div>
           </div>
         </body>
       </html>`;

    const elm = (new DOMParser())
      .parseFromString(template, "text/html").body.firstElementChild;

    this.suite.getElement().appendChild(elm);

    document.getElementById(`${this.getId()}-input`).addEventListener("change", () => {

      if (document.getElementById(`${this.getId()}-input`).checked)
        this.enable();
      else
        this.disable();
    });

    document.querySelector(`#${this.getId()} > .card-header`).addEventListener("click", () => {
      document.getElementById(`${this.getId()}-tests`).classList.toggle("show");
    });

    return this;
  }

  /**
   * Enables the given task.
   */
  enable() {
    const selector = `#${this.getId()}-tests .form-check-input`;

    for (const elm of document.querySelectorAll(selector))
      elm.checked = true;

    document.getElementById(`${this.getId()}-tests`).classList.add("show");
  }

  /**
   * Disables the given task.
   */
  disable() {

    document.getElementById(`${this.getId()}-tests`).classList.remove("show");

    const selector = `#${this.getId()}-tests .form-check-input`;

    for (const elm of document.querySelectorAll(selector))
      elm.checked = false;
  }

  /**
   * Creates an new test case report.
   *
   * @param {string} id
   *   the unique test case report
   * @param {string} name
   *   the human readable test case name
   * @returns {TestCaseReport}
   *   the test case report.
   */
  createReport(id, name) {
    return (new TestCaseReport(this, id, name)).init();
  }

}
/**
 * Implements a graphical report for a fixture which group multiple test fixtures.
 */
class TestSuiteReport {

  /**
   * Creates a text fixture report.
   *
   * @param {string} id
   *   the unique test fixture report
   * @param {string} name
   *   the human readable test fixture name
   * @returns {TestFixtureReport}
   *   the test fixture report.
   */
  createReport(id, name) {
    return (new TestFixtureReport(this, id, name)).init();
  }

  /**
   *
   * @returns {HTMLElement}
   *
   */
  getElement() {
    return document.getElementById("tests");
  }

  /**
   * Enables the given task.
   *
   * @param {string}  [id]
   *   optional, the task's unique id. If omitted all tasks will be enabled.
   */
  enable(id) {
    let selector = "#tests .test-fixture-toggle input";

    if (typeof(id) !== "undefined" && id !== null)
      selector = `#${id}`;

    for (const elm of document.querySelectorAll(selector))
      if (!elm.checked)
        elm.click();
  }

  /**
   * Disables the given task.
   *
   * @param {string}  [id]
   *   optional, the task's unique id. If omitted all tasks will be disabled.
   */
  disable(id) {
    let selector = "#tests .test-fixture-toggle input";

    if (typeof(id) !== "undefined" && id !== null)
      selector = `#${id}`;

    for (const elm of document.querySelectorAll(selector))
      if (elm.checked)
        elm.click();
  }


  /**
   * Clears the UI from displaying any test status.
   */
  reset() {
    for (const elm of document.querySelectorAll("#tests .text-success"))
      elm.classList.remove("text-success");

    for (const elm of document.querySelectorAll("#tests .text-danger"))
      elm.classList.remove("text-danger");

    for (const elm of document.querySelectorAll("#tests .text-primary"))
      elm.classList.remove("text-primary");

    for (const elm of document.querySelectorAll("#tests .alert-danger"))
      elm.parentNode.removeChild(elm);
  }

}

export {TestSuiteReport};
