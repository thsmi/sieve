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
 
(function(/*exports*/) {
  
  "use strict";
  
  /* global SieveGrammar */

	if (!SieveGrammar)
    throw new Error("Could not register AddressParts");
	
  var domainpart = {
    node : "address-part/domain",
    type : "address-part/",
    
    token : ":domain"
  };

  SieveGrammar.addTag(domainpart);

  
  var localpart = {
    node : "address-part/local",
    type : "address-part/",
    
    token : ":local"
  };

  SieveGrammar.addTag(localpart);
  
  var allpart = {
    node : "address-part/all",
    type : "address-part/",
    
    token : ":all"
  };

  SieveGrammar.addTag(allpart);

  
   var addresspart = {
    node : "address-part",
    type : "address-part",
    value : ":all",
    
    items : ["address-part/"]
  };
  
  SieveGrammar.addGroup(addresspart);  

})(window);   
