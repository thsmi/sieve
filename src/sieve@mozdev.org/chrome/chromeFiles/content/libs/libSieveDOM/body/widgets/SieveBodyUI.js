 /*
 * The contents of this file are licenced. You may obtain a copy of 
 * the license at https://github.com/thsmi/sieve/ or request it via 
 * email from the author.
 *
 * Do not remove or change this comment.
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 *      
 */

"use strict";

/**
 * Implements controls to edit a sieve body test
 * 
 * "body" [COMPARATOR] [MATCH-TYPE] [BODY-TRANSFORM]  <key-list: string-list>
 * 
 * @param {} elm
 */
function SieveBodyUI(elm)
{
  SieveTestBoxUI.call(this,elm);
}

SieveBodyUI.prototype = Object.create(SieveTestBoxUI.prototype);
SieveBodyUI.prototype.constructor = SieveBodyUI;

SieveBodyUI.prototype.onValidate
    = function ()
{
  return true;      
}

SieveBodyUI.prototype.initHelp
    = function ()
{

  return $("<div/>")
      .html('The body test matches content in the body of an email message, that '
   +'is, anything following the first empty line after the header.  (The '
   +'empty line itself, if present, is not considered to be part of the '
   +'body.)');      
}

SieveBodyUI.prototype.initEditor
    = function()
{
  var comparator = new SieveComparatorUI(this.getSieve().comparator);
  var matchType = new SieveMatchTypeUI(this.getSieve().matchType);
  var bodyTransform = new SieveBodyTransformUI(this.getSieve().bodyTransform);
  var keyList = new SieveStringListUI(this.getSieve().keyList);
	
  
  /*From, To, Cc, Bcc, Sender, Resent-From, Resent-To*/
  return $("<div/>")
      .append($("<h1/>").text("The email's message body... "))
      .append(matchType.html())
      .append($("<h1/>").text("... any of the keyword(s). "))
      .append(keyList.html())   
      .append(comparator.html())      
      .append(bodyTransform.html());
         
}
  
SieveBodyUI.prototype.initSummary
    = function()
{
  // case- insensitive is the default so skip it...
  return $("<div/>")
      .html(" message body <em> "
                 + this.getSieve().matchType.matchType()+ " " 
                 + $('<div/>').text(this.getSieve().keyList.toScript()).html()+"</em>");
}

//------------------------------------------------------------------------------------------------------------/


/**
 * A UI Element wrapper which collets all possbile transforms and renders them
 * It keeps treck of the currently selected transform.
 * 
 * @param {} elm
 */

function SieveBodyTransformUI(elm)
{
  SieveAbstractBoxUI.call(this,elm);
  
  // TODO chekc if the element is a body transform..
}

SieveBodyTransformUI.prototype = Object.create(SieveAbstractBoxUI.prototype);
SieveBodyTransformUI.prototype.constructor = SieveBodyTransformUI;

SieveBodyTransformUI.nodeName = function () {
  return "body-transform";
}

SieveBodyTransformUI.nodeType  = function () {
  return "comparison";
}

SieveBodyTransformUI.prototype.update
    = function (value)
{ 
  this.getSieve().bodyTransform(value);
}

SieveBodyTransformUI.prototype.createHtml
    = function ()
{
  var type = this.getSieve().type;
  
  var item =  $("<div/>")
    .addClass("sivBodyTransform")
    .append($("<h1/>").text("Transform"))
  
  var widgets = SieveDesigner.getWidgetsByClass("body-transform/",this.id())
  
  var that = this;
  
  widgets.forEach(function(element) { 
    item.append(element.html(type, function(val) { that.update(val) } ));
  });
  
  
  var value = this.getSieve().bodyTransform();
   
  return item;
}


//----------------------------------------------------------------------------------------------------//

function SieveRawTransformUI(id)
{
  this.id = id;
}


SieveRawTransformUI.nodeName = function () {
  return "body-transform/raw";
}

SieveRawTransformUI.nodeType  = function () {
  return "body-transform/";
}

SieveRawTransformUI.isCapable = function (capabilities) {
  // TODO support capabilities...
  return true;      
}

SieveRawTransformUI.prototype.html 
    = function(type, callback) {

  var radio = 
    $("<input/>")
      .attr("type","radio")
      .attr("name","rgBodyTransform"+this.id)
      .attr("value",":content")
      .css("float","left");
          
  if (type.nodeName() == SieveRawTransformUI.nodeName())
    radio.prop('checked', true);          	
  
  radio.change( function() { callback(":raw"); } );  
  
  return $("<div/>")
     .css("overflow","auto")
     .append(radio)
     .append($("<span/>").text("Match against the entire undecoded message body").css("float","left"));      
}

//---------------------------------------------/

function SieveContentTransformUI(id)
{
	 this.id = id;
}


SieveContentTransformUI.nodeName = function () {
  return "body-transform/content";
}

SieveContentTransformUI.nodeType  = function () {
  return "body-transform/";
}

SieveContentTransformUI.isCapable = function (capabilities) {
  return true;      
}

SieveContentTransformUI.prototype.html 
    = function(type, callback) {
    
  // Create the elements
  var radio = 
    $("<input/>")
      .attr("type","radio")
      .attr("name","rgBodyTransform"+this.id)
      .attr("value",":content")
      .css("float","left")
   
  var text = 
    $("<input/>");      
    
  // in case the current element is equivalent with this element
  // we need to update the values.
  if (type.nodeName() == SieveContentTransformUI.nodeName()) {
    radio.prop('checked', true); 
    text.val(type.contentTypes.toScript());
  }
    
  // Add the changed handler. In this case it will fire when the radio button is selected and
  //  when the text was changes but only if the radio button is activated
  var handler = function() {
    if (!radio.prop("checked"))
      return;
      
   var value = text.val();
   

   if (value == "")
     value = '[""]';
   
    callback(":content "+value)
  }    
    
  radio.change( handler );
  text.change(handler);

  return $("<div/>")
      .css("overflow","auto")
      .append(radio)
      .append($("<div/>")
        .append($("<span/>").text("Match against the MIME parts that have the specified content types:"))
        .append("<br/>")
        .append(text));
        	
}



function SieveTextTransformUI(id)
{
  this.id = id;
}


SieveTextTransformUI.nodeName = function () {
  return "body-transform/text";
}

SieveTextTransformUI.nodeType  = function () {
  return "body-transform/";
}

SieveTextTransformUI.isCapable = function (capabilities) {
  // TODO support capabilities...
  return true;      
}

SieveTextTransformUI.prototype.html 
    = function(type, callback) {

  var radio = 
    $("<input/>")
      .attr("type","radio")
      .attr("name","rgBodyTransform"+this.id)
      .attr("value",":text")
      .css("float","left")
           
  if (type.nodeName() == SieveTextTransformUI.nodeName())
    radio.prop("checked",true);             
  
  radio.change( function() { callback(":text"); } );  
  
  return $("<div/>")
     .css("overflow","auto")
     .append(radio)
     .append($("<span/>").text("Match against the decoded message body. (Default)").css("float","left"));      
}


//************************************************************************************

if (!SieveDesigner)
  throw "Could not register Body Extension";

SieveDesigner.register("body-transform", "comparison", SieveBodyTransformUI);

SieveDesigner.register2(SieveTextTransformUI);
SieveDesigner.register2(SieveRawTransformUI);
SieveDesigner.register2(SieveContentTransformUI);


SieveDesigner.register("test/body", SieveBodyUI);
