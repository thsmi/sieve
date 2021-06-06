# Sieve Web Application

The manage sieve protocol is by default incompatible with browsers. Browser can
communicate only via http and websockets, while manage sieve is in contrast a
classic TCP/IP socket based protocol.

To bypass this limitation the server side backend wraps the manage sieve protocol
into a websocket channel. Technically it starts a proxy which forwards manage
sieve sockets over websockets.

This enables the frontend to be run of the same javascript code base used for
the webextension and application.

The communication is almost identically to the standard manage sieve protocol.
The exception is there is no startTLS as the websocket connection is always
secure and cannot be upgraded after connecting.

Running Sieve via websockets is not standardized by an rfc or something similar.

Please keep in mind the proxy is technically similar to a man in middle attack.
And does not provide any end to end security. So you should always protect the
backend with a reverse proxy.

## Installation

* Install a python 3.8 or up
  No external python packages are required, a raw python is sufficient.

* Optional, create I python virtual env.
  A [venv or virtual environment](https://docs.python.org/3/tutorial/venv.html)
  is a sandboxed python runtime environment which will isolate the local environment
  from the global  python installation. It is shipped by default no external
  packages needed.

  To [create the virtual environnement](https://docs.python.org/3/library/venv.html)
  just call ```python -m venv .venv```  and then activate it by starting the
  ```.venv\Scripts\activate.bat``` on Windows or by ```source .venv/Scripts/activate```
  on Linux. The virtual environment was activated when you see a ```(.venv)```
  before you command prompt.

  Keep in mind you can not copy or move virtual environments without breaking it.

* Secure the endpoint.
  More and more browsers require websocket connection to be secured by encryption.

  The application supports direct access via https, which is great for testing in
  an isolated network. But for a real world scenario I strongly suggest to secure
  the endpoint via reverse proxy.

  The application is definitely not designed to be directly accessible from
  the internet without any save guards.

  An nginx configuration example is shown below. Keep in mind it should be an
  https endpoint.

````
    location /sieve/ {
       # Forwards all request to the sieve proxy, in this example
       # it runs at 127.0.0.1:8765
       proxy_pass https://127.0.0.1:8765/;

       # You need this only if the sieve proxy uses a self signed certificate.
       proxy_ssl_verify off;

       # If you authenticate against the proxy, this line will inject here the
       # authentication header and allow a single sign on.
       proxy_set_header X-Forwarded-User me@example.com;

       # The following lines enable websocket support for you nginx proxy.
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "Upgrade";
       proxy_set_header Host $host;
    }
````

* Configure the endpoints.
  Copy the ```config.template.ini``` to ```config.ini``` and adjust it to your needs.
  More details about the configuration can be found in the next paragraph.

* Start the application
  All you need to do is calling ```python main.py```

## Configuration

The configuration is an ini file, which means plain text file with key value pairs
grouped into section. Each section defines an account.

### Global and Default values

The section ```[DEFAULT]``` is special and sets  global values as well as default
or fallback values.

### Username

The sieve proxy does not have any user management included. Instead you need to
use a reverse proxy for authentication and securing the endpoint. The reverse
proxy should be configured, for authenticated user, to automatically injects a
header with the username into the request. The header name can be configured via
```AuthUserHeader```.

But if you are running a single user environment or are just testing there is a
simpler approach. You can specify a fixed username globally or per account via
the configuration parameter ```AuthUser```.

If ```AuthUser``` is set ```AuthUserHeader``` will be ignored.

### Authentication

You have the choice between a client side authentication and two server side
Authentication types. They are controlled via the ```AuthType```parameter.

#### Client Side Authentication

The client running in the browser will prompt for the password. All will be done
by the client, no further server side configuration needed except setting the
```AuthType``` to ```client```.

Keep in mind as the proxy acts like a man in the middle, thus only unencrypted
SASL PLAIN can be used for authentication. Which means passwords are transferred
in plain text. Therefore you should ensure the connection is secured via HTTPs.

#### Server Side Reverse Proxy Authentication

The reverse proxy injects a username and a session token/password into the
requests headers. The sieve proxy trusts this information und used it to
authenticate requests against the sieve server.

This kind of authentication is typically used in a Single Sign On (SSO) scenario.
An the proxy server is configured to create a session token instead of the user
password. In case the client logs out of the SSO all session tokens are invalidated.

The headers which contain the password and the username can be configured via
```AuthUserHeader``` and ```AuthPasswordHeader```.

You activate this by setting ```AuthType``` to ```token```.

#### Server Side Authorization

All is done on the server side, incoming connection are considered as trustworthy
and makes only sense when used in conjunction with a trusted reverse proxy which
injects the client's username into a header. The header name can be set via
```AuthUserHeader```

The server uses a trusted account and then authorize the connection as a
different user. This means you need to configure the trusted account's user
name in ```SieveUser``` as well as the password in ```SievePassword```.

Not all sieve servers are supporting a proxy authorization and if they support
it you need to explicitly enable it.

If you use this you should really know what you are doing.

You activate this by setting ```AuthType``` to ```authorization```.

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
