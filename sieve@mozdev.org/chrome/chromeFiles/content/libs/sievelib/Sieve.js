
var jsLibLoaded = false

function Sieve(host, port, debug) 
{
  var jsLoader = Components
										.classes["@mozilla.org/moz/jssubscript-loader;1"]
										.getService(Components.interfaces.mozIJSSubScriptLoader);
										
	if (jsLibLoaded == false)
	{
	  jsLoader
  	  .loadSubScript("chrome://sieve/content/libs/jslib/jslib.js");
  	  jsLibLoaded = true;
	}
  include("chrome://sieve/content/libs/jslib/network/socket.js");
 
  if (debug == null) 
    this.debug = false;    
  else
    this.debug = debug;    
  
  this.host = host;
  this.port = port;
  this.socket = new Socket();
  this.requests = new Array();
}

Sieve.prototype.isAlive = function()
{
	return this.socket.isAlive();
}

Sieve.prototype.startTLS = function ()
{
    this.socket.startTLS();
}

Sieve.prototype.addRequest = function(request)
{
	this.requests[this.requests.length] = request;
	// wenn die länge nun eins ist war sie vorher null
	// daher muss die Requestwarteschalnge neu angesto�en werden.
	if (this.requests.length > 1)
		return

	// filtert den initrequest heraus...	 	
	if (request instanceof SieveInitRequest)
	  return;

/*	if (request.getCommand() == "")
		return;*/
 	this.socket.write(request.getNextRequest());
}

Sieve.prototype.connect = function () 
{

	if( this.socket.isConnected )
	{
		alert("connected")
		return;
	}
   
	// open socket connection to host - enable binary input 
	this.socket.open(this.host,this.port,true,true);
	this.socket.async(this);
}

/*
disconnects and closes the connection
*/

Sieve.prototype.disconnect 
	= function () 
{	
	this.socket.close();
}

Sieve.prototype.streamStarted 
	= function (socketContext)
{
} 

Sieve.prototype.streamStopped
	= function (socketContext, status)
{
	alert("Stopped\n:"+status)
}

Sieve.prototype.receiveData
	= function (data)
{
  
  if (this.debug)
  {
    var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                           .getService(Components.interfaces.nsIConsoleService);
    consoleService.logStringMessage(data);
  }  

	// is a request handler waiting?
	if ((this.requests.length == 0))
		return
									
	// ... yes, there is one, so we can handle the response...
	this.requests[0].addResponse(data);

 	// ... delete the request, it is processed...	
	if (this.requests[0].hasNextRequest() == false)
  	this.requests.splice(0,1);


	// ... are there any other requests waiting in the queue.
	if ((this.requests.length > 0))
		this.socket.write(this.requests[0].getNextRequest());
}