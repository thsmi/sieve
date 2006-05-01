function Sieve(host, port) 
{
  var jsLoader = Components
										.classes["@mozilla.org/moz/jssubscript-loader;1"]
										.getService(Components.interfaces.mozIJSSubScriptLoader);
  jsLoader
    .loadSubScript("chrome://sieve/content/libs/jslib/jslib.js");
  include("chrome://sieve/content/libs/jslib/network/socket.js");
  
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
		 
	if (request.getCommand() == "")
		return;
		
	this.socket.write(request.getCommand());
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
//	alert("Stopped\n:"+status)
}

Sieve.prototype.receiveData
	= function (data)
{
  var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                                 .getService(Components.interfaces.nsIConsoleService);
  consoleService.logStringMessage(data);

	// is a Request listener existing?
	if ((this.requests.length == 0))		
		return
									
	// ok es gibt einen, dem �bergeben wir mal die daten...
	this.requests[0].setResponse(data);

	// und da nun der Request beendet ist fliegt er raus
	this.requests.splice(0,1);

	// n�chster Request aufrufen
	if ((this.requests.length > 0))
		this.socket.write(this.requests[0].getCommand());
}