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

( function ( exports ) {

  "use strict";

  // TODO we need to do a cleanup, which means document caches elements by their id.
  // These elements should be also tracked by the generic elements. espeically with tags.
  // So it would be good to have a method which collects all ids of elements in use.
  // all other elements can then be dropped and removed.

  // TODO we need a list of items to emulate blocks...  

  function SieveGenericLiteral( parent ) {

    if ( parent === null || typeof ( parent ) === "undefined" )
      throw new Error( "Undefined or invalid parent" );

    this._parent = parent;
    this._document = parent.document();

    this._token = null;
    this._pre = null;
    this._post = null;
  }

  SieveGenericLiteral.prototype.require
    = function ( imports ) {
      return this;
    };

  /**
   * Initializes the literal
   *
   * @param{String} token
   *  the literal as string
   * @param{String} pre
   *  the default whitespace before the literal
   * @param{String} [post]
   *  the optional default whitespace after the literal
   *  It is used to make the code more readable.
   **/
  SieveGenericLiteral.prototype.init
    = function ( token, pre, post ) {

      this._token = token;

      if ( pre === null || typeof ( pre ) === "undefined" )
        pre = "";

      this._pre = this._document.createByName( "whitespace", pre, this._parent );

      if ( post !== null && typeof ( post ) !== "undefined" )
        this._post = this._document.createByName( "whitespace", post, this._parent );

      return this;
    };

  /**
   * Tries to parse the literal.
   *
   * @param  {SieveParser} parser
   *  the parser which should be used
   * @throws
   *   throws an exception in case the literal could not be parsed or initialized.
   */
  SieveGenericLiteral.prototype.parse
    = function ( parser ) {

      if ( this._token === null || typeof ( this._token ) === "undefined" )
        throw new Error( "No token specified" );


      if ( this._document.probeByClass( "whitespace", parser ) )
        this._pre.init( parser );
      else
        this._pre.init( "" );

      parser.extract( this._token );

      if ( this._post === null )
        return;

      // Seems a bit strange, but we stop parsing at linebreaks.      
      // This makes deleting elements easier and generates much 
      // more readable code.      
      if ( this._document.probeByName( "whitespace", parser ) )
        this._post.init( parser, true );
      else
        this._post.init( "" );

      return;
    };

  SieveGenericLiteral.prototype.toScript
    = function () {
      var result = "";

      result += this._pre.toScript() + this._token;

      if ( this._post !== null )
        result += this._post.toScript();

      return result;
    };

  SieveGenericLiteral.prototype.hasDefaultValue
    = function () {
      return true;
    };
  /**
   * Checks if the current element has a value and thus needs
   * to be rendered into a sieve script.
   */
  SieveGenericLiteral.prototype.isDefaultValue
    = function () {
      return true;
    };


  /**
   * @param  {SieveGenericeElement} document
   */
  function SieveGenericMandatoryItem( parent ) {

    if ( parent === null || typeof ( parent ) === "undefined" )
      throw new Error( "Undefined or invalid parent" );

    this._parent = parent;
    this._document = parent.document();

    this._elements = new Map();
  }

  SieveGenericMandatoryItem.prototype.hasElement
    = function ( id ) {

      return this._elements.has( id );

    };

  SieveGenericMandatoryItem.prototype.getElement
    = function ( id ) {

      if ( !this.hasElement( id ) )
        throw new Error( "No Element with id " + id );

      return this._elements.get( id ).element;
    };

  /**
   * Assigns parameters to this object.
   * Any existing parametes will be replaced.
   *
   * @param  {Array} parameters
   *  the parameters which should be set.
   */
  SieveGenericMandatoryItem.prototype.init
    = function ( parameters ) {

      if ( !parameters || !parameters.length )
        throw new Error( "Invalid Parameters" );

      // Drop any existing elements...
      this._elements.clear();

      // Initialize all Parameters...
      parameters.forEach( function ( parameter ) {

        if ( parameter.type === null || typeof ( parameter.type ) === 'undefined' )
          throw new Error( "Parameter without a type " );

        var item = {};
        item.element = this._document.createByName( parameter.type, parameter.value, this._parent );
        item.whitespace = this._document.createByName( "whitespace", " ", this._parent );

        //this._whitespaces["#"+element.id()] = this._document.createByName( "whitespace", " " , this._parent); 
        this._elements.set( parameter.id, item );

      }, this );

      return this;
    };

  SieveGenericMandatoryItem.prototype.require
    = function ( imports ) {

      var requires = [];

      if ( !Array.isArray( requires ) )
        requires = [requires];

      this._elements.forEach( function ( item ) {
        item.element.require( imports );
      }, this );

      return this;
    };

  SieveGenericMandatoryItem.prototype.parse
    = function ( parser ) {

      this._elements.forEach( function ( item ) {
        item.whitespace.init( parser );
        item.element.init( parser );
      }, this );

      return this;
    };

  SieveGenericMandatoryItem.prototype.toScript
    = function () {

      var result = "";

      this._elements.forEach( function ( item ) {
        result += item.whitespace.toScript();
        result += item.element.toScript();
      }, this );

      return result;
    };

  SieveGenericMandatoryItem.prototype.hasDefaultValue
    = function () {
      return true;
    };

  SieveGenericMandatoryItem.prototype.isDefaultValue
    = function () {
      // TODO do we need to evaluate our children?
      return true;
    };


  function SieveGenericDependentItem( parent ) {
    SieveGenericMandatoryItem.call( this, parent );
  }

  SieveGenericDependentItem.prototype = Object.create( SieveGenericMandatoryItem.prototype );
  SieveGenericDependentItem.prototype.constructor = SieveGenericDependentItem;

  SieveGenericDependentItem.prototype.isDependent = function () {
    return true;
  };

  SieveGenericDependentItem.prototype.parse = function ( parser ) {

    try {
      SieveGenericMandatoryItem.prototype.parse.call( this, parser );
    } catch ( ex ) {
      this.enabled = false;
      throw ex;
    }

    this.enabled = true;
    return this;
  };

  SieveGenericDependentItem.prototype.toScript
    = function () {

      if ( !this.enabled )
        return "";

      return SieveGenericMandatoryItem.prototype.toScript.call( this );
    };


  /**
   * Tags are optional they may be there or not.
   * This makes parsing akward.
   *
   * In case they are missing this function is object
   * is fully transparent.
   *
   * Other wise is greedy and eats any leading and tailing
   * Whitespaces.
   *
   * @param  {SieveGenericStructure} parent
   */
  function SieveGenericOptionalItem( parent ) {

    if ( parent === null || typeof ( parent ) === "undefined" )
      throw new Error( "Undefined or invalid parent" );

    this._parent = parent;
    this._document = parent.document();

    this._optionals = new Map();
    this._elements = new Set();

    this._tail = null;
  }

  SieveGenericOptionalItem.prototype.hasElement
    = function ( id ) {
      return this._optionals.has( id );
    };

  SieveGenericOptionalItem.prototype.getElement
    = function ( id ) {

      if ( !this.hasElement( id ) )
        return null; //TODO we should throw it is an error.

      return this._optionals.get( id ).element;
    };

  SieveGenericOptionalItem.prototype.enable
    = function ( id, status ) {

      if ( !this.hasElement( id ) )
        throw new Error( "Unknown element " + id );

      if ( status === false ) {
        this._elements.delete( id );
        return false;
      }

      if ( status === true ) {
        this._elements.add( id );
        return false;
      }

      return this._elements.has( id );
    };

  SieveGenericOptionalItem.prototype.init
    = function ( tags ) {

      if ( !tags || !tags.length )
        throw new Error( "Invalid Tags" );

      if ( this._optionals.length )
        throw new Error( " Tags already initialized" );

      // Initialize all Parameters...
      tags.forEach( function ( tag ) {

        if ( tag.type === null || typeof ( tag.type ) === 'undefined' )
          throw new Error( "Tag without a type" );

        if ( tag.id === null || typeof ( tag.id ) === 'undefined' )
          throw new Error( "Tag without an id" );

        // Skip element if it is not supported by the current system
        if ( SieveLexer.supportsByName( tag.type ) === false )
          return;

        var item = {};
        //item.id = tag.id;
        item.type = tag.type;
        item.element = this._document.createByName( tag.type, tag.value, this._parent );

        var separator = " ";
        if ( tag.separator )
          separator = tag.separator;

        item.whitespace = this._document.createByName( "whitespace", separator, this._parent );

        this._optionals.set( tag.id, item );

        if ( tag.enabled )
          this._elements.add( tag.id );

      }, this );

      if ( this._elements.size )
        this._tail = this._document.createByName( "whitespace", " ", this._parent );

      return this;
    };


  SieveGenericOptionalItem.prototype.parse
    = function ( parser ) {

      // Skip in case this element has not tags 	
      if ( !this._optionals )
        return this;

      this._elements = new Set();

      // Tags may be optional, which means they might be there nor not...
      var pos = parser.pos();

      // ... in any case it needs to be separated by a whitespace
      // if not we know are no tags.
      var whitespace = this._document.createByName( "whitespace", "" );
      if ( this._document.probeByClass( "whitespace", parser ) )
        whitespace.init( parser );

      // then we close the tags element to track duplicate elements.
      var ids = new Set( this._optionals.keys() );
      var hasTags = true;

      while ( hasTags ) {

        hasTags = false;

        for ( let id of ids ) {

          let item = this._optionals.get( id );

          if ( !this._document.probeByName( item.type, parser ) )
            continue;

          item.whitespace = whitespace;
          item.element.init( parser );

          // Then drop it from our worker
          ids.delete( id );
          this._elements.add( id );

          whitespace = null;
          whitespace = this._document.createByName( "whitespace", "" );

          // In case there are no more whitespaces we can skip right here.          
          if ( this._document.probeByClass( "whitespace", parser ) )
            whitespace.init( parser );

          hasTags = true;
          break;
        }
      }

      // in case we did not find any tags, there won't be any elements. Which means we have
      // to restore the extracted whitespaces. We do this by reseting the postion.
      if ( this._elements.size === 0 ) {

        this._tail = null;
        parser.pos( pos );
        return this;
      }

      this._tail = whitespace;

      return this;
    };


  SieveGenericOptionalItem.prototype.require
    = function ( imports ) {
      var requires = [];

      if ( !Array.isArray( requires ) )
        requires = [requires];

      for ( let id of this._elements ) {
        this._optionals.get( id ).element.require( imports );
      }

      return this;
    };

  SieveGenericOptionalItem.prototype.hasDefaultValue
    = function () {

      if ( this._elements.size > 0 )
        return false;

      for ( var item of this._optionals.values() ) {

        if ( item.element.hasDefaultValue() )
          continue;

        return false;
      }

      return true;
    };

  SieveGenericOptionalItem.prototype.isDefaultValue
    = function () {

      // in case we have an element we can skip right here       
      if ( this._elements.size > 0 )
        return false;

      // we can skip otherwise in case one of our 
      // optionals has a non default value.
      for ( var item of this._optionals.values() ) {

        if ( item.element.isDefaultValue() )
          continue;

        return false;
      }

      return true;
    };

  SieveGenericOptionalItem.prototype.toScript
    = function () {

      var result = "";

      // We try to preserve all elemets entered by the user
      for ( let id of this._elements ) {

        let item = this._optionals.get( id );

        result += item.whitespace.toScript();
        result += item.element.toScript();
      }

      // Then add other optional elements.
      for ( let [id, item] of this._optionals ) {
        if ( this._elements.has( id ) )
          continue;

        if ( item.element.hasDefaultValue ) {

          if ( item.element.hasDefaultValue() && item.element.isDefaultValue() )
            continue;
        }

        // TODO: Do we realy need this? A value which is enabled
        // is contained in this._elements and a value which is not enabled
        // should not be rendered.
        if ( !item.element.hasCurrentValue || item.element.hasCurrentValue() === false ) {
          continue;
        }

        result += item.whitespace.toScript();
        result += item.element.toScript();
      }

      if ( this._tail )
        result += this._tail.toScript();

      return result;
    };

  // -------------

  function BiDiIterator( items ) {
    this.items = items;
    this.index = 0;
  }

  BiDiIterator.prototype.next = function () {
    if ( this.hasNext() )
      return null;

    this.index++;

    return this.items[this.index];
  };

  BiDiIterator.prototype.prev = function () {
    if ( this.hasPrev() )
      return null;

    this.index--;

    return this.items[this.index];
  };

  BiDiIterator.prototype.hasNext = function () {
    return ( this.index < this.index.length );
  };

  BiDiIterator.prototype.hasPrev = function () {
    return ( this.index >= 0 );
  };

  // ---------  


  /* global SieveLexer */
  /* global SieveAbstractElement */

  function SieveGenericStructure( docshell, id, type ) {
    SieveAbstractElement.call( this, docshell, id );

    this._elements = [];
    this._requirements = new Set();
    this._nodeName = type;
  }

  SieveGenericStructure.prototype = Object.create( SieveAbstractElement.prototype );
  SieveGenericStructure.prototype.constructor = SieveGenericStructure;

  SieveGenericStructure.prototype.nodeName
    = function () {
      if ( this._nodeName === null )
        throw new Error( "Uninitialized Element" );

      return this._nodeName;
    };

  SieveGenericStructure.prototype.require
    = function ( imports ) {

      this._requirements.forEach( function ( requirement ) {
        imports[requirement] = true;
      }, this );

      this._elements.forEach( function ( element ) {
        element.require( imports );
      }, this );

      return this;
    };

  SieveGenericStructure.prototype.init
    = function ( parser ) {

      var pos = null;
      var prev = null;

      this._elements.forEach( function ( element ) {

        if ( element.isDependent && element.isDependent() ) {

          // save the current position for a rollback
          pos = parser.pos();

          // A dependent element is optional so it is ok
          // if we fail here
          try {
            element.parse( parser );
          }
          catch ( ex ) {
            // TODO reset item
            // Reset the position as if nothing happened
            parser.pos( pos );
            pos = null;
          }

          // and continue with the next element          
          prev = element;
          return;
        }

        // This happens only if the previoous element
        // was a dependent element, and it was parsed 
        // successfully
        if ( pos !== null ) {

          try {
            element.parse( parser );

          } catch ( ex ) {

            prev.enabled = false;

            // parsing failed. So let's reset the position and 
            // try parsing without the dependent element.
            // we need to reset the dependet element
            parser.pos( pos );
            element.parse( parser );
          }

          pos = null;
          return;
        }

        element.parse( parser );
        return;
      }, this );


      /* this._elements.forEach( function ( element ) {
         element.parse( parser );
       }, this );*/

      return this;
    };

  SieveGenericStructure.prototype.toScript
    = function () {

      var result = "";

      this._elements.forEach( function ( element ) {
        result += element.toScript();
      }, this );

      return result;
    };

  SieveGenericStructure.prototype.hasDefaultValue
    = function () {
      for ( var item of this._elements ) {
        if ( item.hasDefaultValue() )
          continue;

        return false;
      }

      return true;
    };

  SieveGenericStructure.prototype.isDefaultValue
    = function () {

      for ( var item of this._elements ) {

        if ( item.isDefaultValue() )
          continue;

        return false;
      }

      return true;
    };


  /**
   * @param  {} requirements
   */
  SieveGenericStructure.prototype.addRequirements
    = function ( requirements ) {

      if ( requirements === null || typeof ( requirements ) === "undefined" )
        return this;

      if ( !Array.isArray( requirements ) )
        requirements = [requirements];

      requirements.forEach( function ( requirement ) {
        this._requirements.add( requirement );
      }, this );

      return this;
    };

  SieveGenericStructure.prototype.setNodeName
    = function ( nodeName ) {
      this._nodeName = nodeName;
    };


  SieveGenericStructure.prototype.addLiteral
    = function ( token, prefix, postfix ) {
      if ( typeof ( token ) !== "string" )
        throw new Error( "Token in a Literal as to be a string" );

      this._elements.push( new SieveGenericLiteral( this ).init( token, prefix, postfix ) );

      return this;
    };

  SieveGenericStructure.prototype.enable
    = function ( id, status ) {

      for ( let item of this._elements ) {

        if ( !item.enable )
          continue;

        return item.enable( id, status );
      }

      throw new Error( "No Element with id " + id + " found" );
    };

  /**
   * @param  {Array.<object>|object} tags
   */
  SieveGenericStructure.prototype.addOptionalItems
    = function ( tags ) {

      // we bail silently out in case no tags are defined.
      if ( typeof ( tags ) === "undefined" || tags === null )
        return this;

      // Ok if it is something else than an array we just 
      // convert it into an array
      if ( !Array.isArray( tags ) )
        tags = [tags];

      this._elements.push( new SieveGenericOptionalItem( this ).init( tags ) );

      return this;
    };

  /**
   * A dependent element is something between
   * an optional and mandatory element.
   *
   * Such an element is by definition optional but can not
   * live without the mandatory element but has a fixed position.
   * This can occure in case of an ambious type definition.
   *
   * Let's take an example structure
   * "action" <variables:string> [flags:string];
   *
   * As you can see the action has two string parameters.
   * This allow the following two commands
   *
   * action "flags";
   * action "variables" "flags"
   *
   * As the parser is linear the optional "variable" parameter
   * would be greedy an consume the string so that the mandatory
   * flags parameter would fails.
   *
   * A dependent element fixes this. The "variable" element is
   * non greedy. So that in the first case the "flags".
   * 
   * @param {Array.<object>|object} parameters
   *  the configuration and parameters for the dependent item
   * @returns{SieveGenericStructure}
   *  a self reference 
   */
  SieveGenericStructure.prototype.addDependentItems
    = function ( parameter ) {

      if ( typeof ( parameter ) === "undefined" || parameter === null )
        return this;

      var parameters = [];

      if ( parameter.elements )
        parameters = parameter.elements;
      else
        parameters = parameter;

      if ( !Array.isArray( parameters ) )
        parameters = [parameters];

      this._elements.push( new SieveGenericDependentItem( this ).init( parameters ) );

      return this;
    };

  /**
   * A mandatory element is a required element.
   * In case it is not at the expected position
   * an error will be raised
   *
   * @param  {Array.<object>|object} parameters
   *  the configuration and parameter for the generic items.
   * @returns {SieveGenericStructure}
   *  a self reference
   */
  SieveGenericStructure.prototype.addMandatoryItems
    = function ( parameters ) {

      if ( typeof ( parameters ) === "undefined" || parameters === null )
        return this;

      if ( !Array.isArray( parameters ) )
        parameters = [parameters];

      this._elements.push( new SieveGenericMandatoryItem( this ).init( parameters ) );

      return this;
    };

  SieveGenericStructure.prototype.hasElement
    = function ( id ) {

      for ( var item of this._elements ) {

        if ( !item.hasElement || !item.hasElement( id ) )
          continue;

        return true;
      }

      return false;
    };

  SieveGenericStructure.prototype.getElement
    = function ( id ) {

      for ( var item of this._elements ) {

        if ( !item.hasElement || !item.hasElement( id ) )
          continue;

        return item.getElement( id );
      }

      throw new Error( "No element with id " + id );
    };

  /***************************************************************/

  function SieveGenericUnion( docshell, id ) {
    SieveAbstractElement.call( this, docshell, id );

    this._element = {
      current: null,
      default: null
    };
    this._items = [];

    this._prefix = {};
  }

  SieveGenericUnion.prototype = Object.create( SieveAbstractElement.prototype );
  SieveGenericUnion.prototype.constructor = SieveGenericUnion;

  SieveGenericUnion.prototype.nodeName
    = function () {

      return this._element.node;
    };

  SieveGenericUnion.prototype.require
    = function ( imports ) {

      if ( this._element.current !== null ) {
        this._element.current.require( imports );
        return this;
      }

      if ( this._element.default !== null ) {
        this._element.default.require( imports );
        return this;
      }

      return this;
    };

  SieveGenericUnion.prototype.setToken
    = function ( token ) {

      if ( token === null || typeof ( token ) === "undefined" ) {
        this._prefix = {};
        return this;
      }

      if ( typeof ( token ) !== "string" )
        throw new Error( "Token in a Union as to be a string" );

      this._prefix.element = new SieveGenericLiteral( this ).init( token );
      this._prefix.whitespace = this._createByName( "whitespace", " " );
      return this;
    };

  SieveGenericUnion.prototype.addItems
    = function ( items ) {
      this._items = this._items.concat( items );

      return this;
    };

  SieveGenericUnion.prototype.hasDefaultValue
    = function () {

      if ( this._element.default === null )
        return false;

      if ( typeof ( this._element.default ) === "undefined" )
        return false;

      return true;
    };

  SieveGenericUnion.prototype.getDefaultValue
    = function () {
      return this._element.default.toScript();
    };

  SieveGenericUnion.prototype.setDefaultValue
    = function ( value ) {

      if ( value === null || typeof ( value ) === "undefined" )
        return this;

      this._element.default = this._createByClass( this._items, value );

      return this;
    };

  SieveGenericUnion.prototype.isDefaultValue
    = function () {

      if ( this.hasDefaultValue() === false )
        return false;

      if ( this.hasCurrentValue() === false )
        return true;

      return false;
    };

  /**
   * Check if a current value was set.
   *
   * @returns {boolean}
   *  true in case the element has a current value set otherwise false
   */
  SieveGenericUnion.prototype.hasCurrentValue
    = function () {
      if ( this._element.current === null )
        return false;

      if ( typeof ( this._element.current ) === "undefined" )
        return false;

      return true;
    };

  SieveGenericUnion.prototype.getCurrentValue
    = function () {

      if ( this.isDefaultValue() )
        return null;

      return this._element.current.toScript();
    };


  /**
   * Sets the unions current value.
   *
   * @param {String|SieveParser} [value]
   *  optional the new value which should be set. In case it is omitted it will
   *  fallback to the default value if present.
   * @returns {SieveGenericUnion}
   *  a self reference
   */
  SieveGenericUnion.prototype.setCurrentValue
    = function ( value ) {

      if ( this.hasCurrentValue() ) {
        // We delete elements by making them an orphan
        this._element.current.parent( null );
        this._element.current = null;
      }

      if ( value === null || typeof ( value ) === "undefined" )
        return this;

      this._element.current = this._createByClass( this._items, value );
      return this;
    };

  /**
   * Sets the elements value. It is aware of the default and current value.
   *
   * @param{String} value
   *  the value which should be set.
   * @returns{SieveGenericUnion}
   *  a self reference. To create chains.
   **/
  SieveGenericUnion.prototype.setValue
    = function ( value ) {

      // Skip if the value has not changed ...
      if ( this.hasCurrentValue() && ( this.getCurrentValue() === value ) )
        return this;

      // ... then check if it is the default value
      if ( this.hasDefaultValue() && ( this.getDefaultValue() === value ) ) {

        this.setCurrentValue( null );
        return this;
      }

      this.setCurrentValue( value );
      return this;
    };

  /**
   * Gets the value. In case no current value is set it falls back to the default value.
   *
   * @returns{String}
   *  the currently set value as string.
   **/
  SieveGenericUnion.prototype.getValue
    = function () {

      if ( this.isDefaultValue() === false )
        return this.getCurrentValue();

      return this.getDefaultValue();
    };

  SieveGenericUnion.prototype.value
    = function ( value ) {

      console.warn( "SieveGenericUnion.value is deprecated use getValue and setValue" );

      if ( typeof ( value ) !== "undefined" ) {
        return this.setValue( value );
      }

      return this.getValue();
    };

  SieveGenericUnion.prototype.init
    = function ( parser ) {

      if ( this._prefix.element ) {
        this._prefix.element.parse( parser );
        this._prefix.whitespace.init( parser );
      }

      if ( this._items.length === 0 )
        return this;

      this.setCurrentValue( parser );

      return this;
    };

  SieveGenericUnion.prototype.toScript
    = function () {

      var result = "";

      // We do not need to render the default value in a union...
      // ... it is an implicit fallback.            
      if ( this.hasCurrentValue() === false )
        return "";

      if ( this._prefix.element ) {
        result += this._prefix.element.toScript();
        result += this._prefix.whitespace.toScript();
      }

      result += this._element.current.toScript();

      return result;
    };


  var actions = new Map();

  function extendProperty( action, item ) {

    var property = null;

    if ( !action.properties ) {
      action.properties = [item];
      return;
    }

    property = action.properties.find( function ( cur ) {
      return cur.id == item.id;
    });

    if ( !property ) {
      action.properties.unshift( item );
      return;
    }

    item.elements.forEach( function ( cur ) {
      property.elements.unshift( cur );
    });

    return property;
  }

  function extendAction( item ) {

    if ( !actions.has( item.extends ) )
      return;

    var action = actions.get( item.extends );

    item.properties.forEach( function ( property ) {
      extendProperty( action, property );
    });
  }


  function addAction( item ) {

    // Ensure the item has a valid structure...

    // ... there has to be a token ... 
    if ( item.token === null || typeof ( item.token ) === 'undefined' )
      throw new Error( "Token expected but not found" );

    if ( item.node === null || typeof ( item.node ) === 'undefined' )
      throw new Error( "Node expected but not found" );

    if ( actions[item] !== null && typeof ( item.node ) === 'undefined' )
      throw new Error( "Actions already registered" );

    actions.set( item.node, item );
  }


  // gen = new GenericElement()
  // gen.addLiteral( action.token )
  // gen.addWhiteSpace()
  // gen.addGroup( new SieveGenericOptionalItem(this_action )
  // gen.addGroup( new SieveGenericMandatoryItem(parameters) );
  // gen.addLiteral(";")

  function initActions() {

    actions.forEach( function ( item ) {
      // then create the probe methods.

      var onProbe = function ( parser, lexer ) {

        var tokens = item.token;

        if ( !Array.isArray( tokens ) )
          tokens = [tokens];

        for ( var i in tokens )
          if ( parser.startsWith( tokens[i] ) )
            return true;

        return false;
      };

      var onNew = function ( docshell, id ) {

        var element = new SieveGenericStructure( docshell, id, item.node );

        element
          .addLiteral( item.token )
          .addRequirements( item.requires );

        if ( Array.isArray( item.properties ) ) {

          item.properties.forEach( function ( elm ) {

            if ( elm.optional )
              element.addOptionalItems( elm.elements );
            else if ( elm.dependent )
              element.addDependentItems( elm );
            else
              element.addMandatoryItems( elm.elements );
          });

        }
        element
          .addLiteral( ";", "", "\r\n" );

        // add something optional which eats whitespaces but stops a comments or linebreaks.

        return element;
      };

      var onCapable = function ( capabilities ) {

        if ( ( item.requires === null ) || ( typeof ( item.requires ) === 'undefined' ) )
          return true;

        var requires = item.requires;

        if ( !Array.isArray( requires ) )
          requires = [requires];

        for ( var i in requires )
          if ( capabilities[requires[i]] !== true )
            return false;

        return true;
      };

      var name = item.node;
      var type = item.type;

      var obj = {};
      obj.onProbe = onProbe;
      obj.onNew = onNew;
      obj.onCapable = onCapable;

      SieveLexer.registerGeneric( name, type, obj );

    });
  }


  function addTest( item ) {

    var onProbe = function ( parser, lexer ) {

      var tokens = item.token;

      if ( !Array.isArray( tokens ) )
        tokens = [tokens];

      for ( var i in tokens )
        if ( parser.startsWith( tokens[i] ) )
          return true;

      return false;
    };

    var onNew = function ( docshell, id ) {

      var element = new SieveGenericStructure( docshell, id, item.node );

      element
        .addLiteral( item.token )
        .addRequirements( item.requires );

      if ( Array.isArray( item.properties ) ) {

        item.properties.forEach( function ( elm ) {

          if ( elm.optional )
            element.addOptionalItems( elm.elements );
          else if ( elm.dependent )
            element.addDependentItems( elm );
          else
            element.addMandatoryItems( elm.elements );
        });

      }

      return element;
    };

    var onCapable = function ( capabilities ) {

      if ( ( item.requires === null ) || ( typeof ( item.requires ) === 'undefined' ) )
        return true;

      var requires = item.requires;

      if ( !Array.isArray( requires ) )
        requires = [requires];

      for ( var i in requires )
        if ( capabilities[requires[i]] !== true )
          return false;

      return true;
    };

    var name = item.node;
    var type = item.type;

    var obj = {};
    obj.onProbe = onProbe;
    obj.onNew = onNew;
    obj.onCapable = onCapable;

    SieveLexer.registerGeneric( name, type, obj );
  }



  function addGroup( tag ) {

    if ( tag.node === null || typeof ( tag.node ) === 'undefined' )
      throw new Error( "Node expected but not found" );

    //if ( tag.value === null || typeof ( tag.value ) === 'undefined' )  
    //  throw new Error( "Default value for tag group " + tag.node + " not found" );

    var onProbe = function ( parser, lexer ) {
      if ( tag.token !== null && typeof ( tag.token ) !== "undefined" )
        return parser.startsWith( tag.token );

      return lexer.probeByClass( tag.items, parser );
    };

    var onNew = function ( docshell, id ) {

      var element = new SieveGenericUnion( docshell, id );
      element.setToken( tag.token );
      element.addItems( tag.items );
      element.setDefaultValue( tag.value );
      return element;
    };

    var onCapable = function ( capabilities ) {

      if ( ( tag.requires === null ) || ( typeof ( tag.requires ) === 'undefined' ) )
        return true;

      var requires = tag.requires;

      if ( !Array.isArray( requires ) )
        requires = [requires];

      for ( var i in requires )
        if ( capabilities[requires[i]] !== true )
          return false;

      return true;
    };

    var name = tag.node;
    var type = tag.type;

    var obj = {};
    obj.onProbe = onProbe;
    obj.onNew = onNew;
    obj.onCapable = onCapable;

    SieveLexer.registerGeneric( name, type, obj );
  }

  // -------------------------------------------------------

  function addTag( item ) {

    var token = item.token;

    if ( !Array.isArray( token ) )
      token = [token];

    if ( !token.length )
      throw new Error( "Adding Tag failed, no parser token defined" );

    var onProbe = function ( parser, lexer ) {
      return parser.startsWith( item.token );
    };

    var onNew = function ( docshell, id ) {
      var element = new SieveGenericStructure( docshell, id, item.node );

      element
        .addLiteral( item.token )
        .addRequirements( item.requires );

      if ( Array.isArray( item.properties ) ) {

        item.properties.forEach( function ( elm ) {

          if ( elm.optional )
            element.addOptionalItems( elm.elements );
          else
            element.addMandatoryItems( elm.elements );
        });

      }

      return element;
    };

    var onCapable = function ( capabilities ) {

      if ( ( item.requires === null ) || ( typeof ( item.requires ) === 'undefined' ) )
        return true;

      var requires = item.requires;

      if ( !Array.isArray( requires ) )
        requires = [requires];

      for ( var i in requires )
        if ( capabilities[requires[i]] !== true )
          return false;

      return true;
    };

    var name = item.node;
    var type = item.type;

    var obj = {};
    obj.onProbe = onProbe;
    obj.onNew = onNew;
    obj.onCapable = onCapable;

    SieveLexer.registerGeneric( name, type, obj );
  }

  function createGrammar( capabilites ) {
    initActions();

    // todo we should retrun a lexxer so that the gramar is scoped.   
    // but this is fare future
    return null;
  }

  // ---------------------------------------------------

  exports.SieveGrammar = {};
  exports.SieveGrammar.addAction = addAction;
  exports.SieveGrammar.extendAction = extendAction;
  exports.SieveGrammar.addGroup = addGroup;
  exports.SieveGrammar.addTag = addTag;
  exports.SieveGrammar.addTest = addTest;

  exports.SieveGrammar.create = createGrammar;

})( window );
