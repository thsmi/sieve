/* global window */
 
 
(function(/*exports*/) {

"use strict";  
  /* global $: false */
  /* global SieveDesigner */
  
  /* global SieveAbstractBoxUI */
	/* global SieveAddress */
	/* global SieveStringListUI */

  /******************************************************************************/
  
  function SieveTestUI(elm)
  {
    SieveAbstractBoxUI.call(this,elm);
  }
  
  SieveTestUI.prototype = Object.create(SieveAbstractBoxUI.prototype);
  SieveTestUI.prototype.constructor = SieveTestUI;
  
  
  SieveTestUI.prototype.createHtml
      = function (parent)
  {  
    
    return parent.append($("<div/>")
      .append($("<div/>").text("address"))
      .append($("<button/>").text("Trash")))
      .append($("<div/>")
        .css("display","table")
        .append($("<div/>")
          .css({"display":"table-cell","vertical-align":"middle"})
          .append((new SieveStringListUI(this.getSieve().headerList))
            .defaults(["To","From","Cc","Bcc","Reply-To"]).html()))
        .append($("<div/>")
          .css({"display":"table-cell","vertical-align":"middle"})
          .append((new SieveMatchType2UI(this.getSieve().matchType)).html()))
        .append($("<div/>")
          .css({"display":"table-cell","vertical-align":"middle"})
          .append((new SieveStringListUI(this.getSieve().keyList)).html())));   
  };
  
  function SieveMatchType2UI(elm)
  {
    SieveAbstractBoxUI.call(this,elm);
  }
  
  SieveMatchType2UI.prototype = Object.create(SieveAbstractBoxUI.prototype);
  SieveMatchType2UI.prototype.constructor = SieveMatchType2UI;
  
  
  SieveMatchType2UI.prototype.createHtml
      = function (parent)
  {
    return parent.append($("<select/>")
      .append($("<option/>").text("is"))
      .append($("<option/>").text("matches"))
      .append($("<option/>").text("contains")));
  };
  
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
  
}());
