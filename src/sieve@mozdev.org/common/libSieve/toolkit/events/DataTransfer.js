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

"use strict";

/**
 * A stupid wrapper around the data transfer used to bypass a google chrome bug.
 * The bug causes getData() to return always an empty string in dragenter and 
 * dragover events.
 * 
 * Strangely this happens only in a chrome web app. "Normal" Chrome does not 
 * suffer from this bug.
 * 
 * The workaround is to store the transfer element locally and just add
 * a token to the drag's datatransfer element.
 * 
 * A chrome webapp detection is build in so that the workaround is only used 
 * when realy needed.
 * 
 * The workaround has some limitation you can set at most one data object.
 * 
 * @param {DataTransfer} dt
 *   the data transfer object which should be wrapped.
 */
function SieveDataTransfer(dt) {	
	this.dt = dt;	
}

SieveDataTransfer._transfer = null;
SieveDataTransfer._token = null;

/**
 * Calculates a random token, which is used to idenfiy the transfer.
 * It is just a precausion in for very unlikely cases, that an 
 * external drop uses the very same flavours.
 */
SieveDataTransfer.prototype.generateToken
  = function() 
{
	var token = [];

  for (var i=0; i<32; i++) {
  	
    var item = (Math.floor(Math.random() * (256))).toString(16)
    
    if (item.length < 2)
      item = "0"+item;
    
    token.push(item);    
  }
  
  return token.join("");
}

/**
 * Checks if the DataTransfer contains the given flavour.
 * 
 * @param {string} flavour
 *   the flavour which should be checked
 * @return {Boolean}
 *   true in case the flavour is contained otherwise false.
 */
SieveDataTransfer.prototype.contains
  = function(flavour)
{
  for (var i=0; i<this.dt.items.length; i++)
  	if (this.dt.items[i].type == flavour)
  	  return true;
  	  
  return false;
}

/**
 * Retunrs the data bound to the given flavour.
 * 
 * @param {String} flavour
 *   the flavour as string
 * @return {String}
 *   the data stored in the dragtarget.
 */
SieveDataTransfer.prototype.getData
  = function(flavour) {
  	
  // In case it's not a web app we can a short cut ...
  if ( !window.chrome || !chrome.runtime || !chrome.runtime.id) 
    return this.dt.getData(flavour);

  // ... otherwise we need a workaround for a chrome web app bug.
  if (!this.contains(flavour))
    return "";
       
  if (!this.contains(SieveDataTransfer._token))
    return "";
    
  return SieveDataTransfer._transfer;
}

/**
 * Binds the data to the data transfer object
 * 
 * @param {String} flavour
 *   the drag falvour as string
 * @param {Object} transfer
 *   the transfer object should be a string
 */
SieveDataTransfer.prototype.setData
  = function(flavour, transfer) {
  	
  this.dt.setData(flavour, transfer);
  
  if ( !window.chrome ||  !chrome.runtime || !chrome.runtime.id) 
    return   
  
  // ignore the "application/sieve" flavour
  if (flavour == "application/sieve")
    return;
  
  if (SieveDataTransfer._transfer || SieveDataTransfer._token)
    throw new "Transfer in progress, clear before starting new one.";
    
  SieveDataTransfer._transfer = transfer;
    
  // We generate a onetime token to ensure drag and drop integrity
  SieveDataTransfer._token = this.generateToken(); 
  this.dt.setData(SieveDataTransfer._token,"");
}

/**
 * Clear should be called before and after each drop.
 * 
 * It releases the drop target from the current context.
 */
SieveDataTransfer.prototype.clear
  = function() {
  	
  SieveDataTransfer._token = null;
  SieveDataTransfer._transfer = null;  	
}

