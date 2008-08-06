// we have one central sieve object , but a seperate message queue for every window. 
// therefore we need a for every window a seperate watchdog inorder to link
// the global sieve object with the local message queue
 
function SieveWatchDog()
{
  this.timeout      = null;
  this.timeoutDelay = 20000;
  this.idle         = null;
  this.idleDelay    = 30*60*1000;
  this.listener     = null;
}

/**
 * 
 * @param {} interval
 */
SieveWatchDog.prototype.setTimeoutInterval
    = function (interval)
{
  if (interval == null)
    this.timeoutDelay = 20000;
  else
    this.timeoutDelay = interval;
}

SieveWatchDog.prototype.onAttach
    = function (idleDelay)
{   
  this.timeout 
    = Components.classes["@mozilla.org/timer;1"]
        .createInstance(Components.interfaces.nsITimer);
  
  if (idleDelay == null)
    return;
  
  this.idle 
    = Components.classes["@mozilla.org/timer;1"]
        .createInstance(Components.interfaces.nsITimer);
  this.idleDelay = idleDelay;        
}

SieveWatchDog.prototype.onDeattach
    = function ()
{
  if (this.timeout != null)
  {
    this.timeout.cancel();
    this.timeout = null;
  }
  
  if (this.idle != null)
  {
    this.idle.cancel();
    this.idle = null;
  }
}   

SieveWatchDog.prototype.notify
    = function (timer) 
{
  timer.cancel();  
  if ((this.timeout == timer) && (this.listener != null))
    this.listener.onWatchDogTimeout();
  
  if ((this.idle == timer) && (this.listener != null))
    this.listener.onIdle();
}

SieveWatchDog.prototype.onStart
    = function (timeout)
{
  this.timeout.initWithCallback(
         this,
         ((timeout != null) ? timeout : this.timeoutDelay),
         Components.interfaces.nsITimer.TYPE_ONE_SHOT);
}

SieveWatchDog.prototype.onStop
    = function()
{
  if (this.timeout != null)
    this.timeout.cancel();
    
  if (this.idle == null)
    return;
      
  this.idle.cancel();
  this.idle.initWithCallback(this,this.idleDelay,
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
