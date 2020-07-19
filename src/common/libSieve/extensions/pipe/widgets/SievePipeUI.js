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

(function () {

  "use strict";

  /* global SieveActionDialogBoxUI */
  /* global SieveStringListWidget */
  /* global SieveDesigner */

  /* global SieveMoveDragHandler */
  /* global SieveTestDropHandler */

  /* global SieveTemplate */

  /**
   * Implements a UI for the pipe execute action/test
   */
  class SieveExecuteActionUI extends SieveActionDialogBoxUI {

    /**
     * The name of the program to be executed
     * @returns {SieveString}
     *   the program name as string.
     */
    program() {
      return this.getSieve().getElement("program");
    }

    /**
     * The command line arguments to be passed to the program.
     * @returns {SieveStringList}
     *   the arguments as string list.
     */
    arguments() {
      return this.getSieve().getElement("arguments");
    }

    /**
     * @inheritdoc
     */
    getTemplate() {
      return "./extensions/pipe/templates/SieveExecuteUI.html";
    }

    /**
     * @inheritdoc
     */
    onSave() {

      const program = document.querySelector("#sivExecuteProgram");

      if (!program.checkValidity())
        return false;

      this.program().value(program.value);

      (new SieveStringListWidget("#sivExecuteArguments"))
        .save(this.arguments());

      this.getSieve().enable("arguments",
        document.querySelector("#sivExecuteArgumentsCbx").checked);

      this.onSaveOutput();
      this.onSaveInput();

      return true;
    }

    /**
     * Saves the output options.
     */
    onSaveOutput() {
      // The output requires the variable capability
      if (!this.getSieve().hasElement("output"))
        return;

      this.getSieve().enable("output",
        document.querySelector("#sivExecuteOutputCbx").checked);

      this.getSieve().getElement("output").getElement("name").value(
        document.querySelector("#sivExecuteOutputName").value);
    }

    /**
     * Saves the input options.
     */
    onSaveInput() {

      const status = document.querySelector("#sivExecuteInputCbx").checked;
      const input = this.getSieve().getElement("input");

      // In case it is disabled we invalidate the current element.
      if (!status) {
        input.setCurrentElement();
        return;
      }

      // Otherwise we need to create or update the element.
      const nodeName = document
        .querySelector(`input[type="radio"][name="sieve-execute-input"]:checked`)
        .value;

      if (nodeName === "execute/input/input") {
        if (!input.hasCurrentElement() || input.getCurrentElement().nodeName() !== nodeName)
          input.setElement(':input ""' );

        input.getElement("data").value(
          document.querySelector("#sivExecuteInputName").value);
      }

      if (nodeName === "execute/input/pipe")
        if (!input.hasCurrentElement() || input.getCurrentElement().nodeName() !== nodeName)
          input.setElement(':pipe');
    }

    /**
     * Called when the input group changed.
     */
    onInputGroupChange() {
      if (document.querySelector("#sivExecuteInputCbx").checked)
        document.querySelector("#sivExecuteInputCbxContent").classList.remove("d-none");
      else
        document.querySelector("#sivExecuteInputCbxContent").classList.add("d-none");


    }

    /**
     * Called when the output group changed.
     */
    onOutputGroupChange() {
      if (document.querySelector("#sivExecuteOutputCbx").checked)
        document.querySelector("#sivExecuteOutputCbxContent").classList.remove("d-none");
      else
        document.querySelector("#sivExecuteOutputCbxContent").classList.add("d-none");
    }

    /**
     * @inheritdoc
     */
    onLoad() {

      document.querySelector("#sivExecuteProgram").value = this.program().value();

      (new SieveStringListWidget("#sivExecuteArguments"))
        .init(this.arguments());

      if (this.getSieve().enable("arguments"))
        document.querySelector("#sivExecuteArgumentsCbx").checked = true;

      if (this.getSieve().hasElement("output")) {

        document.querySelector("#sivExecuteOutput").classList.remove("d-none");

        if (this.getSieve().enable("output"))
          document.querySelector("#sivExecuteOutputCbx").checked = true;

        document.querySelector("#sivExecuteOutputName").value
          = this.getSieve().getElement("output").getElement("name").value();

        document.querySelector("#sivExecuteOutputCbx").addEventListener("change", () => {
          this.onOutputGroupChange();
        });

        this.onOutputGroupChange();
      }

      if (this.getSieve().getElement("input").hasCurrentElement()) {
        document.querySelector("#sivExecuteInputCbx").checked = true;

        const current = this.getSieve().getElement("input").getCurrentElement();

        document
          .querySelector(`input[type="radio"][name="sieve-execute-input"][value="${current.nodeName()}"]`)
          .checked = true;

        if (current.nodeName() === "execute/input/input")
          document.querySelector("#sivExecuteInputName").value = current.getElement("data").value();
      }

      document.querySelector("#sivExecuteInputCbx").addEventListener("change", () => {
        this.onInputGroupChange();
      });

      document.querySelector("#sivExecuteInputName").addEventListener("focus", () => {
        document.querySelector("#sivExecuteInputRb").checked = true;
      });

      this.onInputGroupChange();

      document.querySelector("#sivExecuteProgram").focus();
    }

    /**
     * @inheritdoc
     */
    getSummary() {
      const FRAGMENT =
        `<div>
         <span data-i18n="execute.summary"></span>
         <em class="sivExecuteProgram"></em>
       </div>`;

      const elm = (new SieveTemplate()).convert(FRAGMENT);
      elm.querySelector(".sivExecuteProgram").textContent = this.program().value();
      return elm;
    }
  }



  /**
   * Implements a UI for the pipe filter action/test
   */
  class SieveFilterActionUI extends SieveActionDialogBoxUI {

    /**
     * The name of the program to be executed
     * @returns {SieveString}
     *   the program name as string.
     */
    program() {
      return this.getSieve().getElement("program");
    }

    /**
     * The command line arguments to be passed to the program.
     * @returns {SieveStringList}
     *   the arguments as string list.
     */
    arguments() {
      return this.getSieve().getElement("arguments");
    }

    /**
     * @inheritdoc
     */
    getTemplate() {
      return "./extensions/pipe/templates/SieveFilterUI.html";
    }

    /**
     * @inheritdoc
     */
    onSave() {

      const program = document.querySelector("#sivFilterProgram");

      if (!program.checkValidity())
        return false;

      this.program().value(program.value);

      (new SieveStringListWidget("#sivFilterArguments"))
        .save(this.arguments());

      this.getSieve().enable("arguments",
        document.querySelector("#sivFilterArgumentsCbx").checked);

      return true;
    }

    /**
     * @inheritdoc
     */
    onLoad() {

      document.querySelector("#sivFilterProgram").value = this.program().value();

      (new SieveStringListWidget("#sivFilterArguments"))
        .init(this.arguments());

      if (this.getSieve().enable("arguments"))
        document.querySelector("#sivFilterArgumentsCbx").checked = true;


      document.querySelector("#sivFilterProgram").focus();
    }

    /**
     * @inheritdoc
     */
    getSummary() {
      const FRAGMENT =
        `<div>
         <span data-i18n="filter.summary"></span>
         <em class="sivFilterProgram"></em>
       </div>`;

      const elm = (new SieveTemplate()).convert(FRAGMENT);
      elm.querySelector(".sivFilterProgram").textContent = this.program().value();
      return elm;
    }
  }


  /**
   * Implements a UI for the pipe action/test
   */
  class SievePipeActionUI extends SieveActionDialogBoxUI {

    /**
     * The name of the program to be executed
     * @returns {SieveString}
     *   the program name as string.
     */
    program() {
      return this.getSieve().getElement("program");
    }

    /**
     * The command line arguments to be passed to the program.
     * @returns {SieveStringList}
     *   the arguments as string list.
     */
    arguments() {
      return this.getSieve().getElement("arguments");
    }

    /**
     * @inheritdoc
     */
    getTemplate() {
      return "./extensions/pipe/templates/SievePipeUI.html";
    }

    /**
     * @inheritdoc
     */
    onSave() {

      const program = document.querySelector("#sivPipeProgram");

      if (!program.checkValidity())
        return false;

      this.program().value(program.value);

      (new SieveStringListWidget("#sivPipeArguments"))
        .save(this.arguments());

      this.getSieve().enable("arguments",
        document.querySelector("#sivPipeArgumentsCbx").checked);

      this.getSieve().enable("try",
        document.querySelector("#sivPipeTryCbx").checked);

      if (this.getSieve().hasElement("copy")) {
        this.getSieve().enable("copy",
          document.querySelector("#sivPipeCopyCheckbox").checked);
      }

      return true;
    }

    /**
     * @inheritdoc
     */
    onLoad() {

      document.querySelector("#sivPipeProgram").value = this.program().value();

      (new SieveStringListWidget("#sivPipeArguments"))
        .init(this.arguments());

      if (this.getSieve().enable("arguments"))
        document.querySelector("#sivPipeArgumentsCbx").checked = true;

      if (this.getSieve().enable("try"))
        document.querySelector("#sivPipeTryCbx").checked = true;

      if (this.getSieve().hasElement("copy")) {
        document.querySelector("#sivPipeCopy").classList.remove("d-none");

        if (this.getSieve().enable("copy"))
          document.querySelector("#sivPipeCopyCheckbox").checked = true;
      }

      document.querySelector("#sivPipeProgram").focus();
    }

    /**
     * @inheritdoc
     */
    getSummary() {
      const FRAGMENT =
        `<div>
         <span data-i18n="pipe.summary"></span>
         <em class="sivPipeProgram"></em>
       </div>`;

      const elm = (new SieveTemplate()).convert(FRAGMENT);
      elm.querySelector(".sivPipeProgram").textContent = this.program().value();
      return elm;
    }
  }

  /**
   * An ugly hack which converts the Filer Action into a Filter Test.
   */
  class SieveFilterTestUI extends SieveFilterActionUI {

    /**
     * @inheritdoc
     */
    constructor(elm) {
      super(elm);

      this.drag(new SieveMoveDragHandler("sieve/test"));
      this.drop(new SieveTestDropHandler());
    }

    /**
     * @inheritdoc
     */
    createHtml(parent) {
      const elm = super.createHtml(parent);
      elm.classList.add("sivTest");
      elm.classList.remove("sivAction");
      return elm;
    }

    /**
     * @inheritdoc
     */
    getSummary() {
      const FRAGMENT =
        `<div>
         <span data-i18n="filter.summary.test.pre"></span>
         <em class="sivFilterProgram"></em>
         <span data-i18n="filter.summary.test.post"></span>
       </div>`;

      const elm = (new SieveTemplate()).convert(FRAGMENT);
      elm.querySelector(".sivFilterProgram").textContent = this.program().value();
      return elm;
    }

  }

  /**
   * An ugly hack which converts the Execute Action into a Execute Test.
   */
  class SieveExecuteTestUI extends SieveExecuteActionUI {

    /**
     * @inheritdoc
     */
    constructor(elm) {
      super(elm);

      this.drag(new SieveMoveDragHandler("sieve/test"));
      this.drop(new SieveTestDropHandler());
    }

    /**
     * @inheritdoc
     */
    createHtml(parent) {
      const elm = super.createHtml(parent);
      elm.classList.add("sivTest");
      elm.classList.remove("sivAction");
      return elm;
    }


    /**
     * @inheritdoc
     */
    getSummary() {
      const FRAGMENT =
        `<div>
         <span data-i18n="execute.summary.test.pre"></span>
         <em class="sivExecuteProgram"></em>
         <span data-i18n="execute.summary.test.post"></span>
       </div>`;

      const elm = (new SieveTemplate()).convert(FRAGMENT);
      elm.querySelector(".sivExecuteProgram").textContent = this.program().value();
      return elm;
    }
  }

  if (!SieveDesigner)
    throw new Error("Could not register Pipe Extension");

  SieveDesigner.register("action/pipe", SievePipeActionUI);
  SieveDesigner.register("action/filter", SieveFilterActionUI);
  SieveDesigner.register("action/execute", SieveExecuteActionUI);

  SieveDesigner.register("test/filter", SieveFilterTestUI);
  SieveDesigner.register("test/execute", SieveExecuteTestUI);

})(window);
