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
 
 /* global window */
 
"use strict";
 
(function(exports) {
   
  /* global $: false */ 
  /* global SieveMoveDragHandler */
  /* global SieveTestDropHandler */
  /* global SieveDropHandler */
  /* global SieveTrashBoxDropHandler */
  
  // TODO Add button to show selection source...
   
  /**
   * can be an document or element...
   * @param {} elm
   *   sieve element is bound to this box.
   */
  function SieveAbstractBoxUI(elm)
  {  
    if (!elm)
     throw "Element expected";
  
    if (!elm.document && !elm.root)
      throw "Neiter a Sieve Element nor a Sieve Document";
      
    this._elm = elm;
    this._handler = {};
  }
  
  /**
   * Return the nesteds unique id. In case no sieve element is bound to 
   * this element it return -1 
   * 
   * @return {int}
   *   An Integer as unique identifiert for the nested sieve element. 
   */
  SieveAbstractBoxUI.prototype.id
      = function()
  {
    if (this._elm.document)
      return this._elm.id();
      
    return -1;
  };
  
  /**
   * Returns the sieve Element bound to this box.
   * In case no element is bound, an exception will be thrown
   * 
   * @return {}
   *   the sieve object bound to this box
   */
  SieveAbstractBoxUI.prototype.getSieve
      = function ()
  {
    if (!this._elm.document)
      throw "No Sieve Element bound to this box";
      
    return this._elm;
  };
  
  SieveAbstractBoxUI.prototype.document
      = function()
  {
    if (this._elm.document)
      return this._elm.document();
      
    return this._elm;
  };
  
  SieveAbstractBoxUI.prototype.createHtml
      = function (parent)
  {
    throw "Implement html()";      
  };
  
  SieveAbstractBoxUI.prototype.html
      = function (invalidate)
  {    
    if (this._domElm && !invalidate)
      return this._domElm;
      
    this._domElm = this.createHtml($("<div/>"));  
    
    if (this.id() > -1)
      this._domElm.attr("id","sivElm"+this.id());
    
    // update all our event handlers
    for (var topic in this._handler)
      if (this._handler[topic].attach)
        this._handler[topic].attach(this._domElm);
    
    return this._domElm;
  };
  
  SieveAbstractBoxUI.prototype.reflow
      = function ()
  {
    if (this.id() < 0)
      throw "Invalid id";
      
    var item = $("#sivElm"+this.id());
    
    if ((!item.length) || (item.length >1))
      throw ""+item.length+" Elements found for #sivElm"+this.id();
     
    this._domElm = null;
    
    item.replaceWith(this.html());
  };
  
  SieveAbstractBoxUI.prototype.toScript
      = function ()
  {
    if (this._elm.document)
      return this._elm.toScript();
      
    return "";
  };
  
  
  /**
   * THe dop element
   * @param {} handler
   * @param {} target
   * @return {}
   */
  SieveAbstractBoxUI.prototype.drop
      = function (handler,sibling)
  {
    if (typeof(handler) == "undefined")
      return this._handler["drop"];
      
     //release old handler
     if (this._handler["drop"])
       this._handler["drop"].bind(null);
     
     this._handler["drop"] = handler;
     this._handler["drop"].bind(this,sibling);
    
     return this;
  };
  
  SieveAbstractBoxUI.prototype.drag
      = function (handler)
  {
    if (typeof(handler) === "undefined")
      return this._handler["drag"];
      
     //release old handler
     if (this._handler["drag"])
       this._handler["drag"].bind(null);
      
     this._handler["drag"] = handler;
     this._handler["drag"].bind(this);
     
     return this;
  };
  
  
  /******************************************************************************/
  
  
  function SieveEditableBoxUI(elm)
  {
    // Call parent constructor...
    SieveAbstractBoxUI.call(this,elm);
  }
  
  // Inherrit from DragBox
  SieveEditableBoxUI.prototype = Object.create(SieveAbstractBoxUI.prototype);
  SieveEditableBoxUI.prototype.constructor = SieveEditableBoxUI;
  
  SieveEditableBoxUI.prototype.onValidate
      = function(e)
  {
    return true;
  };
  
  SieveEditableBoxUI.prototype.showEditor
      = function(e)
  { 
    if (!this.initEditor)
      return;
      
    var _this = this;      
        
    this._domElm.children(".sivSummaryContent").remove();
    
    this._domElm
      .append($("<div/>")
        .text("X")
        .addClass("sivEditorCloseIcon")
        .click(function(e) { _this.showSummary();   e.preventDefault(); return true; }));
          
    if (this.initHelp)
      this._domElm
        .append($("<div/>")
          .text("?")
          .addClass("sivEditorHelpIcon")
          .click(function() { $(this)/*.toggle()*/.next().toggle();}))
        .append(this.initHelp()
          .click(function() { $(this).toggle()/*.next().toggle()*/;})
          .addClass("sivEditorHelpText"));
          
    this._domElm    
      .attr("sivIsEditable",  "true")
      .append(this.initEditor()
        .addClass("sivEditorContent"))
      .append($("<div/>")
        .addClass("sivControlBox")
        .append($("<button/>")
          .text("Ok")
          .click(function(e) { _this.showSummary();   e.preventDefault(); return true; } ))
        .append($("<div/>")));
      
  };
  
  SieveEditableBoxUI.prototype.showSummary
      = function (e)
  {
    try
    {
      this.onValidate();
    }
    catch (ex)
    {
      this._domElm.find(".sivControlBox > div").text(ex);
      return;
    }
      
    var _this = this;
      
    this._domElm
      .removeAttr("sivIsEditable")
        .children(".sivEditorContent,.sivControlBox,.sivEditorHelpText,.sivEditorHelpIcon,.sivEditorCloseIcon")
          .remove()
        .end()
        .append(this.initSummary()
          .addClass("sivSummaryContent")
          .click(function(e) { _this.showEditor();   e.preventDefault(); return true; } ));
          
    return;
  };
  
  
  SieveEditableBoxUI.prototype.createHtml
      = function (parent)
  {
    if (typeof(parent) == "undefined")
      throw "parent parameter is missing";
      
    var _this = this;
    
    //parent =  SieveAbstractBoxUI.prototype.createHtml.call(this,parent);
    
    parent.addClass((this.initEditor)?"sivEditableElement":"");
    
    if(this.initSummary)
      parent.append(this.initSummary()
        .addClass("sivSummaryContent")
        .click(function(e) { _this.showEditor();   e.preventDefault(); return true; } ));
     
    if (this.id() != -1)
      parent.attr("id","sivElm"+this.id());
      
    return  parent;
  };
  
  /******************************************************************************/
  
  function SieveTestBoxUI(elm)
  {
    // Call parent constructor...
    SieveEditableBoxUI.call(this,elm);  
    this.drag(new SieveMoveDragHandler("sieve/test"));
    this.drop(new SieveTestDropHandler()); 
  }
  
  SieveTestBoxUI.prototype = Object.create(SieveEditableBoxUI.prototype);
  SieveTestBoxUI.prototype.constructor = SieveTestBoxUI;
  
  SieveTestBoxUI.prototype.createHtml
      = function (parent)
  {
    return SieveEditableBoxUI.prototype.createHtml.call(this,parent)
      .addClass("sivTest");
  };
  
  /******************************************************************************/
  
  function SieveOperatorBoxUI(elm)
  {
    // Call parent constructor...
    SieveEditableBoxUI.call(this,elm);  
    this.drag(new SieveMoveDragHandler("sieve/operator"));
    this.drop(new SieveTestDropHandler()); 
  }
  
  SieveOperatorBoxUI.prototype = Object.create(SieveEditableBoxUI.prototype);
  SieveOperatorBoxUI.prototype.constructor = SieveOperatorBoxUI;
  
  SieveOperatorBoxUI.prototype.createHtml
      = function (parent)
  {
    return SieveEditableBoxUI.prototype.createHtml.call(this,parent)
      .addClass("sivOperator");
  };
  
  /******************************************************************************/
  
  function SieveActionBoxUI(elm)
  {
    // Call parent constructor...
    SieveEditableBoxUI.call(this,elm);  
    this.drag(new SieveMoveDragHandler());
  }
  
  SieveActionBoxUI.prototype = Object.create(SieveEditableBoxUI.prototype);
  SieveActionBoxUI.prototype.constructor = SieveActionBoxUI;
  
  SieveActionBoxUI.prototype.createHtml
      = function (parent)
  {
    return SieveEditableBoxUI.prototype.createHtml.call(this,parent)
      .addClass("sivAction");
  };
  
  /******************************************************************************/
  
  /**
   * 
   * @param {SieveAbstractElement} elm
   *   Either the Sieve element which should be bound to this box or the document.
   * @param {SieveAbstractBoxUI} parent
   *   The parent Sieve Element, to which dropped Elemenents will be added.  
   */
  function SieveDropBoxUI(parent)
  {
    if (!parent)
      throw "Parent expected";
    
    if (parent.document)
      SieveAbstractBoxUI.call(this,parent.document());
    else if (parent.root)
      SieveAbstractBoxUI.call(this,parent);
    else
      throw ("Either a docshell or an elements expected");
     
    if (parent.document)
      this._parent = parent;
    
    this.drop(new SieveDropHandler());
  }
  
  SieveDropBoxUI.prototype = Object.create(SieveAbstractBoxUI.prototype);
  SieveDropBoxUI.prototype.constructor = SieveDropBoxUI;
  
  SieveDropBoxUI.prototype.createHtml
      = function (parent)
  {   
    return parent.append($("<div/>").addClass("sivDropBox"));    
  };
  
  SieveDropBoxUI.prototype.parent
      = function ()
  {
    return this._parent;
  };
  
  //****************************************************************************//
  
  function SieveTrashBoxUI(docshell)
  {
    // Call parent constructor...
    SieveDropBoxUI.call(this,docshell);  
    this.drop(new SieveTrashBoxDropHandler());
  }
  
  // Inherrit from DragBox
  SieveTrashBoxUI.prototype = Object.create(SieveDropBoxUI.prototype);
  SieveTrashBoxUI.prototype.constructor = SieveTrashBoxUI;
  
  
  //****************************************************************************//
  
  function SieveDialogBoxUI(elm)
  {
    // Call parent constructor...
    SieveAbstractBoxUI.call(this,elm);
  }
  
  // Inherrit from DragBox
  SieveDialogBoxUI.prototype = Object.create(SieveAbstractBoxUI.prototype);
  SieveDialogBoxUI.prototype.constructor = SieveDialogBoxUI;
  
  
  SieveDialogBoxUI.prototype.showEditor
      = function(e)
  { 
    var that = this;      
  
    var onSave = function() {
    	
    	// Check if on save was canceled...
    	if (!that.onSave())
    	  return;
    	
    	// Remove the event handlers...
    	$('#sivDialog').hide();
      $('#sivDialogOverlay').off('click');
      //$('#sivDialogDiscard').off('click');
      $('#sivDialogSave').off('click');
      $('#sivDialogClose').off('click');
      
      // and clean the dialog content.
      $('#sivDialogBody').empty(); 
      
      // update the summary
      that._domElm.children(".sivSummaryContent").remove();
      that._domElm.append(that.getSummary().addClass("sivSummaryContent"));
    };
    
    $('#sivDialog').show();
    $('#sivDialogOverlay').click( function()  { onSave(); } );
    //$('#sivDialogDiscard').click( function()  { that.onDiscard() } )
    $('#sivDialogSave').click( function()  { onSave(); } );
    $('#sivDialogClose').click( function()  { onSave(); } );
    
    $('#sivDialogBody')
      .empty()
      .load(this.getTemplate(), function (response, status, xhr) { 
        if ( status == "error" )
          alert( "" + xhr.status + " " + xhr.statusText );
  
        that.onLoad();       
      });
   
  };
  
  SieveDialogBoxUI.prototype.createHtml
      = function (parent)
  {
    if (typeof(parent) == "undefined")
      throw "parent parameter is missing";
      
    var that = this;
    
    //parent =  SieveAbstractBoxUI.prototype.createHtml.call(this,parent);
    
    parent.addClass((this.getTemplate)?"sivEditableElement":"");
    
    if(this.getSummary) {
      parent.append(this.getSummary()
          .addClass("sivSummaryContent"))
        .click(function(e) { that.showEditor();  e.preventDefault(); return true; } );
    }
     
    if (this.id() != -1)
      parent.attr("id","sivElm"+this.id());
      
    return  parent;
  };
  
  SieveDialogBoxUI.prototype.getTemplate
      = function () 
  {
    throw "Implement getTemplate()";     
  };
    
  SieveDialogBoxUI.prototype.getSummary
      = function()
  {
    throw "Implement getSummary()";
  };
  
  SieveDialogBoxUI.prototype.onSave
      = function () 
  {
  	return true;
  };
  
  SieveDialogBoxUI.prototype.onLoad
      = function ()    
  {
    throw "Implement onLoad()";  
  };
  
  //------------------------------------------------------/
  
  function SieveActionDialogBoxUI(elm)
  {
    // Call parent constructor...
    SieveDialogBoxUI.call(this,elm);  
    this.drag(new SieveMoveDragHandler());
  }
  
  SieveActionDialogBoxUI.prototype = Object.create(SieveDialogBoxUI.prototype);
  SieveActionDialogBoxUI.prototype.constructor = SieveActionDialogBoxUI;
  
  SieveActionDialogBoxUI.prototype.createHtml
      = function (parent)
  {
    return SieveDialogBoxUI.prototype.createHtml.call(this,parent)
      .addClass("sivAction");
  };
  
  //-------------------------------------------/
  
  function SieveTestDialogBoxUI(elm)
  {
    // Call parent constructor...
    SieveDialogBoxUI.call(this,elm);  
    this.drag(new SieveMoveDragHandler("sieve/test"));
    this.drop(new SieveTestDropHandler()); 
  }
  
  SieveTestDialogBoxUI.prototype = Object.create(SieveDialogBoxUI.prototype);
  SieveTestDialogBoxUI.prototype.constructor = SieveTestDialogBoxUI;
  
  SieveTestDialogBoxUI.prototype.createHtml
      = function (parent)
  {
    return SieveDialogBoxUI.prototype.createHtml.call(this,parent)
      .addClass("sivTest");
  };

  exports.SieveAbstractBoxUI = SieveAbstractBoxUI;
  exports.SieveEditableBoxUI = SieveEditableBoxUI;
  exports.SieveTestBoxUI = SieveTestBoxUI;
  exports.SieveOperatorBoxUI = SieveOperatorBoxUI;
  exports.SieveActionBoxUI = SieveActionBoxUI;
  exports.SieveDropBoxUI = SieveDropBoxUI;
  exports.SieveTrashBoxUI = SieveTrashBoxUI;
  exports.SieveDialogBoxUI = SieveDialogBoxUI;
  exports.SieveActionDialogBoxUI = SieveActionDialogBoxUI;
  exports.SieveTestDialogBoxUI = SieveTestDialogBoxUI;

})(window);