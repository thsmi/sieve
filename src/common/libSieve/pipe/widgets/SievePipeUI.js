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

  /* global SieveTestDialogBoxUI */
  /* global SieveActionDialogBoxUI */
  /* global SieveStringListWidget */
  /* global SieveDesigner */

  /* global SieveTemplate */

  /**
   *
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
      return "./pipe/templates/SieveFilterUI.html";
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
   *
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
      return "./pipe/templates/SievePipeUI.html";
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

  if (!SieveDesigner)
    throw new Error("Could not register Pipe Extension");

  SieveDesigner.register("action/pipe", SievePipeActionUI);
  SieveDesigner.register("action/filter", SieveFilterActionUI);

})(window);
