function SieveTestUI(elm)
{
  SieveAbstractBoxUI.call(this,elm);
}

SieveTestUI.prototype.__proto__ = SieveAbstractBoxUI.prototype;


SieveTestUI.prototype.createHtml
    = function (parent)
{
  return parent.append($("<div/>")
    .append($("<div/>").text("address")))
    .append($("<div/>")
      .css("display","table")
      .append($("<div/>")
        .css({"display":"table-cell","vertical-align":"middle"})
        .append((new SieveStringListUI(this.getSieve().headerList))
          .defaults(["To","From","Cc","Bcc","Reply-To"]).html()))
      .append($("<div/>")
        .css({"display":"table-cell","vertical-align":"middle"})
        .append("<div>[ Contains&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|V ]</div>"))
      .append($("<div/>")
        .css({"display":"table-cell","vertical-align":"middle"})
        .append((new SieveStringListUI(this.getSieve().keyList)).html())));   
}

/*<style type="text/css">

div.container {
  border: 1px solid #000000;
  display:table;  
}

div.cell {
  padding:20px;
  display:table-cell;
  vertical-align:middle;
}

</style>

<div>
  <div>address</div>
  <div class="container">
    <div class="cell">
      <div>[ TO&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|+|X|V]</div>
      <div>[ From&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|+|X||V]</div>
      <div>[ BCC&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|+|X|V]</div> 
    </div>
    <div class="cell">
      <div>[ Contains&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|V ]</div>
    </div>
    <div class="cell">
      <div>[ Example.com&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|+|X|V]</div>
      <div>[ Example.org&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|+|X|V]</div>
    </div>
  </div>
</div>
<div>address</div>*/
if (!SieveDesigner)
  throw "Could not register Block Widgets";

SieveDesigner.register(SieveAddress, SieveTestUI);