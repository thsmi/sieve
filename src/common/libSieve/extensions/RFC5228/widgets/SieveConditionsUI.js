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

  /* global SieveDesigner */
  /* global SieveBlockUI */
  /* global SieveSourceBoxUI */
  /* global SieveMoveDragHandler */
  /* global SieveDropBoxUI */
  /* global SieveConditionDropHandler */

  /* global SieveTemplate */

  const IS_FIRST_ITEM = 0;

  /**
   * Provides a UI for the if statement
   */
  class SieveIfUI extends SieveBlockUI {

    /**
     * @inheritdoc
     */
    createHtml(parent) {

      const test = document.createElement("div");
      test.appendChild(this.getSieve().test().html());
      test.classList.add("sivConditionalChild");

      const elm = document.createElement("div");
      elm.id = `sivElm${this.id()}`;
      elm.classList.add("sivConditional");
      elm.appendChild(test);
      elm.appendChild(super.createHtml(parent));

      return elm;
    }
  }


  /**
   * Provides an UI for the Else statement
   */
  class SieveElseUI extends SieveBlockUI {

    /**
     * @inheritdoc
     */
    createHtml(parent) {
      const elm = document.createElement("div");
      elm.id = `sivElm${this.id()}`;
      elm.classList.add("sivConditional");
      elm.appendChild(super.createHtml(parent));

      return elm;
    }
  }

  /**
   * Provides an UI for Sieve conditions
   */
  class SieveConditionUI extends SieveSourceBoxUI {

    /**
     * @inheritdoc
     */
    constructor(elm) {
      super(elm);
      this.drag(new SieveMoveDragHandler());
    }


    /**
     * @inheritdoc
     */
    createHtml(parent) {

      const FRAGMENT =
      `<div>
         <div class="sivConditionText sivConditionIf">
           <div data-i18n="condition.if" style="flex: 1 1 auto"></div>
           <div class="sivSummaryControls">
             <span class="sivIconCode"></span>
           </div>
         </div>
         <div class="sivConditionText sivConditionElse">
           <div data-i18n="condition.else" style="flex: 1 1 auto"></div>
           <div class="sivSummaryControls">
             <span class="sivIconCode"></span>
           </div>
         </div>
         <div class="sivConditionText sivConditionElseIf">
           <div data-i18n="condition.elseif" style="flex: 1 1 auto"></div>
           <div class="sivSummaryControls">
             <span class="sivIconCode"></span>
           </div>
         </div>

         <div class="sivConditionChild"></div>

         <div class="sivSummaryContent"></div>

         <div class="sivConditionCode" style="display:none">
           <code></code>
           <div class="sivSummaryControls">
             <span class="sivIconEdit invisible"></span>
             <span class="sivIconCode"></span>
           </div>
         </div>
       </div>`;

      const item = (new SieveTemplate()).convert(FRAGMENT);

      parent.classList.add("sivCondition");
      parent.id = `sivElm${this.id()}`;

      const elm2 = document.createElement("div");

      const children = this.getSieve().children();
      for (let i = 0; i < children.length; i++) {

        elm2.appendChild((new SieveDropBoxUI(this, "sivConditionSpacer"))
          .drop(new SieveConditionDropHandler(), children[i])
          .html());

        let condition;
        if (i === IS_FIRST_ITEM) {
          condition = item.querySelector(".sivConditionIf");
        } else if (children[i].test) {
          condition = item.querySelector(".sivConditionElseIf").cloneNode(true);
        } else {
          condition = item.querySelector(".sivConditionElse").cloneNode(true);
        }

        condition.querySelector(".sivIconCode").addEventListener("click", (e) => {
          return this.onToggleView(e);
        });
        elm2.appendChild(condition);

        const child = item.querySelector(".sivConditionChild").cloneNode(true);
        child.appendChild(children[i].html());
        elm2.appendChild(child);
      }

      elm2.appendChild((new SieveDropBoxUI(this, "sivConditionSpacer"))
        .drop(new SieveConditionDropHandler())
        .html());

      const content = item.querySelector(".sivSummaryContent");
      content.id = `${this.uniqueId}-summary`;

      while (elm2.children.length)
        content.appendChild(elm2.firstChild);

      const code = item.querySelector(".sivConditionCode");
      code.id = `${this.uniqueId}-code`;

      const control = code.querySelector(".sivSummaryControls");
      control.querySelector(".sivIconCode").addEventListener("click", (e) => {
        return this.onToggleView(e);
      });

      parent.appendChild(content);
      parent.appendChild(code);

      return parent;
    }
  }

  if (!SieveDesigner)
    throw new Error("Could not register Conditional Widgets");

  SieveDesigner.register("condition/if", SieveIfUI);
  SieveDesigner.register("condition/else", SieveElseUI);
  SieveDesigner.register("condition", SieveConditionUI);

})(window);
