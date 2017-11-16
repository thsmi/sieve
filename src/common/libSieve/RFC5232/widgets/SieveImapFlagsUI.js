/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

/* global window */
 
"use strict";
 
(function(exports) {
	
  /* global $: false */
  /* global SieveDesigner */
  /* global SieveActionBoxUI */
  /* global SieveTestBoxUI */
	
  function SieveSetFlagUI(elm)
  {
    SieveActionBoxUI.call(this,elm);
  }
  
  SieveSetFlagUI.prototype = Object.create(SieveActionBoxUI.prototype);
  SieveSetFlagUI.prototype.constructor = SieveSetFlagUI;
  
  SieveSetFlagUI.prototype.initSummary
      = function ()
  {
    return $("<div/>")
             .text("Set IMAP flag "+this.getSieve().flaglist.toScript());  
  };

  
  function SieveAddFlagUI(elm)
  {
    SieveActionBoxUI.call(this,elm);
  }
  
  SieveAddFlagUI.prototype = Object.create(SieveActionBoxUI.prototype);
  SieveAddFlagUI.prototype.constructor = SieveAddFlagUI;
  
  SieveAddFlagUI.prototype.initSummary
      = function ()
  {
    return $("<div/>")
             .text("Add IMAP flag(s) "+this.getSieve().flaglist.toScript());  
  };
  
  
  
  function SieveRemoveFlagUI(elm)
  {
    SieveActionBoxUI.call(this,elm);
  }
  
  SieveRemoveFlagUI.prototype = Object.create(SieveActionBoxUI.prototype);
  SieveRemoveFlagUI.prototype.constructor = SieveRemoveFlagUI;
  
  SieveRemoveFlagUI.prototype.initSummary
      = function ()
  {
    return $("<div/>")
             .text("Remove IMAP flag(s) "+this.getSieve().flaglist.toScript());  
  };
  
  
  
  function SieveHasFlagUI(elm)
  {
    SieveTestBoxUI.call(this,elm);  
  }
  
  SieveHasFlagUI.prototype = Object.create(SieveTestBoxUI.prototype);
  SieveHasFlagUI.prototype.constructor = SieveHasFlagUI;
  
  
  SieveHasFlagUI.prototype.initSummary
      = function()
  {
    return $("<div/>")
             .text("Has IMAP flag(s) "+this.getSieve().flaglist.toScript());   
  };
  
  if (!SieveDesigner)
    throw "Could not register IMAP Flags Widgets";
  
    
  SieveDesigner.register("action/setflag", SieveSetFlagUI);
  SieveDesigner.register("action/addflag", SieveAddFlagUI);
  SieveDesigner.register("action/removeflag", SieveRemoveFlagUI);
  
  SieveDesigner.register("test/hasflag", SieveHasFlagUI);
  
})(window);
