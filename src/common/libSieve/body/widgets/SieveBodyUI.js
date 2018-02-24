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

/* global window */

( function ( /*exports*/ ) {

  "use strict";

  /* global $: false */
  /* global SieveTestDialogBoxUI */
  /* global SieveTabWidget */
  /* global SieveMatchTypeUI */
  /* global SieveComparatorUI */
  /* global SieveStringListWidget */
  /* global SieveAbstractBoxUI */
  /* global SieveDesigner */


  /**
   * A UI Element wrapper which collets all possbile transforms and renders them
   * It keeps treck of the currently selected transform.
   * 
   * @param {} elm
   * @constructor
   */

  function SieveBodyTransformUI( elm ) {
    SieveAbstractBoxUI.call( this, elm );

    // TODO chekc if the element is a body transform..
  }

  SieveBodyTransformUI.prototype = Object.create( SieveAbstractBoxUI.prototype );
  SieveBodyTransformUI.prototype.constructor = SieveBodyTransformUI;

  SieveBodyTransformUI.nodeName = function () {
    return "body-transform";
  };

  SieveBodyTransformUI.nodeType = function () {
    return "comparison";
  };

  SieveBodyTransformUI.prototype.onSelect
    = function () {
      debugger;
      var value = $( "input[name='rgBodyTransform" + this.id() + "']:checked" ).val();
      this.getSieve().setValue( value );
    };

  /**
   * Gets and sets the bodytransfrom
   * 
   * @param {String} [transform]
   *   the body transform which should be set.
   * 
   * @return {String} 
   *   the body transform's value
   */
  SieveBodyTransformUI.prototype.bodyTransform
    = function ( transform ) {
      debugger;
      return this.getSieve().tagValue( transform );
    };

  SieveBodyTransformUI.prototype.update
    = function ( value ) {
      this.getSieve().tagValue( value );
    };

  SieveBodyTransformUI.prototype.createHtml
    = function () {

      var widgets = SieveDesigner.getWidgetsByClass( "body-transform/", this.id() );

      var item = $( "<div/>" )
        .addClass( "sivBodyTransform" );

      var that = this;

      widgets.forEach( function ( element ) {
        item.append( element.html( function () { that.onSelect(); }) );
      }, this );

      var value = this.getSieve().getValue();

      item.find( "input[name='rgBodyTransform" + this.id() + "'][value='" + value + "']" )
        .attr( "checked", "checked" );

      return item;
    };


  //----------------------------------------------------------------------------------------------------//

  function SieveAbstractTransformUI( id ) {
    this.id = id;
  }

  SieveAbstractTransformUI.prototype.html
    = function ( value, description, callback ) {

      var radio =
        $( "<input/>" )
          .attr( "type", "radio" )
          .attr( "name", "rgBodyTransform" + this.id )
          .attr( "value", value )
          .css( "float", "left" );

      radio.change( callback );

      return $( "<div/>" )
        .css( "overflow", "auto" )
        .append( radio )
        .append( $( "<span/>" )
          .css( "float", "left" )
          .text( description ) );
    };

  //-----------------------------

  function SieveRawTransformUI( id ) {
    SieveAbstractTransformUI.call( this, id );
  }

  SieveRawTransformUI.prototype = Object.create( SieveAbstractTransformUI.prototype );
  SieveRawTransformUI.prototype.constructor = SieveRawTransformUI;

  SieveRawTransformUI.nodeName = function () {
    return "body-transform/raw";
  };

  SieveRawTransformUI.nodeType = function () {
    return "body-transform/";
  };

  SieveRawTransformUI.isCapable = function ( /*capabilities*/ ) {
    // TODO support capabilities...
    return true;
  };

  SieveRawTransformUI.prototype.html
    = function ( callback ) {

      return SieveAbstractTransformUI.prototype.html.call(
        this,
        ":raw",
        "Match against the entire undecoded message body",
        callback );
    };

  /*SieveRawTransformUI.prototype.html 
      = function(type, description, callback) {
  
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
  };*/

  //---------------------------------------------/

  function SieveContentTransformUI( id ) {
    SieveAbstractTransformUI.call( this, id );
  }

  SieveContentTransformUI.prototype = Object.create( SieveAbstractTransformUI.prototype );
  SieveContentTransformUI.prototype.constructor = SieveContentTransformUI;

  SieveContentTransformUI.nodeName = function () {
    return "body-transform/content";
  };

  SieveContentTransformUI.nodeType = function () {
    return "body-transform/";
  };

  SieveContentTransformUI.isCapable = function ( /*capabilities*/ ) {
    return true;
  };

  SieveContentTransformUI.prototype.html
    = function ( callback ) {

      // TODO content has a /stringfield, this needs to be implemented.

      var cb = function () {
        callback();
      };

      var html = SieveAbstractTransformUI.prototype.html.call(
        this,
        ":content",
        "Match against the MIME parts that have the specified content types:",
        callback );

    var text = 
        $( "<input/>" );
    text.val( "hello world" );

    return ($("<div/>")
       .css("overflow","auto")
       .append(html)
        .append(text))[0]; 

    };

  /*SieveContentTransformUI.prototype.html 
      = function(type, callback) {
      
    // Create the elements
      let radio =
      $("<input/>")
        .attr("type","radio")
        .attr("name","rgBodyTransform"+this.id)
        .attr("value",":content")
        .css("float","left");
     
      let text =
      $("<input/>");      
      
    // in case the current element is equivalent with this element
    // we need to update the values.
      if (type.nodeName() === SieveContentTransformUI.nodeName()) {
      radio.prop('checked', true); 
      text.val(type.contentTypes.toScript());
    }
      
    // Add the changed handler. In this case it will fire when the radio button is selected and
    //  when the text was changes but only if the radio button is activated
      let handler = function () {
      if (!radio.prop("checked"))
        return;
        
        let value = text.val();
     
  
     if (value === "")
       value = '[""]';
     
      callback(":content "+value);
    };    
      
    radio.change( handler );
    text.change(handler);
  
    return $("<div/>")
        .css("overflow","auto")
        .append(radio)
        .append($("<div/>")
          .append($("<span/>").text("Match against the MIME parts that have the specified content types:"))
          .append("<br/>")
          .append(text));
          	
  };*/



  function SieveTextTransformUI( id ) {
    SieveAbstractTransformUI.call( this, id );
  }

  SieveTextTransformUI.prototype = Object.create( SieveAbstractTransformUI.prototype );
  SieveTextTransformUI.prototype.constructor = SieveTextTransformUI;

  SieveTextTransformUI.nodeName = function () {
    return "body-transform/text";
  };

  SieveTextTransformUI.nodeType = function () {
    return "body-transform/";
  };

  SieveTextTransformUI.isCapable = function ( /*capabilities*/ ) {
    // TODO support capabilities...
    return true;
  };

  SieveTextTransformUI.prototype.html
    = function ( callback ) {

      return SieveAbstractTransformUI.prototype.html.call(
        this,
        ":text",
        "Match against the decoded message body. (Default)",
        callback );
    };

  /*SieveTextTransformUI.prototype.html 
      = function(type, callback) {
  
      let radio =
      $("<input/>")
        .attr("type","radio")
        .attr("name","rgBodyTransform"+this.id)
        .attr("value",":text")
        .css("float","left");
             
    if (type.nodeName() == SieveTextTransformUI.nodeName())
      radio.prop("checked",true);             
    
    radio.change( function() { callback(":text"); } );  
    
    return $("<div/>")
       .css("overflow","auto")
       .append(radio)
       .append($("<span/>").text("Match against the decoded message body. (Default)").css("float","left"));      
  };*/


  /**
   * Implements controls to edit a sieve body test
   * 
   * "body" [COMPARATOR] [MATCH-TYPE] [BODY-TRANSFORM]  <key-list: string-list>
   *
   * @constructor
   * @param {Object} elm - The sieve element which should be rendered.
   */
  function SieveBodyUI( elm ) {
    SieveTestDialogBoxUI.call( this, elm );
  }

  SieveBodyUI.prototype = Object.create( SieveTestDialogBoxUI.prototype );
  SieveBodyUI.prototype.constructor = SieveBodyUI;

  SieveBodyUI.prototype.matchtype
    = function () {
      return this.getSieve().getElement( "match-type" );
    };

  SieveBodyUI.prototype.comparator
    = function () {
      return this.getSieve().getElement( "comparator" );
    };

  SieveBodyUI.prototype.bodyTransform
    = function () {
      return this.getSieve().getElement( "body-transform" );
    };

  SieveBodyUI.prototype.keys
    = function ( values ) {
      return this.getSieve().getElement( "keys" ).values( values );
    };

  SieveBodyUI.prototype.onLoad
    = function () {

      ( new SieveTabWidget() ).init();

      var matchtype = new SieveMatchTypeUI( this.matchtype() );
      $( "#sivBodyMatchTypes" )
        .append( matchtype.html() );

      var comparator = new SieveComparatorUI( this.comparator() );
      $( "#sivBodyComparator" )
        .append( comparator.html() );
      
      var bodyTransform = new SieveBodyTransformUI( this.bodyTransform() );
      $( "#sivBodyTransform" )
        .append( bodyTransform.html() );

      ( new SieveStringListWidget( "#sivBodyKeyList" ) ).init( this.keys() );

    };

  SieveBodyUI.prototype.onSave
    = function () {

      this.keys(( new SieveStringListWidget( "#sivBodyKeyList" ) ).values() );
      return true;
    };

  SieveBodyUI.prototype.getTemplate
    = function () {
      return "./body/templates/SieveBodyTestUI.html #sivBodyDialog";
    };

  SieveBodyUI.prototype.getSummary
    = function () {

      // case- insensitive is the default so skip it...
      return $( "<div/>" )
        .html( " message body <em> "
        + this.matchtype().getValue() + " "
        + $( '<div/>' ).text( this.keys() ).html() + "</em>" );
    };


  //************************************************************************************

  if ( !SieveDesigner )
    throw new Error("Could not register Body Extension");

  SieveDesigner.register( "body-transform", "comparison", SieveBodyTransformUI );

  SieveDesigner.register2( SieveTextTransformUI );
  SieveDesigner.register2( SieveRawTransformUI );
  SieveDesigner.register2( SieveContentTransformUI );


  SieveDesigner.register( "test/body", SieveBodyUI );

})( window );
