(function (exports) {

  "use strict";

  class AbstractTestReport {

    constructor(name) {
      this.name = name;
    }

    getName() {
      return this.name;
    }

    /**
     * Adds a sub report to this report
     *
     * @abstract
     * @param {string} name
     *   the sub reports name
     * @returns {AbstractTestReport}
     *   a self reference
     */
    addSubReport(name) {
      throw new Error(`Implement add(${name})`);
    }

    addInfo(msg) {
      throw new Error(`Implement addInfo(${msg})`);
    }

    addTrace(msg) {
      throw new Error(`Implement addTrace(${msg})`);
    }

    addError(ex) {
      throw new Error(`Implement addError(${ex})`);
    }

    addWarning(msg) {
      throw new Error(`Implement addWarning(${msg})`);
    }

    addSuccess() {
      throw new Error(`Implement addSuccess()`);
    }
  }

  exports.AbstractTestReport = AbstractTestReport;

})(this);
