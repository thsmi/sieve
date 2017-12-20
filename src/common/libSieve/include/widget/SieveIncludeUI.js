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

( function ( /*exports*/ ) {

    "use strict";

    /* global $: false */
    /* global SieveActionBoxUI */
    /* global SieveActionDialogBoxUI */
    /* global SieveDesigner */
    /* global SieveTabWidget */
    /* global SieveStringListWidget */

    /******************************************************************************/

    function SieveReturnUI( elm ) {
        SieveActionBoxUI.call( this, elm );
    }

    SieveReturnUI.prototype = Object.create( SieveActionBoxUI.prototype );
    SieveReturnUI.prototype.constructor = SieveReturnUI;

    SieveReturnUI.prototype.initSummary
        = function () {

            return $( "<div/>" )
                .text( "End current script and return to the parent script" );
        };

    /******************************************************************************/


    function SieveGlobalActionUI( elm ) {
        SieveActionDialogBoxUI.call( this, elm );
    }

    SieveGlobalActionUI.prototype = Object.create( SieveActionDialogBoxUI.prototype );
    SieveGlobalActionUI.prototype.constructor = SieveGlobalActionUI;

    SieveGlobalActionUI.prototype.variables
        = function ( values ) {
            return this.getSieve().getElement( "variables" ).values( values );
        };

    SieveGlobalActionUI.prototype.getTemplate
        = function () {
            return "./include/template/SieveGlobalActionUI.html #sivDialogInclude";
        };

    SieveGlobalActionUI.prototype.onSave
        = function () {
            var values = ( new SieveStringListWidget( "#sivIncludeGlobalList" ) ).values();

            if ( !values || !values.length ) {
                window.alert( "Source list is empty" );
                return false;
            }

            this.variables( values );
            return true;
        };

    SieveGlobalActionUI.prototype.onLoad
        = function () {
            ( new SieveTabWidget() ).init();
            ( new SieveStringListWidget( "#sivIncludeGlobalList" ) )
                .init( this.variables() );
        };

    SieveGlobalActionUI.prototype.getSummary
        = function () {

            return $( "<div/>" )
                .html( "Define as global variable(s) " + $( '<em/>' ).text( this.variables() ).html() );
        };


    /******************************************************************************/

    function SieveIncludeActionUI( elm ) {
        SieveActionDialogBoxUI.call( this, elm );
    }

    SieveIncludeActionUI.prototype = Object.create( SieveActionDialogBoxUI.prototype );
    SieveIncludeActionUI.prototype.constructor = SieveIncludeActionUI;

    SieveIncludeActionUI.prototype.getTemplate
        = function () {
            return "./include/template/SieveIncludeActionUI.html #sivDialogInclude";
        };

    SieveIncludeActionUI.prototype.once
        = function ( value ) {

            return this.getSieve().enable( "once", value );
        };

    SieveIncludeActionUI.prototype.optional
        = function ( value ) {
            return this.getSieve().enable( "optional", value );
        };

    SieveIncludeActionUI.prototype.personal
        = function ( value ) {

            var elm = this.getSieve().getElement( "location" );

            if ( value === true )
                elm.setValue( ":personal" );

            if ( value === false )
                elm.setValue( ":global" );

            return ( elm.getValue() === ":personal" );
        };

    SieveIncludeActionUI.prototype.script
        = function ( value ) {

            var elm = this.getSieve().getElement( "script" );

            if ( value !== null && typeof ( value ) !== "undefined" )
                elm.value( value );

            return elm.value();
        };

    SieveIncludeActionUI.prototype.onSave
        = function () {

            var script = $( "#sivIncludeScriptName" ).val();

            if ( script.trim() === "" ) {
                window.alert( "Invalid Script name" );
                return false;
            }

            this.script( script);

            this.personal( $( "input[type='radio'][name='personal']:checked" ).val() === "true" );
            this.optional(( $( "input:checkbox[name='optional']:checked" ).length > 0 ) );
            this.once(( $( "input:checkbox[name='once']:checked" ).length > 0 ) );

            return true;
        };

    SieveIncludeActionUI.prototype.onLoad
        = function () {
            ( new SieveTabWidget() ).init();

            $( 'input:radio[name="personal"][value="' + !!this.personal() + '"]' ).prop( 'checked', true );

            $( 'input:checkbox[name="optional"]' ).prop( 'checked', !!this.optional() );
            $( 'input:checkbox[name="once"]' ).prop( 'checked', !!this.once() );

            $( "#sivIncludeScriptName" ).val( this.script() );
        };

    SieveIncludeActionUI.prototype.getSummary
        = function () {
            var str =
                "Include "
                + ( this.personal() ? "personal" : "global" )
                + " script " + $( '<em/>' ).text( this.script() ).html();

            return $( "<div/>" )
                .html( str );

        };


    if ( !SieveDesigner )
        throw new Error( "Could not register Action Widgets" );


    SieveDesigner.register( "action/return", SieveReturnUI );
    SieveDesigner.register( "action/global", SieveGlobalActionUI );
    SieveDesigner.register( "action/include", SieveIncludeActionUI );

})( window );