var ios = Components.classes["@mozilla.org/network/io-service;1"]
                    .getService(Components.interfaces.nsIIOService);
var pps = Components.classes["@mozilla.org/network/protocol-proxy-service;1"]
                    .getService(Components.interfaces.nsIProtocolProxyService);



  var pi = null;
  var uri = null;
  
  uri = ios.newURI("http://www.mozilla.org/", null, null);
  pi = pps.resolve(uri, 0)
  print("HTTP Proxy:"+pi);
  print(pi.type+" | "+pi.host+" | "+pi.port);


  uri = ios.newURI("x-sieve://sieve.mozdev.org", null, null);

  pi = pps.resolve(uri, 0)
  print("X-Sieve Proxy:"+pi);
  print(pi.type+" | "+pi.host+" | "+pi.port);

  uri = ios.newURI("sieve://sieve.mozdev.org", null, null);
  pi = pps.resolve(uri, 0)
  print("Sieve Proxy:"+pi); 
  //print(ios.getProtocolHandler("x-sieve"));
  //print("X-SIEVE Flags"+ios.getProtocolFlags("x-sieve"));
  //print("HTTP Flags"+ios.getProtocolFlags("http"));

  //uri = ios.getProtocolHandler("x-sieve").newURI("x-sieve://mozilla.org",null,null);
  //pi = pps.resolve(uri, 0)
  //print("Sieve Proxy 2:"+pi);

  print("HTTP Scheme:"+ios.getProtocolHandler("http").scheme);
  print("Sieve Scheme:"+ios.getProtocolHandler("x-sieve").scheme);  

  //print(Components.classes["@mozilla.org/network/protocol;1?name=x-sieve"].createInstance(Components.interfaces.nsIProtocolHandler));