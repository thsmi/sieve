/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */
 
"use strict";
 
// Sieve Layout Engine is a static class...

/**
 * A static class implementing a simple Layout engine. 
 * 
 * Widgest can register on rendering Elements. 
 */
var SieveDesigner = 
{
  names : {},
  
  /**
   * Widgets can register a constructor in order to rendering element. 
   * They use either the elements name or the construtor as identifier.
   * 
   * When an element ist ready to be rendered the widget's constructor
   * is invoked, and the new widget's instance is bound to the element.
   *    
   * @param {String/Constructor} name
   *   The name or the constructor of the element the widget can render.
   * @param {Constructor} callback
   *   Constructor which should be calls to render this element 
   */
  register: function (name,callback)
  {    
    if (typeof(name) == "undefined" || !name)
      throw "Layout Engine Error: Widget can't be registered without a name";
      
    if (typeof(name) != "string")
      name = name.nodeName(); 
     
    this.names[name] = {}
    this.names[name].onNew = function(elm) { return new callback(elm); }    
  },
  
  /**
   * Returns a widget for the given element.
   * 
   * In case no widget registered for the element null is returned, other
   * wise a new instance which can be used to display the element.
   * 
   * @param {SieveAbstractElement} element
   */
  widget: function (elm)
  {
    if (!elm.nodeName())
      throw "Layout Engine Error: Element has no name";
            
    if (!this.names[elm.nodeName()])
      return null;
      
    return this.names[elm.nodeName()].onNew(elm);
  }
 
  // TODO implement  method do toggle if element should be displayed or not  
    
}
