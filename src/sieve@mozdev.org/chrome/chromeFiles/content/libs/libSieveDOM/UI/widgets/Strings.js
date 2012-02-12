function SieveStringListUI(elm)
{
  // Call parent constructor...
  SieveAbstractBoxUI.call(this,elm);
}

// Inherrit from DragBox
SieveStringListUI.prototype.__proto__ = SieveAbstractBoxUI.prototype;  

SieveStringListUI.prototype.onAddItem
    = function ()
{
  var val = $("#txtAddString"+this.getId()).val();  
  
  this.getSieve().append(val);
  
  $("#divAddString"+this.getId())
    .before(this._createItemUI(val));    
}

SieveStringListUI.prototype.onRemoveItem
    = function (elm)
{
  var text = elm.prev().text();  
  this.getSieve().remove(text);
  
  alert(elm.parent().remove().html());
}

SieveStringListUI.prototype._createItemUI
    = function (text)
{
  var that = this;
  return $("<div/>")
      .append($("<span/>")
        .text(text))
      .append($("<button/>")
        .click(function(ev){ that.onRemoveItem($(this));} )
        .text("-"));
}

SieveStringListUI.prototype.init
    = function ()
{
  var that = this;
  var headers = $("<div/>");
  
  for (var i=0; i< this.getSieve().size(); i++)
    headers.append(this._createItemUI(this.getSieve().item(i)))
  
  headers.append($("<div/>")
    .attr("id","divAddString"+this.getId())
    .append($("<input/>")
      .attr("id","txtAddString"+this.getId()))
    .append($("<button/>").text("+")
      .click(function(){ that.onAddItem() } )));
    
  return headers; 
}

SieveStringListUI.prototype.getWidget
    = function ()
{
  if (this._domElm)
    return this._domElm;

  var _this = this;
    
  this._domElm = this.init();
         
  return this._domElm;
}

/*****************************************************************************/

function SieveHeaderListUI(elm)
{
  // Call parent constructor...
  SieveStringListUI.call(this,elm);
}

// Inherrit from DragBox
SieveHeaderListUI.prototype.__proto__ = SieveStringListUI.prototype;  

SieveHeaderListUI.prototype.onSelect
    = function ()
{   
  var val = $("#cbHeaders"+this.getId()).val();
    
  if (val == "Customize...")
    $("#txtAddString"+this.getId()).show()
  else
    $("#txtAddString"+this.getId()).val(val).hide();

}

SieveHeaderListUI.prototype.init
    = function ()
{  
  var that = this;
  var header = SieveStringListUI.prototype.init.call(this)
    .children(":last")
    .prepend($("<select/>")
      .attr("id","cbHeaders"+this.getId())
      .change(function(){that.onSelect()})
      .append($("<option/>").text("Subject"))
      .append($("<option/>").text("Cc"))
      .append($("<option/>").text("From"))
      .append($("<option/>").text("To"))
      .append($("<option/>").text("Bcc"))
      .append($("<option/>").text("Date"))
      .append($("<option/>").text("---"))
      .append($("<option/>").text("Customize...")))
    .end()
    .find("#txtAddString"+this.getId())
      .hide()
      .val("Subject")
    .end();
      
  
  return header;
     
 // TODO select feeds input and input is hidden field, except if custom is slected.
       /*
      .val("blubber")
      .append($("<br/")));*/
  // Common headers
  // ["Subject","From","Date","Priority","Status","To","Cc","Bcc","List-Id","Mailing-List"]
     /*.children(":last")
       .children(":last").prev()
         .append($("<select/>")
         .append($("<option/>").text("Subject"))
         .append($("<option/>").text("Cc"))
         .append($("<option/>").text("From"))
         .append($("<option/>").text("To"))
         .append($("<option/>").text("Bcc"))
         .append($("<option/>").text("Date"))
         .append($("<option/>").text("---"))
         .append($("<option/>").text("Customize...")))
       
       .append($("<br/>")); */
}