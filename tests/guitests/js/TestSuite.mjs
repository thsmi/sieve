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

import { TestSuiteReport } from "./Report.mjs";
import { EventSimulator } from "./Simulator.mjs";

const RANDOM_SEED_SIZE = 10000000;
const HEX_STRING = 16;

const DEFAULT_DELAY = 1000;

/**
 * The basel class implemented by all clients.
 */
class AbstractTest {

  /**
   * Creates a new instance
   */
  constructor() {
    this.id = "siv-"
      + Math.floor(Math.random() * RANDOM_SEED_SIZE).toString(HEX_STRING)
      + Date.now().toString(HEX_STRING);
  }

  /**
   * Returns a unique and random id which can be used to identify this task
   * It is calculated when the object was created.
   *
   * @returns {string}
   *   a unique id
   */
  getId() {
    return this.id;
  }

  /**
   * Runs all enabled test in the the test suite.
   */
  async run() {
    throw new Error("Implement me");
  }
}

/**
 *
 */
class TestCase extends AbstractTest {

  /**
   * Create a new instance
   *
   * @param {string} name
   *   the testcase name
   * @param {Function} callback
   *
   */
  constructor(name, callback) {
    super();

    this.name = name;
    this.callback = callback;

    this.report = null;
  }

  /**
   * Returns the test case name.
   *
   * @returns {string}
   *   the test case name
   */
  getName() {
    return this.name;
  }

  /**
   *
   * @param {*} report
   */
  setReport(report) {
    this.report = report.createReport(this.getId(), this.getName());
  }

  /**
   * @inheritdoc
   */
  async run() {

    if (!this.report.isEnabled())
      return;

    try {
      this.report.start();

      const simulator = new EventSimulator("main");

      if (document.getElementById("cbThrottle").checked)
        simulator.setThrottle(DEFAULT_DELAY);

      if (document.getElementById("cbDropBox").checked)
        simulator.setHighlightDropBox(true);

      await simulator.load("./../gui/libSieve/SieveGui.html");

      try {
        await this.callback(simulator);
      } finally {
        await simulator.unload();
      }

      this.report.complete();

    } catch (ex) {
      this.report.error(ex);
    }


  }
}

/**
 *
 */
class TestFixture extends AbstractTest {


  /**
   * Creates a new instance.
   *
   * @param {string} name
   *   the fixture's name
   */
  constructor(name) {
    super();

    this.tests = [];
    this.report = null;

    this.name = name;
  }

  /**
   * Gets the fixtures name.
   *
   * @returns {string}
   *   the fixture's name
   */
  getName() {
    return this.name;
  }

  /**
   *
   * @param {*} report
   */
  setReport(report) {
    this.report = report.createReport(this.getId(), this.getName());
  }

  /**
   * Adds a test case to the fixture.
   *
   * @param {string} name
   *   the test case's unique name
   * @param {Function} callback
   *   the callback to be called to run the test
   * @returns {TestCase}
   *   the newly created test case.
   */
  add(name, callback) {
    const test = new TestCase(name, callback);
    this.tests.push(test);

    test.setReport(this.report);

    return test;
  }

  /**
   * @inheritdoc
   */
  async run() {

    for (const test of this.tests) {
      await test.run();
    }
  }
}

/**
 *
 */
class TestSuite {

  /**
   * Creates a new instance.
   */
  constructor() {
    this.fixtures = [];
    this.report = new TestSuiteReport();
  }

  /**
   * Adds a new fixture to the test suite.
   *
   * @param {string} name
   *   the fixtures human readable description.
   *
   * @returns {TestFixture}
   *   the newly create fixture.
   */
  add(name) {

    const fixture = new TestFixture(name);
    this.fixtures.push(fixture);

    fixture.setReport(this.report);

    return fixture;
  }

  /**
   * Enables the given test id.
   *
   * @param {string} [id]
   *   the optional test id, if omitted all test will be enabled.
   */
  enable(id) {
    this.report.enable(id);
  }

  /**
   * Disables the given test id.
   *
   * @param {string} [id]
   *   the optional test id, if omitted all test will be disabled .
   */
  disable(id) {
    this.report.disable(id);
  }

  /**
   * @inheritdoc
   */
  async run() {

    this.report.reset();

    for (const fixture of this.fixtures)
      await fixture.run();
  }
}

const suite = new TestSuite();

export { suite };
