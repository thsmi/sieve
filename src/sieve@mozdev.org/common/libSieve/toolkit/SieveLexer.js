/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */
 
"use strict";
 
// Sieve Lexer is a static class...

var SieveLexer = 
{
  types :  {},
  names : {},//[],
  maxId : 0,
  _capabilities : {},
  
  register: function (callback)
  {
    if (!callback.nodeType)
      throw "Lexer Error: Registration failed, element has no type";
      
    var type = callback.nodeType();

    if (!callback.nodeName)
      throw "Lexer Error: Registration failed, element has no name";
      
    var name = callback.nodeName();
      
    if (!callback.isElement)
      throw "Lexer Error: isElement function for "+name+" missing";
      
    if (this.types[type] == null)
      this.types[type] = new Object();
          
    var obj = new Object();
    obj.name = name;
    obj.onProbe =  function(token, doc) {return callback.isElement(token, doc)} 
    obj.onNew = function(docshell, id) {return new callback(docshell,id)};
    obj.onCapable = function(capabilities) {
      if (!callback.isCapable)
        return true;        
      return callback.isCapable(capabilities);
    }
    
    this.names[name] = obj;
    this.types[type][name] = obj;      
  },
  
  getConstructor : function(selectors, token)
  {
  	if (typeof(selectors) === "string")
  	  selectors = [selectors];
  	
  	  
    if (!Array.isArray(selectors))
      throw "Invalid Type list, not an array";
      
    // enumerate all selectors...
    for (var selector in selectors)
    {
      selector = selectors[selector];
    
      for (var key in this.types[selector])
        if (this.types[selector][key].onCapable(this._capabilities))
          if (this.types[selector][key].onProbe(token, this))
            return this.types[selector][key];
    }
             
    return null;    
  },
  
  createInstance : function(docshell,constructor,parser)
  { 

    if (!constructor.onCapable(this._capabilities))
      throw "Capability not supported";    
    
    var item = constructor.onNew(docshell, ++(this.maxId));         
    
    if ((typeof(parser) != "undefined") && (parser))
      item.init(parser);
        
    return item; 
  },
  
  /**
   * by class...
   * Parses the given Data and returns the result
   * 
   * @param {SieveDocument} docshell
   * @param {String} type
   * @param {String} data
   * @return {}
   **/
  createByClass : function(docshell, types, parser)
  {
    var item = this.getConstructor(types,parser);

    if (item == null)
      throw "Unknown or incompatible "+types+" expected but found: "+parser.bytes(50);
    
    return this.createInstance(docshell,item,parser);
  },
  
  /**
   * Creates an element for a by name and returns the result
   *
   * @param {SieveDocument} docshell
   * @param {String} name
   * @optional @param {String} initializer
   *   A sieve token as string, used to initialize the created element.
   *    
   * @return {}
   **/
  createByName : function(docshell, name, parser)
  {   
    if (!this.names[name])
      throw "No Constructor for >>"+name+"<< found";

    return this.createInstance(docshell,this.names[name],parser)
  },
  
  getMaxId : function ()
  {
    return this.maxId();
  },
  
  probeByName : function(name,parser)
  {
    // If there's no data then skip
    if ((typeof(parser) === "undefined") || parser.empty())
      return false;
      
    if (typeof(this.names[name]) === "undefined")
      throw "Unknown name " +name;

    if (!this.names[name].onCapable(this._capabilities))
      return false;
      
    if (!this.names[name].onProbe(parser, this))
      return false;
      
    return true;
  },
  
  /**
   * Tests if the given Data is parsable
   * @param {} type
   *   either a single type as string or a list of things containing all type to test.
   * @param {} data
   * @return {Boolean}
   */
  probeByClass : function(types,parser)
  {
    // If there's no data then skip
    if ((typeof(parser) === "undefined") || parser.empty())
      return false;
      
    // Check for an valid element constructor... 
    if (this.getConstructor(types,parser))
      return true;
      
    return false;      
  },

  supportsByName : function(name)
  {
    if (typeof(this.names[name]) === "undefined")
      return false;
      
    if (!this.names[name].onCapable(this._capabilities))
      return false;
      
    return true;
  },  
  
  supportsByClass : function(type)
  {
    if (typeof(selectors) === "string")
      selectors = [selectors];
    
      
    if (!Array.isArray(selectors))
      throw "Invalid Type list, not an array";
      
    // enumerate all selectors...
    for (var selector in selectors)
    {
      selector = selectors[selector];
    
      for (var key in this.types[selector])
        if (this.types[selector][key].onCapable(this._capabilities))
          return true;
    }
             
    return false;
  },
  
  
  
//  getNamesByClass : function(selectors)
//  {
//    if (!selectors.length)
//      throw "Invalid Type list, not an array";
//      
//    var result = [];
//    // enumerate all selectors...
//    for (var selector in selectors)
//    {
//      selector = selectors[selector];
//    
//      for (var key in this.types[selector])
//        if (this.types[selector][key].onCapable(this._capabilities))
//          result.push(key);
//    }
//             
//    return result;
//  },
  
  capabilities : function(capabilities)
  {
    if (typeof(capabilities) == "undefined")
      return this._capabilities;
      
    this._capabilities = capabilities;
    
    return this;
  }
}
