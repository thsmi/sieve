/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at http://sieve.mozdev.org or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

// TODO the WatchDog is no more needed to be detachable. thus this code
// could be merged into Sieve.js

/**
 * A managse sieve server always respond to a request within a certain time. If 
 * it fails to do so, something most likely went terribliy wrong. 
 *
 * As we are using an event driven design. Losing contact to the server, 
 * unexpected and unparsable responses jam the event queue for ever. There
 * is a request and no matching response...
 * 
 * ... the watchdog kicks in here. If the client receives no or no parsable 
 * response within a specified timeout interval. The Watchdog assumes a broken 
 * event queue and invokes onWatchdogTimeout().  
 * 
 * Furthermore servers close inactive conections after a certain time. In order
 * to prevent that, we need to send a "Keep alive" packet when neede. The countdown 
 * timer starts imediately after receiving a response and will be reset upon sending 
 * a request. In case such an idle timout occures onIdleTimeout() is invoked.  
 *
 * NOTE: Every XUL window has a seperate message queue, furthermore a sieve 
 * object supports only one watchdog. This means you need a seperate watchdog
 * for every window that uses the sieve object. 
 * 
 * @param {} timeout
 *   specifies the maximal intervall between a request and a response.  
 * @param {Int} idle
 *   Specifies the maximal time interval between a response and a request. 
 *   It basically is used for sending "Keep alive" packets. It can be used to
 *   ensures that in worst case every idleInterval a packet is send. 
 *   
 *   This parameter is optional and can be null.
 */
function SieveWatchDog(timeout, idle)
{
  if (!timeout)
    timeout = 20000;
    
  if (!idle)
    idle = null;
    
  this.timeout = { timer:null, delay:timeout};
  this.idle    = { timer:null, delay:idle};
  
  this.listener     = null;
}

/**
 * sets the timout 
 * @param {} interval
 *   the number of miliseconds before the watchdog
 */
SieveWatchDog.prototype.setTimeoutInterval
    = function (interval)
{
  if (interval == null)
    this.timeout.delay = 20000;
  else
    this.timeout.delay = interval;
}



SieveWatchDog.prototype.onAttach
    = function ()
{   
  this.timeout.timer 
    = Components.classes["@mozilla.org/timer;1"]
        .createInstance(Components.interfaces.nsITimer);
  
  if (this.idle.delay == null)
    return;
  
  this.idle.timer 
    = Components.classes["@mozilla.org/timer;1"]
        .createInstance(Components.interfaces.nsITimer);
          
}

SieveWatchDog.prototype.onDeattach
    = function ()
{
  if (this.timeout.timer != null)
  {
    this.timeout.timer.cancel();
    this.timeout.timer = null;
  }
  
  if (this.idle.timer != null)
  {
    this.idle.timer.cancel();
    this.idle.timer = null;
  }
}   

SieveWatchDog.prototype.notify
    = function (timer) 
{
  timer.cancel();  
  if ((this.timeout.timer == timer) && (this.listener != null))
    this.listener.onWatchDogTimeout();
  
  if ((this.idle.timer == timer) && (this.listener != null))
    this.listener.onIdle();
}

SieveWatchDog.prototype.onStart
    = function ()
{
  this.timeout.timer.initWithCallback(
         this, this.timeout.delay,
         Components.interfaces.nsITimer.TYPE_ONE_SHOT);
}

SieveWatchDog.prototype.onStop
    = function()
{
  if (this.timeout.timer != null)
    this.timeout.timer.cancel();
    
  if (this.idle.timer == null)
    return;
      
  this.idle.timer.cancel();  
  this.idle.timer.initWithCallback(this,this.idle.delay,
         Components.interfaces.nsITimer.TYPE_ONE_SHOT);
    
  return;
}

SieveWatchDog.prototype.addListener
    = function(listener)
{
  if (listener == null)
    return;
    
  this.listener = listener;  
}
