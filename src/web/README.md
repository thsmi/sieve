# Sieve Web Application

The manage sieve protocol is by default incompatible with browsers. Browser can
communicate only via http and websockets, while manage sieve is in contrast a
classic TCP/IP socket based protocol.

To bypass this limitation the server side backend wraps the manage sieve protocol
into a websocket channel. Technically it starts a proxy which forwards manage
sieve sockets over websockets.

This enables the frontend to be run of the same javascript code base used for
the webextension and application.

The communication almost identically to the standard manage sieve protocol.
The exception is there is no startTLS as the websocket connection is always
secure and cannot be upgraded after connecting.

The websocket connection tunnel is not standardized by an rfc or something similar.

Please keep in mind the proxy is technically similar to a man in middle attack.
And does not provide any end to end security. So you should alway protect the
backend with a reverse proxy.

## Configuration

Run inside a virtual env.

## Deep Dive

### Structure
Technically the web app it is a zombi between the APP and the WX

Reused from wx:
* wx/libs/libManageSieve/SieveResponseParser.js
* wx/libs/libManageSieve/SieveRequestBuilder.js

Reused from app:
* app/libs/libManageSieve/SieveLogger.js

### Connecting

* The client connects to proxy via a websocket

* The proxy creates a secure connection to the sieve server via the manage sieve protocol.
  * As first step the connection to sieve server is secured by calling starttls.
  * In case of a successful handshake the proxy sends the initial message to
    the client. It returns the server's capabilities. The STARTTLS message is
    skipped, because the connection is already secured. The SASL mechanisms are
    set to "SASL" "PLAIN" it is currently the only supported mechanism.

* Normal Sieve communication
  The sieve client start normal communication.
  Typically it will first try to authenticate.
