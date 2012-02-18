function SieveMatchTypeUI(elm)
{
  SieveAbstractBoxUI.call(this,elm);
}

SieveMatchTypeUI.prototype.__proto__ = SieveAbstractBoxUI.prototype; 

SieveMatchTypeUI.prototype.onSelect
    = function ()
{
  var value = $("input[name='rgMatchType"+this.getId()+"']:checked").val(); 
  this.getSieve().matchType(value);
}

SieveMatchTypeUI.prototype.init
    = function ()
{
  var that = this;
  
  return $("<div/>")
    .append($("<div/>")
      .css("overflow","auto")
      .append($("<input/>")
        .attr("type","radio")
        .attr("name","rgMatchType"+this.getId())
        .css("float","left")
        .attr("value","contains")
        .change(function () {that.onSelect()}))
      .append($("<div/>")
        .css("float","left")
        .append($("<h1/>").text("... contains ..."))
        .append($("<span/>").text('e.g. "frobnitzm" contains "frob" and "nit", but not "fbm"'))))
    .append($("<div/>")
      .css("overflow","auto")
      .append($("<input/>")
        .attr("type","radio")
        .attr("name","rgMatchType"+this.getId())
        .css("float","left")
        .attr("value","is")
        .change(function () {that.onSelect()}))
      .append($("<div/>")
        .css("float","left")
        .append($("<h1/>").text("... is ..."))
        .append($("<span/>").text('e.g. only "frobnitzm" is "frobnitzm"'))))
    .append($("<div/>")
      .css("overflow","auto")
      .append($("<input/>")
        .attr("type","radio")
        .attr("name","rgMatchType"+this.getId())
        .css("float","left")
        .attr("value","matches")
        .change(function () {that.onSelect()}))
      .append($("<div/>")
        .css("float","left")        
        .append($("<h1/>").text("... matches ..."))
        .append($("<span/>").html('... as an wildcard match ...<br>'
          + '"*" matches zero or more characters, and "?" matches a single character <br>'
          + 'e.g.: "frobnitzm" matches "frob*zm" or "frobnit?m" but not frob?m '))))
    .find("input[name='rgMatchType"+this.getId()+"'][value='"+this.getSieve().matchType()+"']")
      .attr("checked","checked")
    .end();          
          
}

SieveMatchTypeUI.prototype.getWidget
    = function ()
{
  if (this._domElm)
    return this._domElm;

  var _this = this;
    
  this._domElm = this.init();
         
  return this._domElm;
}
//****************************************************************************//

function SieveAddressPartUI(elm)
{
  SieveAbstractBoxUI.call(this,elm);
}

SieveAddressPartUI.prototype.__proto__ = SieveAbstractBoxUI.prototype; 

SieveAddressPartUI.prototype.onSelect
    = function ()
{
  var value = $("input[name='rgAddressPart"+this.getId()+"']:checked").val(); 
  this.getSieve().addressPart(value);
}

SieveAddressPartUI.prototype.init
    = function ()
{
  var that = this;
  
  return $("<div/>")
    .append($("<div/>")
      .css("overflow","auto")
      .append($("<input/>")
        .attr("type","radio")
        .attr("name","rgAddressPart"+this.getId())
        .css("float","left")
        .attr("value","all")
        .change(function () {that.onSelect()}))
      .append($("<div/>")
        .css("float","left")
        .append($("<h1/>").text("... an email address with ..."))
        .append($("<span/>").html('An email address consists of a domain an a local part split by the "@" sign.<br>'
          + 'The local part is case sensitive while the domain part is not'))))
    .append($("<div/>")
      .css("overflow","auto")
      .append($("<input/>")
        .attr("type","radio")
        .attr("name","rgAddressPart"+this.getId())
        .css("float","left")
        .attr("value","domain")
        .change(function () {that.onSelect()}))
      .append($("<div/>")
        .css("float","left")
        .append($("<h1/>").text("... a domain part with ..."))
        .append($("<span/>").html('Everything after the @ sign. The domain part is not case sensistive.<br>'
          + 'e.g.: "me@example.com" is stripped to "example.com"'))))
    .append($("<div/>")
      .css("overflow","auto")
      .append($("<input/>")
        .attr("type","radio")
        .attr("name","rgAddressPart"+this.getId())
        .css("float","left")
        .attr("value","localpart")
        .change(function () {that.onSelect()}))
      .append($("<div/>")
        .css("float","left")        
        .append($("<h1/>").text("... a local part with..."))
        .append($("<span/>").html('Everything before the @ sign. The local part is case sensistive.<br>'
          + 'e.g.: "me@example.com" is stripped to "me"'))))
    .find("input[name='rgAddressPart"+this.getId()+"'][value='"+this.getSieve().addressPart()+"']")
      .attr("checked","checked")
    .end();           
          
}

SieveAddressPartUI.prototype.getWidget
    = function ()
{
  if (this._domElm)
    return this._domElm;

  var _this = this;
    
  this._domElm = this.init();
         
  return this._domElm;
}


//****************************************************************************//

function SieveComparatorUI(elm)
{
  SieveAbstractBoxUI.call(this,elm);
}

SieveComparatorUI.prototype.__proto__ = SieveAbstractBoxUI.prototype; 

SieveComparatorUI.prototype.onSelect
    = function ()
{
  var value = $("input[name='rgComparator"+this.getId()+"']:checked").val(); 
  this.getSieve().comparator(value);
}

SieveComparatorUI.prototype.init
    = function ()
{
  var that = this;
  return $("<div/>")
    .append($("<h1/>").text("Compare"))
    .append($("<div/>")
      .append($("<input/>")
        .attr("type","radio")
        .attr("name","rgComparator"+this.getId())
        .attr("value","i;ascii-casemap")
        .change(function () {that.onSelect()}))
      .append($("<span/>").text("Case insensitive ASCII String (default)")))
    .append($("<div/>")
      .append($("<input/>")
        .attr("type","radio")
        .attr("name","rgComparator"+this.getId())
        .attr("value","i;octet")
        .change(function () {that.onSelect()}))
      .append($("<span/>").text("Case sensitive UTF-8 Octetts")))
      .find("input[name='rgComparator"+this.getId()+"'][value='"+this.getSieve().comparator()+"']")
        .attr("checked","checked")
      .end();
}

SieveComparatorUI.prototype.getWidget
    = function ()
{
  if (this._domElm)
    return this._domElm;

  var _this = this;
    
  this._domElm = this.init();
         
  return this._domElm;
}

//****************************************************************************//

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

  elm.parent().remove();
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
  var headers = $("<div/>").addClass("SivStringList");
  
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
}