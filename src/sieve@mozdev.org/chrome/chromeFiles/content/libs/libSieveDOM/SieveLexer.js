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
  
  register2: function (type,name,callback)
  {
    if (!callback.isElement)
      throw "Lexer Error: isElement function for "+name+" missing";
      
    this.register(type,name,
      function(token) {return callback.isElement(token)}, 
      function(id) {return new callback(id)});
  },
  
  /**
   * @param {} type 
   * @param {} id
   * @param {} onProbe  // Callback to evaluete object
   * @param {} onNew // Callback to get an object
   */
  register: function(type,name,onProbe,onCreate)
  { 
    if (onProbe == null)
      throw "Lexer Error: Probe function for "+name+" missing";
    if (onCreate == null)
      throw "Lexer Error: Create function for "+name+" missing";
      
    if (this.types[type] == null)
      this.types[type] = new Object();
    
    //alert("Registering"+type+"  "+name);
    
    var obj = new Object();
    obj.name = name;
    obj.onProbe = onProbe;
    obj.onNew = onCreate;
    
    this.names[name] = obj;
    this.types[type][name] = obj;
  },
  
  getConstructor : function(selectors, token)
  {
    if (!selectors.length)
      throw "Invalid Type list, not an array";
      
    // enumerate all selectors...
    for (var selector in selectors)
    {
      selector = selectors[selector];
    
      for (var key in this.types[selector])
        if (this.types[selector][key].onProbe(token))
          return this.types[selector][key].onNew;
    }
             
    return null;    
  },
  
  /**
   * by class...
   * Parses the given Data and returns the result
   * 
   * @param {} type
   * @param {} data
   * @return {}
   */
  createByClass : function(types,data)
  {
    var c = this.getConstructor(types,data);

    if (c==null)
      throw "No compatible Constructor for Class(es): "+types+" in "+data;
    
    return this.getConstructor(types,data)(++(this.maxId));    
  },
  
  /**
   * Creates an element for a by name and returns the result
   * 
   * @param {} name
   * @optional @param {String} initializer
   *   A sieve token as string, used to initialize the created element.
   *    
   * @return {}
   */
  createByName : function(name, data)
  {   
    if (!this.names[name])
      throw "No Constructor for >>"+name+"<< found";
      
    try
    {
      var item = this.names[name].onNew(++(this.maxId));
      
      if (data)
        item.init(data);
        
      return item; 
    }
    catch (e)
    {
      throw(" "+e+" \r\n"+name+"\r\n"+this.names)
    }
  },
  
  getMaxId : function ()
  {
    return this.maxId();
  },
  
  probeByName : function(name,data)
  {
    // If there's no data then skip
    if ((typeof(data) === "undefined") || !data.length)
      return false;
      
    if (this.names[name].onProbe(data))
      return true;
      
    return false;
  },
  
  /**
   * Tests if the given Data is parsable
   * @param {} type
   * @param {} data
   * @return {Boolean}
   */
  probeByClass : function(types,data)
  {
    // Check for an valid element constructor... 
    if (this.getConstructor(types,data))
      return true;
      
    return false;      
  }
}
