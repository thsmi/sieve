
// Sieve Lexer is a static class...

var SieveLexer = 
{
  types :  [],
  names : [],
  /**
   * @param {} type 
   * @param {} id
   * @param {} onProbe  // Callback to evaluete object
   * @param {} onNew // Callback to get an object
   */
  register: function(type,name,onProbe,onCreate)
  {
    if (onProbe == null)
      throw "Lexer Error: Probe function for "+id+" missing";
    if (onCreate == null)
      throw "Lexer Error: Parse function for "+id+" missing";
      
    if (this.types[type] == null)
      this.types[type] = new Array()
    
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
   * @param {} type
   * @param {} data
   * @return {}
   */
  createByClass : function(types,data,id)
  {
    var c = this.getConstructor(types,data);
    
    if (c==null)
      throw " "+types+" "+data;
    
    return this.getConstructor(types,data)(id);
    
/*    var result = {};
    
    result.elm = 
    
    // TODO: rename parse to serialize
    result.data = result.elm.init(data);    
    
    return result;*/ 
  },
  
  createByName : function(name,id)
  {    
    try
    {
      return this.names[name].onNew(id);
    }
    catch (e)
    {
      alert(" "+e+" \r\n"+name+"\r\n"+this.names)
    }
  },
  
  probeByName : function(name,data)
  {
    if (this.names[name].onProbe(data))
      return true;
      
    return false;
  },
  
  /**
   * Tests if the given Data is parsable
   * @param {} type
   * @param {} data
   * @param {} hint
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
