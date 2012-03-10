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

SieveIfUI.prototype.__proto__ = SieveBlockUI.prototype;

SieveIfUI.prototype.createHtml
    = function ()
{
  return $("<div/>")
    .attr("id","sivElm"+this.id())
    .append(
      this.getSieve().test().html())
    .append($("<div/>")
      .text("# DO"))
    .append(
      SieveBlockUI.prototype.createHtml.call(this));
}


function SieveElseUI(elm)
{
  SieveBlockUI.call(this,elm); 
}

SieveElseUI.prototype.__proto__ = SieveBlockUI.prototype;

SieveElseUI.prototype.createHtml
    = function ()
{
  return $("<div/>")
           .attr("id","sivElm"+this.id())
           .append(
              SieveBlockUI.prototype.createHtml.call(this));
}


function SieveConditionUI(elm)
{
  SieveDragBoxUI.call(this,elm);
  this.flavour("sieve/action");
}

SieveConditionUI.prototype.__proto__ = SieveDragBoxUI.prototype;


SieveConditionUI.prototype.onDragEnter
    = function (event)
{   
  // Show Dropboxes
  $("#SieveCondition"+this.id()+" > .sivDropBox").show();
  return true;
}

SieveConditionUI.prototype.onDragExit
    = function (event)
{
  // Hide Dropboxes
  $("#SieveCondition"+this.id()+" > .sivDropBox").hide();
  return true;
}

SieveConditionUI.prototype.init
    = function ()
{
  /*
   <drop: test>
   if <test>
    <block>
   <drop: test>   
   else  if <test :dropA>
     <block>
   <drop: test>
   else
     <block>
   */
 /* 
dropA: wenn drop.owner == elm[0]
  if = createIf(test);  
  elsif = createElsIf(elms[0]);
  
  remove(elms[0]);
    
  append(0,elsif)
  append(0,if)
  
  
dropB: wenn drop.owner > elm[0] && drop.owner < length-1
  createElsIf(test)
  append(i,test)
        
dropC
  !hasElse 
  if (action)
    createElse(action)
  if (test)
    createElsIf(test)
  
  apend(length,item)
  */
 /*<dropA: test ->if,if->elsif>
 if <test>
 <block>
 <dropC: action -> else; test -> elsif>
 
 <dropA: test -> if>
 if <test>
 <block>
 <dropB: test -> elsif>
 else [[<drop: test -> elsif>]] 
 <block>
 <//dropC//> 
 
 <dropA>
 if <test>
   block
 <dropB>
 elsif <test>
   block
 <dropC>
 
 <dropA:test -> if>
 if <test>
   <block>
 <dropB:test -> elsif>
 elsif <test>
   <block>
 <dropB: test -> elsif>
 else [[<drop: test -> elsif>]] 
 <block>
 <//dropC//>
 */
     
  
  var elm = $("<div/>")
              .attr("id","SieveCondition"+this.id())
             /* .bind("dragexit",function(e) { return _this.onDragExit(e)})
              .bind("dragenter",function(e) { return _this.onDragEnter(e)})     
              .bind("dragdrop",function(e) { return _this.onDragExit(e)})*/       
    
  var children = this.getSieve().children();
                  
  for (var i=0; i<children.length;i++)
  {
    elm
      .append((new SieveDropBoxUI(this,children[i]))      
        .drop(new SieveConditionDropHandler()).html())
   
    if (i==0)
      elm.append($("<div/>").text("# IF"))
    else if (children[i].test)
      elm.append($("<div/>").text("# ELSE IF"))
    else
      elm.append($("<div/>").text("# ELSE"))
              
              
    elm.append(children[i].html());
  }
  
  elm
    .append((new SieveDropBoxUI(this))      
      .drop(new SieveConditionDropHandler()).html())  
   
  this.onDragExit();
  
  return elm;
}