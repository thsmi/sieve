// Create the namespace...
// Our server is implemented within an anonymous method...

(function (exports) {


  /* global BrowserTestSuite */
  /* global BrowserTestReport */

  /**
   * The main entry point executed as soon as the document is fully loaded.
   */
  function main() {

    const suite = new BrowserTestSuite();

    document.querySelector("#toggleTrace").addEventListener('click', () => {
      document.querySelector("#divOutput").classList.toggle("showTrace");
    });

    document.querySelector("#start").addEventListener('click', () => {

      for (const value of exports.tests.values()) {
        if (value.disabled)
          value.disabled = false;
      }

      for (const elm of document.querySelectorAll("#tests input[type=checkbox]:not(:checked)")) {
        const name = elm.value;

        if (exports.tests.get(name).script)
          exports.tests.get(name).disabled = true;
      }

      const report = new BrowserTestReport();
      report.clear();

      suite.load(exports.tests);
      suite.run(report);
    });

    document.querySelector("#tests-none").addEventListener('click', () => {

      const items = document.querySelectorAll("#tests input[type=checkbox]");
      for (const item of items)
        item.checked = false;
    });

    document.querySelector("#tests-all").addEventListener('click', () => {

      const items = document.querySelectorAll("#tests input[type=checkbox]");
      for (const item of items)
        item.checked = true;
    });

    document.querySelector("#result-clear").addEventListener('click', () => {
      const container = document.querySelector("#divOutput");
      while (container.firstChild)
        container.removeChild(container.firstChild);

      for (const elm of document.querySelectorAll("#tests .success"))
        elm.classList.remove("success");

      for (const elm of document.querySelectorAll("#tests .failure"))
        elm.classList.remove("failure");
    });

    /**
     * Scrolls the give test name into view
     *
     * @param {string} test
     *   the test name
     */
    function gotoTest(test) {
      document
        .querySelector(`#divOutput div[data-name='${test}']`)
        .scrollIntoView();
    }


    const elm = document.querySelector("#tests");

    for (const [name, value] of exports.tests.entries()) {

      if (!value.script)
        continue;

      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = true;
      input.value = name;

      const span = document.createElement("span");
      span.textContent = name;
      span.addEventListener("click", () => {
        gotoTest(name);
      });

      const div = document.createElement("div");
      div.appendChild(input);
      div.appendChild(span);

      elm.appendChild(div);
    }
  }

  if (document.readyState !== 'loading')
    (async () => { await main(); })();
  else
    document.addEventListener('DOMContentLoaded', async () => { await main(); }, { once: true });

})(this);
