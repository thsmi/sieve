# Implements a websocket transport

It just wraps the sieve messages messages into a websocket channel.

The communication is identically like with the sieve protocol with on exception.
There is no startTLS as the connection is always secure and cannot be upgraded.

It is a proxy or "man in the middle" approach. And only active during the initial handshake. Afterwards it is passive and just pumps messages.

## Connecting

1. Client Connects to Proxy
2. Proxy creates connection to server

   It caches the initial capability message.

3. Proxy Secures connection to server

   1. Proxy calls STARTTLS
   2. Proxy parses STARTTLS response and returns it as welcome MESSAGE to the client.

      It updates the initial capability message.


4. Send capabilities to client

   The SASL mechanisms are set to "SASL" "PLAIN" it is currently the only supported mechanims. And STARTTLS is removed.

   The implementation gets a "via Websocket" appended.

5. Normal Sieve communication

   The sieve client can now start normal communication.
   Typically it will first try to authenticate.


## Components

Technically it is a zombi between the APP and the WX

Reused from wx:
  * wx/libs/libManageSieve/SieveResponseParser.js
  * wx/libs/libManageSieve/SieveRequestBuilder.js

Reused from app:
  * app/libs/libManageSieve/SieveLogger.js

No Reuse
  * SieveTimer
  * SieveCrypto -> Just a dummy as we only support plain.
  * SieveClient
