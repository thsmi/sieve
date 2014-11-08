/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */
 
"use strict";
 
function SieveIfUI(elm)
{
  SieveBlockUI.call(this,elm);
}

SieveIfUI.prototype = Object.create(SieveBlockUI.prototype);
SieveIfUI.prototype.constructor = SieveIfUI;

SieveIfUI.prototype.createHtml
    = function (parent)
{
  return $("<div/>")
    .attr("id","sivElm"+this.id())
    .addClass("sivConditional")
    .append(
       $("<div/>").append(this.getSieve().test().html())
          .addClass("sivConditionalChild"))
    .append(
      SieveBlockUI.prototype.createHtml.call(this,parent));
}


function SieveElseUI(elm)
{
  SieveBlockUI.call(this,elm); 
}

SieveElseUI.prototype = Object.create(SieveBlockUI.prototype);
SieveElseUI.prototype.constructor = SieveElseUI;

SieveElseUI.prototype.createHtml
    = function (parent)
{
  return $("<div/>")
           .attr("id","sivElm"+this.id())
           .addClass("sivConditional")
           .append(
              SieveBlockUI.prototype.createHtml.call(this,parent));
           
}


function SieveConditionUI(elm)
{
  SieveAbstractBoxUI.call(this,elm);
  this.drag(new SieveMoveDragHandler());
}

SieveConditionUI.prototype = Object.create(SieveAbstractBoxUI.prototype);
SieveConditionUI.prototype.constructor = SieveConditionUI;

SieveConditionUI.prototype.createHtml
    = function (parent)
{  
  var elm = $("<div/>")
              .attr("id","sivElm"+this.id())
              .addClass("sivCondition");     
    
  var children = this.getSieve().children();
                  
  for (var i=0; i<children.length;i++)
  {
    elm
      .append((new SieveDropBoxUI(this))      
        .drop(new SieveConditionDropHandler(),children[i])
        .html()
        .addClass("sivConditionSpacer"));
   
    if (i==0)
      elm.append($("<div/>").text("IF").addClass("sivConditionText"))
    else if (children[i].test)
      elm.append($("<div/>").text("ELSE IF").addClass("sivConditionText"))
    else
      elm.append($("<div/>").text("ELSE").addClass("sivConditionText"))
              
              
    elm.append(
      $("<div/>").append(children[i].html())
        .addClass("sivConditionChild"));
  }
  
  elm
    .append((new SieveDropBoxUI(this))      
      .drop(new SieveConditionDropHandler())
      .html()
      .addClass("sivConditionSpacer"));  
  
  return elm;
}

if (!SieveDesigner)
  throw "Could not register Conditional Widgets";

SieveDesigner.register("condition/if", SieveIfUI);
SieveDesigner.register("condition/else", SieveElseUI);
SieveDesigner.register("condition", SieveConditionUI);