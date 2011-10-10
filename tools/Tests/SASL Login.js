
  var jsLoader = Components
                   .classes["@mozilla.org/moz/jssubscript-loader;1"]
                   .getService(Components.interfaces.mozIJSSubScriptLoader);

  jsLoader
    .loadSubScript("chrome://sieve/content/libs/libManageSieve/SieveRequest.js");
  jsLoader
    .loadSubScript("chrome://sieve/content/libs/libManageSieve/SieveResponse.js");    
  jsLoader
    .loadSubScript("chrome://sieve/content/libs/libManageSieve/SieveResponseParser.js");        
  jsLoader
    .loadSubScript("chrome://sieve/content/libs/libManageSieve/SieveResponseCodes.js");


function bytesFromJSString(str) 
{
  // cleanup linebreaks...
  str = str.replace(/\r\n|\r|\n|\u0085|\u000C|\u2028|\u2029/g,"\r\n");
  
  // ... and convert to UTF-8
  var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"]
                      .createInstance(Components.interfaces.nsIScriptableUnicodeConverter); 
  converter.charset = "UTF-8"; 

  return converter.convertToByteArray(str, {});
}

var request = new SieveSaslLoginRequest();

request.setUsername("blubb");
request.setPassword("bla");

// CLIENT -> SERVER
if (!request.hasNextRequest())
  throw "AUTHENTICATE \"LOGIN\" expected"

print("REQUEST: "+request.getNextRequest());

// SERVER -> CLIENT
print("RESPONSE: "+'"VXNlcm5hbWU6"');
request.addResponse(bytesFromJSString('"VXNlcm5hbWU6"'));

if (!request.hasNextRequest())
  throw "USERNAME: expected"

print("REQUEST: "+request.getNextRequest());

// SERVER -> CLIENT
print("RESPONSE: "+'"UGFzc3dvcmQ6"');
request.addResponse(bytesFromJSString('"UGFzc3dvcmQ6"'));

if (!request.hasNextRequest())
  throw "PASSWORD: expected"

print("REQUEST: "+request.getNextRequest());


print("RESPONSE: "+'OK');
request.addResponse(bytesFromJSString('OK\n'));

if (request.hasNextRequest())
  throw "Failure a request expected";

