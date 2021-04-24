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

import { SieveDesigner } from "./../../../toolkit/SieveDesigner.mjs";

import { SieveSourceBoxUI, SieveDropBoxUI } from "./../../../toolkit/widgets/Boxes.mjs";
import { SieveBlockUI } from "./SieveBlocksUI.mjs";

import { SieveMoveDragHandler } from "./../../../toolkit/events/DragHandler.mjs";

import { SieveConditionDropHandler } from "./../../../toolkit/events/DropHandler.mjs";

import { SieveTemplate } from "./../../../toolkit/utils/SieveTemplate.mjs";

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
    test.append(this.getSieve().test().html());
    test.classList.add("sivConditionalChild");

    const elm = document.createElement("div");
    elm.id = `sivElm${this.id()}`;
    elm.classList.add("sivConditional");
    elm.append(test);
    elm.append(super.createHtml(parent));

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
    elm.append(super.createHtml(parent));

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

         <div class="sivConditionCode" class="d-none">
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

      elm2.append((new SieveDropBoxUI(this, "sivConditionSpacer"))
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
      elm2.append(condition);

      const child = item.querySelector(".sivConditionChild").cloneNode(true);
      child.append(children[i].html());
      elm2.append(child);
    }

    elm2.append((new SieveDropBoxUI(this, "sivConditionSpacer"))
      .drop(new SieveConditionDropHandler())
      .html());

    const content = item.querySelector(".sivSummaryContent");
    content.id = `${this.uniqueId}-summary`;

    while (elm2.children.length)
      content.append(elm2.firstChild);

    const code = item.querySelector(".sivConditionCode");
    code.id = `${this.uniqueId}-code`;
    code.classList.add("d-none");

    const control = code.querySelector(".sivSummaryControls");
    control.querySelector(".sivIconCode").addEventListener("click", (e) => {
      return this.onToggleView(e);
    });

    parent.append(content);
    parent.append(code);

    return parent;
  }
}

SieveDesigner.register("condition/if", SieveIfUI);
SieveDesigner.register("condition/else", SieveElseUI);
SieveDesigner.register("condition", SieveConditionUI);
